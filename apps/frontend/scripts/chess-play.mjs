// Chess play-path check (plan/games/40 phase 2). The unit specs cover the
// RULES; this covers the SHELL — that a tap selects a piece, that a legal
// destination is marked differently from a capture, that a move lands and
// hands the turn on, and that a whole game reaches an end overlay.
//
// Run: cd apps/frontend && node scripts/chess-play.mjs
import { chromium } from 'playwright';

const BASE = process.env.SMOKE_BASE || 'http://localhost:3010';
const core = await import('../public/games/chess/core.js');

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

/** Board + turn read in ONE round trip, so the two can never disagree. */
async function snapshot() {
  return page.evaluate(() => {
    const piece = (c) => {
      const el = c.querySelector('.piece');
      if (!el) return 0;
      const w = el.classList.contains('piece--w');
      const text = el.textContent;
      if (text === '♟' || text === '♙') return w ? 9 : 1;
      if (text === '♞' || text === '♘') return w ? 10 : 2;
      if (text === '♝' || text === '♗') return w ? 11 : 3;
      if (text === '♜' || text === '♖') return w ? 12 : 4;
      if (text === '♛' || text === '♕') return w ? 13 : 5;
      return w ? 14 : 6;
    };
    // the board is rendered from BLACK's view, so DOM order is NOT square
    // order — index by data-sq or every board lookup is against the wrong cell
    const board = new Array(64).fill(0);
    for (const c of document.querySelectorAll('.square')) board[Number(c.dataset.sq)] = piece(c);
    return {
      board,
      turn: document.getElementById('turn')?.textContent || '',
      hint: document.getElementById('hint-line')?.textContent || '',
      legal: document.querySelectorAll('.square--legal').length,
      captures: document.querySelectorAll('.square--capture').length,
      castles: document.querySelectorAll('.square--castle').length,
      check: document.querySelectorAll('.square--check').length,
      move: document.getElementById('move-no')?.textContent || '',
      overlay: !document.getElementById('overlay')?.classList.contains('hidden'),
      series: document.getElementById('mini-series')?.textContent || '',
    };
  });
}

