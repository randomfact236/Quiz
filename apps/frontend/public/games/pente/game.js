/**
 * ============================================================================
 * game.js — Pente (plan/games/23-pente.md) — UI shell
 * ============================================================================
 * Plain ESM, no build step (the games convention). The pure model lives in
 * core.js (jest-tested), persistence in storage.js, flags/strings in
 * config.js. Screens + DOM wiring only; it auto-inits when its board exists.
 *
 * Modes (the family template): solo vs computer (easy/medium/hard), 2-player
 * hot-seat, and ⚔️ online duels on the server-authoritative backend — the
 * server resolves captures and both win conditions, so a client cannot claim
 * a pair it did not flank. Deep link: ?pte=CODE. Sides: 1 = ⚫, 2 = ⚪.
 *
 * Two things this game does that the others do not: a move can REMOVE stones
 * off the board (so the stone count is not a progress bar), and there are TWO
 * ways to win (five in a row, or the capture target).
 * ============================================================================
 */

import {
  BOARD_SIZES,
  DEFAULT_SIZE,
  CAPTURE_TARGET,
  EMPTY,
  BLACK,
  WHITE,
  other,
  sizeOf,
  initialBoard,
  fromArray,
  isEmpty,
  capturesAt,
  pairsAt,
  hasLine,
  applyMove,
  stoneCount,
  outcome,
  isFull,
  aiMove,
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

const SIDE_LABEL = { 1: '⚫ Black', 2: '⚪ White' };
const CAPTURE_TARGETS = [3, 5];

const state = {
  screen: 'menu',
  mode: '1p', // '1p' | '2p' | 'online'
  difficulty: 'medium',
  size: DEFAULT_SIZE,
  target: CAPTURE_TARGET,
  cells: initialBoard(DEFAULT_SIZE),
  turn: WHITE, // black opened with the centre stone
  starter: WHITE,
  /** Captured PAIRS, indexed 0 = black, 1 = white. */
  captures: [0, 0],
  locked: false,
  lastMove: null, // { idx, captured }
  winLine: null, // the five that ended it, for the celebration
  series: emptyTally(),
  aiTimer: null,
  online: null,
};

const els = {};

function currentSetupKey() {
  return seriesSetupKey(state.mode, state.difficulty, state.size) + ':' + state.target;
}

/* ---- screens -------------------------------------------------------------- */

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
  els.seriesScope.textContent = scope + ' · ' + state.size + '×' + state.size;
  els.seriesD.textContent = String(state.series.d);
  els.seriesL.textContent = String(state.series.l);
  els.seriesDraw.textContent = String(state.series.draw);
  const total = state.series.d + state.series.l + state.series.draw;
  els.resetSeriesBtn.disabled = total === 0;
}

function refreshSeriesFromStorage() {
  state.series = loadSeries(currentSetupKey());
}

/* ---- board ---------------------------------------------------------------- */

function buildBoard() {
  const size = state.size;
  els.board.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
  els.board.innerHTML = '';
  for (let idx = 0; idx < size * size; idx++) {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'cell';
    cell.dataset.idx = String(idx);
    cell.setAttribute('aria-label', squareName(idx) + ', empty');
    els.board.appendChild(cell);
  }
}

function squareName(idx) {
  const size = sizeOf(state.cells);
  const row = Math.floor(idx / size);
  const file = idx % size;
  return String.fromCharCode(97 + file) + (row + 1);
}

function stoneHtml(cell) {
  return '<span class="stone stone--' + (cell === BLACK ? 'dark' : 'light') + '"></span>';
}

/** The side the human controls right now. */
function mySide() {
  if (state.mode === 'online') return state.online ? state.online.mark : BLACK;
  if (state.mode === '2p') return state.turn;
  return BLACK; // 1p: you play black, white is the computer
}

function isAiTurnNow() {
  return state.mode === '1p' && state.turn === WHITE;
}

function opponentName() {
  if (state.mode === 'online' && state.online) {
    return state.online.mark === BLACK ? state.online.lName : state.online.rName;
  }
  return state.mode === '1p' ? 'the computer' : null;
}

