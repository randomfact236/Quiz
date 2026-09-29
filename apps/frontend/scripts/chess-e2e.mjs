// Live Chess duel E2E over HTTP (plan/games/40 phase 3).
const API = process.env.E2E_API || 'http://localhost:3012/api/v1';
const core = await import('../public/games/chess/core.js');
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
  if (ok) pass++; else fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? ' — ' + extra : ''}`);
};

const white = await token('ch-e2e-white-' + Date.now());
const black = await token('ch-e2e-black-' + Date.now());
const stranger = await token('ch-e2e-stranger-' + Date.now());

const created = await post('/chess', white, { playerName: 'Rosa' });
check('create returns a 6-char code', /^[A-Z0-9]{6}$/.test(created.body.code), created.body.code);
const code = created.body.code;

const joined = await post(`/chess/${code}/join`, black, { playerName: 'Yusuf' });
check('join starts the match', joined.body.status === 'running', joined.body.status);
check('the board is the standard array', joined.body.board.length === 64 && joined.body.board.filter((p) => p !== 0).length === 32);
check('the challenger is seated as black (2)', joined.body.yourMark === 2);
check('the opening offers 20 legal moves server-side',
  core.legalMoves({ board: joined.body.board, turn: core.WHITE, castling: 15, enPassant: -1 }).length === 20);

const third = await post(`/chess/${code}/join`, stranger, { playerName: 'Mallory' });
check('a third player is refused', third.status === 403, `status ${third.status}`);
const outOfTurn = await post(`/chess/${code}/move`, black, { from: 12, to: 28 });
check('black cannot move on white\'s turn', outOfTurn.status === 400, outOfTurn.body.message);
const notIn = await post(`/chess/${code}/move`, stranger, { from: 12, to: 28 });
check('a stranger cannot move', notIn.status === 403, `status ${notIn.status}`);
// e2 -> d5 is a pawn reaching three files across in one move: impossible
// (e2-e3 and e2-e4 are both LEGAL, which an earlier version of this check
// got wrong — it played a real move and every later check cascaded off it.)
const nonsense = await post(`/chess/${code}/move`, white, { from: 12, to: 35 });
check('a move that is not in the legal list is rejected', nonsense.status === 400, nonsense.body.message);
const knight = await post(`/chess/${code}/move`, white, { from: 1, to: 18 });
check('a knight move is accepted', knight.status === 201 || knight.status === 200, `status ${knight.status}`);
check('the turn passed to black', knight.body.turn === 2);
check('the fullmove clock did not tick on white', knight.body.fullmove === 1, `fullmove ${knight.body.fullmove}`);

// a real e2-e4 double push, and the en-passant square the server records
// a genuinely open file: e8 is the black KING, so e7-e5 is illegal
const pushed = await post(`/chess/${code}/move`, black, { from: 51, to: 35 }); // d7-d5
if (pushed.status >= 400) {
  console.log('  (black e-pawn push rejected:', pushed.body.message, ')');
}
check('a double push records the skipped square', pushed.body.enPassant === 43, `enPassant ${pushed.body.enPassant} (d6 = 43)`);

const poll = await call(`/chess/${code}?guestId=${white.guestId}`, 'GET', white);
check('the poll returns the same board', JSON.stringify(poll.body.board) === JSON.stringify(pushed.body.board));
check('the poll exposes no private field', !('rGuestId' in poll.body) && !('yGuestId' in poll.body));

// play the game out with the model driving both sides
let view = pushed.body;
let plies = 0;
let throttled = 0;
while (view.status === 'running' && plies < 300) {
  const moves = core.legalMoves({ board: view.board, turn: view.turn === 1 ? core.WHITE : core.BLACK, castling: view.castling, enPassant: view.enPassant });
  if (moves.length === 0) break;
  const move = moves[plies % moves.length];
  const who = view.turn === 1 ? white : black;
  let res = await call(`/chess/${code}/move`, 'POST', who, {
    from: move.from, to: move.to, promotion: move.promotion || null,
  });
  for (let w = 0; res.status === 429 && w < 3; w++) { throttled++; await sleep(20000); res = await call(`/chess/${code}/move`, 'POST', who, { from: move.from, to: move.to, promotion: move.promotion || null }); }
  if (res.status >= 400) { check('a legal move was accepted mid-game', false, res.body.message); break; }
  view = res.body;
  plies++;
  await sleep(400);
}
check('a full game reaches a decision', view.status === 'finished', `${plies} plies (${throttled} throttled)`);
check('the server named the result', !!view.result, `result ${view.result}, winner ${view.winner}, draw ${view.draw}`);
if (view.result === 'checkmate') {
  check('checkmate names the winning side', view.winner === 1 || view.winner === 2);
} else {
  check('a drawn result has no winner', view.winner === null);
}
const afterEnd = await post(`/chess/${code}/move`, white, { from: 12, to: 28 });
check('no moves after the game ends', afterEnd.status === 400);

console.log(`\n${pass}/${pass + fail} live checks passed`);
process.exit(fail ? 1 : 0);
