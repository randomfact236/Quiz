/**
 * ============================================================================
 * game.js — Connect Four (plan/games/01-connect-four.md) — UI shell
 * ============================================================================
 * Plain ESM, no build step (the games convention). The pure model lives in
 * core.js (jest-tested), persistence in storage.js, flags/strings in
 * config.js. This file is screens + DOM wiring; it auto-inits only when its
 * board exists in the DOM.
 *
 * Modes (the family template): solo vs computer (easy/medium/hard), 2-player
 * hot-seat, and ⚔️ online duels — server-authoritative moves, 3-second poll
 * (the /connectfour backend, cloned from /tictactoe). Deep link: ?c4=CODE.
 * ============================================================================
 */

import { COLS, ROWS, CELLS, emptyBoard, other, dropInPlace, roundOutcome, aiMove } from './core.js';
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
  board: emptyBoard(),
  turn: 'R',
  starter: 'R', // mark that opens the current round
  locked: false, // true during AI thinking and after the round ends
  series: emptyTally(),
  aiTimer: null,
  // plan/games/01: live online duel — server-authoritative, 3-s poll.
  online: null, // { code, mark, pollTimer, busy, rName, yName }
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
  let scope =
    state.mode === '1p'
      ? 'vs computer · ' + state.difficulty
      : state.mode === 'online'
        ? 'online duel'
        : '2 players';
  els.seriesScope.textContent = scope;
  els.seriesR.textContent = String(state.series.r);
  els.seriesY.textContent = String(state.series.y);
  els.seriesDraw.textContent = String(state.series.draw);
  const total = state.series.r + state.series.y + state.series.draw;
  els.resetSeriesBtn.disabled = total === 0;
}

function refreshSeriesFromStorage() {
  state.series = loadSeries(currentSetupKey());
}

/* ---- playing screen --------------------------------------------------------- */

function renderBoard() {
  for (let i = 0; i < CELLS; i++) renderCell(i);
}

/** Update a single cell — re-rendering everything would restart the drop animation. */
function renderCell(i) {
  const cell = els.board.children[i];
  const mark = state.board[i];
  cell.dataset.mark = mark || '';
  cell.innerHTML = mark ? '<span class="disc disc--' + mark + '" aria-hidden="true"></span>' : '';
  const row = Math.floor(i / COLS);
  const col = i % COLS;
  cell.setAttribute(
    'aria-label',
    'Row ' + (row + 1) + ', column ' + (col + 1) + ', ' + (mark ? mark : 'empty')
  );
  cell.disabled = state.locked || !!mark;
}

function highlightWin(line) {
  const cells = els.board.children;
  for (let i = 0; i < CELLS; i++) {
    if (line.indexOf(i) !== -1) cells[i].classList.add('cell--win');
    else cells[i].classList.add('cell--dim');
  }
}

function renderTurn() {
  let label;
  const mark = state.turn;
  if (state.mode === '1p') {
    label = isAiTurnNow() ? "Computer's turn…" : "Your turn — you're 🔴";
  } else if (state.mode === 'online' && state.online) {
    const you = state.online.mark;
    const oppName = you === 'R' ? state.online.yName : state.online.rName;
    label =
      mark === you
        ? 'Your turn — you are ' + (you === 'R' ? '🔴' : '🟡')
        : 'Waiting for ' + (oppName || 'opponent') + '…';
  } else {
    label = (mark === 'R' ? "🔴 Red's" : "🟡 Yellow's") + ' turn';
  }
  els.turn.textContent = label;
  els.turn.dataset.mark = mark;
}

function isAiTurnNow() {
  return state.mode === '1p' && state.turn === 'Y';
}

function lockBoard(locked) {
  state.locked = locked;
  const cells = els.board.children;
  for (let i = 0; i < CELLS; i++) cells[i].disabled = locked || !!state.board[i];
}

