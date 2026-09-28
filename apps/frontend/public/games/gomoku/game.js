/**
 * ============================================================================
 * game.js — Gomoku / Five in a Row (plan/games/02-gomoku.md) — UI shell
 * ============================================================================
 * Plain ESM, no build step (the games convention). The pure model lives in
 * core.js (jest-tested), persistence in storage.js, flags/strings in
 * config.js. This file is screens + DOM wiring; it auto-inits only when its
 * board exists in the DOM.
 *
 * Modes (the family template): solo vs computer (easy/medium/hard), 2-player
 * hot-seat, and ⚔️ online duels — server-authoritative moves, 3-second poll
 * (the /gomoku backend, cloned from /tictactoe). Deep link: ?g5=CODE.
 * Freestyle rules: five OR MORE in a row wins. Black (⚫, the creator) opens.
 * ============================================================================
 */

import { SIZES, createEmptyBoard, other, placeInPlace, roundOutcome, aiMove } from './core.js?v=2';
import {
  emptyTally,
  seriesSetupKey,
  loadSeries,
  saveSeries,
  loadPrefs,
  savePrefs,
} from './storage.js';
import { GAME_CONFIG } from './config.js';

/* ==========================================================================
 * UI — auto-inits only when the board exists (never under jest/node)
 * ======================================================================= */

const state = {
  screen: 'menu',
  mode: '1p', // '1p' | '2p' | 'online'
  difficulty: 'medium', // 'easy' | 'medium' | 'hard'
  size: 15, // 15 standard | 11 quick
  board: createEmptyBoard(15),
  turn: 'B',
  starter: 'B', // mark that opens the current match
  lastMove: -1,
  locked: false, // true during AI thinking and after the match ends
  series: emptyTally(),
  aiTimer: null,
  // plan/games/02: live online duel — server-authoritative, 3-s poll.
  online: null, // { code, mark, pollTimer, busy, bName, wName }
};

const els = {};

function currentSetupKey() {
  return seriesSetupKey(state.mode, state.difficulty, state.size);
}

const markLabel = (m) => (m === 'B' ? '⚫' : '⚪');
const markName = (m) => (m === 'B' ? 'Black' : 'White');

/* ---- screens -------------------------------------------------------------- */

function showScreen(name) {
  state.screen = name;
  els.screenMenu.classList.toggle('screen--active', name === 'menu');
  els.screenPlaying.classList.toggle('screen--active', name === 'playing');
  if (name === 'menu') renderSeriesCard();
}

/* ---- menu screen ---------------------------------------------------------- */

function renderSeriesCard() {
  let scope =
    state.mode === '1p'
      ? 'vs computer · ' + state.difficulty
      : state.mode === 'online'
        ? 'online duel'
        : '2 players';
  els.seriesScope.textContent = scope + ' · ' + state.size + '×' + state.size;
  els.seriesB.textContent = String(state.series.b);
  els.seriesW.textContent = String(state.series.w);
  els.seriesDraw.textContent = String(state.series.draw);
  const total = state.series.b + state.series.w + state.series.draw;
  els.resetSeriesBtn.disabled = total === 0;
}

function refreshSeriesFromStorage() {
  state.series = loadSeries(currentSetupKey());
}

/* ---- playing screen --------------------------------------------------------- */

function renderBoard() {
  const size = state.size;
  els.board.style.gridTemplateColumns = 'repeat(' + size + ', 1fr)';
  for (let i = 0; i < size * size; i++) renderCell(i);
  sizeGridLines();
}

/** The drawn grid lines behind the intersections follow the cell pitch. */
function sizeGridLines() {
  const pitch = (els.board.clientWidth - 16) / state.size;
  if (pitch > 0) els.board.style.setProperty('--cell', pitch + 'px');
}

/** Update a single cell — re-rendering everything would restart the drop animation. */
function renderCell(i) {
  const cell = els.board.children[i];
  const mark = state.board[i];
  const row = Math.floor(i / state.size);
  const col = i % state.size;
  cell.dataset.mark = mark || '';
  cell.innerHTML = mark ? '<span class="stone stone--' + mark + '" aria-hidden="true"></span>' : '';
  cell.classList.toggle('last', i === state.lastMove);
  cell.setAttribute(
    'aria-label',
    'Row ' + (row + 1) + ', column ' + (col + 1) + ', ' + (mark ? markName(mark) : 'empty')
  );
  cell.disabled = state.locked || !!mark;
}

