/**
 * ============================================================================
 * game.js — Checkers (plan/games/06-checkers.md) — UI shell
 * ============================================================================
 * Plain ESM, no build step (the games convention). The pure model lives in
 * core.js (jest-tested), persistence in storage.js, flags/strings in
 * config.js. This file is screens + DOM wiring; it auto-inits only when its
 * board exists in the DOM, so importing it in tests has no side effects.
 *
 * Modes (the family template): solo vs computer (easy/medium/hard), 2-player
 * hot-seat, and ⚔️ online duels on the server-authoritative backend — the
 * SERVER validates every step, so neither player can skip a forced capture,
 * cut a multi-jump short, or claim a capture that never happened.
 * Deep link: ?ck=CODE. Sides: 1 = 🔴 Red (creator, opens), 2 = ⚫ Black.
 * ============================================================================
 */

import {
  RED,
  BLACK,
  BOARD_ROWS,
  squareLabel,
  sideOf,
  isKing,
  other,
  initialBoard,
  fromArray,
  legalMoves,
  hasAnyJump,
  applyMove,
  outcome,
  advancesClock,
  aiMove,
} from './core.js?v=1';
import {
  emptyTally,
  seriesSetupKey,
  loadSeries,
  saveSeries,
  loadPrefs,
  savePrefs,
} from './storage.js';
import { GAME_CONFIG, t } from './config.js';

/* ==========================================================================
 * UI — auto-inits only when the board exists (never under jest/node)
 * ======================================================================= */

const SIDE_CLASS = { 1: 'piece--r', 2: 'piece--b' };
const SIDE_LABEL = { 1: '🔴 Red', 2: '⚫ Black' };

const state = {
  screen: 'menu',
  mode: '1p', // '1p' | '2p' | 'online'
  difficulty: 'medium', // 'easy' | 'medium' | 'hard'
  board: initialBoard(),
  turn: RED,
  starter: RED, // side that opens the current game
  /** Mid multi-jump: the square the chain continues from (null = free choice). */
  chainSquare: null,
  /** The piece the hard/medium tier is visibly considering (the think pulse). */
  thinkingSquare: null,
  selected: null, // the piece the player has picked up
  quietPlies: 0, // plies since the last capture/advancement — the draw clock
  locked: false, // true during AI thinking and after the game ends
  lastMove: null, // { from, to, over, crowned } for the hop/crown animations
  series: emptyTally(),
  aiTimer: null,
  online: null, // { code, mark, pollTimer, busy }
};

const els = {};

function currentSetupKey() {
  return seriesSetupKey(state.mode, state.difficulty);
}

/* ---- screens -------------------------------------------------------------- */

function showScreen(name) {
  state.screen = name;
  els.screenMenu.classList.toggle('screen--active', name === 'menu');
  els.screenPlaying.classList.toggle('screen--active', name === 'playing');
  if (name === 'menu') renderSeriesCard();
}

/* ---- menu screen ---------------------------------------------------------- */

function renderSeriesCard() {
  const scope =
    state.mode === '1p'
      ? 'vs computer · ' + state.difficulty
      : state.mode === 'online'
        ? 'online duel'
        : '2 players';
  els.seriesScope.textContent = scope;
  els.seriesR.textContent = String(state.series.r);
  els.seriesB.textContent = String(state.series.b);
  els.seriesDraw.textContent = String(state.series.draw);
  const total = state.series.r + state.series.b + state.series.draw;
  els.resetSeriesBtn.disabled = total === 0;
}

function refreshSeriesFromStorage() {
  state.series = loadSeries(currentSetupKey());
}

/* ---- board ---------------------------------------------------------------- */

/**
 * Build the 8×8 grid once. Only the 32 dark squares are buttons — the light
 * ones are inert decoration, so a tap can never land on an unplayable square.
 */