function renderBoard() {
  // with captures, "legal moves" is not a thing — any empty point is playable,
  // but capture points are called out because they are the good ones
  const showCaptures = !state.locked && state.captures[myIndex()] < state.target;
  for (const cell of els.board.children) {
    const idx = Number(cell.dataset.idx);
    const value = state.cells[idx];
    cell.innerHTML = value === EMPTY ? '' : stoneHtml(value);
    cell.className = 'cell';
    if (isEmpty(state.cells, idx) && !state.locked) {
      cell.classList.add('cell--free');
      if (showCaptures && pairsAt(state.cells, idx, state.turn, state.size) > 0) {
        cell.classList.add('cell--capture');
      }
    }
    if (state.winLine && state.winLine.indexOf(idx) !== -1) cell.classList.add('cell--win');
    if (state.thinkingSquare === idx) cell.classList.add('cell--thinking');
    cell.setAttribute(
      'aria-label',
      squareName(idx) + ', ' + (value === EMPTY ? 'empty' : SIDE_LABEL[value].split(' ')[1].toLowerCase())
    );
  }
}

function myIndex() {
  return state.turn === BLACK ? 0 : 1;
}

function renderCaptures() {
  els.capDark.textContent = state.captures[0] + ' / ' + state.target;
  els.capLight.textContent = state.captures[1] + ' / ' + state.target;
  for (const [side, node] of [[0, els.pipsDark], [1, els.pipsLight]]) {
    node.innerHTML = '';
    for (let i = 0; i < state.target; i++) {
      const pip = document.createElement('i');
      if (i < state.captures[side]) pip.className = 'on';
      node.appendChild(pip);
    }
  }
}

function renderTurn() {
  let label;
  if (state.mode === '1p') {
    label = state.turn === BLACK ? "Your turn — you're ⚫" : "Computer's turn…";
  } else if (state.mode === 'online' && state.online) {
    const you = state.online.mark;
    const opp = opponentName();
    label =
      state.turn === you ? "Your turn — you're " + SIDE_LABEL[you] : (opp || 'Opponent') + ' is thinking…';
  } else {
    label = SIDE_LABEL[state.turn] + "'s turn";
  }
  els.turn.textContent = label;
  els.turn.dataset.turn = String(state.turn);
}

function renderHint() {
  let hint = '';
  // The opening note comes FIRST and outside the locked guard: the computer is
  // thinking exactly when the player needs to know why it is not their move,
  // and a hint hidden behind `!state.locked` is a hint that never shows.
  if (state.mode === '1p' && isAiTurnNow() && isOpeningPosition()) {
    hint = 'Your opening stone is down — the computer replies';
  } else if (!state.locked) {
    if (isFull(state.cells)) {
      hint = 'Board full';
    } else if (state.mode === '1p' && state.turn === BLACK) {
      hint = countCaptures(state.turn) > 0 ? 'A capture is available — take the pair' : 'Tap any open intersection';
    }
  }
  els.hintLine.textContent = hint;
}

/** Only the compulsory centre stone is on the board. */
function isOpeningPosition() {
  const counts = stoneCount(state.cells);
  return counts.black + counts.white === 1;
}

function countCaptures(side) {
  let n = 0;
  for (let idx = 0; idx < state.cells.length; idx++) {
    if (isEmpty(state.cells, idx) && pairsAt(state.cells, idx, side, state.size) > 0) n++;
  }
  return n;
}

function renderMiniSeries() {
  els.miniSeries.textContent =
    '⚫ ' + state.series.d + ' · 🤝 ' + state.series.draw + ' · ⚪ ' + state.series.l;
}

function renderAll() {
  renderBoard();
  renderCaptures();
  renderTurn();
  renderHint();
  renderMiniSeries();
}

/* ---- a game ---------------------------------------------------------------- */

function startGame() {
  state.cells = initialBoard(state.size);
  state.captures = [0, 0];
  state.turn = state.starter;
  state.locked = false;
  state.lastMove = null;
  state.winLine = null;
  if (state.aiTimer) {
    clearTimeout(state.aiTimer);
    state.aiTimer = null;
  }
  els.overlay.classList.add('hidden');
  els.overlay.classList.remove('overlay--in');
  buildBoard();
  renderAll();
  if (isAiTurnNow()) scheduleAi();
}

function onCellTap(idx) {
  if (state.screen !== 'playing' || state.locked) return;
  if (isAiTurnNow()) return;
  if (!isEmpty(state.cells, idx)) {
    toast('That intersection is taken');
    return;
  }
  if (state.mode === 'online') {
    if (state.turn !== state.online.mark) return;
    sendOnlineMove(idx);
    return;
  }
  play(idx);
}

function play(idx) {
  const side = state.turn;
  let r;
  try {
    r = applyMove(state.cells, side, idx);
  } catch {
    toast('You cannot play there');
    return;
  }
  state.cells = r.cells;
  state.captures[side === BLACK ? 0 : 1] += r.pairs;
  state.lastMove = { idx, captured: r.captured };
  state.turn = r.turn;
  state.winLine = r.line ? findLine(r.cells, side) : null;

  renderAll();
  if (r.pairs > 0) toast('Captured ' + r.pairs + (r.pairs === 1 ? ' pair' : ' pairs') + '!');

  const result = outcome(state.cells, side, state.captures, state.target, state.size);
  if (result) {
    endGame(result);
    return;
  }
  if (isFull(state.cells)) {
    endGame({ winner: null, line: false, points: state.captures[side === BLACK ? 0 : 1] });
    return;
  }
  if (isAiTurnNow()) scheduleAi();
}