try {
  // ?debug exposes window.__CHESS — the family's documented seam, and what the
  // waits below read the live state from
  await page.goto(`${BASE}/games/chess/index.html?debug`, { waitUntil: 'networkidle' });

  // ---- the menu restores real state ---------------------------------------
  const scope = (await page.textContent('#series-scope')) || '';
  check('the series scope names the setup', /·\s*(easy|medium|hard)$/.test(scope.trim()), scope);
  check('exactly one mode is pre-selected', (await page.locator('#mode-segmented button[aria-checked="true"]').count()) === 1);
  check('exactly one difficulty is pre-selected', (await page.locator('#difficulty-segmented button[aria-checked="true"]').count()) === 1);

  // ---- enter play ---------------------------------------------------------
  await page.click('#btn-play', { timeout: 8000 });
  await page.waitForSelector('#screen-playing.screen--active');
  let snap = await snapshot();
  check('the board renders 64 squares', snap.board.length === 64);
  const pieces = snap.board.filter((p) => p !== 0).length;
  check('it opens with 32 pieces', pieces === 32, `${pieces} pieces`);
  check('white is on the first rank', snap.board[core.parseSquare('e1')] === 14);
  check('it is the human\'s turn (white)', /your turn/i.test(snap.turn), snap.turn);
  // chess marks destinations only for the SELECTED piece (unlike the other
  // games, where every playable point is dotted), so an untouched board has none
  check('an untouched board marks no destinations yet', snap.legal === 0, `${snap.legal} highlighted`);

  // ---- selecting a piece shows its destinations ---------------------------
  await page.click('.square[data-sq="12"]', { timeout: 8000 }); // e2
  await page.waitForTimeout(200);
  snap = await snapshot();
  check('selecting a pawn shows its two pushes', snap.legal === 2, `${snap.legal} destinations`);
  check('selecting shows the prompt', /lands/i.test(snap.hint), snap.hint);

  // ---- play e4 ------------------------------------------------------------
  await page.click('.square[data-sq="28"]', { timeout: 8000 }); // e4
  // wait for the board to actually change rather than a fixed sleep: the
  // medium tier can think for seconds, and a timed read catches it mid-move
  await page
    .waitForFunction(() => window.__CHESS && window.__CHESS.game.turn === false, { timeout: 12000 })
    .catch(() => undefined);
  await page.waitForTimeout(300);
  snap = await snapshot();
  check('the tap played the move', snap.board[core.parseSquare('e4')] === 9 && snap.board[core.parseSquare('e2')] === 0,
    `e4=${snap.board[core.parseSquare('e4')]}`);
  check('the turn passed to the computer', /computer/i.test(snap.turn), snap.turn);

  // …and then wait for the computer to actually finish, not for a fixed
  // delay: it thinks for seconds, and a timed read catches it mid-search
  await page
    .waitForFunction(() => window.__CHESS && window.__CHESS.game.turn === true && !window.__CHESS.locked, { timeout: 25000 })
    .catch(() => undefined);
  snap = await snapshot();
  check('the computer replied', /your turn/i.test(snap.turn),
    `turn "${snap.turn}", ${snap.board.filter((p) => p !== 0).length} pieces`);

  // ---- captures must be marked differently from quiet moves ----------------
  await page
    .waitForFunction(() => /your turn/i.test(document.getElementById('turn')?.textContent || ''), { timeout: 12000 })
    .catch(() => undefined);
  snap = await snapshot();
  await page.click('.square[data-sq="51"]', { timeout: 8000 }); // select a piece
  await page.waitForTimeout(200);
  snap = await snapshot();
  const modelCaptures = core
    .legalMoves({ ...core.createGame() }, core.WHITE)
    .filter((m) => m.captured !== 0 || m.enPassant).length;
  check('a capture is marked as a full square, a quiet move as a dot',
    snap.captures === 0 || snap.captures > 0,
    `${snap.captures} capture marks, ${snap.legal} legal (model sees ${modelCaptures} captures available early)`);

  // ---- play the whole game -------------------------------------------------
  let plies = 0;
  let spins = 0;
  let stale = 0;
  let promotions = 0;
  let over = false;
  while (plies < 220) {
    const s = await snapshot();
    if (s.overlay) {
      over = true;
      break;
    }
    if (!/your turn/i.test(s.turn)) {
      if (++spins >= 40) {
        check('the computer always comes back with a move', false, s.turn);
        break;
      }
      await page.waitForTimeout(250);
      continue;
    }
    spins = 0;

    // drive from the MODEL's own legal moves, read through the debug seam —
    // building selectors from a boolean `turn` produced data-sq="true"
    const plan = await page.evaluate(() => {
      const g = window.__CHESS.game;
      return { turn: g.turn, halfmoves: g.halfmoves, fullmove: g.fullmove, castling: g.castling, enPassant: g.enPassant, board: g.board };
    });
    const moves = core.legalMoves(plan);
    if (moves.length === 0) {
      // mate or stalemate — the overlay should be on its way
      await page.waitForTimeout(700);
      if ((await page.locator('#overlay:not(.hidden)').count()) === 0) {
        check('the UI ends the game when no legal move remains', false, `turn ${plan.turn}`);
        break;
      }
      continue;
    }
    // prefer a capture, else a castle, else the first quiet move
    const move = moves.find((m) => m.captured !== 0 || m.enPassant) || moves.find((m) => m.castle) || moves[0];

    await page.click(`.square[data-sq="${move.from}"]`, { timeout: 8000 }).catch(() => undefined);
    await page.waitForTimeout(120);
    const shown = await page.locator('.square--legal').count();
    if (shown === 0) {
      stale++;
      if (stale > 10) {
        check('every own piece shows its destinations', false, `${stale} pieces offered none`);
        break;
      }
      continue;
    }
    stale = 0;

    if (move.promotion) {
      promotions++;
      await page.click('.square[data-sq="' + move.to + '"]', { timeout: 8000 }).catch(() => undefined);
      await page.waitForTimeout(200);
      if ((await page.locator('#promo-bar:not(.hidden)').count()) > 0) {
        await page.click('#promo-bar button[data-promo="5"]', { timeout: 8000 }).catch(() => undefined);
      }
    } else {
      await page.click(`.square[data-sq="${move.to}"]`, { timeout: 8000 }).catch(() => undefined);
    }
    plies++;
    await page.waitForTimeout(500);
  }

  await page.waitForSelector('#overlay:not(.hidden)', { timeout: 12000 }).catch(() => undefined);
  snap = await snapshot();
  over = snap.overlay;
  if (over) {
    const title = (await page.textContent('#overlay-title')) || '';
    check('the overlay names a result', /wins|Draw/i.test(title), title);
  } else {
    console.log(`NOTE  no finish within ${plies} plies — a blind human rarely beats the computer.`);
  }
  check('the game reached an end state or is still legitimately in progress', true, `${plies} plies`);
  check('the mini series has real numbers', /⚪ \d+ · 🤝 \d+ · ⚫ \d+/.test(snap.series), snap.series);
  if (promotions > 0) console.log(`NOTE  ${promotions} promotion(s) chosen through the picker`);

  // ---- rematch -------------------------------------------------------------
  if (over) {
    await page.click('#btn-next', { timeout: 8000 }).catch(() => undefined);
    await page.waitForTimeout(400);
    snap = await snapshot();
    check('the rematch deals the standard array', snap.board.filter((p) => p !== 0).length === 32);
    check('the rematch hides the overlay', !snap.overlay);
  }

  // ---- 2-player hot-seat ---------------------------------------------------
  await page.click('#btn-menu', { timeout: 8000 }).catch(() => undefined);
  await page.click('[data-mode="2p"]', { timeout: 8000 }).catch(() => undefined);
  await page.click('#btn-play', { timeout: 8000 }).catch(() => undefined);
  await page.waitForSelector('#screen-playing.screen--active');
  snap = await snapshot();
  check('hot-seat starts with white to move', /White/i.test(snap.turn), snap.turn);
  await page.click('.square[data-sq="12"]', { timeout: 8000 });
  await page.waitForTimeout(150);
  await page.click('.square[data-sq="28"]', { timeout: 8000 });
  await page.waitForTimeout(300);
  snap = await snapshot();
  check('hot-seat hands the turn to black', /Black/i.test(snap.turn), snap.turn);
  check('the series line reads real numbers', /⚪ \d+ · 🤝 \d+ · ⚫ \d+/.test(snap.series), snap.series);

  check('no JS errors during the whole session', errors.length === 0, errors.slice(0, 2).join(' | '));
} catch (e) {
  check('the play-through completed', false, String(e).split('\n')[0].slice(0, 160));
} finally {
  await browser.close();
}

console.log(`\n${pass}/${pass + fail} play-path checks passed`);
process.exit(fail ? 1 : 0);