function buildBoard() {
  els.board.innerHTML = '';
  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let file = 0; file < BOARD_ROWS; file++) {
      const playable = file % 2 !== (row % 2 === 0 ? 1 : 0);
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'sq' + (playable ? ' sq--dark' : ' sq--void');
      cell.tabIndex = playable ? 0 : -1;
      if (playable) {
        cell.dataset.row = String(row);
        cell.dataset.file = String(file);
        cell.dataset.sq = String(row * 4 + (file >> 1));
        cell.setAttribute('aria-label', squareLabel(row * 4 + (file >> 1)) + ', empty');
      } else {
        cell.disabled = true;
        cell.setAttribute('aria-hidden', 'true');
      }
      els.board.appendChild(cell);
    }
  }
}

/** The squares the player may pick up right now (own pieces, in scope). */
function selectableSquares() {
  if (state.locked) return [];
  // one legal-move computation for the whole board, not one per piece
  const options = legalMoves(
    state.board,
    mySide(),
    state.chainSquare === null ? null : state.chainSquare
  );
  const out = [];
  for (const move of options) if (!out.includes(move.from)) out.push(move.from);
  return out;
}

/**
 * Destinations for the currently selected piece.
 *
 * `legalMoves(board, side, from)` is the CHAIN API — a non-null third argument
 * means "this piece is mid-jump, jumps only". A plain selection must therefore
 * filter the FULL move list, or picking a piece up silently offers nothing
 * (found by the play-path check).
 */
function destinationSquares() {
  if (state.selected === null) return [];
  if (state.chainSquare !== null) {
    return legalMoves(state.board, mySide(), state.chainSquare);
  }
  return legalMoves(state.board, mySide()).filter((move) => move.from === state.selected);
}

function renderBoard() {
  const selectable = selectableSquares();
  const destinations = new Map(destinationSquares().map((m) => [m.to, m]));
  const overs = new Set(
    destinationSquares()
      .filter((m) => m.over !== undefined)
      .map((m) => m.over)
  );

  for (const cell of els.board.children) {
    if (cell.dataset.sq === undefined) continue;
    const sq = Number(cell.dataset.sq);
    const piece = state.board[sq];
    const move = destinations.get(sq);
    cell.className = 'sq sq--dark'; // every playable square is a dark one
    cell.innerHTML = piece ? pieceHtml(piece) : '';
    cell.classList.remove(
      'sq--selected',
      'sq--dest',
      'sq--jump',
      'sq--over',
      'sq--chain',
      'sq--moved',
      'sq--crowned',
      'sq--thinking'
    );

    if (state.chainSquare === sq) cell.classList.add('sq--chain');
    if (state.selected === sq) cell.classList.add('sq--selected');
    else if (selectable.includes(sq)) cell.classList.add('sq--mine');
    if (move) {
      cell.classList.add('sq--dest');
      if (move.over !== undefined) cell.classList.add('sq--jump');
    }
    if (overs.has(sq)) cell.classList.add('sq--over');

    // hop + crown flourishes for the step just played
    const last = state.lastMove;
    if (last && last.to === sq) {
      cell.classList.add('sq--moved');
      if (last.crowned) cell.classList.add('sq--crowned');
    }
    if (state.thinkingSquare === sq) cell.classList.add('sq--thinking');

    const label = squareLabel(sq);
    cell.setAttribute(
      'aria-label',
      label +
        ', ' +
        (piece
          ? isKing(piece)
            ? SIDE_LABEL[sideOf(piece)] + ' king'
            : SIDE_LABEL[sideOf(piece)] + ' man'
          : 'empty')
    );
  }
}

function pieceHtml(piece) {
  const side = sideOf(piece);
  const cls = SIDE_CLASS[side] + (isKing(piece) ? ' piece--king' : '');
  return '<span class="piece ' + cls + '"></span>';
}

/* ---- turn + hint lines ------------------------------------------------------ */

/** The side the human controls right now. */
function mySide() {
  if (state.mode === 'online') return state.online ? state.online.mark : RED;
  if (state.mode === '2p') return state.turn;
  return RED; // 1p: you always play red
}

function isAiTurnNow() {
  return state.mode === '1p' && state.turn === BLACK;
}

function opponentName() {
  if (state.mode === 'online' && state.online) {
    return state.online.mark === RED ? state.online.bName : state.online.rName;
  }
  return state.mode === '1p' ? 'the computer' : null;
}

