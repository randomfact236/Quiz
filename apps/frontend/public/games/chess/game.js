/**
 * ============================================================================
 * game.js — Chess (plan/games/40-chess.md) — UI shell
 * ============================================================================
 * Plain ESM, no build step. The rules live in core.js (jest-tested); this is
 * screens + DOM wiring, and it auto-inits when its board exists.
 *
 * Modes: solo vs computer (easy/medium/hard), 2-player hot-seat, and ⚔️ online
 * duels on the server-authoritative backend. Deep link: ?ch=CODE.
 * Sides: 1 = ⚪ White (creator, opens), 2 = ⚫ Black.
 *
 * Two pieces of UI the rules force: a legal move is a dot, a CAPTURE is a full
 * square, and castling shows as a dashed box (you tap the KING, never the
 * rook) — all three are easy to get wrong and the play-path check pins them.
 * ============================================================================
 */

import {
  WHITE,
  BLACK,
  EMPTY,
  PAWN,
  KNIGHT,
  BISHOP,
  ROOK,
  QUEEN,
  KING,
  FILES,
  createGame,
  rowOf,
  fileOf,
  squareName,
  parseSquare,
  typeOf,
  isWhite,
  colourOf,
  make,
  findKing,
  isInCheck,
  legalMoves,
  applyMove,
  outcome,
  isInsufficientMaterial,
  aiMove,
  fromArray,
} from './core.js?v=1';
import {
  emptyTally,
  seriesSetupKey,
  loadSeries,
  saveSeries,
  loadPrefs,
  savePrefs,
} from './storage.js?v=1';
import { GAME_CONFIG, t } from './config.js?v=1';

const PIECE_GLYPH = {
  [PAWN]: { 1: '♟', 2: '♙' },
  [KNIGHT]: { 1: '♞', 2: '♘' },
  [BISHOP]: { 1: '♝', 2: '♗' },
  [ROOK]: { 1: '♜', 2: '♖' },
  [QUEEN]: { 1: '♛', 2: '♕' },
  [KING]: { 1: '♚', 2: '♔' },
};

// the core's side is a BOOLEAN (WHITE === true), so these keys are booleans —
// keying them 1/2 made every side name read "undefined"
const SIDE_LABEL = { true: '⚪ White', false: '⚫ Black' };
const DRAW_REASON = {
  stalemate: 'Stalemate — nobody could move.',
  fifty: 'The fifty-move rule — no capture and no pawn move in 50 moves each.',
  repetition: 'Threefold repetition.',
  material: 'Neither side has enough material to mate.',
};

const state = {
  screen: 'menu',
  mode: '1p',
  difficulty: 'medium',
  game: createGame(),
  selected: -1,
  pendingPromotion: null, // a move awaiting the player's choice
  locked: false,
  lastMove: null,
  series: emptyTally(),
  aiTimer: null,
  online: null,
};

const els = {};

function currentSetupKey() {
  return seriesSetupKey(state.mode, state.difficulty);
}

function mySide() {
  if (state.mode === 'online') return state.online ? state.online.mark : WHITE;
  if (state.mode === '2p') return state.game.turn;
  return WHITE; // 1p: you play white
}

function isAiTurnNow() {
  return state.mode === '1p' && state.game.turn === BLACK;
}

/* ---- screens ------------------------------------------------------------------ */

function showScreen(name) {
  state.screen = name;
  els.screenMenu.classList.toggle('screen--active', name === 'menu');
  els.screenPlaying.classList.toggle('screen--active', name === 'playing');
  if (name === 'menu') renderSeriesCard();
}

function renderSeriesCard() {
  const scope =
    state.mode === '1p'
      ? 'vs computer · ' + state.difficulty
      : state.mode === 'online'
        ? 'online duel'
        : '2 players';
  els.seriesScope.textContent = scope;
  els.seriesW.textContent = String(state.series.w);
  els.seriesB.textContent = String(state.series.b);
  els.seriesDraw.textContent = String(state.series.draw);
  const total = state.series.w + state.series.b + state.series.draw;
  els.resetSeriesBtn.disabled = total === 0;
}

function refreshSeriesFromStorage() {
  state.series = loadSeries(currentSetupKey());
}

/* ---- board -------------------------------------------------------------------- */

const FILES_ORDER = ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']; // black's view on top

