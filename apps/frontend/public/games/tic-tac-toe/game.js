/**
 * ============================================================================
 * Tic Tac Toe — game.js (Game 02, plan/games/02-tic-tac-toe.md) — UI shell
 * ============================================================================
 * Plain ESM, no build step (the games convention). Rev 2
 * structure (§12): the pure model lives in core.js, persistence in storage.js
 * (versioned + migrated), flags/strings in config.js. This file is only the
 * screens + DOM wiring; it auto-inits when its board exists in the DOM, so
 * importing it in tests has no side effects.
 *
 * Board model = Array(9) of null | 'X' | 'O'. X is the first mover of the
 * series; the loser of a round starts the next one (starter flips on draw).
 * ============================================================================
 */

import { emptyBoard, other, roundOutcome, aiMove, hardAiToastDue } from './core.js?v=9';
import {
  emptyTally,
  seriesSetupKey,
  loadSeries,
  saveSeries,
  loadPrefs,
  savePrefs,
  getHardAiToastSeen,
  markHardAiToastSeen,
} from './storage.js';
import { GAME_CONFIG, t } from './config.js';

/* ==========================================================================
 * UI — auto-inits only when the board exists (never under jest/node)
 * ======================================================================= */

const MARK_SVG = {
  X:
    '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">' +
    '<line class="stroke" x1="22" y1="22" x2="78" y2="78"/>' +
    '<line class="stroke s2" x1="78" y1="22" x2="22" y2="78"/></svg>',
  O:
    '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">' +
    '<circle class="stroke" cx="50" cy="50" r="29"/></svg>',
};

const state = {
  screen: 'menu',
  mode: '1p', // '1p' | '2p' | 'online'
  difficulty: 'medium', // 'easy' | 'medium' | 'hard'
  misere: false,
  board: emptyBoard(),
  turn: 'X',
  starter: 'X', // mark that opens the current round
  locked: false, // true during AI thinking and after the round ends
  series: emptyTally(),
  aiTimer: null,
  // plan/18 phase 5: live online duel — server-authoritative board, 3-s poll.
  online: null, // { code, mark, pollTimer, busy }
};

const els = {};

function currentSetupKey() {
  return seriesSetupKey(state.mode, state.difficulty, state.misere);
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
  if (state.misere) scope += ' · misère';
  els.seriesScope.textContent = scope;
  els.seriesX.textContent = String(state.series.x);
  els.seriesO.textContent = String(state.series.o);
  els.seriesDraw.textContent = String(state.series.draw);
  const total = state.series.x + state.series.o + state.series.draw;
  els.resetSeriesBtn.disabled = total === 0;
}

function refreshSeriesFromStorage() {
  state.series = loadSeries(currentSetupKey());
}

/* ---- playing screen --------------------------------------------------------- */

function renderBoard() {
  for (let i = 0; i < 9; i++) renderCell(i);
}

/** Update a single cell — re-rendering the whole board would restart every mark's draw-in animation. */
function renderCell(i) {
  const cell = els.board.children[i];
  const mark = state.board[i];
  cell.dataset.mark = mark || '';
  cell.innerHTML = mark ? MARK_SVG[mark] : '';
  const row = Math.floor(i / 3) + 1;
  const col = (i % 3) + 1;
  cell.setAttribute(
    'aria-label',
    'Row ' + row + ', column ' + col + ', ' + (mark ? mark : 'empty')
  );
  cell.disabled = state.locked || !!mark;
  cell.classList.remove('cell--win', 'cell--dim', 'cell--animating', 'cell--think');
  if (mark) {
    // Draw-in reveal; the class is always removed on a timer so the mark
    // ends fully visible even if CSS animations never advance.
    cell.classList.add('cell--animating');
    setTimeout(() => cell.classList.remove('cell--animating'), 600);
  }
}

function highlightWin(line) {
  const cells = els.board.children;
  for (let i = 0; i < 9; i++) {
    if (line.indexOf(i) !== -1) cells[i].classList.add('cell--win');
    else cells[i].classList.add('cell--dim');
  }
}

function isAiTurnNow() {
  return state.mode === '1p' && state.turn === 'O';
}

function renderTurn() {
  let label;
  const mark = state.turn;
  if (state.mode === '1p') {
    label = isAiTurnNow() ? "Computer's turn…" : "Your turn — you're " + mark;
  } else if (state.mode === 'online' && state.online) {
    const you = state.online.mark;
    const oppName = you === 'X' ? state.online.oName : state.online.xName;
    label =
      mark === you ? "Your turn — you're " + mark : 'Waiting for ' + (oppName || 'opponent') + '…';
  } else {
    label = mark + "'s turn";
  }
  els.turn.textContent = label;
  els.turn.dataset.mark = mark;
}