function renderTurn() {
  let label;
  if (state.mode === '1p') {
    label = state.turn === RED ? "Your turn — you're 🔴" : "Computer's turn…";
  } else if (state.mode === 'online' && state.online) {
    const you = state.online.mark;
    const opp = opponentName();
    label =
      state.turn === you
        ? "Your turn — you're " + SIDE_LABEL[you]
        : (opp || 'Opponent') + ' is thinking…';
  } else {
    label = SIDE_LABEL[state.turn] + "'s turn";
  }
  els.turn.textContent = label;
  els.turn.dataset.turn = String(state.turn);
}

/** The banner that teaches the two rules players trip over most. */
function renderHint() {
  let hint = '';
  if (state.mode === 'online' && state.online && state.turn !== state.online.mark) {
    hint = '';
  } else if (state.chainSquare !== null) {
    hint = 'Keep jumping — the chain must be finished';
  } else if (state.selected !== null) {
    const moves = destinationSquares();
    hint = moves.some((m) => m.over !== undefined) ? 'Tap a ring to jump' : 'Tap a dot to move';
  } else if (hasAnyJump(state.board, mySide())) {
    hint = 'Capture required — jump an opponent piece';
  }
  els.hintLine.textContent = hint;
}

function renderMiniSeries() {
  els.miniSeries.textContent =
    '🔴 ' + state.series.r + ' · 🤝 ' + state.series.draw + ' · ⚫ ' + state.series.b;
}

/* ---- a round ---------------------------------------------------------------- */

function startRound() {
  state.board = initialBoard();
  state.turn = state.starter;
  state.chainSquare = null;
  state.selected = null;
  state.quietPlies = 0;
  state.lastMove = null;
  state.locked = false;
  if (state.aiTimer) {
    clearTimeout(state.aiTimer);
    state.aiTimer = null;
  }
  els.overlay.classList.add('hidden');
  els.overlay.classList.remove('overlay--in');
  renderBoard();
  renderTurn();
  renderHint();
  renderMiniSeries();
  if (isAiTurnNow()) scheduleAi();
}

/** Tap handler: pick up a piece, drop it on a destination, or change your mind. */
function onSquareTap(sq) {
  if (state.screen !== 'playing' || state.locked) return;
  if (isAiTurnNow()) return;
  if (state.mode === 'online') {
    if (state.turn !== state.online.mark) return; // the poll will catch us up
    onlineTap(sq);
    return;
  }

  const destinations = destinationSquares();
  if (state.selected !== null && destinations.some((m) => m.to === sq)) {
    playStep({ from: state.selected, to: sq });
    return;
  }
  if (selectableSquares().includes(sq)) {
    state.selected = state.selected === sq ? null : sq;
    renderBoard();
    renderHint();
    return;
  }
  // tapping anything else clears the selection
  if (state.selected !== null) {
    state.selected = null;
    renderBoard();
    renderHint();
  }
}

/** Play one validated step for the human (local + hot-seat). */
function playStep(move) {
  const mover = state.turn;
  let result;
  try {
    result = applyMove(state.board, mover, move);
  } catch {
    toast('That piece cannot go there');
    return;
  }
  state.quietPlies = advancesClock(state.board, mover, result.move) ? 0 : state.quietPlies + 1;
  state.board = result.board;
  state.lastMove = { ...result.move, crowned: result.crowned };
  state.chainSquare = result.chain ? result.move.to : null;
  state.selected = null;
  if (!result.chain) state.turn = result.turn;

  renderBoard();
  renderTurn();
  renderHint();
  if (result.crowned) toast(`${SIDE_LABEL[mover]} crowned a king 👑`);

  // The game can only be decided when the turn actually passes — mid-chain
  // the same side still owes a jump. `outcome` is written from the point of
  // view of the side that JUST MOVED (it wins when the opponent cannot move),
  // so the caller must pass `mover`, not the new side to move: passing the
  // side to move checks the wrong side and a blocked game never ends (found
  // by the play-path check — the board froze with no overlay).
  const finished = result.chain ? null : outcome(state.board, mover, state.quietPlies);
  if (finished) {
    endRound(finished);
    return;
  }
  if (isAiTurnNow()) scheduleAi();
}

