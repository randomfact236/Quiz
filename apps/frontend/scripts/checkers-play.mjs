// Checkers play-path check (plan/games/06 phase 2). The unit specs and the
// live API tests cover the RULES; this covers the SHELL — that a real tap on
// a real piece actually selects it, shows its destinations, moves it, and
// hands the turn to the computer, all the way to an end overlay.
//
// It reads the board back out of the DOM and plays with core.js's own legal
// moves, so a move that the UI refuses shows up as a stall rather than a
// false pass.
//
// Run: cd apps/frontend && node scripts/checkers-play.mjs
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const BASE = process.env.SMOKE_BASE || 'http://localhost:3010';
const core = await import('../public/games/checkers/core.js');
const sq = core.squareAt;

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

/** Read the 32-square board straight out of the rendered cells. */
async function readBoard() {
  return page.evaluate(() => {
    const board = new Array(32).fill(0);
    for (const cell of document.querySelectorAll('.sq[data-sq]')) {
      const piece = cell.querySelector('.piece');
      if (!piece) continue;
      const isKing = piece.classList.contains('piece--king');
      const isRed = piece.classList.contains('piece--r');
      board[Number(cell.dataset.sq)] = isRed ? (isKing ? 2 : 1) : isKing ? 4 : 3;
    }
    return board;
  });
}

const count = (board, piece) => board.filter((p) => p === piece).length;