function renderMiniSeries() {
  els.miniSeries.textContent =
    '✕ ' + state.series.x + ' · 🤝 ' + state.series.draw + ' · ◯ ' + state.series.o;
  els.misereBadge.classList.toggle('hidden', !state.misere);
}

function lockBoard(locked) {
  state.locked = locked;
  const cells = els.board.children;
  for (let i = 0; i < 9; i++) cells[i].disabled = locked || !!state.board[i];
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
  els.board.classList.remove('board--deal');
  // restart the deal-in animation
  void els.board.offsetWidth;
  els.board.classList.add('board--deal');
  if (isAiTurnNow()) scheduleAiMove();
}

function placeMark(index) {
  if (state.screen !== 'playing' || state.locked) return; // round over / AI thinking
  if (state.board[index]) return; // occupied — no-op
  if (isAiTurnNow()) return; // human cannot move for the computer
  if (state.mode === 'online') {
    playOnlineMove(index);
    return;
  }
  play(index);
}

function play(index) {
  state.board[index] = state.turn;
  renderCell(index);
  const outcome = roundOutcome(state.board, state.misere);
  if (outcome) {
    endRound(outcome);
    return;
  }
  state.turn = other(state.turn);
  renderTurn();
  if (isAiTurnNow()) scheduleAiMove();
}

function clearThinkPulse() {
  for (const cell of els.board.children) cell.classList.remove('cell--think');
}

function scheduleAiMove() {
  lockBoard(true);
  // Medium/Hard are deterministic, so the "decision" can be shown honestly: a
  // faint pulse on the cell being settled on resolves into the move when the
  // think-delay ends. Easy stays instant/random — there is no strategy to
  // visualize (suggestion 02 item 1).
  const planned =
    state.difficulty !== 'easy' ? aiMove(state.board, 'O', state.difficulty, state.misere) : null;
  if (planned !== null && planned !== undefined) {
    els.board.children[planned].classList.add('cell--think');
  }
  state.aiTimer = setTimeout(() => {
    state.aiTimer = null;
    clearThinkPulse();
    if (state.screen !== 'playing' || !isAiTurnNow()) return;
    const move =
      planned !== null && planned !== undefined
        ? planned
        : aiMove(state.board, 'O', state.difficulty, state.misere);
    if (move === null || move === undefined) return;
    lockBoard(false);
    play(move);
  }, GAME_CONFIG.aiThinkDelayMs);
}

/* ---- online duel (plan/18 phase 5) ------------------------------------------- */
/* Server-authoritative matches (backend /tictactoe): the board only changes
 * via POST move, and both players sync the authoritative state with the same
 * 3-second poll the duels use. One round per match; rematch = new match. */

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
    onlineApi('/tictactoe/' + state.online.code + '/leave', {
      playerName: onlinePlayerName(),
      guestId: onlineGuestId(),
    }).catch(() => undefined);
  }
  stopOnlinePoll();
  state.online = null;
}

function onlineCreate() {
  onlineStatus('Creating the match…');
  onlineApi('/tictactoe', {
    playerName: onlinePlayerName(),
    guestId: onlineGuestId(),
    misere: state.misere,
  })
    .then(({ code }) => {
      state.online = { code, mark: 'X', pollTimer: null, oName: null, busy: false };
      const link = 'https://pigzap.com/games/tic-tac-toe/?ttt=' + code;
      onlineStatus('Match ' + code + ' — waiting for a challenger. Send: ' + link);
      if (navigator.share) {
        navigator
          .share({ title: 'Tic Tac Toe duel', text: 'Duel me — match ' + code, url: link })
          .catch(() => undefined);
      }
      state.online.pollTimer = setInterval(pollOnline, 3000);
    })
    .catch(() => onlineStatus('Could not create the match — check your connection.'));
}