/** The five-in-a-row through the last move, for the celebration. */
function findLine(cells, side) {
  const size = state.size;
  const last = state.lastMove ? state.lastMove.idx : -1;
  if (last < 0) return null;
  const row = Math.floor(last / size);
  const file = last % size;
  const dirs = [
    [-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1],
  ];
  for (const [dr, df] of dirs) {
    const line = [last];
    for (const sign of [1, -1]) {
      let r = row + dr * sign;
      let f = file + df * sign;
      while (r >= 0 && r < size && f >= 0 && f < size && cells[r * size + f] === side) {
        line.push(r * size + f);
        r += dr * sign;
        f += df * sign;
      }
    }
    if (line.length >= 5) return line;
  }
  return null;
}

/* ---- AI ---------------------------------------------------------------------- */

function scheduleAi() {
  state.locked = true;
  renderHint();
  const planned =
    state.difficulty !== 'easy'
      ? aiMove(state.cells, WHITE, state.captures, state.difficulty, {
          maxNodes: GAME_CONFIG.hardSearchNodes,
        })
      : null;
  if (planned !== null && planned !== undefined) {
    const cell = els.board.children[planned];
    if (cell) cell.classList.add('cell--thinking');
  }
  state.thinkingSquare = planned ?? null;
  state.aiTimer = setTimeout(() => {
    state.aiTimer = null;
    state.thinkingSquare = null;
    for (const cell of els.board.children) cell.classList.remove('cell--thinking');
    if (state.screen !== 'playing' || !isAiTurnNow()) return;
    const move =
      planned !== null && planned !== undefined
        ? planned
        : aiMove(state.cells, WHITE, state.captures, state.difficulty, {
            maxNodes: GAME_CONFIG.hardSearchNodes,
          });
    if (move === null || move === undefined) {
      state.locked = false;
      renderAll();
      return;
    }
    state.locked = false;
    play(move);
  }, GAME_CONFIG.aiThinkDelayMs);
}

/* ---- game end -------------------------------------------------------------------- */

function endGame(result) {
  state.locked = true;
  const isDraw = !result.winner;
  const winner = result.winner;

  if (isDraw) state.series.draw++;
  else if (winner === BLACK) state.series.d++;
  else state.series.l++;
  saveSeries(currentSetupKey(), state.series);

  state.starter = other(state.starter); // rematch flips the opener

  renderBoard();
  renderCaptures();
  renderTurn();
  renderHint();
  renderMiniSeries();
  const youWon =
    state.mode === '1p'
      ? winner === BLACK
      : state.mode === 'online' && state.online
        ? winner === state.online.mark
        : false;
  if (youWon) vibrate([40, 60, 40]);
  setTimeout(() => showOverlay(isDraw, winner, result), 450);
}

function showOverlay(isDraw, winner, result) {
  let title;
  let emoji;
  let sub;
  if (isDraw) {
    title = 'Draw 🤝';
    emoji = '🤝';
    sub = 'A full board with no five.';
  } else {
    title = SIDE_LABEL[winner] + ' wins! 🎉';
    emoji = winner === BLACK ? '⚫' : '⚪';
    const how = result.line ? 'five in a row' : result.points + ' pairs captured';
    if (state.mode === '1p') {
      sub = (winner === BLACK ? 'You ' : 'The computer ') + (winner === BLACK ? 'take' : 'takes') + ' it by ' + how + '.';
    } else if (state.mode === '2p') {
      sub = 'Won by ' + how + '.';
    } else {
      const youWon = winner === state.online.mark;
      sub = (youWon ? 'You take the duel' : (opponentName() || 'Your opponent') + ' takes it') + ' by ' + how + '.';
    }
  }
  els.overlayEmoji.textContent = emoji;
  els.overlayTitle.textContent = title;
  const counts = stoneCount(state.cells);
  const seriesLine =
    'Series — ⚫ ' + state.series.d + ' · ⚪ ' + state.series.l + ' · 🤝 ' + state.series.draw;
  els.overlaySub.textContent = sub + ' ' + seriesLine;
  els.overlay.classList.remove('hidden');
  els.overlay.classList.add('overlay--in');
  document.getElementById('btn-next').textContent =
    state.mode === 'online' ? 'New online match' : 'Next game';
  document.getElementById('btn-next').focus();
}

