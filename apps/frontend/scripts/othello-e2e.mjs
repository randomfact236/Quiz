// Live Othello duel E2E over HTTP (plan/games/12 phase 3).
const API = process.env.E2E_API || 'http://localhost:3012/api/v1';
const core = await import('../public/games/othello/core.js');

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

const dark = await token('oth-e2e-dark-' + Date.now());
const light = await token('oth-e2e-light-' + Date.now());
const stranger = await token('oth-e2e-stranger-' + Date.now());

const created = await post('/othello', dark, { playerName: 'Rosa', size: 6 });
check('create returns a 6-char code', /^[A-Z0-9]{6}$/.test(created.body.code), created.body.code);
const code = created.body.code;

const joined = await post(`/othello/${code}/join`, light, { playerName: 'Yusuf' });
check('join starts the match', joined.body.status === 'running', joined.body.status);
check('the challenger is seated as light (2)', joined.body.yourMark === core.LIGHT);
check('the 6x6 board opens with 2 discs a side',
  joined.body.dark === 2 && joined.body.light === 2, `${joined.body.dark}:${joined.body.light}`);

const third = await post(`/othello/${code}/join`, stranger, { playerName: 'Mallory' });
check('a third player is refused', third.status === 403, `status ${third.status}`);

// --- a square that outflanks nothing is rejected, whoever sends it -------------
const bad = await post(`/othello/${code}/move`, dark, { idx: 0 });
check('a square that outflanks nothing is rejected', bad.status === 400, bad.body.message);

const outOfTurn = await post(`/othello/${code}/move`, light, { idx: 20 });
check('light cannot move on dark\'s turn', outOfTurn.status === 400, outOfTurn.body.message);

const notIn = await post(`/othello/${code}/move`, stranger, { idx: 19 });
check('a stranger cannot move', notIn.status === 403, `status ${notIn.status}`);

const outOfRange = await post(`/othello/${code}/move`, dark, { idx: 999 });
check('an out-of-range square is rejected', outOfRange.status === 400, outOfRange.body.message);

// --- the server decides the flips ---------------------------------------------
const first = core.legalMoves(core.fromArray(joined.body.cells, 6), core.DARK, 6)[0];
const expectFlip = core.flipsFor(joined.body.cells, first, core.DARK, 6);
const moved = await post(`/othello/${code}/move`, dark, { idx: first });
check('a legal placement is accepted', moved.status === 201 || moved.status === 200, `status ${moved.status}`);
check('the server computed the same flips we did',
  JSON.stringify(moved.body.lastMove.flipped) === JSON.stringify(expectFlip),
  `server ${JSON.stringify(moved.body.lastMove.flipped)} vs model ${JSON.stringify(expectFlip)}`);
check('the discs on the board really changed colour',
  expectFlip.every((sq) => moved.body.cells[sq] === core.DARK));
check('the turn passed to light', moved.body.turn === core.LIGHT);
check('the counts are server-derived', moved.body.dark === 4 && moved.body.light === 1,
  `${moved.body.dark}:${moved.body.light}`);

const poll = await call(`/othello/${code}?guestId=${dark.guestId}`, 'GET', dark);
check('the poll returns the same board', poll.body.cells[first] === core.DARK);
check('the poll exposes no private field', !('rGuestId' in poll.body) && !('yGuestId' in poll.body));

// --- play it out ----------------------------------------------------------------
let view = moved.body;
let plies = 0;
let throttled = 0;
while (view.status === 'running' && plies < 300) {
  const moves = core.legalMoves(view.cells, view.turn, view.size);
  if (!moves.length) break;
  const move = moves[plies % moves.length];
  const who = view.turn === core.DARK ? dark : light;
  let res = await call(`/othello/${code}/move`, 'POST', who, { idx: move });
  for (let w = 0; res.status === 429 && w < 3; w++) {
    throttled++; await sleep(20000);
    res = await call(`/othello/${code}/move`, 'POST', who, { idx: move });
  }
  if (res.status >= 400) { check('a legal move was accepted mid-game', false, res.body.message); break; }
  view = res.body;
  plies++;
  await sleep(500);
}
check('a full game reaches a decision', view.status === 'finished', `${plies} plies (${throttled} throttled)`);
const { dark: d, light: l } = view;
check('the result matches the final board', d + l === view.size * view.size, `${d}+${l} of ${view.size ** 2}`);
check('the winner is the side with more discs',
  view.winner === null ? d === l : (view.winner === core.DARK ? d > l : l > d),
  `winner ${view.winner}, ${d}:${l}, draw ${view.draw}`);

const afterEnd = await post(`/othello/${code}/move`, dark, { idx: 0 });
check('no moves after the game ends', afterEnd.status === 400);

console.log(`\n${pass}/${pass + fail} live checks passed`);
process.exit(fail ? 1 : 0);