function buildBoard() {
  els.board.innerHTML = '';
  // rendered from black's side, so the ranks read 8→1 and the files h→a
  for (let row = 7; row >= 0; row--) {
    for (let col = 7; col >= 0; col--) {
      const sq = row * 8 + col;
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'square' + ((row + col) % 2 === 1 ? ' square--dark' : '');
      cell.dataset.sq = String(sq);
      cell.setAttribute('aria-label', squareName(sq) + ', empty');
      els.board.appendChild(cell);
    }
  }
}

function pieceHtml(piece) {
  const type = typeOf(piece);
  const white = isWhite(piece);
  return (
    '<span class="piece piece--' +
    (white ? 'w' : 'b') +
    '">' +
    PIECE_GLYPH[type][white ? 2 : 1] +
    '</span>'
  );
}

function renderBoard() {
  const moves = state.locked ? [] : legalMoves(state.game);
  const fromSelected = state.selected;
  const dests = new Set(moves.filter((m) => m.from === fromSelected).map((m) => m.to));
  const castleDests = new Set(
    moves.filter((m) => m.from === fromSelected && m.castle).map((m) => m.to)
  );
  const captures = new Set(
    moves.filter((m) => m.captured !== EMPTY || m.enPassant).map((m) => m.to)
  );
  const checked = isInCheck(state.game.board, state.game.turn)
    ? findKing(state.game.board, state.game.turn)
    : -1;

  for (const cell of els.board.children) {
    const sq = Number(cell.dataset.sq);
    const piece = state.game.board[sq];
    cell.innerHTML = piece === EMPTY ? '' : pieceHtml(piece);
    cell.className = cell.className.replace(
      / square--(legal|capture|castle|check|moved|thinking)/g,
      ''
    );
    if (dests.has(sq)) cell.classList.add('square--legal');
    if (dests.has(sq) && captures.has(sq)) cell.classList.add('square--capture');
    if (castleDests.has(sq)) cell.classList.add('square--castle');
    if (checked === sq) cell.classList.add('square--check');
    if (state.lastMove && (state.lastMove.from === sq || state.lastMove.to === sq)) {
      cell.classList.add('square--moved');
    }
    if (state.thinkingSquare === sq) cell.classList.add('square--thinking');
    cell.setAttribute(
      'aria-label',
      squareName(sq) + ', ' + (piece === EMPTY ? 'empty' : SIDE_LABEL[colourOf(piece)])
    );
  }
}

function renderTurn() {
  let text;
  if (state.mode === '1p') {
    text = state.game.turn === WHITE ? "Your turn — you're ⚪" : "Computer's turn…";
  } else if (state.mode === 'online' && state.online) {
    const opp = state.online.mark === WHITE ? state.online.bName : state.online.lName;
    text =
      state.game.turn === state.online.mark
        ? "Your turn — you're " + SIDE_LABEL[state.online.mark]
        : (opp || 'Opponent') + ' is thinking…';
  } else {
    text = SIDE_LABEL[state.game.turn] + ' to move';
  }
  els.turn.textContent = text;
  els.turn.dataset.turn = state.game.turn ? '1' : '2';
}

function renderHint() {
  let hint = '';
  if (!state.locked) {
    if (state.mode === '1p' && state.game.turn === WHITE) {
      hint = state.selected >= 0 ? 'Tap where the piece lands' : 'Tap one of your pieces';
    }
  }
  els.hintLine.textContent = hint;
}

/** Each side starts with 15 non-king pieces, so what is missing was taken. */
const START_MATERIAL = 15;

function renderCaptures() {
  const board = state.game.board;
  let whiteLeft = 0;
  let blackLeft = 0;
  for (let sq = 0; sq < 64; sq++) {
    const piece = board[sq];
    if (piece === EMPTY) continue;
    if (typeOf(piece) === KING) continue;
    if (isWhite(piece)) whiteLeft++;
    else blackLeft++;
  }
  // The tally is what each player has TAKEN, i.e. what the opponent is missing.
  // Counting what is still on the board and labelling it "taken" showed 15 at
  // the opening (found by looking at the live game).
  els.capWhite.textContent = String(START_MATERIAL - blackLeft);
  els.capBlack.textContent = String(START_MATERIAL - whiteLeft);
  els.moveNo.textContent = String(state.game.fullmove);
}