/* ---- AI --------------------------------------------------------------------- */

function scheduleAi() {
  state.locked = true;
  // Medium/hard are deterministic, so the decision can be shown honestly: a
  // pulse on the piece about to move. Easy stays instant — there is no
  // strategy to visualise.
  const planned =
    state.difficulty !== 'easy'
      ? aiMove(state.board, BLACK, state.difficulty, {
          maxNodes: GAME_CONFIG.hardSearchNodes,
          quietPlies: state.quietPlies,
        })
      : null;
  state.thinkingSquare = planned ? planned.from : null;
  renderBoard();
  state.aiTimer = setTimeout(() => {
    state.aiTimer = null;
    state.thinkingSquare = null;
    if (state.screen !== 'playing' || !isAiTurnNow()) return;
    const move =
      planned && planned !== undefined
        ? planned
        : aiMove(state.board, BLACK, state.difficulty, {
            maxNodes: GAME_CONFIG.hardSearchNodes,
            quietPlies: state.quietPlies,
          });
    if (!move) {
      // The side to move has no legal step at all — that is a LOSS for it, not
      // a game that quietly stops. (playStep normally catches this; this is the
      // backstop for any position the outcome check cannot see.)
      state.locked = false;
      endRound(other(state.turn));
      return;
    }
    state.locked = false;
    playStep(move);
  }, GAME_CONFIG.aiThinkDelayMs);
}

/* ---- round end ---------------------------------------------------------------- */

function endRound(result) {
  state.locked = true;
  const isDraw = result === 'draw';
  const winner = isDraw ? null : result;

  if (isDraw) state.series.draw++;
  else if (winner === RED) state.series.r++;
  else state.series.b++;
  saveSeries(currentSetupKey(), state.series);

  // Rematch flips the opener — the same rule as the rest of the family.
  state.starter = other(state.starter);

  renderMiniSeries();
  const youWon =
    state.mode === '1p'
      ? winner === RED
      : state.mode === 'online' && state.online
        ? winner === state.online.mark
        : false;
  if (!isDraw && youWon) vibrate([40, 60, 40]);
  setTimeout(() => showOverlay(isDraw, winner), 450);
}

function showOverlay(isDraw, winner) {
  let title;
  let emoji;
  let sub;
  if (isDraw) {
    title = 'Draw 🤝';
    emoji = '🤝';
    sub = 'Forty quiet moves — nobody cracked. Run it back?';
  } else {
    title = SIDE_LABEL[winner] + ' wins! 🎉';
    emoji = winner === RED ? '🔴' : '⚫';
    if (state.mode === '1p') {
      sub = winner === RED ? 'You beat the computer!' : 'The computer takes it. Rematch?';
    } else if (state.mode === '2p') {
      sub = '';
    } else {
      const youWon = winner === state.online.mark;
      sub = youWon ? 'You take the duel!' : (opponentName() || 'Your opponent') + ' takes it.';
    }
  }
  els.overlayEmoji.textContent = emoji;
  els.overlayTitle.textContent = title;
  const seriesLine =
    'Series — 🔴 ' + state.series.r + ' · ⚫ ' + state.series.b + ' · 🤝 ' + state.series.draw;
  els.overlaySub.textContent = (sub ? sub + ' ' : '') + seriesLine;
  els.overlay.classList.remove('hidden');
  els.overlay.classList.add('overlay--in');
  document.getElementById('btn-next').textContent =
    state.mode === 'online' ? 'New online match' : 'Next game';
  document.getElementById('btn-next').focus();
}

/* ---- online duel (server-authoritative, 3 s poll) ----------------------------- */

const ONLINE_API =
  location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? 'http://localhost:3012/api/v1'
    : 'https://api.pigzap.com/api/v1';

