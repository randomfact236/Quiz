// Othello play-path check (plan/games/12 phase 2). The unit specs and the
// live API tests cover the RULES; this covers the SHELL — that a real tap on a
// legal square places a disc, flips the right ones, hands the turn to the
// computer, and plays all the way to an end overlay.
//
// It reads the board back out of the DOM and plays with core.js's own legal
// moves, so a move the UI refuses shows up as a stall rather than a false pass.
//
// Run: cd apps/frontend && node scripts/othello-play.mjs
import { chromium } from 'playwright';

const BASE = process.env.SMOKE_BASE || 'http://localhost:3010';
const core = await import('../public/games/othello/core.js');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e).split('\n')[0]));
page.on('console', (m) => {
  if (m.type() === 'error' && !/cloudflareinsights|beacon\.min/.test(m.text()))
    errors.push(m.text().slice(0, 120));
});

let pass = 0;
let fail = 0;
const check = (name, ok, extra = '') => {
  if (ok) pass++;
  else fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? ' — ' + extra : ''}`);
};

/** Read the board out of the rendered cells, plus the turn line, atomically. */
async function snapshot() {
  return page.evaluate(() => {
    const cells = [...document.querySelectorAll('.cell')].map((c) => {
      const disc = c.querySelector('.disc');
      if (!disc) return 0;
      return disc.classList.contains('disc--dark') ? 1 : 2;
    });
    return {
      cells,
      turn: document.getElementById('turn')?.textContent || '',
      hint: document.getElementById('hint-line')?.textContent || '',
      bar: document.getElementById('bar-count')?.textContent || '',
      overlay: !document.getElementById('overlay')?.classList.contains('hidden'),
      legal: document.querySelectorAll('.cell--legal').length,
    };
  });
}

const count = (cells, value) => cells.filter((c) => c === value).length;

try {
  await page.goto(`${BASE}/games/othello/index.html`, { waitUntil: 'networkidle' });

  // ---- the menu restores real state (the checkers prefs bug lived here) ----
  const scope = (await page.textContent('#series-scope')) || '';
  check('the series scope names the setup', /·\s*(easy|medium|hard)\s+·\s*[68]×[68]/.test(scope), scope);
  check('exactly one mode is pre-selected', (await page.locator('#mode-segmented button[aria-checked="true"]').count()) === 1);
  check('exactly one difficulty is pre-selected', (await page.locator('#difficulty-segmented button[aria-checked="true"]').count()) === 1);
  check('exactly one board size is pre-selected', (await page.locator('#size-segmented button[aria-checked="true"]').count()) === 1);

  await page.click('#size-segmented button[data-size="6"]');
  await page.reload({ waitUntil: 'networkidle' });
  const persisted = await page.locator('#size-segmented button[data-size="6"]').getAttribute('aria-checked');
  check('the chosen board size persists across a reload', persisted === 'true', `aria-checked=${persisted}`);

  // ---- enter play ---------------------------------------------------------
  await page.click('#btn-play');
  await page.waitForSelector('#screen-playing.screen--active');
  let snap = await snapshot();
  check('the 6x6 opening has 2 dark and 2 light', count(snap.cells, 1) === 2 && count(snap.cells, 2) === 2,
    `dark ${count(snap.cells, 1)}, light ${count(snap.cells, 2)}`);
  check('the board has 36 squares', snap.cells.length === 36);
  // 6x6 has the same four opening moves as 8x8 — derive it, never hardcode
  const expectedLegal = core.legalMoves(snap.cells, core.DARK).length;
  check('the legal squares are hinted on the board', snap.legal === expectedLegal,
    `${snap.legal} highlighted, model says ${expectedLegal}`);
  check('the score bar shows the opening count', /2 : 2/.test(snap.bar), snap.bar);

  // ---- the first move, by tapping -----------------------------------------
  const opening = snap.cells;
  const first = core.legalMoves(opening, core.DARK)[0];
  const expectedFlips = core.flipsFor(opening, first, core.DARK);
  await page.click(`.cell[data-idx="${first}"]`);
  await page.waitForTimeout(250);
  snap = await snapshot();
  check('the tap placed a disc', snap.cells[first] === core.DARK);
  check('the outflanked discs flipped', expectedFlips.every((s) => snap.cells[s] === core.DARK),
    `${expectedFlips.length} expected flipped`);
  check('the turn passed to the computer', /computer/i.test(snap.turn), snap.turn);

  // ---- the computer answers -----------------------------------------------
  await page.waitForFunction(() => /your turn/i.test(document.getElementById('turn')?.textContent || ''), { timeout: 15000 })
    .catch(() => undefined);
  snap = await snapshot();
  check('the computer played a reply', !snap.cells.every((c, i) => c === opening[i]));
  check('it is the human\'s turn again', /your turn/i.test(snap.turn), snap.turn);
  check('one more disc is on the board', count(snap.cells, 1) + count(snap.cells, 2) === 6,
    `${count(snap.cells, 1) + count(snap.cells, 2)} discs (2 each + the human's + the computer's)`);

  // ---- play the whole game through the UI --------------------------------
  let plies = 0;
  let flips = 0;
  let spins = 0;
  let over = false;
  while (plies < 200) {
    const s = await snapshot();
    if (s.overlay) {
      over = true;
      break;
    }
    if (!/your turn/i.test(s.turn)) {
      // the computer moves itself; the board is locked while it thinks
      if (++spins >= 30) {
        check('the computer always comes back with a move', false, JSON.stringify(s));
        break;
      }
      await page.waitForTimeout(250);
      continue;
    }
    spins = 0;
    const moves = core.legalMoves(s.cells, core.DARK);
    if (moves.length === 0) {
      // the UI must be handling the pass itself
      await page.waitForTimeout(300);
      continue;
    }
    if (s.legal !== moves.length) {
      check('the board highlights exactly the legal squares', false, `ui ${s.legal} vs model ${moves.length}`);
      break;
    }
    const move = moves[plies % moves.length];
    const expectFlip = core.flipsFor(s.cells, move, core.DARK);
    await page.click(`.cell[data-idx="${move}"]`);
    await page.waitForTimeout(120);
    const after = await snapshot();
    if (after.cells[move] !== core.DARK) {
      check('every legal move placed its disc', false, `idx ${move}`);
      break;
    }
    if (!expectFlip.every((sq) => after.cells[sq] === core.DARK)) {
      check('every flip landed on the board', false, `idx ${move} should flip ${expectFlip.length}`);
      break;
    }
    flips += expectFlip.length;
    plies++;
    await page.waitForTimeout(650);
  }

  await page.waitForSelector('#overlay:not(.hidden)', { timeout: 12000 }).catch(() => undefined);
  snap = await snapshot();
  over = snap.overlay;

  check('a full game plays to a finish in the UI', over, `${plies} human plies, ${flips} discs flipped`);
  check('discs were flipped along the way', flips > 0, `${flips} flipped`);
  const title = (await page.textContent('#overlay-title')) || '';
  check('the overlay names a result', /wins|Draw/i.test(title), title);
  const sub = (await page.textContent('#overlay-sub')) || '';
  check('the overlay shows the final disc count', /\d+–\d+/.test(sub), sub);
  // the series line silently read "NaN / undefined" when the tally keys and
  // the UI's side keys disagreed
  check('the series line has real numbers', /Series — ⚫ \d+ · ⚪ \d+ · 🤝 \d+/.test(sub), sub);
  check('the mini series has real numbers', /⚫ \d+ · 🤝 \d+ · ⚪ \d+/.test(await page.textContent('#mini-series')),
    await page.textContent('#mini-series'));

  // ---- rematch -------------------------------------------------------------
  await page.click('#btn-next');
  await page.waitForTimeout(400);
  snap = await snapshot();
  check('the rematch deals a fresh board', count(snap.cells, 1) === 2 && count(snap.cells, 2) === 2);
  check('the rematch hides the overlay', !snap.overlay);

  // ---- hot-seat -------------------------------------------------------------
  await page.click('#btn-menu');
  await page.click('[data-mode="2p"]');
  await page.click('#btn-play');
  await page.waitForSelector('#screen-playing.screen--active');
  snap = await snapshot();
  const firstSide = /Light/i.test(snap.turn) ? core.LIGHT : core.DARK;
  const secondSide = firstSide === core.DARK ? core.LIGHT : core.DARK;
  const m1 = core.legalMoves(snap.cells, firstSide)[0];
  await page.click(`.cell[data-idx="${m1}"]`);
  await page.waitForTimeout(250);
  snap = await snapshot();
  check('hot-seat hands the turn to the other side',
    snap.turn.includes(secondSide === core.DARK ? 'Dark' : 'Light'), snap.turn);
  const m2 = core.legalMoves(snap.cells, secondSide)[0];
  await page.click(`.cell[data-idx="${m2}"]`);
  await page.waitForTimeout(250);
  snap = await snapshot();
  check('the second player can move too',
    snap.turn.includes(firstSide === core.DARK ? 'Dark' : 'Light'), snap.turn);
  check('hot-seat placed both discs', count(snap.cells, 1) + count(snap.cells, 2) === 6,
    `${count(snap.cells, 1) + count(snap.cells, 2)} discs`);

  check('no JS errors during the whole session', errors.length === 0, errors.slice(0, 2).join(' | '));
} catch (e) {
  check('the play-through completed', false, String(e).split('\n')[0].slice(0, 160));
} finally {
  await browser.close();
}

console.log(`\n${pass}/${pass + fail} play-path checks passed`);
process.exit(fail ? 1 : 0);