function renderMiniSeries() {
  els.miniSeries.textContent =
    '⚪ ' + state.series.w + ' · 🤝 ' + state.series.draw + ' · ⚫ ' + state.series.b;
}

function renderAll() {
  renderBoard();
  renderTurn();
  renderHint();
  renderCaptures();
  renderMiniSeries();
}

/* ---- a game ---------------------------------------------------------------------- */

function startGame() {
  state.game = createGame();
  state.selected = -1;
  state.pendingPromotion = null;
  state.locked = false;
  state.lastMove = null;
  if (state.aiTimer) {
    clearTimeout(state.aiTimer);
    state.aiTimer = null;
  }
  els.promoBar.classList.add('hidden');
  els.overlay.classList.add('hidden');
  els.overlay.classList.remove('overlay--in');
  buildBoard();
  renderAll();
  if (isAiTurnNow()) scheduleAi();
}

function onSquareTap(sq) {
  if (state.screen !== 'playing' || state.locked) return;
  if (isAiTurnNow()) return;
  if (state.mode === 'online') {
    if (state.game.turn !== state.online.mark) return;
    onlineTap(sq);
    return;
  }

  const side = state.game.turn;
  // tapping one of our own pieces selects it
  if (state.game.board[sq] !== EMPTY && colourOf(state.game.board[sq]) === side) {
    state.selected = state.selected === sq ? -1 : sq;
    renderBoard();
    renderHint();
    return;
  }
  // tapping a destination plays
  const options = legalMoves(state.game).filter((m) => m.from === state.selected && m.to === sq);
  if (options.length === 0) {
    state.selected = -1;
    renderBoard();
    renderHint();
    return;
  }
  // a promotion has four versions of the same move — ask which
  if (options.some((m) => m.promotion)) {
    state.pendingPromotion = { from: state.selected, to: sq, side };
    els.promoBar.classList.remove('hidden');
    for (const b of els.promoBar.querySelectorAll('button'))
      b.setAttribute('aria-pressed', 'false');
    return;
  }
  playMove(options[0]);
}

function choosePromotion(type) {
  const pending = state.pendingPromotion;
  if (!pending) return;
  const move = legalMoves(state.game).find(
    (m) =>
      m.from === pending.from && m.to === pending.to && m.promotion === make(type, pending.side)
  );
  els.promoBar.classList.add('hidden');
  state.pendingPromotion = null;
  if (!move) {
    toast('That promotion is not available');
    return;
  }
  playMove(move);
}

function playMove(move) {
  const side = state.game.turn;
  const result = applyMove(state.game, move);
  state.game = result.state;
  state.lastMove = move;
  state.selected = -1;
  renderAll();
  if (result.captured !== EMPTY)
    toast(
      `${SIDE_LABEL[side]} takes ${SIDE_LABEL[colourOf(result.captured) === WHITE ? BLACK : WHITE].split(' ')[1].toLowerCase()}`
    );
  const ending = outcome(state.game);
  if (ending) {
    endGame(ending, side);
    return;
  }
  if (isAiTurnNow()) scheduleAi();
}

/* ---- promotion picker -------------------------------------------------------------- */

function wirePromoBar() {
  els.promoBar = document.getElementById('promo-bar');
  for (const btn of els.promoBar.querySelectorAll('button')) {
    btn.addEventListener('click', () => {
      btn.setAttribute('aria-pressed', 'true');
      choosePromotion(Number(btn.dataset.promo));
    });
  }
}

/* ---- AI -------------------------------------------------------------------------------- */

function scheduleAi() {
  state.locked = true;
  renderHint();
  const planned =
    state.difficulty !== 'easy'
      ? aiMove(state.game, state.difficulty, { maxNodes: GAME_CONFIG.hardSearchNodes })
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
        : aiMove(state.game, state.difficulty, { maxNodes: GAME_CONFIG.hardSearchNodes });
    state.locked = false;
    renderBoard();
    if (!move) {
      endGame(outcome(state.game) || 'stalemate', state.game.turn);
      return;
    }
    playMove(move);
  }, GAME_CONFIG.aiThinkDelayMs);
}

/* ---- ending ------------------------------------------------------------------------------- */