/* ---- online duel (server-authoritative, 3 s poll) ---------------------------------- */

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
    onlineApi('/pente/' + state.online.code + '/leave', {
      playerName: onlinePlayerName(),
      guestId: onlineGuestId(),
    }).catch(() => undefined);
  }
  stopOnlinePoll();
  state.online = null;
}

function onlineCreate() {
  onlineStatus('Creating the match…');
  onlineApi('/pente', {
    playerName: onlinePlayerName(),
    guestId: onlineGuestId(),
    size: state.size,
    target: state.target,
  })
    .then(({ code }) => {
      state.online = { code, mark: BLACK, pollTimer: null, lName: null, busy: false };
      const link = 'https://pigzap.com/games/pente/?pte=' + code;
      onlineStatus('Match ' + code + ' — waiting for a challenger. Send: ' + link);
      if (navigator.share) {
        navigator.share({ title: 'Pente duel', text: 'Duel me — match ' + code, url: link }).catch(() => undefined);
      }
      state.online.pollTimer = setInterval(pollOnline, 3000);
    })
    .catch(() => onlineStatus('Could not create the match — check your connection.'));
}

function onlineJoin(code) {
  if (!code) return;
  onlineStatus('Joining ' + code + '…');
  onlineApi('/pente/' + encodeURIComponent(code) + '/join', {
    playerName: onlinePlayerName(),
    guestId: onlineGuestId(),
  })
    .then((view) => {
      state.online = {
        code: view.code,
        mark: view.yourMark,
        pollTimer: null,
        rName: view.rName,
        lName: view.lName,
        busy: false,
      };
      if (view.status === 'waiting') {
        onlineStatus('Joined as ⚪ White — waiting for Black…');
        state.online.pollTimer = setInterval(pollOnline, 3000);
        return;
      }
      enterOnlinePlay(view);
    })
    .catch((e) => onlineStatus('Join failed: ' + (e.message || 'try again')));
}

function pollOnline() {
  if (!state.online || state.online.busy) return;
  onlineApi('/pente/' + encodeURIComponent(state.online.code) + '?guestId=' + encodeURIComponent(onlineGuestId()))
    .then((view) => {
      if (!state.online) return;
      state.online.rName = view.rName;
      state.online.lName = view.lName;
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
  state.size = view.size;
  state.target = view.target;
  if (els.board.children.length !== view.size * view.size) buildBoard();
  state.cells = fromArray(view.cells, view.size);
  state.captures = [view.captures[0] || 0, view.captures[1] || 0];
  state.turn = view.turn;
  state.lastMove = view.lastMove || null;
  renderAll();
  if (view.status === 'finished' && !state.locked) {
    finishOnlineGame(view);
  }
}

function sendOnlineMove(idx) {
  state.online.busy = true;
  onlineApi('/pente/' + encodeURIComponent(state.online.code) + '/move', {
    guestId: onlineGuestId(),
    idx,
  })
    .then((view) => {
      if (state.online) state.online.busy = false;
      applyOnlineView(view);
    })
    .catch((e) => {
      if (state.online) state.online.busy = false;
      toast(e.message === 'Illegal move' ? 'The server rejected that point' : 'Move rejected — try again');
      pollOnline();
    });
}

function finishOnlineGame(view) {
  state.locked = true;
  stopOnlinePoll();
  const isDraw = !view.winner;
  const winner = view.winner;
  const youWon = !isDraw && winner === state.online.mark;

  if (isDraw) state.series.draw++;
  else if (winner === BLACK) state.series.d++;
  else state.series.l++;
  saveSeries(currentSetupKey(), state.series);
  renderMiniSeries();
  if (youWon) vibrate([40, 60, 40]);
  const points = state.captures[winner === BLACK ? 0 : 1] || 0;
  setTimeout(() => showOverlay(isDraw, winner, { line: !!view.line, points }), 450);
}

/* ---- share ---------------------------------------------------------------------------- */

function shareText() {
  const url = 'https://pigzap.com/games/pente/';
  const score = '⚫ ' + state.series.d + ' · ⚪ ' + state.series.l + ' · draws ' + state.series.draw;
  if (state.mode === '2p') return t('share2p', { score, url });
  return t('share1p', {
    setup: 'Pente vs the computer (' + state.difficulty + ', ' + state.size + '×' + state.size + ')',
    score,
    url,
  });
}

function shareUrls() {
  const url = 'https://pigzap.com/games/pente/';
  const text = shareText();
  const textNoUrl = text.split(url).join('').replace(/\s+/g, ' ').trim();
  document.getElementById('share-fb').href =
    'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url) + '&quote=' + encodeURIComponent(textNoUrl);
  document.getElementById('share-x').href = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text);
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

/* ---- wiring ------------------------------------------------------------------------------ */

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
    buttons[i].setAttribute('aria-checked', buttons[i].getAttribute(attr) === value ? 'true' : 'false');
  }
}

