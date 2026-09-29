/**
 * ============================================================================
 * game.js — Othello (plan/games/12-othello.md) — UI shell
 * ============================================================================
 * Plain ESM, no build step (the games convention). The pure model lives in
 * core.js (jest-tested), persistence in storage.js, flags/strings in
 * config.js. This file is screens + DOM wiring; it auto-inits only when its
 * board exists in the DOM.
 *
 * Modes (the family template): solo vs computer (easy/medium/hard), 2-player
 * hot-seat, and ⚔️ online duels on the server-authoritative backend — the
 * SERVER recomputes every flip, so a client cannot claim discs it did not
 * outflank. Deep link: ?oth=CODE. Sides: 1 = ⚫ Dark (creator, opens), 2 = ⚪ Light.
 *
 * A PASS is a real state in this game: the side with no legal placement does
 * nothing and the turn goes back. The banner says so rather than looking hung.
 * ============================================================================
 */

import {
  BOARD_SIZES,
  DEFAULT_SIZE,
  EMPTY,
  DARK,
  LIGHT,
  other,
  sizeOf,
  initialBoard,
  fromArray,
  legalMoves,
  applyMove,
  pass,
  discCount,
  isOver,
  outcome,
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

const SIDE_LABEL = { 1: '⚫ Dark', 2: '⚪ Light' };

const state = {
  screen: 'menu',
  mode: '1p', // '1p' | '2p' | 'online'
  difficulty: 'medium', // 'easy' | 'medium' | 'hard'
  size: DEFAULT_SIZE,
  cells: initialBoard(DEFAULT_SIZE),
  turn: DARK,
  starter: DARK,
  locked: false, // true during AI thinking and after the game ends
  lastMove: null, // { idx, flipped } for the place/flip animations
  series: emptyTally(),
  aiTimer: null,
  online: null, // { code, mark, pollTimer, busy }
};

const els = {};

function currentSetupKey() {
  return seriesSetupKey(state.mode, state.difficulty, state.size);
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

/** Build the grid for the current size. Only playable squares exist at all. */
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

function discHtml(cell) {
  return '<span class="disc disc--' + (cell === DARK ? 'dark' : 'light') + '"></span>';
}

/** The side the human controls right now. */
function mySide() {
  if (state.mode === 'online') return state.online ? state.online.mark : DARK;
  if (state.mode === '2p') return state.turn;
  return DARK; // 1p: you always play dark
}

function isAiTurnNow() {
  return state.mode === '1p' && state.turn === LIGHT;
}

function opponentName() {
  if (state.mode === 'online' && state.online) {
    return state.online.mark === DARK ? state.online.lName : state.online.dName;
  }
  return state.mode === '1p' ? 'the computer' : null;
}

function renderBoard() {
  const moves = state.locked ? [] : legalMoves(state.cells, state.turn);
  for (const cell of els.board.children) {
    const idx = Number(cell.dataset.idx);
    const value = state.cells[idx];
    cell.innerHTML = value === EMPTY ? '' : discHtml(value);
    cell.classList.remove('cell--legal', 'cell--flip', 'cell--placed', 'cell--thinking');
    if (value === EMPTY && moves.indexOf(idx) !== -1) cell.classList.add('cell--legal');
    const last = state.lastMove;
    if (last) {
      if (last.idx === idx) cell.classList.add('cell--placed');
      if (last.flipped.indexOf(idx) !== -1) cell.classList.add('cell--flip');
    }
    cell.setAttribute(
      'aria-label',
      squareName(idx) +
        ', ' +
        (value === EMPTY ? 'empty' : SIDE_LABEL[value].split(' ')[1].toLowerCase())
    );
  }
}

function renderScoreBar() {
  const { dark, light, empty } = discCount(state.cells);
  const played = dark + light;
  els.barDark.style.width = played === 0 ? '50%' : (dark / played) * 100 + '%';
  els.barCount.textContent = dark + ' : ' + light + (empty ? '  ·  ' + empty + ' empty' : '');
}

function renderTurn() {
  let label;
  if (state.mode === '1p') {
    label = state.turn === DARK ? "Your turn — you're ⚫" : "Computer's turn…";
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

/** The banner: legal-move count, or the pass the player needs to know about. */
function renderHint() {
  let hint = '';
  if (!state.locked) {
    if (isOver(state.cells)) hint = '';
    else if (legalMoves(state.cells, state.turn).length === 0) {
      hint = SIDE_LABEL[state.turn] + ' has no move — passing';
    } else if (state.mode === '1p' && state.turn === DARK) {
      hint = 'Tap a highlighted square to outflank';
    }
  }
  els.hintLine.textContent = hint;
}

function renderMiniSeries() {
  els.miniSeries.textContent =
    '⚫ ' + state.series.d + ' · 🤝 ' + state.series.draw + ' · ⚪ ' + state.series.l;
}

/* ---- a game ---------------------------------------------------------------- */

/** Re-derive the turn after any board change, handling the pass rule. */
function settleTurn(result) {
  state.cells = result.cells;
  state.lastMove = { idx: result.idx ?? null, flipped: result.flipped || [] };
  state.turn = result.turn;
  return result;
}

function startGame() {
  state.cells = initialBoard(state.size);
  state.turn = state.starter;
  state.locked = false;
  state.lastMove = null;
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

function renderAll() {
  renderBoard();
  renderScoreBar();
  renderTurn();
  renderHint();
  renderMiniSeries();
}

/** Tap handler — one tap places one disc. */
function onCellTap(idx) {
  if (state.screen !== 'playing' || state.locked) return;
  if (isAiTurnNow()) return;
  if (state.mode === 'online') {
    if (state.turn !== state.online.mark) return;
    sendOnlineMove(idx);
    return;
  }
  play(idx);
}

function play(idx) {
  const side = state.turn;
  let result;
  try {
    result = applyMove(state.cells, side, idx);
  } catch {
    toast('That square flips nothing');
    return;
  }
  settleTurn(result);
  renderAll();
  finishIfOver();
  if (!state.locked && isAiTurnNow()) scheduleAi();
}

function finishIfOver() {
  if (isOver(state.cells)) {
    endGame(outcome(state.cells));
    return true;
  }
  // a pass is not the end — the banner already says who is stuck
  if (legalMoves(state.cells, state.turn).length === 0) {
    const advanced = pass(state.cells, state.turn);
    if (advanced.over) {
      endGame(outcome(state.cells));
      return true;
    }
    state.turn = advanced.turn;
    renderAll();
  }
  return false;
}

/* ---- AI ---------------------------------------------------------------------- */

function scheduleAi() {
  state.locked = true;
  renderHint();
  // Medium/hard are deterministic, so the decision can be shown honestly; easy
  // is random and has no strategy to visualise.
  const planned =
    state.difficulty !== 'easy'
      ? aiMove(state.cells, LIGHT, state.difficulty, { maxNodes: GAME_CONFIG.hardSearchNodes })
      : null;
  if (planned !== null && planned !== undefined) {
    const cell = els.board.children[planned];
    if (cell) cell.classList.add('cell--thinking');
  }
  state.aiTimer = setTimeout(() => {
    state.aiTimer = null;
    for (const cell of els.board.children) cell.classList.remove('cell--thinking');
    if (state.screen !== 'playing' || !isAiTurnNow()) return;
    const move =
      planned !== null && planned !== undefined
        ? planned
        : aiMove(state.cells, LIGHT, state.difficulty, { maxNodes: GAME_CONFIG.hardSearchNodes });
    if (move === null || move === undefined) {
      // the computer is stuck too — the game is over, not hung
      state.locked = false;
      if (finishIfOver()) return;
      return;
    }
    state.locked = false;
    play(move);
  }, GAME_CONFIG.aiThinkDelayMs);
}

/* ---- game end -------------------------------------------------------------------- */

function endGame(result) {
  state.locked = true;
  const isDraw = result.draw;
  const winner = result.winner; // null on a draw

  if (isDraw) state.series.draw++;
  else if (winner === DARK) state.series.d++;
  else state.series.l++;
  saveSeries(currentSetupKey(), state.series);

  // Rematch flips the opener — the same rule as the rest of the family.
  state.starter = other(state.starter);

  renderBoard();
  renderScoreBar();
  renderTurn();
  renderHint();
  renderMiniSeries();
  const youWon =
    state.mode === '1p' ? winner === DARK : state.mode === 'online' && state.online ? winner === state.online.mark : false;
  if (!isDraw && youWon) vibrate([40, 60, 40]);
  setTimeout(() => showOverlay(isDraw, winner, result), 450);
}

function showOverlay(isDraw, winner, result) {
  let title;
  let emoji;
  let sub;
  if (isDraw) {
    title = 'Draw 🤝';
    emoji = '🤝';
    sub = 'An even split of the board.';
  } else {
    title = SIDE_LABEL[winner] + ' wins! 🎉';
    emoji = winner === DARK ? '⚫' : '⚪';
    if (state.mode === '1p') {
      sub = winner === DARK ? 'You outflanked the computer!' : 'The computer takes it. Rematch?';
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
    'Series — ⚫ ' + state.series.d + ' · ⚪ ' + state.series.l + ' · 🤝 ' + state.series.draw;
  els.overlaySub.textContent =
    (sub ? sub + ' ' : '') + result.dark + '–' + result.light + '. ' + seriesLine;
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
    onlineApi('/othello/' + state.online.code + '/leave', {
      playerName: onlinePlayerName(),
      guestId: onlineGuestId(),
    }).catch(() => undefined);
  }
  stopOnlinePoll();
  state.online = null;
}

function onlineCreate() {
  onlineStatus('Creating the match…');
  onlineApi('/othello', {
    playerName: onlinePlayerName(),
    guestId: onlineGuestId(),
    size: state.size,
  })
    .then(({ code }) => {
      state.online = { code, mark: DARK, pollTimer: null, lName: null, busy: false };
      const link = 'https://pigzap.com/games/othello/?oth=' + code;
      onlineStatus('Match ' + code + ' — waiting for a challenger. Send: ' + link);
      if (navigator.share) {
        navigator
          .share({ title: 'Othello duel', text: 'Duel me — match ' + code, url: link })
          .catch(() => undefined);
      }
      state.online.pollTimer = setInterval(pollOnline, 3000);
    })
    .catch(() => onlineStatus('Could not create the match — check your connection.'));
}

function onlineJoin(code) {
  if (!code) return;
  onlineStatus('Joining ' + code + '…');
  onlineApi('/othello/' + encodeURIComponent(code) + '/join', {
    playerName: onlinePlayerName(),
    guestId: onlineGuestId(),
  })
    .then((view) => {
      state.online = {
        code: view.code,
        mark: view.yourMark,
        pollTimer: null,
        dName: view.dName,
        lName: view.lName,
        busy: false,
      };
      if (view.status === 'waiting') {
        onlineStatus('Joined as ⚪ Light — waiting for Dark to be claimed…');
        state.online.pollTimer = setInterval(pollOnline, 3000);
        return;
      }
      enterOnlinePlay(view);
    })
    .catch((e) => onlineStatus('Join failed: ' + (e.message || 'try again')));
}

function pollOnline() {
  if (!state.online || state.online.busy) return;
  onlineApi('/othello/' + encodeURIComponent(state.online.code) + '?guestId=' + encodeURIComponent(onlineGuestId()))
    .then((view) => {
      if (!state.online) return;
      state.online.dName = view.dName;
      state.online.lName = view.lName;
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
  // The JOINER has no poll yet (only the creator's create-branch starts one).
  if (state.online && !state.online.pollTimer) {
    state.online.pollTimer = setInterval(pollOnline, 3000);
  }
}

function applyOnlineView(view) {
  state.size = view.size;
  if (els.board.children.length !== view.size * view.size) buildBoard();
  state.cells = fromArray(view.cells, view.size);
  state.turn = view.turn;
  state.lastMove = view.lastMove || null;
  renderAll();
  if (view.status === 'finished' && !state.locked) {
    const counts = discCount(state.cells);
    finishOnlineGame(view, counts);
  }
}

function sendOnlineMove(idx) {
  state.online.busy = true;
  onlineApi('/othello/' + encodeURIComponent(state.online.code) + '/move', {
    guestId: onlineGuestId(),
    idx,
  })
    .then((view) => {
      if (state.online) state.online.busy = false;
      applyOnlineView(view);
    })
    .catch((e) => {
      if (state.online) state.online.busy = false;
      toast(e.message === 'Illegal move' ? 'The server rejected that square' : 'Move rejected — try again');
      pollOnline(); // resync rather than sit on a rejected local state
    });
}

function finishOnlineGame(view, counts) {
  state.locked = true;
  stopOnlinePoll();
  const isDraw = !!view.draw;
  const winner = view.winner;
  const youWon = !isDraw && winner === state.online.mark;

  if (isDraw) state.series.draw++;
  else if (winner === DARK) state.series.d++;
  else state.series.l++;
  saveSeries(currentSetupKey(), state.series);
  renderMiniSeries();
  if (youWon) vibrate([40, 60, 40]);
  setTimeout(() => showOverlay(isDraw, winner, { dark: counts.dark, light: counts.light }), 450);
}

/* ---- share (plan §6) ---------------------------------------------------------------- */

function shareText() {
  const url = 'https://pigzap.com/games/othello/';
  const score = '⚫ ' + state.series.d + ' · ⚪ ' + state.series.l + ' · draws ' + state.series.draw;
  if (state.mode === '2p') return t('share2p', { score, url });
  return t('share1p', {
    setup: 'Othello vs the computer (' + state.difficulty + ', ' + state.size + '×' + state.size + ')',
    score,
    url,
  });
}

function shareUrls() {
  const url = 'https://pigzap.com/games/othello/';
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

/* ---- wiring --------------------------------------------------------------------------- */

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
  savePrefs({ mode: state.mode, difficulty: state.difficulty, size: state.size });
}

function init() {
  els.screenMenu = document.getElementById('screen-menu');
  els.screenPlaying = document.getElementById('screen-playing');
  els.board = document.getElementById('board');
  els.turn = document.getElementById('turn');
  els.hintLine = document.getElementById('hint-line');
  els.barDark = document.getElementById('bar-dark');
  els.barCount = document.getElementById('bar-count');
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

  // Pausing mid-AI-turn drops the pending move; reschedule on return.
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

  // Restore the menu exactly as the player left it. storage.js keys the level
  // as `difficulty` and the board as `size`.
  const prefs = loadPrefs();
  if (prefs) {
    state.mode = prefs.mode;
    state.difficulty = prefs.difficulty;
    state.size = prefs.size;
    applyModeUi(state.mode);
    syncSegmented(document.getElementById('mode-segmented'), 'data-mode', state.mode);
    syncSegmented(
      document.getElementById('difficulty-segmented'),
      'data-difficulty',
      state.difficulty
    );
    syncSegmented(document.getElementById('size-segmented'), 'data-size', String(state.size));
  }

  refreshSeriesFromStorage();
  renderSeriesCard();
  showScreen('menu');

  // ?oth=CODE deep link — flip to online mode with the code prefilled.
  const othCode = new URLSearchParams(window.location.search).get('oth');
  if (othCode) {
    state.mode = 'online';
    applyModeUi('online');
    syncSegmented(document.getElementById('mode-segmented'), 'data-mode', 'online');
    renderSeriesCard();
    els.onlineCode.value = othCode.toUpperCase().slice(0, 6);
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
  var SLUG = 'othello';
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
