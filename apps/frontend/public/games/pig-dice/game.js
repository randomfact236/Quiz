/**
 * ============================================================================
 * game.js — Pig Dice, push-your-luck (plan/games/05-pig-dice.md) — UI shell
 * ============================================================================
 * Plain ESM, no build step (the games convention). The pure model lives in
 * core.js (jest-tested), persistence in storage.js, flags/strings in
 * config.js. This file is screens + DOM wiring; it auto-inits only when its
 * table exists in the DOM.
 *
 * Modes (the family template): solo vs computer (easy/medium/hard), 2-player
 * hot-seat, and ⚔️ online duels on the server-authoritative backend — where
 * the SERVER rolls every die (crypto RNG) so neither player can influence it.
 * Deep link: ?pd=CODE. Marks: 1 = 🔴 Red (creator, opens), 2 = 🔵 Blue.
 * ============================================================================
 */

import {
  TARGETS,
  DEFAULT_TARGET,
  createState,
  other,
  applyRoll,
  applyHold,
  aiAction,
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

const DIE_FACES = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

/* ==========================================================================
 * UI — auto-inits only when the table exists (never under jest/node)
 * ======================================================================= */

const state = {
  screen: 'menu',
  mode: '1p', // '1p' | '2p' | 'online'
  difficulty: 'medium',
  target: DEFAULT_TARGET,
  match: createState(DEFAULT_TARGET), // { scores: [r, y], pot, turn, target }
  locked: false, // a finished match locks the buttons
  rName: 'Red',
  bName: 'Blue',
  lastRoll: null, // pips of the last roll (display)
  notice: '', // '' | { text, cls }
  series: emptyTally(),
  aiTimer: null,
  // plan/games/05: live online duel — the server rolls, 3-s poll.
  online: null, // { code, mark, pollTimer, busy }
};

const els = {};

function currentSetupKey() {
  return seriesSetupKey(state.mode, state.difficulty);
}

const myMark = () => (state.mode === 'online' && state.online ? state.online.mark : 1);
const randomPip = () => 1 + Math.floor(Math.random() * 6);

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
  els.seriesScope.textContent = scope + ' · to ' + state.target;
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
  els.die.textContent = state.lastRoll ? DIE_FACES[state.lastRoll] : '🎲';
  els.pot.textContent = String(state.match.pot);
  els.score1.textContent = String(state.match.scores[0]);
  els.score2.textContent = String(state.match.scores[1]);

  const turn = state.match.turn;
  const mine = state.mode === 'online' ? turn === myMark() : turn === 1;
  let turnText;
  if (state.mode === '1p') {
    turnText = turn === 1 ? "Your turn — you're 🔴" : 'Computer is deciding…';
  } else if (state.mode === '2p') {
    turnText = turn === 1 ? '🔴 Red to play' : '🔵 Blue to play';
  } else {
    const oppName = turn === 1 ? els.rName : els.bName;
    turnText = mine
      ? 'Your turn — you are ' + (turn === 1 ? '🔴' : '🔵')
      : (oppName || 'Your opponent') + ' is deciding…';
  }
  els.turn.textContent = turnText;
  els.turn.dataset.mark = String(turn);

  els.notice.textContent = state.notice ? state.notice.text : '';
  els.notice.className =
    'notice' + (state.notice && state.notice.cls ? ' ' + state.notice.cls : '');

  const canAct = state.match.turn === myMark() || (state.mode === '2p' && true);
  els.btnRoll.disabled = !canAct;
  els.btnHold.disabled = !canAct;
}

/* ---- local match flow --------------------------------------------------------- */

function myAction(action) {
  if (state.mode === 'online') {
    onlineMove(action);
    return;
  }
  if (state.mode === '1p' && state.match.turn !== 1) return; // computer's turn
  if (action === 'roll') {
    const r = applyRoll(state.match, randomPip());
    state.match = r.state;
    state.lastRoll = r.pips;
    state.notice = r.busted
      ? { text: '🎲 Rolled a 1 — pot lost!', cls: 'notice--bust' }
      : { text: 'Rolled ' + r.pips, cls: '' };
  } else {
    const h = applyHold(state.match);
    state.match = h.state;
    state.lastRoll = null;
    state.notice = { text: '✋ Held for ' + h.banked, cls: 'notice--bank' };
    if (h.won) {
      finishLocal(myMark());
      return;
    }
  }
  renderTable();
  if (state.mode === '1p' && state.match.turn === 2) scheduleAi();
}

