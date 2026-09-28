/**
 * ============================================================================
 * game.js — Dots and Boxes (plan/games/03-dots-and-boxes.md) — UI shell
 * ============================================================================
 * Plain ESM, no build step (the games convention). The pure model lives in
 * core.js (jest-tested), persistence in storage.js, flags/strings in
 * config.js. This file is screens + DOM wiring; it auto-inits only when its
 * board exists in the DOM.
 *
 * The board is one SVG: dots at odd lattice points, a fat line per drawn
 * edge, a translucent fill per claimed box, and a transparent fat line per
 * edge as the tap target (data-edge → the model's edge index).
 *
 * Modes (the family template): solo vs computer (easy/medium/hard), 2-player
 * hot-seat, and ⚔️ online duels — server-authoritative moves, 3-second poll
 * (the /dots-and-boxes backend, cloned from /tictactoe). Deep link: ?dbb=CODE.
 * Marks: 1 = 🔴 Red (creator, opens), 2 = 🔵 Blue.
 * ============================================================================
 */

import {
  SIZES,
  DEFAULT_SIZE,
  createState,
  drawEdge,
  isComplete,
  gameResult,
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
import { GAME_CONFIG } from './config.js';

/* ==========================================================================
 * UI — auto-inits only when the board exists (never under jest/node)
 * ======================================================================= */

const state = {
  screen: 'menu',
  mode: '1p', // '1p' | '2p' | 'online'
  difficulty: 'medium',
  size: DEFAULT_SIZE,
  match: null, // core.js state { n, edges, owners, turn, scores }
  starter: 1,
  locked: false,
  series: emptyTally(),
  aiTimer: null,
  // plan/games/03: live online duel — server-authoritative, 3-s poll.
  online: null, // { code, mark, pollTimer, busy, rName, bName }
};

const els = {};

function currentSetupKey() {
  return seriesSetupKey(state.mode, state.difficulty, state.size);
}

const markLabel = (m) => (m === 1 ? '🔴' : '🔵');
const markName = (m) => (m === 1 ? 'Red' : 'Blue');

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
  els.seriesR.textContent = String(state.series.r);
  els.seriesB.textContent = String(state.series.b);
  els.seriesDraw.textContent = String(state.series.draw);
  const total = state.series.r + state.series.b + state.series.draw;
  els.resetSeriesBtn.disabled = total === 0;
}

function refreshSeriesFromStorage() {
  state.series = loadSeries(currentSetupKey());
}

/* ---- board rendering (one SVG, rebuilt on state change) ---------------------- */

const SVG_NS = 'http://www.w3.org/2000/svg';
/** Lattice: dot (r,c) sits at (2c+1, 2r+1) in a (2n+1)-wide viewBox. */
const dotX = (c) => 2 * c + 1;
const dotY = (r) => 2 * r + 1;

function edgeGeometry(n, edge) {
  const hCount = n * (n + 1);
  if (edge < hCount) {
    const r = Math.floor(edge / n);
    const c = edge % n;
    return { x1: dotX(c), y1: dotY(r), x2: dotX(c + 1), y2: dotY(r) };
  }
  const k = edge - hCount;
  const r = Math.floor(k / (n + 1));
  const c = k % (n + 1);
  return { x1: dotX(c), y1: dotY(r), x2: dotX(c), y2: dotY(r + 1) };
}