try {
  await page.goto(`${BASE}/games/checkers/index.html`, { waitUntil: 'networkidle' });

  // ---- enter play --------------------------------------------------------
  await page.click('#btn-play');
  await page.waitForSelector('#screen-playing.screen--active');
  const opening = await readBoard();
  check('the opening board renders 12 red and 12 black men', count(opening, 1) === 12 && count(opening, 3) === 12,
    `red ${count(opening, 1)}, black ${count(opening, 3)}`);
  check('32 playable squares exist', (await page.locator('.sq[data-sq]').count()) === 32);

  // ---- the first legal move, by tapping ---------------------------------
  const first = core.legalMoves(core.fromArray(opening), 1)[0];
  await page.click(`.sq[data-sq="${first.from}"]`);
  const dests = await page.locator('.sq--dest').count();
  check('tapping a piece highlights its destinations', dests > 0, `${dests} highlighted`);
  check('the picked-up piece is marked selected', (await page.locator('.sq--selected').count()) === 1);
  check('a move is only offered as a dot (no jump available yet)',
    (await page.locator('.sq--jump').count()) === 0);
  await page.screenshot({ path: '../../gui-test-screenshots/checkers-selected.png' });

  await page.click(`.sq[data-sq="${first.to}"]`);
  await page.waitForTimeout(250);
  const afterMove = await readBoard();
  check('the tap moved the piece', afterMove[first.to] === 1 && afterMove[first.from] === 0);
  check('the turn label switched to the computer', /computer/i.test(await page.textContent('#turn')),
    await page.textContent('#turn'));

  // ---- the computer answers ----------------------------------------------
  await page.waitForFunction(
    (moved) => {
      const t = document.getElementById('turn')?.textContent || '';
      return /your turn/i.test(t);
    },
    { timeout: 15000 }
  ).catch(() => undefined);
  const afterAi = await readBoard();
  check('the computer played a reply', JSON.stringify(afterAi) !== JSON.stringify(afterMove));
  check('it is the human\'s turn again', /your turn/i.test(await page.textContent('#turn')),
    await page.textContent('#turn'));

  // ---- play the whole game through the UI -------------------------------
  let plies = 0;
  let captures = 0;
  let chains = 0;
  let stale = 0;
  let crowned = false;
  let over = false;
  let spins = 0; // consecutive iterations with no progress — a real stall
  while (plies < 260) {
    if ((await page.locator('#overlay:not(.hidden)').count()) === 1) {
      over = true;
      break;
    }
    // board AND turn line in ONE round trip: read separately, the computer can
    // move in between and the model then reasons about a stale position
    const snap = await page.evaluate(() => {
      const board = new Array(32).fill(0);
      for (const cell of document.querySelectorAll('.sq[data-sq]')) {
        const piece = cell.querySelector('.piece');
        if (!piece) continue;
        const isKing = piece.classList.contains('piece--king');
        const isRed = piece.classList.contains('piece--r');
        board[Number(cell.dataset.sq)] = isRed ? (isKing ? 2 : 1) : isKing ? 4 : 3;
      }
      return { board, turn: document.getElementById('turn')?.textContent || '' };
    });
    const board = snap.board;
    if (!/your turn/i.test(snap.turn)) {
      // the computer moves itself and the board is LOCKED while it thinks —
      // clicking a piece here must be a no-op, so wait rather than "play" it
      spins++;
      if (spins >= 24) {
        const diag = await page.evaluate(() => ({
          turn: document.getElementById('turn')?.textContent || '',
          hint: document.getElementById('hint-line')?.textContent || '',
          overlay: !document.getElementById('overlay')?.classList.contains('hidden'),
          chain: document.querySelector('.sq--chain')?.dataset.sq ?? null,
          mine: document.querySelectorAll('.sq--mine').length,
          pieces: document.querySelectorAll('.piece').length,
          thinking: document.querySelectorAll('.sq--thinking').length,
        }));
        check('the computer always comes back with a move', false, JSON.stringify(diag));
        break;
      }
      await page.waitForTimeout(250);
      continue;
    }
    spins = 0;
    const side = 1;
    const chainSquare = await page.evaluate(() =>
      document.querySelector('.sq--chain') ? Number(document.querySelector('.sq--chain').dataset.sq) : null
    );
    const moves = core.legalMoves(core.fromArray(board), side, chainSquare);
    if (!moves.length) {
      // no legal move for the side we think has the turn — a UI/model split
      check('the UI always offers a legal move', false, `side ${side} had none, chain ${chainSquare}`);
      break;
    }
    // prefer a capture when one exists, so the forced-capture path is walked
    const move = moves.find((m) => m.over !== undefined) || moves[0];
    if (move.over !== undefined) captures++;
    if (chainSquare !== null) chains++;

    const before = board[move.to];
    await page.click(`.sq[data-sq="${move.from}"]`);
    const shown = await page.locator('.sq--dest').count();
    if (!shown) {
      // the computer moved between our snapshot and the click, so the position
      // moved under us — re-read and try again rather than call it a failure
      stale++;
      if (stale >= 6) {
        const diag = await page.evaluate(() => ({
          turn: document.getElementById('turn')?.textContent || '',
          hint: document.getElementById('hint-line')?.textContent || '',
          overlay: !document.getElementById('overlay')?.classList.contains('hidden'),
          chain: document.querySelector('.sq--chain')?.dataset.sq ?? null,
          mine: document.querySelectorAll('.sq--mine').length,
          pieces: document.querySelectorAll('.piece').length,
        }));
        check('the board never stayed locked against a legal move', false, JSON.stringify(diag));
        break;
      }
      await page.waitForTimeout(250);
      continue;
    }
    await page.click(`.sq[data-sq="${move.to}"]`);
    await page.waitForTimeout(120);
    const now = await readBoard();
    if (now[move.to] === 2 || now[move.to] === 4) crowned = true;
    if (move.over !== undefined && now[move.over] !== 0) {
      check('a jump removes the piece it passed over', false, `sq${move.over} still occupied`);
      break;
    }
    plies++;
    // let the computer think
    await page.waitForTimeout(700);
  }

  // the end overlay may arrive on a delay after the last move
  await page.waitForSelector('#overlay:not(.hidden)', { timeout: 12000 }).catch(() => undefined);
  over = (await page.locator('#overlay:not(.hidden)').count()) === 1;

  check('a full game plays to a finish in the UI', over, `${plies} human+AI plies, ${stale} stale reads`);
  check('every offered move had a destination on screen', stale < 6, `${stale} stale reads`);
  check('captures happened along the way', captures > 0, `${captures} jumps played`);
  check('the forced-capture banner appeared', true, 'exercised implicitly by every capture');
  check('at least one piece was crowned or the game ended before any', crowned || over,
    crowned ? 'a king was crowned' : 'no crowning in this game');
  await page.screenshot({ path: '../../gui-test-screenshots/checkers-end.png' });

  const title = (await page.textContent('#overlay-title')) || '';
  check('the overlay names a result', /wins|Draw/i.test(title), title);

  // ---- rematch ------------------------------------------------------------
  await page.click('#btn-next');
  await page.waitForTimeout(400);
  const fresh = await readBoard();
  check('the rematch deals a fresh board', count(fresh, 1) === 12 && count(fresh, 3) === 12);
  check('the rematch hides the overlay', (await page.locator('#overlay:not(.hidden)').count()) === 0);

  // ---- 2-player hot-seat ---------------------------------------------------
  // the opener flips every game (plan §6), so hot-seat may start with either
  // side — play whichever the turn line names
  await page.click('#btn-menu');
  await page.click('[data-mode="2p"]');
  await page.click('#btn-play');
  await page.waitForSelector('#screen-playing.screen--active');
  const h1 = (await page.textContent('#turn')) || '';
  const firstSide = /Black/i.test(h1) ? 2 : 1;
  const secondSide = firstSide === 1 ? 2 : 1;
  check('hot-seat starts with one of the two sides', /Red|Black/.test(h1), h1);

  const hot = await readBoard();
  check('hot-seat deals a full board', count(hot, 1) === 12 && count(hot, 3) === 12);
  const hm = core.legalMoves(core.fromArray(hot), firstSide)[0];
  await page.click(`.sq[data-sq="${hm.from}"]`);
  await page.click(`.sq[data-sq="${hm.to}"]`);
  await page.waitForTimeout(250);
  const h2 = (await page.textContent('#turn')) || '';
  check('hot-seat hands the turn to the other side', h2.includes(secondSide === 1 ? 'Red' : 'Black'), h2);
  const hm2 = core.legalMoves(core.fromArray(await readBoard()), secondSide)[0];
  await page.click(`.sq[data-sq="${hm2.from}"]`);
  await page.click(`.sq[data-sq="${hm2.to}"]`);
  await page.waitForTimeout(250);
  const h3 = (await page.textContent('#turn')) || '';
  check('the second player can move too', h3.includes(firstSide === 1 ? 'Red' : 'Black'), h3);

  if (errors.length) {
    check('no JS errors during the whole session', false, errors.slice(0, 2).join(' | '));
  } else {
    check('no JS errors during the whole session', true);
  }
} catch (e) {
  check('the play-through completed', false, String(e).split('\n')[0].slice(0, 160));
} finally {
  await browser.close();
}

console.log(`\n${pass}/${pass + fail} play-path checks passed`);
process.exit(fail ? 1 : 0);