function onlineGuestId() {
  try {
    const key = 'aiquiz:guest-id';
    let id = localStorage.getItem(key);
    if (!id) {
      id = 'guest_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return 'guest_anon';
  }
}

function onlinePlayerName() {
  const name = els.onlineName.value.trim().slice(0, 24) || 'Guest';
  try {
    localStorage.setItem('pigzap:challenge-name', name);
  } catch {
    /* private mode */
  }
  return name;
}

/** The server-signed guest pair — every guest WRITE requires it as X-Guest-Token. */
function onlineGuestPair() {
  try {
    const raw = localStorage.getItem('aiquiz:guest-token');
    if (!raw) return null;
    const pair = JSON.parse(raw);
    return pair && pair.guestId && pair.token ? pair : null;
  } catch {
    return null;
  }
}

async function ensureOnlineGuestPair() {
  const guestId = onlineGuestId();
  const cached = onlineGuestPair();
  if (cached && cached.guestId === guestId) return cached;
  const res = await fetch(ONLINE_API + '/guest-users/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ legacyId: guestId }),
  });
  if (!res.ok) return null;
  const pair = await res.json();
  try {
    localStorage.setItem('aiquiz:guest-token', JSON.stringify(pair));
  } catch {
    /* private mode — the in-memory pair still works this page */
  }
  return pair;
}