function highlightWin(line) {
  const cells = els.board.children;
  for (let i = 0; i < cells.length; i++) {
    if (line.indexOf(i) !== -1) cells[i].classList.add('cell--win');
    else cells[i].classList.add('cell--dim');
  }
}

function isAiTurnNow() {
  return state.mode === '1p' && state.turn === 'W';
}

function renderTurn() {
  let label;
  const mark = state.turn;
  if (state.mode === '1p') {
    label = isAiTurnNow() ? "Computer's turn…" : "Your turn — you're ⚫";
  } else if (state.mode === 'online' && state.online) {
    const you = state.online.mark;
    const oppName = you === 'B' ? state.online.wName : state.online.bName;
    label =
      mark === you
        ? 'Your turn — you are ' + markLabel(you)
        : 'Waiting for ' + (oppName || 'opponent') + '…';
  } else {
    label = markLabel(mark) + ' ' + markName(mark) + "'s turn";
  }
  els.turn.textContent = label;
  els.turn.dataset.mark = mark;
}

function lockBoard(locked) {
  state.locked = locked;
  const cells = els.board.children;
  for (let i = 0; i < cells.length; i++) cells[i].disabled = locked || !!state.board[i];
}

function startRound() {
  state.board = createEmptyBoard(state.size);
  state.turn = state.starter;
  state.lastMove = -1;
  state.locked = false;
  if (state.aiTimer) {
    clearTimeout(state.aiTimer);
    state.aiTimer = null;
  }
  renderBoard();
  renderTurn();
  renderMiniSeries();
  els.overlay.classList.add('hidden');
  els.overlay.classList.remove('overlay--in');
  if (isAiTurnNow()) scheduleAiMove();
}

function placeMark(index) {
  if (state.screen !== 'playing' || state.locked) return; // match over / AI thinking
  if (state.board[index]) return; // occupied — no-op
  if (isAiTurnNow()) return; // human cannot move for the computer
  if (state.mode === 'online') {
    playOnlineMove(index);
    return;
  }
  play(index);
}

function play(index) {
  if (!placeInPlace(state.board, state.size, index, state.turn)) return;
  state.lastMove = index;
  renderCell(index);
  const outcome = roundOutcome(state.board, state.size, index);
  if (outcome) {
    endRound(outcome);
    return;
  }
  state.turn = other(state.turn);
  renderTurn();
  if (isAiTurnNow()) scheduleAiMove();
}

/* ---- solo AI ---------------------------------------------------------------- */

function clearThinkPulse() {
  els.thinkingBadge.classList.add('hidden');
}

function scheduleAiMove() {
  lockBoard(true);
  els.thinkingBadge.classList.remove('hidden');
  state.aiTimer = setTimeout(() => {
    state.aiTimer = null;
    clearThinkPulse();
    if (state.screen !== 'playing' || !isAiTurnNow()) return;
    const index = aiMove(
      state.board,
      state.size,
      'W',
      state.difficulty,
      GAME_CONFIG.hardSearchDepth
    );
    lockBoard(false);
    if (index < 0) return;
    play(index);
  }, GAME_CONFIG.aiThinkDelayMs);
}

/* ---- online duel (plan/games/02) --------------------------------------------- */
/* Server-authoritative matches (backend /gomoku): the board only changes via
 * POST move (a cell index), and both players sync the authoritative state
 * with the same 3-second poll the duels use. One match per round; rematch =
 * new match. Deep link: ?g5=CODE. */

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

/** The server-signed guest pair (HARD-03) cached by the app under this key —
 *  every guest WRITE the duels backend accepts requires it as X-Guest-Token. */
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

/** Reuse the app's signed pair, or issue one for this device's guest id. */
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
    onlineApi('/gomoku/' + state.online.code + '/leave', {
      playerName: onlinePlayerName(),
      guestId: onlineGuestId(),
    }).catch(() => undefined);
  }
  stopOnlinePoll();
  state.online = null;
}

function onlineCreate() {
  onlineStatus('Creating the match…');
  onlineApi('/gomoku', {
    playerName: onlinePlayerName(),
    guestId: onlineGuestId(),
    size: state.size,
  })
    .then(({ code }) => {
      state.online = { code, mark: 'B', pollTimer: null, wName: null, busy: false };
      const link = 'https://pigzap.com/games/gomoku/?g5=' + code;
      onlineStatus('Match ' + code + ' — waiting for a challenger. Send: ' + link);
      if (navigator.share) {
        navigator
          .share({ title: 'Gomoku duel', text: 'Duel me — match ' + code, url: link })
          .catch(() => undefined);
      }
      state.online.pollTimer = setInterval(pollOnline, 3000);
    })
    .catch(() => onlineStatus('Could not create the match — check your connection.'));
}

