/**
 * ============================================================================
 * game.js — Rock Paper Scissors, best-of-5 (plan/games/07) — UI shell
 * ============================================================================
 * Plain ESM, no build step (the games convention). The pure model lives in
 * core.js (jest-tested), persistence in storage.js, flags/strings in
 * config.js. This file is screens + DOM wiring; it auto-inits only when its
 * table exists in the DOM.
 *
 * Modes (the family template): solo vs computer (easy/medium/hard), 2-player
 * hot-seat, and ⚔️ online duels — where picks are SIMULTANEOUS: the server
 * resolves the round only when both throws are locked and reveals them
 * together (no second-mover cheating). Deep link: ?rps=CODE.
 * Marks: 1 = 🔴 Red (creator), 2 = 🔵 Blue.
 * ============================================================================
 */

import {
  LABELS,
  GLYPHS,
  DEFAULT_TARGET,
  createState,
  applyRound,
  isMatchWon,
  aiPick,
} from './core.js?v=1';
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
 * UI — auto-inits only when the table exists (never under jest/node)
 * ======================================================================= */

const state = {
  screen: 'menu',
  mode: '1p', // '1p' | '2p' | 'online'
  difficulty: 'medium',
  match: createState(), // { wins: [you, them], history, lastRound, target }
  roundNo: 1,
  locked: false,
  pending: null, // hot-seat: the throw locked in, waiting for the second player
  rName: 'Red',
  bName: 'Computer',
  series: emptyTally(),
  aiTimer: null,
  // plan/games/07: live online duel — server-resolved, 3-s poll.
  online: null, // { code, mark, pollTimer, busy }
};

const els = {};

function currentSetupKey() {
  return seriesSetupKey(state.mode, state.difficulty);
}

const myMark = () => (state.mode === 'online' && state.online ? state.online.mark : 1);
const opponentLabel = () => (state.mode === '1p' ? '💻 Computer' : state.bName || 'Blue');

/** Whose throw is due: hot-seat tracks the locked throw; online asks the
 *  server who is up. */
function whoseThrow() {
  if (state.mode === 'online') {
    return state.online && state.online.myTurn ? myMark() : state.pendingBy || 1;
  }
  return state.pending ? (state.pending.by === 1 ? 2 : 1) : 1;
}

/* ---- screens -------------------------------------------------------------- */

function showScreen(name) {
  state.screen = name;
  els.screenMenu.classList.toggle('screen--active', name === 'menu');
  els.screenPlaying.classList.toggle('screen--active', name === 'playing');
  if (name === 'menu') renderSeriesCard();
}

