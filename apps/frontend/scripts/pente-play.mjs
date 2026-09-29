// Pente play-path check (plan/games/23 phase 2). The unit specs cover the
// RULES; this covers the SHELL — that a tap on an open intersection places a
// stone, that a flank actually removes the pair from the board, that the
// capture tally moves, and that a whole game runs to an end overlay.
//
// It reads the board out of the DOM and plays with core.js's own rules, so a
// move the UI refuses shows up as a stall rather than a false pass.
//
// Run: cd apps/frontend && node scripts/pente-play.mjs
import { chromium } from 'playwright';

const BASE = process.env.SMOKE_BASE || 'http://localhost:3010';
const core = await import('../public/games/pente/core.js');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
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

/** Read the board + turn + capture tally out of the rendered DOM, atomically. */
async function snapshot() {
  return page.evaluate(() => {
    const size = document.querySelectorAll('.cell').length;
    const dim = Math.round(Math.sqrt(size));
    const cells = [...document.querySelectorAll('.cell')].map((c) => {
      const s = c.querySelector('.stone');
      if (!s) return 0;
      return s.classList.contains('stone--dark') ? 1 : 2;
    });
    return {
      size: dim,
      cells,
      turn: document.getElementById('turn')?.textContent || '',
      hint: document.getElementById('hint-line')?.textContent || '',
      capDark: document.getElementById('cap-dark')?.textContent || '',
      capLight: document.getElementById('cap-light')?.textContent || '',
      overlay: !document.getElementById('overlay')?.classList.contains('hidden'),
      free: document.querySelectorAll('.cell--free').length,
      captureHints: document.querySelectorAll('.cell--capture').length,
      series: document.getElementById('mini-series')?.textContent || '',
    };
  });
}

const count = (cells, v) => cells.filter((c) => c === v).length;