function onlineJoin(code) {
  if (!code) return;
  onlineStatus('Joining ' + code + '…');
  onlineApi('/gomoku/' + encodeURIComponent(code) + '/join', {
    playerName: onlinePlayerName(),
    guestId: onlineGuestId(),
  })
    .then((view) => {
      adoptOnlineView(view);
      if (view.status === 'waiting') {
        // Re-opening your own match link on this device: the server sees the
        // same guest id and returns the creator's view — don't claim ⚪.
        onlineStatus(
          view.yourMark === 'B'
            ? 'This is your own match — waiting for a challenger to join.'
            : 'Joined as ⚪ — waiting for ⚫ to be claimed…'
        );
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
    '/gomoku/' +
      encodeURIComponent(state.online.code) +
      '?guestId=' +
      encodeURIComponent(onlineGuestId())
  )
    .then((view) => {
      if (!state.online) return;
      adoptOnlineView(view);
      if (view.status === 'waiting') return; // still waiting for the opponent
      if (state.screen !== 'playing') enterOnlinePlay(view);
      else applyOnlineView(view);
    })
    .catch(() => undefined); // transient — the poll rides again
}

function adoptOnlineView(view) {
  state.online = {
    code: view.code,
    mark: view.yourMark,
    pollTimer: state.online ? state.online.pollTimer : null,
    bName: view.bName,
    wName: view.yName,
    busy: false,
  };
}

function enterOnlinePlay(view) {
  refreshSeriesFromStorage();
  showScreen('playing');
  startOnlineRound(view);
}

function startOnlineRound(view) {
  els.overlay.classList.add('hidden');
  els.overlay.classList.remove('overlay--in');
  state.locked = false;
  applyOnlineView(view);
  // The JOINER has no poll yet (only the creator's create-branch starts one) —
  // without this their page freezes on the join view: no opponent moves, no
  // turn updates, moves silently ignored. Found by the manual browser check.
  if (state.online && !state.online.pollTimer) {
    state.online.pollTimer = setInterval(pollOnline, 3000);
  }
}

function applyOnlineView(view) {
  state.size = view.size;
  // the match may use a different board size than the menu did — rebuild the
  // cells before rendering, or stale intersections linger
  if (els.board.children.length !== view.size * view.size) buildBoard();
  state.board = view.board.slice();
  state.turn = view.turn;
  renderBoard();
  renderTurn();
  renderMiniSeries();
  if (view.status === 'finished' && !state.locked) finishOnlineRound(view);
}

function playOnlineMove(index) {
  if (!state.online || state.online.busy) return;
  if (state.turn !== state.online.mark) return; // opponent's turn — poll will catch up
  state.online.busy = true;
  onlineApi('/gomoku/' + encodeURIComponent(state.online.code) + '/move', {
    guestId: onlineGuestId(),
    cell: index,
  })
    .then((view) => {
      if (state.online) state.online.busy = false;
      applyOnlineView(view);
    })
    .catch(() => {
      if (state.online) state.online.busy = false;
      toast('Move rejected — try again');
    });
}

function finishOnlineRound(view) {
  state.locked = true;
  stopOnlinePoll();
  const isDraw = !!view.draw;
  const winner = view.winner;
  const youWon = !isDraw && winner === state.online.mark;

  if (isDraw) state.series.draw++;
  else if (winner === 'B') state.series.b++;
  else state.series.w++;
  saveSeries(currentSetupKey(), state.series);

  if (view.winningLine) highlightWin(view.winningLine);
  renderMiniSeries();
  if (youWon) vibrate([40, 60, 40]);

  const oppName = state.online.mark === 'B' ? view.wName : view.bName;
  setTimeout(() => {
    els.overlayEmoji.textContent = isDraw ? '🤝' : youWon ? '🎉' : '😬';
    els.overlayTitle.textContent = isDraw
      ? 'Draw 🤝'
      : youWon
        ? 'You win! 🎉'
        : (oppName || 'Opponent') + ' wins';
    els.overlayTitle.dataset.mark = isDraw ? '' : winner || '';
    els.overlaySub.textContent =
      'Series — ⚫ ' + state.series.b + ' · ⚪ ' + state.series.w + ' · 🤝 ' + state.series.draw;
    els.overlay.classList.remove('hidden');
    els.overlay.classList.add('overlay--in');
    document.getElementById('btn-next').textContent = 'New online match';
    document.getElementById('btn-next').focus();
  }, 650);
}

/* ---- round end --------------------------------------------------------------- */

function endRound(outcome) {
  state.locked = true;
  const isDraw = outcome === 'draw';
  const winner = isDraw ? null : outcome.winner;

  if (isDraw) state.series.draw++;
  else if (winner === 'B') state.series.b++;
  else state.series.w++;
  saveSeries(currentSetupKey(), state.series);

  // Next opener: the loser starts the rematch; a draw flips the opener.
  if (isDraw) state.starter = other(state.starter);
  else state.starter = other(winner);

  if (!isDraw) highlightWin(outcome.line);
  renderMiniSeries();
  if (!isDraw) vibrate([40, 60, 40]);

  setTimeout(() => showOverlay(isDraw, winner), 650);
}

function showOverlay(isDraw, winner) {
  let title;
  let emoji;
  let sub;
  if (isDraw) {
    title = 'Draw 🤝';
    emoji = '🤝';
    sub = 'The board filled with no five. Run it back?';
  } else {
    title = markName(winner) + ' wins!';
    emoji = markLabel(winner);
    if (state.mode === '1p') {
      sub = winner === 'B' ? 'You beat the computer!' : 'The computer takes it. Rematch?';
    }
  }
  els.overlayEmoji.textContent = emoji;
  els.overlayTitle.textContent = title;
  els.overlayTitle.dataset.mark = isDraw ? '' : winner;
  const seriesLine =
    'Series — ⚫ ' + state.series.b + ' · ⚪ ' + state.series.w + ' · 🤝 ' + state.series.draw;
  els.overlaySub.textContent = (sub ? sub + ' ' : '') + seriesLine;
  els.overlay.classList.remove('hidden');
  els.overlay.classList.add('overlay--in');
  document.getElementById('btn-next').focus();
}

function renderMiniSeries() {
  els.miniSeries.textContent =
    '⚫ ' + state.series.b + ' · 🤝 ' + state.series.draw + ' · ⚪ ' + state.series.w;
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

/* ---- keyboard a11y: roving focus on the board ------------------------------------ */

function handleBoardKeys(e) {
  const cells = els.board.children;
  const index = Array.prototype.indexOf.call(cells, document.activeElement);
  const from = index === -1 ? 0 : index;
  const size = state.size;
  const map = {
    ArrowLeft: from - 1,
    ArrowRight: from + 1,
    ArrowUp: from - size,
    ArrowDown: from + size,
  };
  if (e.key in map) {
    e.preventDefault();
    let next = map[e.key];
    if (next < 0) next += size * size;
    if (next >= size * size) next -= size * size;
    cells[next].focus();
  }
}

/* ---- wiring ------------------------------------------------------------------------ */

function buildBoard() {
  els.board.innerHTML = '';
  for (let i = 0; i < state.size * state.size; i++) {
    const row = Math.floor(i / state.size);
    const col = i % state.size;
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'cell';
    cell.setAttribute('aria-label', 'Row ' + (row + 1) + ', column ' + (col + 1) + ', empty');
    els.board.appendChild(cell);
  }
}

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

function applyModeUi(mode) {
  els.difficultyRow.classList.toggle('hidden', mode !== '1p');
  els.onlineRow.classList.toggle('hidden', mode !== 'online');
  els.btnPlay.classList.toggle('hidden', mode === 'online');
}

function applySizeUi() {
  // the board is rebuilt at the current size (and re-gridded for the lines)
  buildBoard();
  if (state.screen === 'playing') {
    startRound();
  } else {
    renderBoard();
  }
}

function saveMenuPrefs() {
  savePrefs({ mode: state.mode, difficulty: state.difficulty, size: state.size });
}

function init() {
  els.screenMenu = document.getElementById('screen-menu');
  els.screenPlaying = document.getElementById('screen-playing');
  els.board = document.getElementById('board');
  els.turn = document.getElementById('turn');
  els.overlay = document.getElementById('overlay');
  els.overlayEmoji = document.getElementById('overlay-emoji');
  els.overlayTitle = document.getElementById('overlay-title');
  els.overlaySub = document.getElementById('overlay-sub');
  els.miniSeries = document.getElementById('mini-series');
  els.seriesScope = document.getElementById('series-scope');
  els.seriesB = document.getElementById('series-b');
  els.seriesW = document.getElementById('series-w');
  els.seriesDraw = document.getElementById('series-draw');
  els.resetSeriesBtn = document.getElementById('reset-series');
  els.difficultyRow = document.getElementById('difficulty-row');
  els.onlineRow = document.getElementById('online-row');
  els.onlineName = document.getElementById('online-name');
  els.onlineCode = document.getElementById('online-code');
  els.onlineStatus = document.getElementById('online-status');
  els.thinkingBadge = document.getElementById('thinking-badge');
  els.btnPlay = document.getElementById('btn-play');
  els.toast = document.getElementById('toast');

  // Restore the menu exactly as the player left it.
  const prefs = loadPrefs();
  state.mode = prefs.mode;
  state.difficulty = prefs.difficulty;
  state.size = SIZES.indexOf(prefs.size) !== -1 ? prefs.size : 15;

  buildBoard();

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
  bindSegmented(document.getElementById('size-segmented'), 'data-size', (raw) => {
    const size = Number(raw);
    if (!SIZES.includes(size) || size === state.size) return;
    state.size = size;
    state.board = createEmptyBoard(size);
    state.lastMove = -1;
    refreshSeriesFromStorage();
    renderSeriesCard();
    saveMenuPrefs();
    applySizeUi();
  });

  els.btnPlay.addEventListener('click', () => {
    refreshSeriesFromStorage();
    showScreen('playing');
    startRound();
  });
  document.getElementById('btn-online-create').addEventListener('click', onlineCreate);
  document.getElementById('btn-online-join').addEventListener('click', () => {
    onlineJoin(els.onlineCode.value.trim().toUpperCase().slice(0, 6));
  });
  const leaveOnlineToMenu = () => {
    onlineLeaveQuietly();
    document.getElementById('btn-next').textContent = 'Next match';
  };
  document.getElementById('btn-menu').addEventListener('click', () => {
    if (state.mode === 'online') leaveOnlineToMenu();
    if (state.aiTimer) {
      clearTimeout(state.aiTimer);
      state.aiTimer = null;
      clearThinkPulse();
    }
    showScreen('menu');
  });
  document.getElementById('btn-next').addEventListener('click', () => {
    if (state.mode === 'online') {
      // One match per online round — the rematch is a fresh match.
      onlineLeaveQuietly();
      onlineCreate();
      return;
    }
    startRound();
  });
  document.getElementById('btn-menu2').addEventListener('click', () => {
    if (state.mode === 'online') leaveOnlineToMenu();
    if (state.aiTimer) {
      clearTimeout(state.aiTimer);
      state.aiTimer = null;
      clearThinkPulse();
    }
    showScreen('menu');
  });
  els.resetSeriesBtn.addEventListener('click', () => {
    state.series = emptyTally();
    saveSeries(currentSetupKey(), state.series);
    renderSeriesCard();
    renderMiniSeries();
  });

  els.board.addEventListener('click', (e) => {
    const cell = e.target.closest('.cell');
    if (!cell) return;
    const index = Array.prototype.indexOf.call(els.board.children, cell);
    if (index >= 0) placeMark(index);
  });
  els.board.addEventListener('keydown', handleBoardKeys);
  window.addEventListener('resize', sizeGridLines);

  // Pausing mid-AI-turn drops the pending move; reschedule on return, or the
  // human would come back to a board that can never be played.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      if (state.aiTimer) {
        clearTimeout(state.aiTimer);
        state.aiTimer = null;
        clearThinkPulse();
      }
    } else if (
      state.screen === 'playing' &&
      isAiTurnNow() &&
      !state.aiTimer &&
      els.overlay.classList.contains('hidden')
    ) {
      scheduleAiMove();
    }
  });

  applyModeUi(state.mode);
  syncSegmented(document.getElementById('mode-segmented'), 'data-mode', state.mode);
  syncSegmented(
    document.getElementById('difficulty-segmented'),
    'data-difficulty',
    state.difficulty
  );
  syncSegmented(document.getElementById('size-segmented'), 'data-size', String(state.size));

  refreshSeriesFromStorage();
  renderSeriesCard();
  showScreen('menu');

  // plan/games/02: ?g5=CODE deep link — flip to online mode with the code
  // prefilled (name remembered from a previous duel when available).
  const g5Code = new URLSearchParams(window.location.search).get('g5');
  if (g5Code) {
    state.mode = 'online';
    applyModeUi('online');
    syncSegmented(document.getElementById('mode-segmented'), 'data-mode', 'online');
    renderSeriesCard();
    els.onlineCode.value = g5Code.toUpperCase().slice(0, 6);
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