function saveMenuPrefs() {
  savePrefs({ mode: state.mode, difficulty: state.difficulty, size: state.size, target: state.target });
}

function init() {
  els.screenMenu = document.getElementById('screen-menu');
  els.screenPlaying = document.getElementById('screen-playing');
  els.board = document.getElementById('board');
  els.turn = document.getElementById('turn');
  els.hintLine = document.getElementById('hint-line');
  els.capDark = document.getElementById('cap-dark');
  els.capLight = document.getElementById('cap-light');
  els.pipsDark = document.getElementById('pips-dark');
  els.pipsLight = document.getElementById('pips-light');
  els.overlay = document.getElementById('overlay');
  els.overlayEmoji = document.getElementById('overlay-emoji');
  els.overlayTitle = document.getElementById('overlay-title');
  els.overlaySub = document.getElementById('overlay-sub');
  els.miniSeries = document.getElementById('mini-series');
  els.seriesScope = document.getElementById('series-scope');
  els.seriesD = document.getElementById('series-d');
  els.seriesL = document.getElementById('series-l');
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
  bindSegmented(document.getElementById('difficulty-segmented'), 'data-difficulty', (difficulty) => {
    state.difficulty = difficulty;
    refreshSeriesFromStorage();
    renderSeriesCard();
    saveMenuPrefs();
  });
  bindSegmented(document.getElementById('size-segmented'), 'data-size', (raw) => {
    const size = Number(raw);
    if (BOARD_SIZES.indexOf(size) === -1 || size === state.size) return;
    state.size = size;
    buildBoard();
    refreshSeriesFromStorage();
    renderSeriesCard();
    saveMenuPrefs();
  });
  bindSegmented(document.getElementById('target-segmented'), 'data-target', (raw) => {
    const target = Number(raw);
    if (CAPTURE_TARGETS.indexOf(target) === -1 || target === state.target) return;
    state.target = target;
    refreshSeriesFromStorage();
    renderSeriesCard();
    saveMenuPrefs();
  });

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
    const cell = e.target.closest('.cell');
    if (!cell) return;
    onCellTap(Number(cell.dataset.idx));
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

  // storage.js keys the level as `difficulty`, the board as `size`; `target`
  // is Pente's own extra preference.
  const prefs = loadPrefs();
  if (prefs) {
    state.mode = prefs.mode;
    state.difficulty = prefs.difficulty;
    state.size = prefs.size;
    state.target = prefs.target ?? CAPTURE_TARGET;
    applyModeUi(state.mode);
    syncSegmented(document.getElementById('mode-segmented'), 'data-mode', state.mode);
    syncSegmented(document.getElementById('difficulty-segmented'), 'data-difficulty', state.difficulty);
    syncSegmented(document.getElementById('size-segmented'), 'data-size', String(state.size));
    syncSegmented(document.getElementById('target-segmented'), 'data-target', String(state.target));
  }

  refreshSeriesFromStorage();
  renderSeriesCard();
  showScreen('menu');

  const pteCode = new URLSearchParams(window.location.search).get('pte');
  if (pteCode) {
    state.mode = 'online';
    applyModeUi('online');
    syncSegmented(document.getElementById('mode-segmented'), 'data-mode', 'online');
    renderSeriesCard();
    els.onlineCode.value = pteCode.toUpperCase().slice(0, 6);
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
  // the family's ?debug seam — lets a headless run read the live state
  // (a locked board with the human's turn showing is otherwise invisible)
  if (new URLSearchParams(window.location.search).has('debug')) {
    window.__PENTE = state;
  }
}

/* share-count pings (prod API; fire-and-forget, best-effort). */
(function () {
  var API = 'https://api.pigzap.com/api/v1/share-counts';
  var SLUG = 'pente';
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
        a.addEventListener('click', function () { ping(pair[1]); }, { once: true, capture: true });
      }
    });
    var copy = document.getElementById('share-copy');
    if (copy && !wired.has(copy)) {
      wired.add(copy);
      copy.addEventListener('click', function () { ping('copy'); }, { once: true, capture: true });
    }
  };
  var btn = document.getElementById('btn-share');
  if (btn) btn.addEventListener('click', wire);
  wire();
})();