function renderSeriesCard() {
  let scope =
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

function renderMiniSeries() {
  els.miniSeries.textContent =
    '🔴 ' + state.series.r + ' · 🤝 ' + state.series.draw + ' · 🔵 ' + state.series.b;
}

/* ---- table rendering --------------------------------------------------------- */

function renderTable() {
  els.score1.textContent = String(state.match.wins[0]);
  els.score2.textContent = String(state.match.wins[1]);
  const last = state.match.lastRound;
  els.glyphYou.textContent = last ? GLYPHS[last.you] : '✊';
  els.glyphThem.textContent = last ? GLYPHS[last.them] : whoseThrow() === myMark() ? '✋' : '✌️';
  els.themWho.textContent = opponentLabel();

  let turnText;
  if (state.match.wins[0] >= state.match.target || state.match.wins[1] >= state.match.target) {
    turnText = 'Match over';
  } else if (state.mode === '1p') {
    turnText = 'Round ' + state.roundNo + ' — throw!';
  } else if (state.mode === '2p') {
    turnText =
      'Round ' + state.roundNo + ' — ' + (whoseThrow() === 1 ? '🔴 Red throws' : '🔵 Blue throws');
  } else {
    turnText =
      whoseThrow() === myMark()
        ? 'Round ' + state.roundNo + ' — your throw (locked in when both are in)'
        : 'Round ' + state.roundNo + ' — waiting for your opponent to throw…';
  }
  els.turn.textContent = turnText;

  const canThrow = !state.locked && whoseThrow() === myMark();
  for (const btn of els.throws) btn.disabled = !canThrow;

  const notice = state.notice || '';
  els.notice.textContent = notice;
  els.notice.className = 'notice' + (notice ? ' notice--bank' : '');
}

/* ---- local match flow --------------------------------------------------------- */

function myThrow(throw_) {
  if (state.locked || whoseThrow() !== myMark()) return;
  if (state.mode === 'online') {
    onlinePick(throw_);
    return;
  }
  if (state.mode === '2p') {
    // hot-seat: the first throw LOCKS, the second resolves the round
    if (!state.pending) {
      state.pending = { by: 1, throw_ };
      state.notice = '🔴 Red locked in — 🔵 Blue to throw';
      renderTable();
      return;
    }
    const first = state.pending;
    state.pending = null;
    const red = first.by === 1 ? first.throw_ : throw_;
    const blue = first.by === 2 ? first.throw_ : throw_;
    const r = applyRound(state.match, red, blue);
    state.match = r.state;
    state.notice = describeRound(r.result, red, blue);
    if (isMatchWon(state.match.wins, state.match.target)) {
      finishLocal(r.result === 'you');
      return;
    }
    state.roundNo += 1;
    renderTable();
    return;
  }
  // solo: my throw against the computer's read of the history
  const their = aiPick(state.match.history, state.difficulty);
  const r = applyRound(state.match, throw_, their);
  state.match = r.state;
  state.notice = describeRound(r.result, throw_, their);
  if (isMatchWon(state.match.wins, state.match.target)) {
    finishLocal(r.result === 'you');
    return;
  }
  state.roundNo += 1;
  renderTable();
  scheduleAi();
}

function describeRound(result, you, them) {
  if (result === 'tie') return `🤝 Tie — ${LABELS[you]} vs ${LABELS[them]}`;
  const winnerLabel =
    result === 'you' ? 'You win' : state.mode === '1p' ? 'Computer wins' : 'Blue wins';
  const w = result === 'you' ? you : them;
  const l = result === 'you' ? them : you;
  return `${result === 'you' ? '🎉' : '😬'} ${winnerLabel} — ${LABELS[w]} beats ${LABELS[l]}`;
}

function scheduleAi() {
  els.thinkingBadge.classList.remove('hidden');
  state.aiTimer = setTimeout(() => {
    state.aiTimer = null;
    els.thinkingBadge.classList.add('hidden');
    if (state.screen !== 'playing' || state.locked) return;
    if (state.mode === '2p') return; // hot-seat is fully manual
    myThrow(aiPick(state.match.history, state.difficulty));
  }, GAME_CONFIG.aiThinkDelayMs);
}

function finishLocal(iWon) {
  state.locked = true;
  if (iWon) state.series.r++;
  else state.series.b++;
  saveSeries(currentSetupKey(), state.series);
  renderTable();
  renderMiniSeries();
  showOverlay(iWon);
}

/* ---- round overlay -------------------------------------------------------------- */

function showOverlay(youWon) {
  els.overlayEmoji.textContent = youWon ? '🎉' : '😬';
  els.overlayTitle.textContent = youWon
    ? 'You win!'
    : state.mode === '1p'
      ? 'Computer wins'
      : 'Blue wins';
  els.overlaySub.textContent =
    'Series — 🔴 ' + state.series.r + ' · 🔵 ' + state.series.b + ' · 🤝 ' + state.series.draw;
  els.overlay.classList.remove('hidden');
  document.getElementById('btn-next').focus();
}

/* ---- online duel (plan/games/07) -------------------------------------------------- */
/* Simultaneous throws: your pick locks server-side and stays hidden until the
 * opponent throws too; the server then reveals both and scores the round.
 * Deep link: ?rps=CODE. */

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
    onlineApi('/rock-paper-scissors/' + state.online.code + '/leave', {
      playerName: onlinePlayerName(),
      guestId: onlineGuestId(),
    }).catch(() => undefined);
  }
  stopOnlinePoll();
  state.online = null;
}