function startRound() {
  state.board = emptyBoard();
  state.turn = state.starter;
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

function placeMark(col) {
  if (state.screen !== 'playing' || state.locked) return; // round over / AI thinking
  if (state.mode === '1p' && isAiTurnNow()) return; // human cannot move for the computer
  if (state.mode === 'online') {
    playOnlineMove(col);
    return;
  }
  play(col);
}

function play(col) {
  const row = dropInPlace(state.board, col, state.turn);
  if (row === -1) return; // full column — no-op
  renderCell(row * COLS + col);
  const outcome = roundOutcome(state.board, row, col);
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
    const col = aiMove(state.board, 'Y', state.difficulty, GAME_CONFIG.hardSearchDepth);
    lockBoard(false);
    if (col === -1) return;
    play(col);
  }, GAME_CONFIG.aiThinkDelayMs);
}

/* ---- online duel (plan/games/01) --------------------------------------------- */
/* Server-authoritative matches (backend /connectfour): the board only changes
 * via POST move (a column), and both players sync the authoritative state with
 * the same 3-second poll the duels and tic-tac-toe use. One round per match;
 * rematch = new match. Deep link: ?c4=CODE. */

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

function onlineApi(path, body) {
  return fetch(ONLINE_API + path, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  }).then((r) => {
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
    onlineApi('/connectfour/' + state.online.code + '/leave', {
      playerName: onlinePlayerName(),
      guestId: onlineGuestId(),
    }).catch(() => undefined);
  }
  stopOnlinePoll();
  state.online = null;
}

function onlineCreate() {
  onlineStatus('Creating the match…');
  onlineApi('/connectfour', {
    playerName: onlinePlayerName(),
    guestId: onlineGuestId(),
  })
    .then(({ code }) => {
      state.online = { code, mark: 'R', pollTimer: null, yName: null, busy: false };
      const link = 'https://pigzap.com/games/connect-four/?c4=' + code;
      onlineStatus('Match ' + code + ' — waiting for a challenger. Send: ' + link);
      if (navigator.share) {
        navigator
          .share({ title: 'Connect Four duel', text: 'Duel me — match ' + code, url: link })
          .catch(() => undefined);
      }
      state.online.pollTimer = setInterval(pollOnline, 3000);
    })
    .catch(() => onlineStatus('Could not create the match — check your connection.'));
}

