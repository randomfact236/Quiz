// Games browser smoke — loads EVERY live game, plays a few real moves, and
// fails on any JS error or a game that won't accept input. The unit specs and
// the API tests cover RULES; only this covers the PLAY path (four real
// UI bugs shipped past both: battleship's hot-seat loop + attribution, the
// D&B null read, pig-dice's AI hang, rps's hot-seat gate).
//
// Run:  cd apps/frontend && node scripts/games-smoke.mjs
// Needs the games deployed; it hits production by default (SMOKE_BASE to
// override, e.g. http://localhost:3010).
import { chromium } from 'playwright';

const BASE = process.env.SMOKE_BASE || 'https://pigzap.com';
const MOBILE = { viewport: { width: 390, height: 844 } };

// per game: how to enter play + what a legal "move" looks like on the page
// `extra` optionally drives the game to a state the 3-move pass never reaches
// — a dead end-state check is how a broken match-over guard once shipped
// clean through both the specs and this smoke.
const GAMES = [
  { slug: 'tic-tac-toe', moves: ['#board .cell', '.cell'], board: '#board .cell' },
  { slug: 'connect-four', moves: ['#board .cell', '.cell[data-col]'], board: '#board .cell' },
  { slug: 'gomoku', moves: ['#board .cell', '.cell'], board: '#board .cell' },
  { slug: 'dots-and-boxes', moves: ['.hit', '.hit[data-edge]'], board: '.hit' },
  { slug: 'battleship', moves: ['#sea-mine .cell', '.cell[data-cell]'], board: '#sea-mine .cell' },
  { slug: 'pig-dice', moves: ['#btn-roll'], board: null, extra: playPigDiceToWin },
  {
    slug: 'checkers',
    // two taps per move: pick the piece up, then drop it on a destination
    moves: ['.sq[data-sq] .piece, .sq[data-sq]'],
    board: '.sq[data-sq]',
  },
  {
    slug: 'rock-paper-scissors',
    moves: ['.throws button', '[data-throw]'],
    board: null,
    extra: checkNoDoubleThrow,
  },
];

/**
 * Play a quick 50-point match to its end: the overlay must appear, the turn
 * line must read "Match over", and BOTH action buttons must be disabled.
 */
async function playPigDiceToWin(page) {
  // restart clean — the 50-point target lives on the menu screen, and the
  // move pass above already has us mid-match on the default 100
  await page.reload({ waitUntil: 'networkidle' });
  const target = page.locator('#target-segmented button[data-target="50"]');
  if (await target.count()) await target.click();
  await page.locator('#btn-play').click();
  await page.waitForSelector('#screen-playing.screen--active');
  const overlayUp = () => page.locator('#overlay:not(.hidden)').count().then((c) => c === 1);
  const myTurn = () =>
    page.textContent('#turn').then((t) => (t || '').includes('Your turn'));
  for (let n = 0; n < 300; n++) {
    if (await overlayUp()) break;
    for (let w = 0; w < 20 && !(await myTurn()) && !(await overlayUp()); w++) {
      await page.waitForTimeout(200);
    }
    if (await overlayUp()) break;
    if (!(await myTurn())) continue;
    const pot = parseInt((await page.textContent('#pot')) || '0', 10) || 0;
    await (pot >= 10 ? page.locator('#btn-hold') : page.locator('#btn-roll')).click();
    await page.waitForTimeout(300);
  }
  if (!(await overlayUp())) throw new Error('the 50-point match never ended');
  const line = ((await page.textContent('#turn')) || '').trim();
  if (line !== 'Match over') throw new Error(`turn line is "${line}", not "Match over"`);
  if (!(await page.locator('#btn-roll').isDisabled()) || !(await page.locator('#btn-hold').isDisabled()))
    throw new Error('the action buttons are still live after the match ended');
}

/**
 * A fat-finger DOUBLE tap must consume exactly one round: the mis-tap guard
 * disarms the throws while a round resolves and re-arms when the next opens.
 */
async function checkNoDoubleThrow(page) {
  const round = () =>
    page.textContent('#turn').then((t) => Number(((t || '').match(/Round (\d+)/) || [])[1] || 0));
  const before = await round();
  // wait out the previous round's re-arm, else the first tap is already refused
  const rock = page.locator('.throws button[data-throw="R"]');
  await rock.waitFor({ state: 'visible', timeout: 5000 });
  for (let i = 0; i < 30 && !(await rock.isEnabled()); i++) await page.waitForTimeout(150);
  await rock.dblclick({ delay: 60 });
  await page.waitForTimeout(1200);
  const after = await round();
  if (after !== before + 1)
    throw new Error(`a double throw advanced round ${before} → ${after} (expected +1)`);
}

const browser = await chromium.launch();
let failed = 0;

for (const game of GAMES) {
  const page = await browser.newPage(MOBILE);
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).split('\n')[0]));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/cloudflareinsights|beacon\.min/.test(m.text()))
      errors.push(m.text().slice(0, 80));
  });
  try {
    await page.goto(`${BASE}/games/${game.slug}/index.html`, { waitUntil: 'networkidle' });

    // enter the playing screen
    let onBoard = false;
    for (let t = 0; t < 4 && !onBoard; t++) {
      const play = page.locator('#btn-play');
      if ((await play.count()) && (await play.isVisible())) await play.click({ timeout: 4000 });
      await page.waitForTimeout(400);
      onBoard = await page
        .locator('#screen-playing.screen--active')
        .count()
        .then((c) => c === 1);
    }
    if (!onBoard) throw new Error('could not enter the playing screen');

    // make a few real moves
    let acted = 0;
    for (let n = 0; n < 3 && acted < 3; n++) {
      for (const sel of game.moves) {
        const loc = page.locator(sel);
        const count = await loc.count();
        for (let i = 0; i < count && acted < 3; i++) {
          const el = loc.nth(i);
          if (await el.isEnabled()) {
            // SVG hit-lines (dots-and-boxes) carry pointer-events:stroke, which
            // Playwright's actionability check can't verify — force those; a
            // real tap hits them fine (played by hand in the IDE browser).
            await el.click({ timeout: 4000, force: sel.startsWith('.hit') });
            acted++;
            await page.waitForTimeout(350);
            break;
          }
        }
        if (acted >= 3) break;
      }
    }
    if (acted === 0) throw new Error('no move could be made (input locked?)');

    // the page must have reacted (something changed after the moves)
    const reacted = await page.evaluate(() => {
      const txt = document.getElementById('turn')?.textContent || '';
      const marked = document.querySelectorAll('[data-mark], .cell--mine, .stone, .disc, .hit');
      return txt.length > 0 || marked.length > 0;
    });
    if (!reacted) throw new Error('page shows no play state');

    // the states the 3-move pass walks past
    if (game.extra) await game.extra(page);

    if (errors.length) throw new Error(`JS errors: ${errors.slice(0, 2).join(' | ')}`);
    console.log(`PASS  ${game.slug.padEnd(18)} — entered play, ${acted} move(s), no JS errors`);
  } catch (e) {
    failed++;
    console.log(`FAIL  ${game.slug.padEnd(18)} — ${String(e).split('\n')[0].slice(0, 110)}`);
  }
  await page.close();
}

await browser.close();
console.log(`\n${GAMES.length - failed}/${GAMES.length} games clean`);
process.exit(failed ? 1 : 0);
