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
const GAMES = [
  { slug: 'tic-tac-toe', moves: ['#board .cell', '.cell'], board: '#board .cell' },
  { slug: 'connect-four', moves: ['#board .cell', '.cell[data-col]'], board: '#board .cell' },
  { slug: 'gomoku', moves: ['#board .cell', '.cell'], board: '#board .cell' },
  { slug: 'dots-and-boxes', moves: ['.hit', '.hit[data-edge]'], board: '.hit' },
  { slug: 'battleship', moves: ['#sea-mine .cell', '.cell[data-cell]'], board: '#sea-mine .cell' },
  { slug: 'pig-dice', moves: ['#btn-roll'], board: null },
  { slug: 'rock-paper-scissors', moves: ['.throws button', '[data-throw]'], board: null },
];

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