function onlineCreate() {
  onlineStatus('Creating the match…');
  onlineApi('/rock-paper-scissors', { playerName: onlinePlayerName(), guestId: onlineGuestId() })
    .then(({ code }) => {
      state.online = { code, mark: 1, pollTimer: null, busy: false, myTurn: true };
      const link = 'https://pigzap.com/games/rock-paper-scissors/?rps=' + code;
      onlineStatus('Match ' + code + ' — waiting for a challenger. Send: ' + link);
      if (navigator.share) {
        navigator
          .share({ title: 'RPS duel', text: 'First to three — match ' + code, url: link })
          .catch(() => undefined);
      }
      refreshSeriesFromStorage();
      showScreen('playing');
      startRound();
      startOnlinePoll();
    })
    .catch(() => onlineStatus('Could not create the match — check your connection.'));
}

function onlineJoin(code) {
  if (!code) return;
  onlineStatus('Joining ' + code + '…');
  onlineApi('/rock-paper-scissors/' + encodeURIComponent(code) + '/join', {
    playerName: onlinePlayerName(),
    guestId: onlineGuestId(),
  })
    .then((view) => {
      state.online = {
        code: view.code,
        mark: view.yourMark,
        pollTimer: null,
        busy: false,
        myTurn: view.theirPending === false && view.yourPending === false,
      };
      refreshSeriesFromStorage();
      showScreen('playing');
      applyOnlineView(view);
      startOnlinePoll();
    })
    .catch((e) => onlineStatus('Join failed: ' + (e.message || 'try again')));
}

function startOnlinePoll() {
  if (state.online && !state.online.pollTimer) {
    state.online.pollTimer = setInterval(pollOnline, 3000);
  }
}

function pollOnline() {
  if (!state.online || state.online.busy) return;
  onlineApi(
    '/rock-paper-scissors/' +
      encodeURIComponent(state.online.code) +
      '?guestId=' +
      encodeURIComponent(onlineGuestId())
  )
    .then((view) => {
      if (!state.online) return;
      applyOnlineView(view);
    })
    .catch(() => undefined);
}

function applyOnlineView(view) {
  const isRed = view.yourMark === 1;
  state.rName = view.rName || 'Red';
  state.bName = view.bName || 'Blue';
  state.match = {
    wins: isRed ? [view.yourWins, view.theirWins] : [view.theirWins, view.yourWins],
    history: state.match.history,
    lastRound: view.lastRound,
    target: view.target || DEFAULT_TARGET,
  };
  state.roundNo = view.round;
  if (state.online) state.online.myTurn = !view.theirPending;
  if (view.lastRound) {
    const r = view.lastRound;
    const youWon = r.result === (isRed ? 'R' : 'Y');
    state.notice = describeRound(youWon ? 'you' : 'them', r.you, r.them);
  } else if (view.theirPending && state.online && !view.yourPending) {
    state.notice = '🔒 Your throw is in — waiting for the reveal';
  } else if (view.yourPending) {
    state.notice = '🔒 Thrown — waiting for your opponent';
  } else {
    state.notice = '';
  }
  renderTable();
  if (view.status === 'finished' && !state.locked) {
    state.locked = true;
    const youWon = view.winner === view.yourMark;
    if (youWon) state.series.r++;
    else if (view.winner === 0) state.series.draw++;
    else state.series.b++;
    saveSeries(currentSetupKey(), state.series);
    renderMiniSeries();
    showOverlay(youWon);
    stopOnlinePoll();
  }
}