function onlineApi(path, body) {
  return ensureOnlineGuestPair()
    .then((pair) =>
      fetch(ONLINE_API + path, {
        method: body ? 'POST' : 'GET',
        headers: {
          ...(body ? { 'Content-Type': 'application/json' } : {}),
          ...(pair ? { 'X-Guest-Token': pair.token } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      })
    )
    .then((r) => {
      if (!r.ok)
        return r.json().then((e) => Promise.reject(new Error(e.message || String(r.status))));
      return r.json();
    });
}

function onlineStatus(text) {
  els.onlineStatus.textContent = text;
}

function stopOnlinePoll() {
  if (state.online && state.online.pollTimer) {
    clearInterval(state.online.pollTimer);
    state.online.pollTimer = null;
  }
}

function onlineLeaveQuietly() {
  if (state.online && state.online.code && state.online.mark) {
    onlineApi('/checkers/' + state.online.code + '/leave', {
      playerName: onlinePlayerName(),
      guestId: onlineGuestId(),
    }).catch(() => undefined);
  }
  stopOnlinePoll();
  state.online = null;
}

function onlineCreate() {
  onlineStatus('Creating the match…');
  onlineApi('/checkers', {
    playerName: onlinePlayerName(),
    guestId: onlineGuestId(),
  })
    .then(({ code }) => {
      state.online = { code, mark: RED, pollTimer: null, bName: null, busy: false };
      const link = 'https://pigzap.com/games/checkers/?ck=' + code;
      onlineStatus('Match ' + code + ' — waiting for a challenger. Send: ' + link);
      if (navigator.share) {
        navigator
          .share({ title: 'Checkers duel', text: 'Duel me — match ' + code, url: link })
          .catch(() => undefined);
      }
      state.online.pollTimer = setInterval(pollOnline, 3000);
    })
    .catch(() => onlineStatus('Could not create the match — check your connection.'));
}

function onlineJoin(code) {
  if (!code) return;
  onlineStatus('Joining ' + code + '…');
  onlineApi('/checkers/' + encodeURIComponent(code) + '/join', {
    playerName: onlinePlayerName(),
    guestId: onlineGuestId(),
  })
    .then((view) => {
      state.online = {
        code: view.code,
        mark: view.yourMark,
        pollTimer: null,
        rName: view.rName,
        bName: view.bName,
        busy: false,
      };
      if (view.status === 'waiting') {
        onlineStatus('Joined as ⚫ Black — waiting for Red to be claimed…');
        state.online.pollTimer = setInterval(pollOnline, 3000);
        return;
      }
      enterOnlinePlay(view);
    })
    .catch((e) => onlineStatus('Join failed: ' + (e.message || 'try again')));
}

function pollOnline() {
  if (!state.online || state.online.busy) return;
  onlineApi(
    '/checkers/' +
      encodeURIComponent(state.online.code) +
      '?guestId=' +
      encodeURIComponent(onlineGuestId())
  )
    .then((view) => {
      if (!state.online) return;
      state.online.rName = view.rName;
      state.online.bName = view.bName;
      if (view.status === 'waiting') return; // still waiting for the opponent
      if (state.screen !== 'playing') enterOnlinePlay(view);
      else applyOnlineView(view);
    })
    .catch(() => undefined); // transient — the poll rides again
}

function enterOnlinePlay(view) {
  refreshSeriesFromStorage();
  showScreen('playing');
  els.overlay.classList.add('hidden');
  els.overlay.classList.remove('overlay--in');
  state.locked = false;
  applyOnlineView(view);
  // The JOINER has no poll yet (only the creator's create-branch starts one) —
  // without this their page freezes: no opponent moves, no turn updates.
  if (state.online && !state.online.pollTimer) {
    state.online.pollTimer = setInterval(pollOnline, 3000);
  }
}

function applyOnlineView(view) {
  state.board = fromArray(view.board);
  state.turn = view.turn;
  state.chainSquare =
    view.chainSquare === null || view.chainSquare === undefined ? null : view.chainSquare;
  state.quietPlies = view.quietPlies || 0;
  state.lastMove = view.lastMove || null;
  state.selected = null;
  renderBoard();
  renderTurn();
  renderHint();
  renderMiniSeries();
  if (view.status === 'finished' && !state.locked) finishOnlineRound(view);
}

function onlineTap(sq) {
  if (!state.online || state.online.busy) return;
  const destinations = destinationSquares();
  if (state.selected !== null && destinations.some((m) => m.to === sq)) {
    sendOnlineStep({ from: state.selected, to: sq });
    return;
  }
  if (selectableSquares().includes(sq)) {
    state.selected = state.selected === sq ? null : sq;
    renderBoard();
    renderHint();
  }
}

function sendOnlineStep(move) {
  state.online.busy = true;
  state.selected = null;
  onlineApi('/checkers/' + encodeURIComponent(state.online.code) + '/step', {
    guestId: onlineGuestId(),
    from: move.from,
    to: move.to,
  })
    .then((view) => {
      if (state.online) state.online.busy = false;
      applyOnlineView(view);
    })
    .catch((e) => {
      if (state.online) state.online.busy = false;
      toast(
        e.message === 'Illegal step' ? 'The server rejected that step' : 'Move rejected — try again'
      );
      pollOnline(); // resync rather than sit on a rejected local state
    });
}

function finishOnlineRound(view) {
  state.locked = true;
  stopOnlinePoll();
  const isDraw = !!view.draw;
  const winner = view.winner;
  const youWon = !isDraw && winner === state.online.mark;

  if (isDraw) state.series.draw++;
  else if (winner === RED) state.series.r++;
  else state.series.b++;
  saveSeries(currentSetupKey(), state.series);
  renderMiniSeries();
  if (youWon) vibrate([40, 60, 40]);

  setTimeout(() => showOverlay(isDraw, winner), 450);
}

/* ---- share (plan §6) ---------------------------------------------------------- */

function shareText() {
  const url = 'https://pigzap.com/games/checkers/';
  const score =
    '🔴 ' + state.series.r + ' · ⚫ ' + state.series.b + ' · draws ' + state.series.draw;
  if (state.mode === '2p') return t('share2p', { score, url });
  return t('share1p', {
    setup: 'Checkers vs the computer (' + state.difficulty + ')',
    score,
    url,
  });
}

function shareUrls() {
  const url = 'https://pigzap.com/games/checkers/';
  const text = shareText();
  const textNoUrl = text.split(url).join('').replace(/\s+/g, ' ').trim();
  document.getElementById('share-fb').href =
    'https://www.facebook.com/sharer/sharer.php?u=' +
    encodeURIComponent(url) +
    '&quote=' +
    encodeURIComponent(textNoUrl);
  document.getElementById('share-x').href =
    'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text);
  document.getElementById('share-wa').href = 'https://wa.me/?text=' + encodeURIComponent(text);
  document.getElementById('share-copy').dataset.copy = text;
}

function copyResult() {
  const text = document.getElementById('share-copy').dataset.copy || '';
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(
      () => toast('Series copied to clipboard 📋'),
      () => window.prompt('Copy your result:', text)
    );
    return;
  }
  window.prompt('Copy your result:', text);
}

let toastTimer = null;
function toast(message) {
  els.toast.textContent = message;
  els.toast.classList.add('toast--in');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove('toast--in'), 2200);
}