function endGame(result, mover) {
  state.locked = true;
  const isDraw = result !== 'checkmate';
  const winner = isDraw ? null : mover;

  if (isDraw) state.series.draw++;
  else if (winner === WHITE) state.series.w++;
  else state.series.b++;
  saveSeries(currentSetupKey(), state.series);
  renderMiniSeries();
  renderBoard();
  renderHint();

  const youWon =
    state.mode === '1p'
      ? winner === WHITE
      : state.mode === 'online' && state.online
        ? winner === state.online.mark
        : false;
  if (youWon) vibrate([40, 60, 40]);
  setTimeout(() => showOverlay(isDraw, winner, result), 450);
}

function showOverlay(isDraw, winner, result) {
  if (isDraw) {
    els.overlayEmoji.textContent = '🤝';
    els.overlayTitle.textContent = 'Draw';
  } else {
    els.overlayEmoji.textContent = winner === WHITE ? '♔' : '♚';
    els.overlayTitle.textContent = SIDE_LABEL[winner] + ' wins!';
  }
  const seriesLine =
    'Series — ⚪ ' + state.series.w + ' · ⚫ ' + state.series.b + ' · 🤝 ' + state.series.draw;
  els.overlaySub.textContent = ((DRAW_REASON[result] || '') + ' ' + seriesLine).trim();
  els.overlay.classList.remove('hidden');
  els.overlay.classList.add('overlay--in');
  document.getElementById('btn-next').textContent =
    state.mode === 'online' ? 'New online match' : 'New game';
  document.getElementById('btn-next').focus();
}

/* ---- online duel ----------------------------------------------------------------------------- */

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
    /* private mode */
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
    onlineApi('/chess/' + state.online.code + '/leave', {
      playerName: onlinePlayerName(),
      guestId: onlineGuestId(),
    }).catch(() => undefined);
  }
  stopOnlinePoll();
  state.online = null;
}

function onlineCreate() {
  onlineStatus('Creating the match…');
  onlineApi('/chess', { playerName: onlinePlayerName(), guestId: onlineGuestId() })
    .then(({ code }) => {
      state.online = { code, mark: WHITE, pollTimer: null, bName: null, busy: false };
      const link = 'https://pigzap.com/games/chess/?ch=' + code;
      onlineStatus('Match ' + code + ' — waiting for a challenger. Send: ' + link);
      if (navigator.share) {
        navigator
          .share({ title: 'Chess duel', text: 'Duel me — match ' + code, url: link })
          .catch(() => undefined);
      }
      state.online.pollTimer = setInterval(pollOnline, 3000);
    })
    .catch(() => onlineStatus('Could not create the match — check your connection.'));
}