try {
  await page.goto(`${BASE}/games/pente/index.html`, { waitUntil: 'networkidle' });

  // ---- the menu restores real state (the prefs bug lived here twice) ----
  const scope = (await page.textContent('#series-scope')) || '';
  check('the series scope names the setup', /·\s*(easy|medium|hard)\s+·\s*\d+×\d+/.test(scope), scope);
  check('exactly one mode is pre-selected', (await page.locator('#mode-segmented button[aria-checked="true"]').count()) === 1);
  check('exactly one difficulty is pre-selected', (await page.locator('#difficulty-segmented button[aria-checked="true"]').count()) === 1);
  check('exactly one board size is pre-selected', (await page.locator('#size-segmented button[aria-checked="true"]').count()) === 1);
  check('exactly one capture target is pre-selected', (await page.locator('#target-segmented button[aria-checked="true"]').count()) === 1);

  // the 15x15 board is the quick one to play through
  await page.click('#size-segmented button[data-size="15"]');
  await page.click('#target-segmented button[data-target="3"]');
  await page.reload({ waitUntil: 'networkidle' });
  const sizeKept = await page.locator('#size-segmented button[data-size="15"]').getAttribute('aria-checked');
  const targetKept = await page.locator('#target-segmented button[data-target="3"]').getAttribute('aria-checked');
  check('the board size and capture target both persist', sizeKept === 'true' && targetKept === 'true',
    `size ${sizeKept}, target ${targetKept}`);

  // ---- enter play -------------------------------------------------------
  await page.click('#btn-play');
  await page.waitForSelector('#screen-playing.screen--active');
  let snap = await snapshot();
  check('the 15x15 board renders 225 intersections', snap.cells.length === 225, `${snap.cells.length}`);
  check('black opens with just the centre stone', count(snap.cells, 1) === 1 && count(snap.cells, 2) === 0,
    `black ${count(snap.cells, 1)}, white ${count(snap.cells, 2)}`);
  check('the centre is black', snap.cells[core.centreOf(15)] === core.BLACK);
  // Pente forces BLACK to open with the centre stone and the human IS black,
  // so the computer legitimately replies before the player can tap. The UI has
  // to say so, or the opening reads as a hang.
  check('the computer replies to the forced opening stone', /computer/i.test(snap.turn), snap.turn);
  check('the opening move is explained', /opening stone/i.test(snap.hint), snap.hint);
  check('every empty point is playable', snap.free === 224, `${snap.free} free`);

  // ---- the human's first real stone --------------------------------------
  await page
    .waitForFunction(() => /your turn/i.test(document.getElementById('turn')?.textContent || ''), {
      timeout: 12000,
    })
    .catch(() => undefined);
  snap = await snapshot();
  const stonesAfterReply = count(snap.cells, 1) + count(snap.cells, 2);
  check('the computer answered the opening stone', stonesAfterReply === 2, `${stonesAfterReply} stones`);
  // Check straight after the tap, NOT after the computer has replied: white may
  // well flank this stone and capture it, which is the point of the game.
  const firstMove = core.centreOf(15) - 15;
  await page.click(`.cell[data-idx="${firstMove}"]`);
  await page.waitForTimeout(250);
  snap = await snapshot();
  check('the tap placed a black stone', snap.cells[firstMove] === core.BLACK,
    `turn "${snap.turn}"`);
  await page
    .waitForFunction(() => /your turn/i.test(document.getElementById('turn')?.textContent || ''), {
      timeout: 12000,
    })
    .catch(() => undefined);
  snap = await snapshot();
  check('the turn came back to the human', /your turn/i.test(snap.turn), snap.turn);

  // ---- force a capture and check the pair comes OFF the board ----------
  // reset into a crafted position by playing a 15x15 game the model controls:
  // simpler — verify the tally and removal using the model's own play
  let plies = 0;
  let captures = 0;
  let spins = 0;
  let stale = 0;
  let over = false;
  while (plies < 220) {
    const s = await snapshot();
    if (s.overlay) {
      over = true;
      break;
    }
    if (!/your turn/i.test(s.turn)) {
      if (++spins >= 40) {
        check('the computer always comes back with a move', false, JSON.stringify(s));
        break;
      }
      await page.waitForTimeout(250);
      continue;
    }
    spins = 0;
    // play a capture if one is offered, else the point nearest the centre
    let move = null;
    if (s.captureHints > 0) {
      const hinted = await page.evaluate(() =>
        [...document.querySelectorAll('.cell--capture')].map((c) => Number(c.dataset.idx))
      );
      // capture the most pairs
      for (const idx of hinted) {
        const p = core.pairsAt(s.cells, idx, core.BLACK, s.size);
        if (move === null || p > core.pairsAt(s.cells, move, core.BLACK, s.size)) move = idx;
      }
    }
    if (move === null) {
      const mid = Math.floor(s.size / 2);
      const empties = s.cells.map((c, i) => (c === 0 ? i : -1)).filter((i) => i >= 0);
      empties.sort((a, b) => {
        const da = Math.abs(Math.floor(a / s.size) - mid) + Math.abs((a % s.size) - mid);
        const db = Math.abs(Math.floor(b / s.size) - mid) + Math.abs((b % s.size) - mid);
        return da - db;
      });
      move = empties[0];
    }
    const expectPairs = core.pairsAt(s.cells, move, core.BLACK, s.size);
    const before = count(s.cells, 1) + count(s.cells, 2);
    await page.click(`.cell[data-idx="${move}"]`);
    await page.waitForTimeout(150); // before the computer can capture it back
    const after = await snapshot();
    if (after.cells[move] !== core.BLACK) {
      // The click can lose a race with a re-render: the snapshot says the
      // square is open and it is our turn, but by the time the click lands the
      // board has moved on and onCellTap() correctly refuses it. Re-read and
      // try again rather than call a refused stale tap a product failure.
      stale++;
      if (stale > 12) {
        check('every playable point accepted the stone', false,
          `${stale} refused taps in a row at idx ${move}`);
        break;
      }
      plies++;
      await page.waitForTimeout(250);
      continue;
    }
    stale = 0;
    if (expectPairs > 0) {
      captures += expectPairs;
      // the pair must be GONE from the board, and the tally must have moved
      const afterStones = count(after.cells, 1) + count(after.cells, 2);
      const expected = before + 1 - expectPairs * 2;
      if (afterStones !== expected) {
        check('a capture removes exactly the flanked pair', false,
          `had ${before}, placed 1, took ${expectPairs} pair(s) → ${afterStones}, expected ${expected}`);
        break;
      }
      if (!after.capDark.startsWith(String(captures))) {
        check('the capture tally follows the board', false, `board ${captures} pairs, tally "${after.capDark}"`);
        break;
      }
    }
    plies++;
    await page.waitForTimeout(600);
  }

  await page.waitForSelector('#overlay:not(.hidden)', { timeout: 12000 }).catch(() => undefined);
  snap = await snapshot();
  over = snap.overlay;

  check('a full game plays to a finish in the UI', over, `${plies} human plies, ${captures} pairs captured`);
  check('the board accepted its taps', stale <= 12, `${stale} stale taps retried`);
  const title = (await page.textContent('#overlay-title')) || '';
  check('the overlay names a result', /wins|Draw/i.test(title), title);
  const sub = (await page.textContent('#overlay-sub')) || '';
  check('the overlay says HOW it was won', /five in a row|pairs captured/i.test(sub), sub);
  check('the mini series has real numbers', /⚫ \d+ · 🤝 \d+ · ⚪ \d+/.test(snap.series), snap.series);

  // ---- rematch -----------------------------------------------------------
  await page.click('#btn-next');
  await page.waitForTimeout(400);
  snap = await snapshot();
  check('the rematch deals a fresh board', count(snap.cells, 1) === 1 && count(snap.cells, 2) === 0);
  check('the rematch resets the capture tally', snap.capDark === '0 / 3', snap.capDark);
  check('the rematch hides the overlay', !snap.overlay);

  check('no JS errors during the whole session', errors.length === 0, errors.slice(0, 2).join(' | '));
} catch (e) {
  check('the play-through completed', false, String(e).split('\n')[0].slice(0, 160));
} finally {
  await browser.close();
}

console.log(`\n${pass}/${pass + fail} play-path checks passed`);
process.exit(fail ? 1 : 0);