function renderBoard() {
  const n = state.size;
  const match = state.match;
  const span = 2 * n + 3; // +1 padding each side
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${span} ${span}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `Dots and boxes board, ${n} by ${n}`);

  const add = (name, attrs, cls) => {
    const el = document.createElementNS(SVG_NS, name);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
    if (cls) el.setAttribute('class', cls);
    svg.appendChild(el);
    return el;
  };

  // claimed boxes (under the lines)
  for (let box = 0; box < n * n; box++) {
    const owner = match.owners[box];
    if (!owner) continue;
    const r = Math.floor(box / n);
    const c = box % n;
    add(
      'rect',
      {
        x: dotX(c) - 0.5,
        y: dotY(r) - 0.5,
        width: 2,
        height: 2,
        rx: 0.25,
      },
      `box-fill box-fill--${owner}`
    );
  }

  // drawn edges
  for (let e = 0; e < match.edges.length; e++) {
    const mark = match.edges[e];
    const g = edgeGeometry(n, e);
    const attrs = { x1: g.x1, y1: g.y1, x2: g.x2, y2: g.y2, 'stroke-width': 0.34 };
    add('line', attrs, `edge ${mark ? 'edge--' + mark : 'edge--idle'}`);
  }

  // tap targets for every free edge (on top)
  for (let e = 0; e < match.edges.length; e++) {
    if (match.edges[e] !== 0) continue;
    const g = edgeGeometry(n, e);
    const hit = add('line', { x1: g.x1, y1: g.y1, x2: g.x2, y2: g.y2, 'data-edge': e }, 'hit');
    hit.setAttribute('aria-label', `Draw the line #${e + 1}`);
    if (state.locked) hit.setAttribute('disabled', 'true');
  }

  // dots last (on top of the lines)
  for (let r = 0; r <= n; r++) {
    for (let c = 0; c <= n; c++) {
      add('circle', { cx: dotX(c), cy: dotY(r), r: 0.22 }, 'dot');
    }
  }

  els.board.innerHTML = '';
  els.board.appendChild(svg);
}

function renderTurn() {
  let label;
  const mark = state.match.turn;
  if (state.mode === '1p') {
    label = mark === 1 ? "Your turn — you're 🔴" : "Computer's turn…";
  } else if (state.mode === 'online' && state.online) {
    const you = state.online.mark;
    const oppName = you === 1 ? state.online.bName : state.online.rName;
    label =
      mark === you
        ? 'Your turn — you are ' + markLabel(you)
        : 'Waiting for ' + (oppName || 'opponent') + '…';
  } else {
    label = markLabel(mark) + ' ' + markName(mark) + "'s turn";
  }
  els.turn.textContent = label;
  els.turn.dataset.mark = String(mark);
}

/** Top bar: the LIVE match score (box claims), not the series tally —
 *  chains are decided by who is ahead right now (manual play caught the
 *  mismatch: the bar showed series games-won and stayed 0–0 all match). */
function renderMiniSeries() {
  if (state.match) {
    els.miniSeries.textContent =
      '🔴 ' + state.match.scores[0] + ' – ' + state.match.scores[1] + ' 🔵';
  }
}

/* ---- match flow ------------------------------------------------------------- */

function startRound() {
  state.match = createState(state.size);
  state.match.turn = state.starter;
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
  if (state.mode === '1p' && state.match.turn !== 1) scheduleAiMove();
}

function placeEdge(edge) {
  if (state.screen !== 'playing' || state.locked) return;
  if (state.match.edges[edge] !== 0) return;
  if (state.mode === '1p' && state.match.turn !== 1) return; // human plays 🔴 only
  if (state.mode === 'online') {
    playOnlineMove(edge);
    return;
  }
  playLocal(edge);
}

function playLocal(edge) {
  const match = state.match;
  const mark = match.turn;
  const r = drawEdge(match, edge, mark);
  if (!r.ok) return;
  const hadExtraTurn = r.extraTurn;
  // a box claim does NOT hand the turn over — the mover keeps playing
  if (!hadExtraTurn) match.turn = mark === 1 ? 2 : 1;

  if (isComplete(match)) {
    finishRound();
    return;
  }
  renderBoard();
  renderTurn();
  renderMiniSeries(); // the live box score must move on every claim
  if (state.mode === '1p' && match.turn !== 1) scheduleAiMove();
}

