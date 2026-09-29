// Live Pente duel E2E over HTTP (plan/games/23 phase 3).
const API = process.env.E2E_API || 'http://localhost:3012/api/v1';
const core = await import('../public/games/pente/core.js');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function token(legacyId) {
  for (let i = 0; i < 6; i++) {
    const r = await fetch(`${API}/guest-users/token`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ legacyId }),
    });
    if (r.status === 429) { await sleep(3000); continue; }
    return r.json();
  }
  throw new Error('could not issue a guest token (throttled)');
}
async function call(path, method, pair, body) {
  const r = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'X-Guest-Token': pair.token },
    body: body ? JSON.stringify({ ...body, guestId: pair.guestId }) : undefined,
  });
  return { status: r.status, body: await r.json() };
}
async function post(path, pair, body) {
  for (let i = 0; i < 6; i++) {
    const res = await call(path, 'POST', pair, body);
    if (res.status === 429) { await sleep(3000); continue; }
    return res;
  }
  return { status: 429, body: { message: 'throttled' } };
}

let pass = 0, fail = 0;
const check = (name, ok, extra = '') => {
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? ' — ' + extra : ''}`);
};

const black = await token('pte-e2e-black-' + Date.now());
const white = await token('pte-e2e-white-' + Date.now());
const stranger = await token('pte-e2e-stranger-' + Date.now());

const created = await post('/pente', black, { playerName: 'Rosa', size: 15, target: 3 });
check('create returns a 6-char code', /^[A-Z0-9]{6}$/.test(created.body.code), created.body.code);
const code = created.body.code;

const joined = await post(`/pente/${code}/join`, white, { playerName: 'Yusuf' });
check('join starts the match', joined.body.status === 'running', joined.body.status);
check('the board is 15x15 with one centre stone',
  joined.body.cells.length === 225 && joined.body.cells.filter((c) => c !== 0).length === 1);
check('the challenger is seated as white (2)', joined.body.yourMark === core.WHITE);
check('white moves second (black opened on the centre)', joined.body.turn === core.WHITE);
check('the capture target came through', joined.body.target === 3, `target ${joined.body.target}`);

const third = await post(`/pente/${code}/join`, stranger, { playerName: 'Mallory' });
check('a third player is refused', third.status === 403, `status ${third.status}`);

const outOfTurn = await post(`/pente/${code}/move`, black, { idx: 0 });
check('black cannot move before white', outOfTurn.status === 400, outOfTurn.body.message);
const notIn = await post(`/pente/${code}/move`, stranger, { idx: 0 });
check('a stranger cannot move', notIn.status === 403, `status ${notIn.status}`);
const occupied = await post(`/pente/${code}/move`, white, { idx: core.centreOf(15) });
check('an occupied intersection is rejected', occupied.status === 400, occupied.body.message);

// ---- a real capture, resolved by the server --------------------------------
const view0 = joined.body;
const size = view0.size;
const emptyIdx = view0.cells.findIndex((c) => c === 0);
const firstMove = await post(`/pente/${code}/move`, white, { idx: emptyIdx });
check('a legal placement is accepted', firstMove.status === 201 || firstMove.status === 200, `status ${firstMove.status}`);
check('the board updated on the server', firstMove.body.cells[emptyIdx] === core.WHITE);
check('the turn passed to black', firstMove.body.turn === core.BLACK);
check('the server reports the stone counts', firstMove.body.stones.white === 1 && firstMove.body.stones.black === 1,
  JSON.stringify(firstMove.body.stones));

// ---- play it out --------------------------------------------------------------
let view = firstMove.body;
let plies = 0;
let throttled = 0;
let captures = 0;
while (view.status === 'running' && plies < 400) {
  const empties = view.cells.map((c, i) => (c === 0 ? i : -1)).filter((i) => i >= 0);
  if (empties.length === 0) break;
  // prefer a capture, else nearest the centre
  const mid = Math.floor(size / 2);
  const dist = (i) => Math.abs(Math.floor(i / size) - mid) + Math.abs((i % size) - mid);
  const withCap = empties.filter((i) => core.pairsAt(view.cells, i, view.turn, size) > 0);
  const pool = withCap.length ? withCap : empties;
  pool.sort((a, b) => dist(a) - dist(b));
  const move = pool[0];
  const expectPairs = core.pairsAt(view.cells, move, view.turn, size);
  const who = view.turn === core.BLACK ? black : white;
  let res = await call(`/pente/${code}/move`, 'POST', who, { idx: move });
  for (let w = 0; res.status === 429 && w < 3; w++) {
    throttled++; await sleep(20000);
    res = await call(`/pente/${code}/move`, 'POST', who, { idx: move });
  }
  if (res.status >= 400) { check('a legal move was accepted mid-game', false, res.body.message); break; }
  if (expectPairs > 0) {
    captures++;
    const taken = res.body.lastMove.captured;
    if (!Array.isArray(taken) || taken.length !== expectPairs * 2) {
      check('the server captured exactly the flanked pair', false, `expected ${expectPairs * 2}, got ${JSON.stringify(taken)}`);
      break;
    }
  }
  view = res.body;
  plies++;
  await sleep(500);
}
check('a full game reaches a decision', view.status === 'finished', `${plies} plies, ${captures} captures (${throttled} throttled)`);
check('the server declared a winner or a draw',
  view.winner === core.BLACK || view.winner === core.WHITE || view.draw === true,
  `winner ${view.winner} draw ${view.draw}`);
check('the capture tallies are on the server', Array.isArray(view.captures) && view.captures.length === 2,
  JSON.stringify(view.captures));

const afterEnd = await post(`/pente/${code}/move`, black, { idx: view.cells.findIndex((c) => c === 0) < 0 ? 0 : view.cells.findIndex((c) => c === 0) });
check('no moves after the game ends', afterEnd.status === 400);

console.log(`\n${pass}/${pass + fail} live checks passed`);
process.exit(fail ? 1 : 0);