function vibrate(pattern) {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch {
    /* unsupported — fine */
  }
}

/* ---- wiring -------------------------------------------------------------------- */

function bindSegmented(container, attr, onPick) {
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('button[' + attr + ']');
    if (!btn) return;
    const buttons = container.querySelectorAll('button[' + attr + ']');
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute('aria-checked', buttons[i] === btn ? 'true' : 'false');
    }
    onPick(btn.getAttribute(attr));
  });
}

/** Reflect a value onto a segmented control's aria-checked states. */
function syncSegmented(container, attr, value) {
  const buttons = container.querySelectorAll('button[' + attr + ']');
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].setAttribute(
      'aria-checked',
      buttons[i].getAttribute(attr) === value ? 'true' : 'false'
    );
  }
}

function saveMenuPrefs() {
  savePrefs({ mode: state.mode, level: state.difficulty });
}

function init() {
  els.screenMenu = document.getElementById('screen-menu');
  els.screenPlaying = document.getElementById('screen-playing');
  els.board = document.getElementById('board');
  els.turn = document.getElementById('turn');
  els.hintLine = document.getElementById('hint-line');
  els.overlay = document.getElementById('overlay');
  els.overlayEmoji = document.getElementById('overlay-emoji');
  els.overlayTitle = document.getElementById('overlay-title');
  els.overlaySub = document.getElementById('overlay-sub');
  els.miniSeries = document.getElementById('mini-series');
  els.seriesScope = document.getElementById('series-scope');
  els.seriesR = document.getElementById('series-r');
  els.seriesB = document.getElementById('series-b');
  els.seriesDraw = document.getElementById('series-draw');
  els.resetSeriesBtn = document.getElementById('reset-series');
  els.difficultyRow = document.getElementById('difficulty-row');
  els.onlineRow = document.getElementById('online-row');
  els.onlineName = document.getElementById('online-name');
  els.onlineCode = document.getElementById('online-code');
  els.onlineStatus = document.getElementById('online-status');
  els.toast = document.getElementById('toast');

  buildBoard();

  const applyModeUi = (mode) => {
    els.difficultyRow.classList.toggle('hidden', mode !== '1p');
    els.onlineRow.classList.toggle('hidden', mode !== 'online');
    document.getElementById('btn-play').classList.toggle('hidden', mode === 'online');
  };

  bindSegmented(document.getElementById('mode-segmented'), 'data-mode', (mode) => {
    state.mode = mode;
    applyModeUi(mode);
    refreshSeriesFromStorage();
    renderSeriesCard();
    saveMenuPrefs();
  });
  bindSegmented(
    document.getElementById('difficulty-segmented'),
    'data-difficulty',
    (difficulty) => {
      state.difficulty = difficulty;
      refreshSeriesFromStorage();
      renderSeriesCard();
      saveMenuPrefs();
    }
  );

  document.getElementById('btn-play').addEventListener('click', () => {
    refreshSeriesFromStorage();
    showScreen('playing');
    startRound();
  });
  document.getElementById('btn-online-create').addEventListener('click', onlineCreate);
  document.getElementById('btn-online-join').addEventListener('click', () => {
    onlineJoin(els.onlineCode.value.trim().toUpperCase().slice(0, 6));
  });

  const leaveOnlineToMenu = () => {
    if (state.mode === 'online') onlineLeaveQuietly();
    if (state.aiTimer) {
      clearTimeout(state.aiTimer);
      state.aiTimer = null;
    }
    showScreen('menu');
  };
  document.getElementById('btn-menu').addEventListener('click', leaveOnlineToMenu);
  document.getElementById('btn-menu2').addEventListener('click', leaveOnlineToMenu);
  document.getElementById('btn-next').addEventListener('click', () => {
    if (state.mode === 'online') {
      onlineLeaveQuietly();
      onlineCreate();
      return;
    }
    startRound();
  });

  const shareRowEl = document.getElementById('share-row');
  let shareRowTimer = null;
  document.getElementById('btn-share').addEventListener('click', () => {
    if (shareRowEl.classList.contains('share-row--open')) {
      shareRowEl.classList.remove('share-row--open');
      clearTimeout(shareRowTimer);
      shareRowTimer = setTimeout(() => {
        shareRowEl.hidden = true;
      }, 260);
    } else {
      clearTimeout(shareRowTimer);
      shareRowEl.hidden = false;
      void shareRowEl.offsetHeight;
      shareRowEl.classList.add('share-row--open');
      shareUrls();
    }
  });
  document.getElementById('share-copy').addEventListener('click', copyResult);
  els.resetSeriesBtn.addEventListener('click', () => {
    state.series = emptyTally();
    saveSeries(currentSetupKey(), state.series);
    renderSeriesCard();
    renderMiniSeries();
  });

  els.board.addEventListener('click', (e) => {
    const cell = e.target.closest('.sq');
    if (!cell || cell.dataset.sq === undefined) return;
    onSquareTap(Number(cell.dataset.sq));
  });

  // Pausing mid-AI-turn drops the pending move; reschedule on return, or the
  // human comes back to a board that can never be played.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      if (state.aiTimer) {
        clearTimeout(state.aiTimer);
        state.aiTimer = null;
      }
    } else if (
      state.screen === 'playing' &&
      isAiTurnNow() &&
      !state.aiTimer &&
      !state.locked &&
      els.overlay.classList.contains('hidden')
    ) {
      scheduleAi();
    }
  });

  // Restore the menu exactly as the player left it.
  const prefs = loadPrefs();
  if (prefs) {
    state.mode = prefs.mode;
    state.difficulty = prefs.level;
    applyModeUi(state.mode);
    syncSegmented(document.getElementById('mode-segmented'), 'data-mode', state.mode);
    syncSegmented(
      document.getElementById('difficulty-segmented'),
      'data-difficulty',
      state.difficulty
    );
  }

  refreshSeriesFromStorage();
  renderSeriesCard();
  showScreen('menu');

  // ?ck=CODE deep link — flip to online mode with the code prefilled.
  const ckCode = new URLSearchParams(window.location.search).get('ck');
  if (ckCode) {
    state.mode = 'online';
    applyModeUi('online');
    syncSegmented(document.getElementById('mode-segmented'), 'data-mode', 'online');
    renderSeriesCard();
    els.onlineCode.value = ckCode.toUpperCase().slice(0, 6);
    try {
      els.onlineName.value = localStorage.getItem('pigzap:challenge-name') || '';
    } catch {
      /* private mode */
    }
    onlineStatus('Match ' + els.onlineCode.value + ' ready — press Join.');
  }
}