function onlineJoin(code) {
  if (!code) return;
  onlineStatus('Joining ' + code + '…');
  onlineApi('/tictactoe/' + encodeURIComponent(code) + '/join', {
    playerName: onlinePlayerName(),
    guestId: onlineGuestId(),
  })
    .then((view) => {
      state.online = {
        code: view.code,
        mark: view.yourMark,
        pollTimer: null,
        xName: view.xName,
        oName: view.oName,
        busy: false,
      };
      if (view.status === 'waiting') {
        onlineStatus('Joined as ⭕ — waiting for X to be claimed…');
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
    '/tictactoe/' +
      encodeURIComponent(state.online.code) +
      '?guestId=' +
      encodeURIComponent(onlineGuestId())
  )
    .then((view) => {
      if (!state.online) return;
      state.online.xName = view.xName;
      state.online.oName = view.oName;
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
  els.board.classList.remove('board--deal');
  void els.board.offsetWidth;
  els.board.classList.add('board--deal');
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
  onlineApi('/tictactoe/' + encodeURIComponent(state.online.code) + '/move', {
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
  else if (winner === 'X') state.series.x++;
  else state.series.o++;
  saveSeries(currentSetupKey(), state.series);

  if (view.winningLine) highlightWin(view.winningLine);
  renderMiniSeries();
  if (youWon) vibrate([40, 60, 40]);

  const oppName = state.online.mark === 'X' ? view.oName : view.xName;
  setTimeout(() => {
    els.overlayEmoji.textContent = isDraw ? '🤝' : youWon ? '🎉' : '😬';
    els.overlayTitle.textContent = isDraw
      ? 'Draw 🤝'
      : youWon
        ? 'You win! 🎉'
        : (oppName || 'Opponent') + ' wins';
    els.overlayTitle.dataset.mark = isDraw ? '' : winner || '';
    const seriesLine =
      'Series — ✕ ' + state.series.x + ' · ◯ ' + state.series.o + ' · 🤝 ' + state.series.draw;
    els.overlaySub.textContent = seriesLine;
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

  // Series tally (misère flips who actually won the round).
  if (isDraw) state.series.draw++;
  else if (winner === 'X') state.series.x++;
  else state.series.o++;
  saveSeries(currentSetupKey(), state.series);

  // Next starter: loser opens the rematch; a draw flips the opener.
  if (isDraw) state.starter = other(state.starter);
  else state.starter = other(winner);

  if (!isDraw) highlightWin(outcome.line);
  renderMiniSeries(); // top-bar tally must move the moment the round ends
  if (!isDraw && (state.mode === '2p' || winner === 'X')) vibrate([40, 60, 40]);

  setTimeout(() => showOverlay(isDraw, winner), 650); // let the winning-line highlight land first
}

function showOverlay(isDraw, winner) {
  let title;
  let emoji;
  let sub;
  if (isDraw) {
    title = 'Draw 🤝';
    emoji = '🤝';
    sub = 'Nobody blinked. Run it back?';
  } else {
    title = winner + ' wins! 🎉';
    emoji = winner === 'X' ? '❌' : '⭕';
    if (state.misere) {
      sub = other(winner) + ' completed three in a row — misère rules say that loses.';
    } else if (state.mode === '1p') {
      sub = winner === 'X' ? 'You beat the computer!' : 'The computer takes it. Rematch?';
    } else {
      sub = '';
    }
  }
  els.overlayEmoji.textContent = emoji;
  els.overlayTitle.textContent = title;
  const seriesLine =
    'Series — ✕ ' + state.series.x + ' · ◯ ' + state.series.o + ' · 🤝 ' + state.series.draw;
  els.overlaySub.textContent = (sub ? sub + ' ' : '') + seriesLine;
  els.overlayTitle.dataset.mark = isDraw ? '' : winner;
  els.overlay.classList.remove('hidden');
  els.overlay.classList.add('overlay--in');
  // One-time softening: first loss-or-draw vs Hard AI points at Medium
  // (suggestion 02 item 2) — lifetime per device, never on other setups.
  if (
    hardAiToastDue({
      mode: state.mode,
      difficulty: state.difficulty,
      winner,
      isDraw,
      seen: getHardAiToastSeen(),
    })
  ) {
    markHardAiToastSeen();
    toast(t('hardAiToast'));
  }
  document.getElementById('btn-next').focus();
}

/* ---- share (plan §6) ----------------------------------------------------------- */

function shareText() {
  const url = 'https://pigzap.com/games/tic-tac-toe/';
  const score = '✕ ' + state.series.x + ' · ◯ ' + state.series.o + ' · draws ' + state.series.draw;
  if (state.mode === '2p') {
    return t('share2p', { score, url });
  }
  let setup = 'Tic Tac Toe vs the computer (' + state.difficulty + ')';
  if (state.misere) setup += ', misère';
  return t('share1p', { setup, score, url });
}

function shareUrls() {
  const url = 'https://pigzap.com/games/tic-tac-toe/';
  const text = shareText();
  const textNoUrl = text.split(url).join('').replace(/\s+/g, ' ').trim();
  const fb = document.getElementById('share-fb');
  fb.href =
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

/* ---- keyboard a11y: roving focus on the board ------------------------------------ */

function handleBoardKeys(e) {
  const cells = els.board.children;
  const index = Array.prototype.indexOf.call(cells, document.activeElement);
  const from = index === -1 ? 0 : index;
  const map = { ArrowUp: from - 3, ArrowDown: from + 3, ArrowLeft: from - 1, ArrowRight: from + 1 };
  if (e.key in map) {
    e.preventDefault();
    let next = map[e.key];
    if (next < 0) next += 9;
    if (next > 8) next -= 9;
    cells[next].focus();
  }
}

/* ---- wiring ------------------------------------------------------------------------ */

function buildBoard() {
  els.board.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'cell';
    cell.dataset.index = String(i);
    cell.setAttribute(
      'aria-label',
      'Row ' + (Math.floor(i / 3) + 1) + ', column ' + ((i % 3) + 1) + ', empty'
    );
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

function saveMenuPrefs() {
  savePrefs({ mode: state.mode, level: state.difficulty, misere: state.misere });
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
  els.misereBadge = document.getElementById('misere-badge');
  els.seriesScope = document.getElementById('series-scope');
  els.seriesX = document.getElementById('series-x');
  els.seriesO = document.getElementById('series-o');
  els.seriesDraw = document.getElementById('series-draw');
  els.resetSeriesBtn = document.getElementById('reset-series');
  els.difficultyRow = document.getElementById('difficulty-row');
  els.onlineRow = document.getElementById('online-row');
  els.onlineName = document.getElementById('online-name');
  els.onlineCode = document.getElementById('online-code');
  els.onlineStatus = document.getElementById('online-status');
  els.btnPlay = document.getElementById('btn-play');
  els.toast = document.getElementById('toast');

  buildBoard();

  const applyModeUi = (mode) => {
    els.difficultyRow.classList.toggle('hidden', mode !== '1p');
    els.onlineRow.classList.toggle('hidden', mode !== 'online');
    els.btnPlay.classList.toggle('hidden', mode === 'online');
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
  document.getElementById('misere-toggle').addEventListener('change', (e) => {
    state.misere = e.target.checked;
    refreshSeriesFromStorage();
    renderSeriesCard();
    saveMenuPrefs();
  });

  document.getElementById('btn-play').addEventListener('click', () => {
    refreshSeriesFromStorage();
    showScreen('playing');
    startRound();
  });
  els.btnOnlineCreate = document.getElementById('btn-online-create');
  els.btnOnlineCreate.addEventListener('click', onlineCreate);
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
  // BUG (2026-09-25 audit): btn-menu clears state.aiTimer on the way out of
  // play; this round-overlay path did not — same treatment here.
  document.getElementById('btn-menu2').addEventListener('click', () => {
    if (state.mode === 'online') leaveOnlineToMenu();
    if (state.aiTimer) {
      clearTimeout(state.aiTimer);
      state.aiTimer = null;
    }
    showScreen('menu');
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
    placeMark(Number(cell.dataset.index));
  });
  els.board.addEventListener('keydown', handleBoardKeys);

  // Pausing mid-AI-turn drops the pending move; reschedule on return, or the
  // human would come back to a board that can never be played.
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
      els.overlay.classList.contains('hidden')
    ) {
      scheduleAiMove();
    }
  });

  // Restore the menu exactly as the player left it (plan §5 prefs model).
  const prefs = loadPrefs();
  if (prefs) {
    state.mode = prefs.mode;
    state.difficulty = prefs.level;
    state.misere = prefs.misere;
    applyModeUi(state.mode);
    syncSegmented(document.getElementById('mode-segmented'), 'data-mode', state.mode);
    syncSegmented(
      document.getElementById('difficulty-segmented'),
      'data-difficulty',
      state.difficulty
    );
    document.getElementById('misere-toggle').checked = state.misere;
  }

  refreshSeriesFromStorage();
  renderSeriesCard();
  showScreen('menu');

  // plan/18 phase 5: ?ttt=CODE deep link — flip to online mode with the code
  // prefilled (name remembered from a previous duel when available).
  const tttCode = new URLSearchParams(window.location.search).get('ttt');
  if (tttCode) {
    state.mode = 'online';
    applyModeUi('online');
    syncSegmented(document.getElementById('mode-segmented'), 'data-mode', 'online');
    renderSeriesCard();
    els.onlineCode.value = tttCode.toUpperCase().slice(0, 6);
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

/* BUG-048: share-count pings (prod API; fire-and-forget, best-effort). */
(function () {
  var API = 'https://api.pigzap.com/api/v1/share-counts';
  var SLUG = 'tic-tac-toe';
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