function finishRound() {
  state.locked = true;
  const result = gameResult(state.match);
  const [r, b] = result.scores;
  if (result.winner === 0) state.series.draw++;
  else if (result.winner === 1) state.series.r++;
  else state.series.b++;
  saveSeries(currentSetupKey(), state.series);
  // the loser opens the rematch; a draw flips the opener
  state.starter = result.winner === 0 ? (state.starter === 1 ? 2 : 1) : result.winner === 1 ? 2 : 1;
  renderBoard();
  renderMiniSeries();
  showOverlay(result);
}

/* ---- solo AI ---------------------------------------------------------------- */

function scheduleAiMove() {
  state.locked = true;
  els.thinkingBadge.classList.remove('hidden');
  renderBoard(); // grey out the taps while the computer thinks
  state.aiTimer = setTimeout(() => {
    state.aiTimer = null;
    els.thinkingBadge.classList.add('hidden');
    if (state.screen !== 'playing' || state.match.turn === 1) return;
    const edge = aiMove(state.match, 2, state.difficulty);
    if (edge < 0) return;
    state.locked = false;
    playLocal(edge);
  }, GAME_CONFIG.aiThinkDelayMs);
}

/* ---- round overlay ------------------------------------------------------------ */

function showOverlay(result) {
  const [r, b] = result.scores;
  let title;
  let emoji;
  let sub;
  if (result.winner === 0) {
    title = 'Draw 🤝';
    emoji = '🤝';
    sub = 'Evenly split. Run it back?';
  } else {
    const won = result.winner;
    title = markName(won) + ' wins! ' + markLabel(won);
    emoji = markLabel(won);
    if (state.mode === '1p') {
      sub = won === 1 ? 'You took more boxes!' : 'The computer took more. Rematch?';
    } else {
      sub = r + ' – ' + b;
    }
  }
  els.overlayEmoji.textContent = emoji;
  els.overlayTitle.textContent = title;
  els.overlayTitle.dataset.mark = String(result.winner || '');
  els.overlaySub.textContent = sub ? sub + ' ' : '';
  els.overlay.classList.remove('hidden');
  els.overlay.classList.add('overlay--in');
  document.getElementById('btn-next').focus();
}

/* ---- online duel (plan/games/03) ---------------------------------------------- */
/* Server-authoritative matches (backend /dots-and-boxes): the board only
 * changes via POST move (an edge index) and — crucially — the SERVER decides
 * whose turn it is, because a box claim grants an extra turn. Both players
 * sync the authoritative state with the same 3-second poll the duels use.
 * One match per round; rematch = new match. Deep link: ?dbb=CODE. */

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
    onlineApi('/dots-and-boxes/' + state.online.code + '/leave', {
      playerName: onlinePlayerName(),
      guestId: onlineGuestId(),
    }).catch(() => undefined);
  }
  stopOnlinePoll();
  state.online = null;
}

function onlineCreate() {
  onlineStatus('Creating the match…');
  onlineApi('/dots-and-boxes', {
    playerName: onlinePlayerName(),
    guestId: onlineGuestId(),
    size: state.size,
  })
    .then(({ code }) => {
      state.online = { code, mark: 1, pollTimer: null, bName: null, busy: false };
      const link = 'https://pigzap.com/games/dots-and-boxes/?dbb=' + code;
      onlineStatus('Match ' + code + ' — waiting for a challenger. Send: ' + link);
      if (navigator.share) {
        navigator
          .share({ title: 'Dots and Boxes duel', text: 'Duel me — match ' + code, url: link })
          .catch(() => undefined);
      }
      state.online.pollTimer = setInterval(pollOnline, 3000);
    })
    .catch(() => onlineStatus('Could not create the match — check your connection.'));
}