if (typeof document !== 'undefined' && document.getElementById('board')) {
  init();
}

/* share-count pings (prod API; fire-and-forget, best-effort). */
(function () {
  var API = 'https://api.pigzap.com/api/v1/share-counts';
  var SLUG = 'checkers';
  var wired = new WeakSet();
  var ping = function (platform) {
    try {
      fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: 'game', contentId: SLUG, platform: platform }),
        keepalive: true,
      }).catch(function () {});
    } catch (e) {
      /* counting is best-effort */
    }
  };
  var wire = function () {
    [
      ['share-fb', 'facebook'],
      ['share-x', 'x'],
      ['share-wa', 'whatsapp'],
    ].forEach(function (pair) {
      var a = document.getElementById(pair[0]);
      if (a && !wired.has(a)) {
        wired.add(a);
        a.addEventListener(
          'click',
          function () {
            ping(pair[1]);
          },
          { once: true, capture: true }
        );
      }
    });
    var copy = document.getElementById('share-copy');
    if (copy && !wired.has(copy)) {
      wired.add(copy);
      copy.addEventListener(
        'click',
        function () {
          ping('copy');
        },
        { once: true, capture: true }
      );
    }
  };
  var btn = document.getElementById('btn-share');
  if (btn) btn.addEventListener('click', wire);
  wire();
})();