function scheduleAi() {
  els.thinkingBadge.classList.remove('hidden');
  state.aiTimer = setTimeout(() => {
    state.aiTimer = null;
    els.thinkingBadge.classList.add('hidden');
    if (state.screen !== 'playing' || state.match.turn !== 2) return;
    if (aiAction(state.match, 2, state.difficulty) === 'hold') {
      const h = applyHold(state.match);
      state.match = h.state;
      state.lastRoll = null;
      state.notice = { text: `💻 Computer held for ${h.banked}`, cls: 'notice--bank' };
      if (h.won) {
        finishLocal(2);
        return;
      }
    } else {
      const r = applyRoll(state.match, randomPip());
      state.match = r.state;
      state.lastRoll = r.pips;
      state.notice = r.busted
        ? { text: '🎲 Computer rolled a 1 — their pot is gone', cls: 'notice--bust' }
        : { text: `💻 Computer rolled ${r.pips}`, cls: '' };
    }
    renderTable();
    // a non-1 roll KEEPS the turn — the computer must decide again (hold once
    // the pot builds). Without this the match freezes on the computer's turn
    // (found by the browser play-through).
    if (state.match.turn === 2) scheduleAi();
  }, GAME_CONFIG.aiThinkDelayMs);
}

/** `winnerMark` — the side that reached the target. */
function finishLocal(winnerMark) {
  if (winnerMark === 1) state.series.r++;
  else if (winnerMark === 2) state.series.b++;
  else state.series.draw++;
  saveSeries(currentSetupKey(), state.series);
  renderTable();
  renderMiniSeries();
  // online: "you" is your mark; local: the human always plays 🔴
  const youWon = state.mode === 'online' ? winnerMark === myMark() : winnerMark === 1;
  showOverlay(youWon, winnerMark);
}

/* ---- round overlay -------------------------------------------------------------- */

function showOverlay(youWon, winnerMark) {
  els.overlayEmoji.textContent = youWon ? '🎉' : '😬';
  els.overlayTitle.textContent = (winnerMark === 1 ? '🔴 Red' : '🔵 Blue') + ' wins!';
  els.overlaySub.textContent =
    'Series — 🔴 ' + state.series.r + ' · 🔵 ' + state.series.b + ' · 🤝 ' + state.series.draw;
  els.overlay.classList.remove('hidden');
  document.getElementById('btn-next').focus();
}

/* ---- online duel (plan/games/05) -------------------------------------------------- */
/* Server-authoritative: the client sends roll/hold only — the SERVER produces
 * the pips (crypto RNG), so the match outcome is provably fair. Deep link: ?pd=CODE. */

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

/** The server-signed guest pair (HARD-03) — every guest write carries it. */
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
    onlineApi('/pig-dice/' + state.online.code + '/leave', {
      playerName: onlinePlayerName(),
      guestId: onlineGuestId(),
    }).catch(() => undefined);
  }
  stopOnlinePoll();
  state.online = null;
}