function onlineJoin(code) {
  if (!code) return;
  onlineStatus('Joining ' + code + '…');
  onlineApi('/connectfour/' + encodeURIComponent(code) + '/join', {
    playerName: onlinePlayerName(),
    guestId: onlineGuestId(),
  })
    .then((view) => {
      state.online = {
        code: view.code,
        mark: view.yourMark,
        pollTimer: null,
        rName: view.rName,
        yName: view.yName,
        busy: false,
      };
      if (view.status === 'waiting') {
        onlineStatus('Joined as 🟡 — waiting for 🔴 to be claimed…');
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
    '/connectfour/' +
      encodeURIComponent(state.online.code) +
      '?guestId=' +
      encodeURIComponent(onlineGuestId())
  )
    .then((view) => {
      if (!state.online) return;
      state.online.rName = view.rName;
      state.online.yName = view.yName;
      if (view.status === 'waiting') return; // still waiting for the opponent
      if (state.screen !== 'playing') enterOnlinePlay(view);
      else applyOnlineView(view);
    })
    .catch(() => undefined); // transient — the poll rides again
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
}

function applyOnlineView(view) {
  state.board = view.board.slice();
  state.turn = view.turn;
  renderBoard();
  renderTurn();
  renderMiniSeries();
  if (view.status === 'finished' && !state.locked) finishOnlineRound(view);
}

function playOnlineMove(col) {
  if (!state.online || state.online.busy) return;
  if (state.turn !== state.online.mark) return; // opponent's turn — poll will catch up
  state.online.busy = true;
  onlineApi('/connectfour/' + encodeURIComponent(state.online.code) + '/move', {
    guestId: onlineGuestId(),
    column: col,
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
  else if (winner === 'R') state.series.r++;
  else state.series.y++;
  saveSeries(currentSetupKey(), state.series);

  if (view.winningLine) highlightWin(view.winningLine);
  renderMiniSeries();
  if (youWon) vibrate([40, 60, 40]);

  const oppName = state.online.mark === 'R' ? view.yName : view.rName;
  setTimeout(() => {
    els.overlayEmoji.textContent = isDraw ? '🤝' : youWon ? '🎉' : '😬';
    els.overlayTitle.textContent = isDraw
      ? 'Draw 🤝'
      : youWon
        ? 'You win! 🎉'
        : (oppName || 'Opponent') + ' wins';
    els.overlayTitle.dataset.mark = isDraw ? '' : winner || '';
    els.overlaySub.textContent =
      'Series — 🔴 ' + state.series.r + ' · 🟡 ' + state.series.y + ' · 🤝 ' + state.series.draw;
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
  else if (winner === 'R') state.series.r++;
  else state.series.y++;
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
    sub = 'The grid filled with no four. Run it back?';
  } else {
    title = (winner === 'R' ? '🔴 Red' : '🟡 Yellow') + ' wins!';
    emoji = winner === 'R' ? '🔴' : '🟡';
    if (state.mode === '1p') {
      sub = winner === 'R' ? 'You beat the computer!' : 'The computer takes it. Rematch?';
    }
  }
  els.overlayEmoji.textContent = emoji;
  els.overlayTitle.textContent = title;
  els.overlayTitle.dataset.mark = isDraw ? '' : winner;
  const seriesLine =
    'Series — 🔴 ' + state.series.r + ' · 🟡 ' + state.series.y + ' · 🤝 ' + state.series.draw;
  els.overlaySub.textContent = (sub ? sub + ' ' : '') + seriesLine;
  els.overlay.classList.remove('hidden');
  els.overlay.classList.add('overlay--in');
  document.getElementById('btn-next').focus();
}

function renderMiniSeries() {
  els.miniSeries.textContent =
    '🔴 ' + state.series.r + ' · 🤝 ' + state.series.draw + ' · 🟡 ' + state.series.y;
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
  const map = {
    ArrowLeft: from - 1,
    ArrowRight: from + 1,
    ArrowUp: from - COLS,
    ArrowDown: from + COLS,
  };
  if (e.key in map) {
    e.preventDefault();
    let next = map[e.key];
    if (next < 0) next += CELLS;
    if (next >= CELLS) next -= CELLS;
    cells[next].focus();
  }
}

/* ---- wiring ------------------------------------------------------------------------ */

function buildBoard() {
  els.board.innerHTML = '';
  for (let i = 0; i < CELLS; i++) {
    const row = Math.floor(i / COLS);
    const col = i % COLS;
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'cell';
    cell.dataset.col = String(col);
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

function saveMenuPrefs() {
  savePrefs({ mode: state.mode, difficulty: state.difficulty });
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
  els.seriesR = document.getElementById('series-r');
  els.seriesY = document.getElementById('series-y');
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

  buildBoard();

  const applyMode = (mode) => {
    state.mode = mode;
    applyModeUi(mode);
    refreshSeriesFromStorage();
    renderSeriesCard();
    saveMenuPrefs();
  };
  bindSegmented(document.getElementById('mode-segmented'), 'data-mode', applyMode);
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
    document.getElementById('btn-next').textContent = 'Next round';
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
      // One round per online match — the rematch is a fresh match.
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

  // Tap ANY cell in a column → the disc drops into that column.
  els.board.addEventListener('click', (e) => {
    const cell = e.target.closest('.cell');
    if (!cell) return;
    placeMark(Number(cell.dataset.col));
  });
  els.board.addEventListener('keydown', handleBoardKeys);

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

  // Restore the menu exactly as the player left it.
  const prefs = loadPrefs();
  state.mode = prefs.mode;
  state.difficulty = prefs.difficulty;
  applyModeUi(state.mode);
  syncSegmented(document.getElementById('mode-segmented'), 'data-mode', state.mode);
  syncSegmented(
    document.getElementById('difficulty-segmented'),
    'data-difficulty',
    state.difficulty
  );

  refreshSeriesFromStorage();
  renderSeriesCard();
  showScreen('menu');

  // plan/games/01: ?c4=CODE deep link — flip to online mode with the code
  // prefilled (name remembered from a previous duel when available).
  const c4Code = new URLSearchParams(window.location.search).get('c4');
  if (c4Code) {
    state.mode = 'online';
    applyModeUi('online');
    syncSegmented(document.getElementById('mode-segmented'), 'data-mode', 'online');
    renderSeriesCard();
    els.onlineCode.value = c4Code.toUpperCase().slice(0, 6);
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
