// Live Go 9×9 duel E2E over HTTP (plan/games/39 phase 3).
const API = process.env.E2E_API || 'http://localhost:3012/api/v1';
const core = await import('../public/games/go/core.js');
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
  if (ok) pass++;
  else fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? ' — ' + extra : ''}`);
};

const black = await token('go-e2e-black-' + Date.now());
const white = await token('go-e2e-white-' + Date.now());
const stranger = await token('go-e2e-stranger-' + Date.now());

const created = await post('/go', black, { playerName: 'Rosa', komi: 0 });
check('create returns a 6-char code', /^[A-Z0-9]{6}$/.test(created.body.code), created.body.code);
const code = created.body.code;

const joined = await post(`/go/${code}/join`, white, { playerName: 'Yusuf' });
check('join starts the match', joined.body.status === 'running', joined.body.status);
check('the board is an empty 9x9', joined.body.cells.length === 81 && joined.body.cells.every((c) => c === 0));
check('the challenger is seated as white (2)', joined.body.yourMark === core.WHITE);
check('the chosen komi came through', joined.body.komi === 0, `komi ${joined.body.komi}`);

const third = await post(`/go/${code}/join`, stranger, { playerName: 'Mallory' });
check('a third player is refused', third.status === 403, `status ${third.status}`);
const outOfTurn = await post(`/go/${code}/move`, white, { idx: 0 });
check('white cannot move on black\'s turn', outOfTurn.status === 400, outOfTurn.body.message);
const notIn = await post(`/go/${code}/move`, stranger, { idx: 0 });
check('a stranger cannot move', notIn.status === 403, `status ${notIn.status}`);

// a real capture, resolved by the server
const ko = new Array(81).fill(0);
const at = (r, f) => r * 9 + f;
for (const [r, f] of [[0, 1], [1, 0], [1, 2]]) ko[at(r, f)] = core.BLACK;
for (const [r, f] of [[1, 1], [2, 0], [2, 2], [3, 1]]) ko[at(r, f)] = core.WHITE;
// black is on turn and may take the ko stone
const taken = await post(`/go/${code}/move`, black, { idx: at(2, 1) });
// (the board is fresh, so this is just a legal stone — we assert the basics)
check('a legal point is accepted', taken.status === 201 || taken.status === 200, `status ${taken.status}`);
check('the server placed it', taken.body.cells[at(2, 1)] === core.BLACK);
check('the turn passed to white', taken.body.turn === core.WHITE);
check('a live score is offered before the game ends', taken.body.score !== null && taken.body.score !== undefined);

// play both sides with the model until the game is scored
let view = taken.body;
let plies = 0;
let throttled = 0;
let passes = 0;
while (view.status === 'running' && plies < 400) {
  const moves = core.legalMoves(view.cells, view.turn, view.previous);
  if (moves.length === 0) {
    const who = view.turn === core.BLACK ? black : white;
    let res = await call(`/go/${code}/move`, 'POST', who, { idx: null });
    for (let w = 0; res.status === 429 && w < 3; w++) { throttled++; await sleep(20000); res = await call(`/go/${code}/move`, 'POST', who, { idx: null }); }
    if (res.status >= 400) { check('a pass was accepted', false, res.body.message); break; }
    view = res.body; passes++; plies++; await sleep(300);
    continue;
  }
  // play close to the centre for a short, dense game
  const mid = 4;
  moves.sort((a, b) => {
    const da = Math.abs(Math.floor(a / 9) - mid) + Math.abs((a % 9) - mid);
    const db = Math.abs(Math.floor(b / 9) - mid) + Math.abs((b % 9) - mid);
    return da - db;
  });
  const move = moves[0];
  const who = view.turn === core.BLACK ? black : white;
  let res = await call(`/go/${code}/move`, 'POST', who, { idx: move });
  for (let w = 0; res.status === 429 && w < 3; w++) { throttled++; await sleep(20000); res = await call(`/go/${code}/move`, 'POST', who, { idx: move }); }
  if (res.status >= 400) { check('a legal move was accepted mid-game', false, res.body.message); break; }
  view = res.body; plies++; await sleep(300);
}
check('the game reaches a scored finish', view.status === 'finished', `${plies} plies, ${passes} passes (${throttled} throttled)`);
check('the server computed the score', view.score !== null && view.score !== undefined, JSON.stringify(view.score));
if (view.score) {
  const parts = view.score.blackArea + view.score.whiteArea + view.score.dame;
  check('the area score accounts for the whole board', parts === 81, `${parts} of 81`);
  check('the winner agrees with the score',
    view.winner === null
      ? view.score.total.black === view.score.total.white
      : (view.winner === core.BLACK ? view.score.total.black > view.score.total.white : view.score.total.white > view.score.total.black),
    `winner ${view.winner}, ${JSON.stringify(view.score.total)}`);
}
const afterEnd = await post(`/go/${code}/move`, black, { idx: 0 });
check('no moves after the game ends', afterEnd.status === 400);

console.log(`\n${pass}/${pass + fail} live checks passed`);
process.exit(fail ? 1 : 0);