function onlinePick(throw_) {
  if (!state.online || state.online.busy || !state.online.myTurn) return;
  state.online.busy = true;
  onlineApi('/rock-paper-scissors/' + encodeURIComponent(state.online.code) + '/pick', {
    guestId: onlineGuestId(),
    pick: throw_,
  })
    .then((view) => {
      if (state.online) state.online.busy = false;
      applyOnlineView(view);
    })
    .catch(() => {
      if (state.online) state.online.busy = false;
      toast('Throw rejected — try again');
    });
}

/* ---- toast / vibrate -------------------------------------------------------------- */

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

/* ---- wiring ------------------------------------------------------------------------- */

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

function applyModeUi(mode) {
  els.difficultyRow.classList.toggle('hidden', mode !== '1p');
  els.onlineRow.classList.toggle('hidden', mode !== 'online');
  els.btnPlay.classList.toggle('hidden', mode === 'online');
}

function saveMenuPrefs() {
  savePrefs({ mode: state.mode, difficulty: state.difficulty });
}

function startRound() {
  state.match = createState();
  state.roundNo = 1;
  state.locked = false;
  state.pending = null;
  state.notice = '';
  if (state.mode !== 'online') {
    state.rName = 'Red';
    state.bName = state.mode === '1p' ? 'Computer' : 'Blue';
  }
  if (state.aiTimer) {
    clearTimeout(state.aiTimer);
    state.aiTimer = null;
  }
  els.thinkingBadge.classList.add('hidden');
  renderTable();
}

function init() {
  els.screenMenu = document.getElementById('screen-menu');
  els.screenPlaying = document.getElementById('screen-playing');
  els.turn = document.getElementById('turn');
  els.glyphYou = document.getElementById('glyph-you');
  els.glyphThem = document.getElementById('glyph-them');
  els.themWho = document.getElementById('them-who');
  els.score1 = document.getElementById('score-1');
  els.score2 = document.getElementById('score-2');
  els.notice = document.getElementById('notice');
  els.overlay = document.getElementById('overlay');
  els.overlayEmoji = document.getElementById('overlay-emoji');
  els.overlayTitle = document.getElementById('overlay-title');
  els.overlaySub = document.getElementById('overlay-sub');
  els.throws = Array.from(document.querySelectorAll('.throws button'));
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
  els.thinkingBadge = document.getElementById('thinking-badge');
  els.btnPlay = document.getElementById('btn-play');
  els.toast = document.getElementById('toast');

  const prefs = loadPrefs();
  state.mode = prefs.mode;
  state.difficulty = prefs.difficulty;

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
      els.thinkingBadge.classList.add('hidden');
    }
    showScreen('menu');
  });
  document.getElementById('btn-next').addEventListener('click', () => {
    if (state.mode === 'online') {
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
      els.thinkingBadge.classList.add('hidden');
    }
    showScreen('menu');
  });
  els.resetSeriesBtn.addEventListener('click', () => {
    state.series = emptyTally();
    saveSeries(currentSetupKey(), state.series);
    renderSeriesCard();
    renderMiniSeries();
  });

  for (const btn of els.throws) {
    btn.addEventListener('click', () => myThrow(btn.getAttribute('data-throw')));
  }

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

  // plan/games/07: ?rps=CODE deep link
  const rpsCode = new URLSearchParams(window.location.search).get('rps');
  if (rpsCode) {
    state.mode = 'online';
    applyModeUi('online');
    syncSegmented(document.getElementById('mode-segmented'), 'data-mode', 'online');
    renderSeriesCard();
    els.onlineCode.value = rpsCode.toUpperCase().slice(0, 6);
    try {
      els.onlineName.value = localStorage.getItem('pigzap:challenge-name') || '';
    } catch {
      /* private mode */
    }
    onlineStatus('Match ' + els.onlineCode.value + ' ready — press Join.');
  }
}

if (typeof document !== 'undefined' && document.getElementById('glyph-you')) {
  init();
}