function onlineJoin(code) {
  if (!code) return;
  onlineStatus('Joining ' + code + '…');
  onlineApi('/dots-and-boxes/' + encodeURIComponent(code) + '/join', {
    playerName: onlinePlayerName(),
    guestId: onlineGuestId(),
  })
    .then((view) => {
      adoptOnlineView(view);
      if (view.status === 'waiting') {
        // Re-opening your own match link on this device: the server sees the
        // same guest id and returns the creator's view — don't claim 🔵.
        onlineStatus(
          view.yourMark === 1
            ? 'This is your own match — waiting for a challenger to join.'
            : 'Joined as 🔵 — waiting for 🔴 to be claimed…'
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
    '/dots-and-boxes/' +
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
    rName: view.rName,
    bName: view.bName,
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
  state.match = {
    n: view.size,
    edges: Uint8Array.from(view.edges),
    owners: Int8Array.from(view.owners),
    turn: view.turn,
    scores: [view.scores[0], view.scores[1]],
  };
  renderBoard();
  renderTurn();
  renderMiniSeries();
  if (view.status === 'finished' && !state.locked) finishOnlineRound(view);
}

function playOnlineMove(edge) {
  if (!state.online || state.online.busy) return;
  if (state.match.turn !== state.online.mark) return; // opponent's turn — poll catches up
  state.online.busy = true;
  onlineApi('/dots-and-boxes/' + encodeURIComponent(state.online.code) + '/move', {
    guestId: onlineGuestId(),
    edge,
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
  const youWon = !view.draw && view.winner === state.online.mark;
  if (view.draw) state.series.draw++;
  else if (view.winner === 1) state.series.r++;
  else state.series.b++;
  saveSeries(currentSetupKey(), state.series);
  renderMiniSeries();
  if (youWon) vibrate([40, 60, 40]);
  setTimeout(() => {
    els.overlayEmoji.textContent = view.draw ? '🤝' : youWon ? '🎉' : '😬';
    els.overlayTitle.textContent = view.draw
      ? 'Draw 🤝'
      : youWon
        ? 'You win! 🎉'
        : (state.online.mark === 1 ? view.bName : view.rName || 'Opponent') + ' wins';
    els.overlayTitle.dataset.mark = String(view.winner || '');
    els.overlaySub.textContent =
      'Series — 🔴 ' + state.series.r + ' · 🔵 ' + state.series.b + ' · 🤝 ' + state.series.draw;
    els.overlay.classList.remove('hidden');
    els.overlay.classList.add('overlay--in');
    document.getElementById('btn-next').textContent = 'New online match';
    document.getElementById('btn-next').focus();
  }, 650);
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

/* ---- wiring --------------------------------------------------------------------- */

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
  state.size = SIZES.indexOf(prefs.size) !== -1 ? prefs.size : DEFAULT_SIZE;

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
    refreshSeriesFromStorage();
    renderSeriesCard();
    saveMenuPrefs();
    if (state.screen === 'playing') startRound();
    else renderBoard();
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

  // tapping an edge's transparent hit-line draws it
  els.board.addEventListener('click', (e) => {
    const hit = e.target.closest('.hit');
    if (!hit) return;
    placeEdge(Number(hit.dataset.edge));
  });

  // Pausing mid-AI-turn drops the pending move; reschedule on return.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      if (state.aiTimer) {
        clearTimeout(state.aiTimer);
        state.aiTimer = null;
        els.thinkingBadge.classList.add('hidden');
      }
    } else if (
      state.screen === 'playing' &&
      state.mode === '1p' &&
      state.match.turn !== 1 &&
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
  renderBoard();

  // plan/games/03: ?dbb=CODE deep link — flip to online mode with the code
  // prefilled (name remembered from a previous duel when available).
  const dbbCode = new URLSearchParams(window.location.search).get('dbb');
  if (dbbCode) {
    state.mode = 'online';
    applyModeUi('online');
    syncSegmented(document.getElementById('mode-segmented'), 'data-mode', 'online');
    renderSeriesCard();
    els.onlineCode.value = dbbCode.toUpperCase().slice(0, 6);
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