function onlineJoin(code) {
  if (!code) return;
  onlineStatus('Joining ' + code + '…');
  onlineApi('/chess/' + encodeURIComponent(code) + '/join', {
    playerName: onlinePlayerName(),
    guestId: onlineGuestId(),
  })
    .then((view) => {
      state.online = {
        code: view.code,
        mark: view.yourMark === 1 ? WHITE : BLACK, // the client's side encoding is boolean (see SIDE_LABEL)
        pollTimer: null,
        wName: view.wName,
        bName: view.bName,
        busy: false,
      };
      if (view.status === 'waiting') {
        onlineStatus('Joined as ⚫ Black — waiting for White…');
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
    '/chess/' +
      encodeURIComponent(state.online.code) +
      '?guestId=' +
      encodeURIComponent(onlineGuestId())
  )
    .then((view) => {
      if (!state.online) return;
      state.online.wName = view.wName;
      state.online.bName = view.bName;
      if (view.status === 'waiting') return;
      if (state.screen !== 'playing') enterOnlinePlay(view);
      else applyOnlineView(view);
    })
    .catch(() => undefined);
}

function enterOnlinePlay(view) {
  refreshSeriesFromStorage();
  showScreen('playing');
  els.overlay.classList.add('hidden');
  els.overlay.classList.remove('overlay--in');
  state.locked = false;
  applyOnlineView(view);
  if (state.online && !state.online.pollTimer) {
    state.online.pollTimer = setInterval(pollOnline, 3000);
  }
}

function applyOnlineView(view) {
  state.game = {
    board: fromArray(view.board),
    turn: view.turn === 1 ? WHITE : BLACK,
    castling: view.castling,
    enPassant: view.enPassant ?? -1,
    halfmoves: view.halfmoves || 0,
    fullmove: view.fullmove || 1,
    history: [],
  };
  state.lastMove = view.lastMove || null;
  state.selected = -1;
  renderAll();
  if (view.status === 'finished' && !state.locked) {
    state.locked = true;
    stopOnlinePoll();
    const isDraw = !view.winner;
    if (isDraw) state.series.draw++;
    else if (view.winner === 1) state.series.w++;
    else state.series.b++;
    saveSeries(currentSetupKey(), state.series);
    renderMiniSeries();
    setTimeout(() => showOverlay(isDraw, view.winner, view.result), 450);
  }
}

function onlineTap(sq) {
  const side = state.game.turn;
  const options = legalMoves(state.game).filter((m) => m.from === state.selected && m.to === sq);
  if (options.length === 0) {
    if (state.game.board[sq] !== EMPTY && colourOf(state.game.board[sq]) === side) {
      state.selected = state.selected === sq ? -1 : sq;
      renderBoard();
      renderHint();
    }
    return;
  }
  if (options.some((m) => m.promotion)) {
    state.pendingPromotion = { from: state.selected, to: sq, side, online: true };
    els.promoBar.classList.remove('hidden');
    for (const b of els.promoBar.querySelectorAll('button'))
      b.setAttribute('aria-pressed', 'false');
    return;
  }
  sendOnlineMove(options[0]);
}

function sendOnlineMove(move) {
  state.online.busy = true;
  state.selected = -1;
  onlineApi('/chess/' + encodeURIComponent(state.online.code) + '/move', {
    guestId: onlineGuestId(),
    from: move.from,
    to: move.to,
    promotion: move.promotion || null,
  })
    .then((view) => {
      if (state.online) state.online.busy = false;
      applyOnlineView(view);
    })
    .catch((e) => {
      if (state.online) state.online.busy = false;
      toast(
        e.message === 'Illegal move' ? 'The server rejected that move' : 'Move rejected — try again'
      );
      pollOnline();
    });
}

/* ---- share ------------------------------------------------------------------------------- */

function shareText() {
  const url = 'https://pigzap.com/games/chess/';
  const score =
    '⚪ ' + state.series.w + ' · ⚫ ' + state.series.b + ' · draws ' + state.series.draw;
  if (state.mode === '2p') return t('share2p', { score, url });
  return t('share1p', { setup: 'Chess vs the computer (' + state.difficulty + ')', score, url });
}

function shareUrls() {
  const url = 'https://pigzap.com/games/chess/';
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
    /* unsupported */
  }
}

/* ---- wiring ---------------------------------------------------------------------------------- */

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
  savePrefs({ mode: state.mode, difficulty: state.difficulty });
}

function init() {
  els.screenMenu = document.getElementById('screen-menu');
  els.screenPlaying = document.getElementById('screen-playing');
  els.board = document.getElementById('board');
  els.turn = document.getElementById('turn');
  els.hintLine = document.getElementById('hint-line');
  els.capWhite = document.getElementById('cap-white');
  els.capBlack = document.getElementById('cap-black');
  els.moveNo = document.getElementById('move-no');
  els.overlay = document.getElementById('overlay');
  els.overlayEmoji = document.getElementById('overlay-emoji');
  els.overlayTitle = document.getElementById('overlay-title');
  els.overlaySub = document.getElementById('overlay-sub');
  els.miniSeries = document.getElementById('mini-series');
  els.seriesScope = document.getElementById('series-scope');
  els.seriesW = document.getElementById('series-w');
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
  wirePromoBar();

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
    startGame();
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
    startGame();
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
    const cell = e.target.closest('.square');
    if (!cell) return;
    onSquareTap(Number(cell.dataset.sq));
  });

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

  const prefs = loadPrefs();
  if (prefs) {
    state.mode = prefs.mode;
    state.difficulty = prefs.difficulty;
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

  const chCode = new URLSearchParams(window.location.search).get('ch');
  if (chCode) {
    state.mode = 'online';
    applyModeUi('online');
    syncSegmented(document.getElementById('mode-segmented'), 'data-mode', 'online');
    renderSeriesCard();
    els.onlineCode.value = chCode.toUpperCase().slice(0, 6);
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
  if (new URLSearchParams(window.location.search).has('debug')) {
    window.__CHESS = state;
  }
}

/* share-count pings (prod API; fire-and-forget, best-effort). */
(function () {
  var API = 'https://api.pigzap.com/api/v1/share-counts';
  var SLUG = 'chess';
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
