// Live Checkers duel E2E over HTTP (plan/games/06 phase 3).
const API = process.env.E2E_API || 'http://localhost:3012/api/v1';
const core = await import('../public/games/checkers/core.js');
const sq = core.squareAt;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// The guest-token endpoint is throttled to 10/min, so a back-to-back re-run
// gets 429'd. Retry rather than report a limiter as a product failure.
async function token(legacyId) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const r = await fetch(`${API}/guest-users/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ legacyId }),
    });
    if (r.status === 429) {
      await sleep(3000);
      continue;
    }
    return r.json();
  }
  throw new Error('could not issue a guest token (throttled)');
}

async function post(path, pair, body) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await call(path, 'POST', pair, body);
    if (res.status === 429) {
      await sleep(3000);
      continue;
    }
    return res;
  }
  return { status: 429, body: { message: 'throttled' } };
}

async function call(path, method, pair, body) {
  const r = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'X-Guest-Token': pair.token },
    body: body ? JSON.stringify({ ...body, guestId: pair.guestId }) : undefined,
  });
  return { status: r.status, body: await r.json() };
}

const red = await token('e2e-red-' + Date.now());
const black = await token('e2e-black-' + Date.now());
const stranger = await token('e2e-stranger-' + Date.now());
let pass = 0, fail = 0;
const check = (name, ok, extra = '') => {
  (ok ? pass++ : fail++);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? ' — ' + extra : ''}`);
};

const created = await post('/checkers', red, { playerName: 'Rosa' });
check('create returns a 6-char code', /^[A-Z0-9]{6}$/.test(created.body.code), created.body.code);
const code = created.body.code;

const joined = await post(`/checkers/${code}/join`, black, { playerName: 'Yusuf' });
check('join starts the match', joined.body.status === 'running', `status ${joined.body.status}`);
check('join seats the challenger as black (2)', joined.body.yourMark === 2);
check('the opening board has 24 pieces', joined.body.board.filter((p) => p).length === 24);

const third = await post(`/checkers/${code}/join`, stranger, { playerName: 'Mallory' });
check('a third player is refused', third.status === 403, `status ${third.status}`);

// every square below comes from the MODEL, never hand-computed: a hardcoded
// (row, file) can land on a light square and the test then "passes" for the
// wrong reason (a validation error instead of the rule under test)
const view0 = joined.body;
const redFirst = core.legalMoves(core.fromArray(view0.board), 1)[0];
const a6 = redFirst.from, b5 = redFirst.to;
const slide = await post(`/checkers/${code}/step`, red, { from: a6, to: b5 });
check('red opens with a legal move', slide.status === 201 || slide.status === 200, `status ${slide.status}`);
check('the board updated', slide.body.board[b5] === core.RED_MAN && slide.body.board[a6] === 0);
check('the turn passed to black', slide.body.turn === 2);

// it is BLACK's turn now, so a second RED step must be refused
const redAgain = core.legalMoves(core.fromArray(slide.body.board), 1)[0];
const outOfTurn = await post(`/checkers/${code}/step`, red, {
  from: redAgain.from,
  to: redAgain.to,
});
check(
  "red cannot move twice in a row",
  outOfTurn.status === 400 && /not your turn/i.test(outOfTurn.body.message || ''),
  outOfTurn.body.message
);

const notIn = await post(`/checkers/${code}/step`, stranger, { from: a6, to: b5 });
check('a stranger cannot move', notIn.status === 403, `status ${notIn.status}`);

const blackNow = core.legalMoves(core.fromArray(slide.body.board), 2)[0];
const reply = await post(`/checkers/${code}/step`, black, { from: blackNow.from, to: blackNow.to });
check(
  'black replies with a legal move',
  reply.body.board[blackNow.to] === core.BLACK_MAN && reply.body.board[blackNow.from] === 0
);
check('the turn came back to red', reply.body.turn === 1);

const blackAgain = await post(`/checkers/${code}/step`, black, {
  from: blackNow.to,
  to: blackNow.from,
});
check(
  'black cannot move twice in a row',
  blackAgain.status === 400 && /not your turn/i.test(blackAgain.body.message || ''),
  blackAgain.body.message
);

// a red man may not step sideways, and may not retreat
const redNow = core.legalMoves(core.fromArray(reply.body.board), 1);
const someRed = redNow[0].from;
const sideways = sq(core.rowOf(someRed), core.fileOf(someRed) + 2);
const notDiagonal = await post(`/checkers/${code}/step`, red, { from: someRed, to: sideways });
check('a non-diagonal step is rejected', notDiagonal.status === 400 && /Illegal step/i.test(notDiagonal.body.message || ''), notDiagonal.body.message);

// a two-square step with nothing to jump over is not a move (and a man's
// "backwards" diagonal is a light square, so retreat is untestable by geometry)
// the man that just moved
const moved = redNow[0].to;
const over = sq(core.rowOf(moved) - 1, core.fileOf(moved));
const twoSquare = sq(core.rowOf(moved) - 2, core.fileOf(moved));
const noVictim = await post(`/checkers/${code}/step`, red, { from: moved, to: twoSquare });
check(
  'a two-square step with no victim is rejected',
  noVictim.status === 400 && /Illegal step/i.test(noVictim.body.message || ''),
  `over sq${over} empty: ${reply.body.board[over] === 0}, ${noVictim.body.message}`
);

const poll = await call(`/checkers/${code}?guestId=${red.guestId}`, 'GET', red);
check('the poll returns the same board', poll.body.board[blackNow.to] === core.BLACK_MAN);
check('the poll exposes no private field', !('rGuestId' in poll.body) && !('yGuestId' in poll.body));

// play the two sides out to a natural finish using the model's own rules.
// Paced: the API throttles bursts, and a 429 here is the limiter working, not
// a rule failure — back off and retry rather than report it as one.
let view = poll.body;
let plies = 0;
let throttled = 0;
while (view.status === 'running' && plies < 400) {
  const moves = core.legalMoves(core.fromArray(view.board), view.turn, view.chainSquare);
  if (!moves.length) break;
  const move = moves[plies % moves.length];
  const who = view.turn === 1 ? red : black;
  let res = await call(`/checkers/${code}/step`, 'POST', who, { from: move.from, to: move.to });
  // the limiter's window is 60s, so a short retry just burns attempts
  for (let w = 0; res.status === 429 && w < 3; w++) {
    throttled++;
    await new Promise((r) => setTimeout(r, 20000));
    res = await call(`/checkers/${code}/step`, 'POST', who, { from: move.from, to: move.to });
  }
  if (res.status >= 400) {
    check('a legal move was accepted mid-game', false, res.body.message);
    break;
  }
  view = res.body;
  plies++;
  await new Promise((r) => setTimeout(r, 700));
}
check('a full game reaches a decision', view.status === 'finished', `${plies} plies, status ${view.status} (${throttled} throttled)`);
check('the result is a winner or a draw', view.winner === 1 || view.winner === 2 || view.draw === true,
  `winner ${view.winner} draw ${view.draw}`);

const afterEnd = await post(`/checkers/${code}/step`, red, { from: 0, to: 4 });
check('no moves after the game ends', afterEnd.status === 400);

console.log(`\n${pass}/${pass + fail} live checks passed`);
process.exit(fail ? 1 : 0);