function onlineCreate() {
  onlineStatus('Creating the match…');
  onlineApi('/pig-dice', {
    playerName: onlinePlayerName(),
    guestId: onlineGuestId(),
    target: state.target,
  })
    .then(({ code }) => {
      state.online = { code, mark: 1, pollTimer: null, busy: false };
      const link = 'https://pigzap.com/games/pig-dice/?pd=' + code;
      onlineStatus('Match ' + code + ' — waiting for a challenger. Send: ' + link);
      if (navigator.share) {
        navigator
          .share({ title: 'Pig Dice duel', text: 'Beat me at Pig — match ' + code, url: link })
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
  onlineApi('/pig-dice/' + encodeURIComponent(code) + '/join', {
    playerName: onlinePlayerName(),
    guestId: onlineGuestId(),
  })
    .then((view) => {
      state.online = { code: view.code, mark: view.yourMark, pollTimer: null, busy: false };
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
    '/pig-dice/' +
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
  state.match = {
    scores: isRed ? [view.yourScore, view.theirScore] : [view.theirScore, view.yourScore],
    pot: view.pot,
    turn: view.turn,
    target: view.target,
  };
  els.rName = view.rName || 'Red';
  els.bName = view.bName || 'Blue';
  state.lastRoll = view.lastRoll ?? null;
  if (view.lastRoll === 1)
    state.notice = { text: '🎲 A 1 — that pot is gone', cls: 'notice--bust' };
  renderTable();
  if (view.status === 'finished' && !state.locked) {
    state.locked = true;
    const youWon = view.winner === view.yourMark;
    if (youWon) state.series.r++;
    else if (view.winner === 0) state.series.draw++;
    else state.series.b++;
    saveSeries(currentSetupKey(), state.series);
    renderMiniSeries();
    showOverlay(youWon, view.winner === 1 ? 1 : 2);
    stopOnlinePoll();
  }
}

function onlineMove(action) {
  if (!state.online || state.online.busy) return;
  if (state.match.turn !== state.online.mark) return;
  state.online.busy = true;
  els.die.classList.add('die--rolling');
  onlineApi('/pig-dice/' + encodeURIComponent(state.online.code) + '/move', {
    guestId: onlineGuestId(),
    action,
  })
    .then((view) => {
      if (state.online) state.online.busy = false;
      els.die.classList.remove('die--rolling');
      applyOnlineView(view);
    })
    .catch(() => {
      if (state.online) state.online.busy = false;
      els.die.classList.remove('die--rolling');
      toast('Move rejected — try again');
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
  savePrefs({ mode: state.mode, difficulty: state.difficulty, target: state.target });
}

function startRound() {
  state.match = createState(state.target);
  state.lastRoll = null;
  state.notice = '';
  state.locked = false;
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
  els.die = document.getElementById('die');
  els.pot = document.getElementById('pot');
  els.score1 = document.getElementById('score-1');
  els.score2 = document.getElementById('score-2');
  els.notice = document.getElementById('notice');
  els.turn = document.getElementById('turn');
  els.overlay = document.getElementById('overlay');
  els.overlayEmoji = document.getElementById('overlay-emoji');
  els.overlayTitle = document.getElementById('overlay-title');
  els.overlaySub = document.getElementById('overlay-sub');
  els.btnRoll = document.getElementById('btn-roll');
  els.btnHold = document.getElementById('btn-hold');
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

  // Restore the menu exactly as the player left it.
  const prefs = loadPrefs();
  state.mode = prefs.mode;
  state.difficulty = prefs.difficulty;
  state.target = prefs.target ?? DEFAULT_TARGET;

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
  bindSegmented(document.getElementById('target-segmented'), 'data-target', (raw) => {
    const target = Number(raw);
    if (!TARGETS.includes(target) || target === state.target) return;
    state.target = target;
    refreshSeriesFromStorage();
    renderSeriesCard();
    saveMenuPrefs();
    if (state.screen === 'playing') startRound();
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

  els.btnRoll.addEventListener('click', () => myAction('roll'));
  els.btnHold.addEventListener('click', () => myAction('hold'));

  applyModeUi(state.mode);
  syncSegmented(document.getElementById('mode-segmented'), 'data-mode', state.mode);
  syncSegmented(
    document.getElementById('difficulty-segmented'),
    'data-difficulty',
    state.difficulty
  );
  syncSegmented(document.getElementById('target-segmented'), 'data-target', String(state.target));

  refreshSeriesFromStorage();
  renderSeriesCard();
  showScreen('menu');

  // plan/games/05: ?pd=CODE deep link
  const pdCode = new URLSearchParams(window.location.search).get('pd');
  if (pdCode) {
    state.mode = 'online';
    applyModeUi('online');
    syncSegmented(document.getElementById('mode-segmented'), 'data-mode', 'online');
    renderSeriesCard();
    els.onlineCode.value = pdCode.toUpperCase().slice(0, 6);
    try {
      els.onlineName.value = localStorage.getItem('pigzap:challenge-name') || '';
    } catch {
      /* private mode */
    }
    onlineStatus('Match ' + els.onlineCode.value + ' ready — press Join.');
  }
}

if (typeof document !== 'undefined' && document.getElementById('die')) {
  init();
}
