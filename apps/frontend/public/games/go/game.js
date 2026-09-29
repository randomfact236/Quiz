/**
 * ============================================================================
 * game.js — Go 9×9 (plan/games/39-go-9x9.md) — UI shell
 * ============================================================================
 * Plain ESM, no build step (the games convention). The pure model lives in
 * core.js (jest-tested), persistence in storage.js, flags/strings in
 * config.js. Screens + DOM wiring only; it auto-inits when its board exists.
 *
 * Modes (the family template): solo vs computer (easy/medium/hard), 2-player
 * hot-seat, and ⚔️ online duels on the server-authoritative backend — the
 * server resolves captures, the ko ban and the final score, so a client
 * cannot claim a stone it did not earn. Deep link: ?go=CODE.
 *
 * Two things this game does that the others do not: a PASS is a real, common
 * move (not a concession), and the game only ends on two passes — so the
 * "Pass" button is part of play, not a surrender.
 * ============================================================================
 */

import {
  SIZE,
  CELLS,
  BLACK,
  WHITE,
  EMPTY,
  DEFAULT_KOMI,
  other,
  rowOf,
  fileOf,
  neighbours,
  playOn,
  isLegal,
  legalMoves,
  applyMove,
  createGame,
  score,
  fromArray,
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

const SIDE_LABEL = { 1: '⚫ Black', 2: '⚪ White' };
const KOMIS = [0, 5.5];

const state = {
  screen: 'menu',
  mode: '1p',
  difficulty: 'medium',
  komi: DEFAULT_KOMI,
  game: createGame(DEFAULT_KOMI),
  locked: false,
  lastMove: null, // { idx, captured }
  series: emptyTally(),
  aiTimer: null,
  online: null,
};

const els = {};

function currentSetupKey() {
  return seriesSetupKey(state.mode, state.difficulty, state.komi);
}

function mySide() {
  if (state.mode === 'online') return state.online ? state.online.mark : BLACK;
  if (state.mode === '2p') return state.game.turn;
  return BLACK;
}

function isAiTurnNow() {
  return state.mode === '1p' && state.game.turn === WHITE;
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
  els.seriesScope.textContent = scope + ' · komi ' + state.komi;
  els.seriesD.textContent = String(state.series.d);
  els.seriesL.textContent = String(state.series.l);
  els.seriesDraw.textContent = String(state.series.draw);
  const total = state.series.d + state.series.l + state.series.draw;
  els.resetSeriesBtn.disabled = total === 0;
}

function refreshSeriesFromStorage() {
  state.series = loadSeries(currentSetupKey());
}

/* ---- board ---------------------------------------------------------------------- */

function buildBoard() {
  els.board.style.gridTemplateColumns = `repeat(${SIZE}, 1fr)`;
  els.board.innerHTML = '';
  for (let idx = 0; idx < CELLS; idx++) {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'intersection';
    cell.dataset.idx = String(idx);
    cell.dataset.row = String(rowOf(idx));
    cell.dataset.col = String(fileOf(idx));
    cell.setAttribute('aria-label', label(idx) + ', empty');
    els.board.appendChild(cell);
  }
}

function label(idx) {
  return String.fromCharCode(97 + fileOf(idx)) + (SIZE - rowOf(idx));
}

function stoneHtml(colour) {
  return '<span class="stone stone--' + (colour === BLACK ? 'black' : 'white') + '"></span>';
}

function renderBoard() {
  const legal = state.locked ? [] : legalMoves(state.game.cells, state.game.turn, state.game.previous);
  for (const cell of els.board.children) {
    const idx = Number(cell.dataset.idx);
    const value = state.game.cells[idx];
    cell.className = 'intersection';
    cell.innerHTML = value === EMPTY ? '' : stoneHtml(value);
    if (legal.indexOf(idx) !== -1) {
      cell.classList.add('intersection--legal');
      // a point that captures something is called out — it is the good move
      const probe = playOn(state.game.cells, state.game.turn, idx);
      if (probe && probe.captured.length > 0) cell.classList.add('intersection--captures');
    }
    const last = state.lastMove;
    if (last) {
      if (last.idx === idx) cell.classList.add('intersection--placed');
      if (last.captured && last.captured.indexOf(idx) !== -1) cell.classList.add('intersection--taken');
    }
    if (state.thinkingSquare === idx) cell.classList.add('intersection--thinking');
    cell.setAttribute(
      'aria-label',
      label(idx) + ', ' + (value === EMPTY ? 'empty' : SIDE_LABEL[value].split(' ')[1].toLowerCase())
    );
  }
}

function renderTurn() {
  let text;
  if (state.mode === '1p') {
    text = state.game.turn === BLACK ? "Your turn — you're ⚫" : "Computer's turn…";
  } else if (state.mode === 'online' && state.online) {
    const opp = state.online.mark === BLACK ? state.online.lName : state.online.rName;
    text =
      state.game.turn === state.online.mark
        ? "Your turn — you're " + SIDE_LABEL[state.online.mark]
        : (opp || 'Opponent') + ' is thinking…';
  } else {
    text = SIDE_LABEL[state.game.turn] + ' to play';
  }
  els.turn.textContent = text;
  els.turn.dataset.turn = String(state.game.turn);
}

function renderHint() {
  let hint = '';
  if (!state.locked) {
    if (state.game.passes === 1) hint = 'White must pass or play to end the game';
    else if (state.mode === '1p' && state.game.turn === BLACK) {
      const anyCapture = legalMoves(state.game.cells, BLACK, state.game.previous).some((idx) => {
        const r = playOn(state.game.cells, BLACK, idx);
        return r && r.captured.length > 0;
      });
      hint = anyCapture ? 'A capture is available' : 'Tap a point to place a stone';
    }
  }
  els.hintLine.textContent = hint;
}

/** A running read of the area, so the bar is meaningful mid-game. */
function renderBars() {
  const s = score(state.game);
  const total = s.blackArea + s.whiteArea || 1;
  els.barDark.style.width = (s.blackArea / total) * 100 + '%';
  els.barCount.textContent = s.blackArea + ' : ' + s.whiteArea;
  els.capDark.textContent = String(s.blackCaptures);
  els.capLight.textContent = String(s.whiteCaptures);
}

function renderMiniSeries() {
  els.miniSeries.textContent = '⚫ ' + state.series.d + ' · 🤝 ' + state.series.draw + ' · ⚪ ' + state.series.l;
}

function renderAll() {
  renderBoard();
  renderTurn();
  renderHint();
  renderBars();
  renderMiniSeries();
}

/* ---- a game ---------------------------------------------------------------------- */

function startGame() {
  state.game = createGame(state.komi);
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

function onPointTap(idx) {
  if (state.screen !== 'playing' || state.locked) return;
  if (isAiTurnNow()) return;
  if (state.mode === 'online') {
    if (state.game.turn !== state.online.mark) return;
    sendOnlineMove(idx);
    return;
  }
  play(idx);
}

function play(idx) {
  const side = state.game.turn;
  const result = applyMove(state.game, side, idx);
  if (!result) {
    toast(idx === null ? 'You cannot pass here' : 'Illegal move — that point has no liberty');
    return;
  }
  state.game = result.state;
  state.lastMove = { idx, captured: result.captured };
  renderAll();
  if (result.captured.length > 0) {
    toast('Captured ' + result.captured.length + (result.captured.length === 1 ? ' stone' : ' stones'));
  }
  if (result.over) {
    endGame();
    return;
  }
  if (isAiTurnNow()) scheduleAi();
}

function pass() {
  if (state.screen !== 'playing' || state.locked) return;
  if (isAiTurnNow()) return;
  if (state.mode === 'online') {
    if (state.game.turn !== state.online.mark) return;
    sendOnlineMove(null);
    return;
  }
  play(null);
}

function endGame() {
  state.locked = true;
  const s = score(state.game);
  const isDraw = !s.winner;
  const winner = s.winner;

  if (isDraw) state.series.draw++;
  else if (winner === BLACK) state.series.d++;
  else state.series.l++;
  saveSeries(currentSetupKey(), state.series);
  renderBars();
  renderMiniSeries();
  renderBoard();
  renderHint();

  const youWon =
    state.mode === '1p'
      ? winner === BLACK
      : state.mode === 'online' && state.online
        ? winner === state.online.mark
        : false;
  if (!isDraw && youWon) vibrate([40, 60, 40]);
  setTimeout(() => showOverlay(isDraw, winner, s), 450);
}

function showOverlay(isDraw, winner, s) {
  els.overlayEmoji.textContent = isDraw ? '🤝' : winner === BLACK ? '⚫' : '⚪';
  els.overlayTitle.textContent = isDraw ? 'Draw 🤝' : SIDE_LABEL[winner] + ' wins!';
  const margin = s.margin;
  const detail =
    '⚫ ' + s.blackArea + '  ⚪ ' + s.whiteArea + (s.komi ? '  (komi ' + s.komi + ')' : '') +
    ' — by ' + margin;
  const seriesLine =
    'Series — ⚫ ' + state.series.d + ' · ⚪ ' + state.series.l + ' · 🤝 ' + state.series.draw;
  els.overlaySub.textContent = detail + '. ' + seriesLine;
  els.overlay.classList.remove('hidden');
  els.overlay.classList.add('overlay--in');
  document.getElementById('btn-next').textContent =
    state.mode === 'online' ? 'New online match' : 'New game';
  document.getElementById('btn-next').focus();
}

/* ---- AI ---------------------------------------------------------------------------- */

function scheduleAi() {
  state.locked = true;
  renderHint();
  const planned =
    state.difficulty !== 'easy'
      ? aiMove(state.game, WHITE, state.difficulty, { maxNodes: GAME_CONFIG.hardSearchNodes })
      : null;
  state.thinkingSquare = planned ?? null;
  renderBoard();
  state.aiTimer = setTimeout(() => {
    state.aiTimer = null;
    state.thinkingSquare = null;
    if (state.screen !== 'playing' || !isAiTurnNow()) return;
    const move =
      planned !== null && planned !== undefined
        ? planned
        : aiMove(state.game, WHITE, state.difficulty, { maxNodes: GAME_CONFIG.hardSearchNodes });
    state.locked = false;
    renderBoard();
    if (move === null || move === undefined) {
      // the computer has no legal placement — that is a legal PASS, not a hang
      play(null);
      return;
    }
    play(move);
  }, GAME_CONFIG.aiThinkDelayMs);
}

/* ---- online duel ------------------------------------------------------------------------- */

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
    onlineApi('/go/' + state.online.code + '/leave', {
      playerName: onlinePlayerName(),
      guestId: onlineGuestId(),
    }).catch(() => undefined);
  }
  stopOnlinePoll();
  state.online = null;
}

function onlineCreate() {
  onlineStatus('Creating the match…');
  onlineApi('/go', {
    playerName: onlinePlayerName(),
    guestId: onlineGuestId(),
    komi: state.komi,
  })
    .then(({ code }) => {
      state.online = { code, mark: BLACK, pollTimer: null, lName: null, busy: false };
      const link = 'https://pigzap.com/games/go/?go=' + code;
      onlineStatus('Match ' + code + ' — waiting for a challenger. Send: ' + link);
      if (navigator.share) {
        navigator.share({ title: 'Go duel', text: 'Duel me — match ' + code, url: link }).catch(() => undefined);
      }
      state.online.pollTimer = setInterval(pollOnline, 3000);
    })
    .catch(() => onlineStatus('Could not create the match — check your connection.'));
}

function onlineJoin(code) {
  if (!code) return;
  onlineStatus('Joining ' + code + '…');
  onlineApi('/go/' + encodeURIComponent(code) + '/join', {
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
  onlineApi('/go/' + encodeURIComponent(state.online.code) + '?guestId=' + encodeURIComponent(onlineGuestId()))
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
  state.game = {
    cells: fromArray(view.cells),
    turn: view.turn,
    captures: [view.captures?.[0] || 0, view.captures?.[1] || 0],
    passes: view.passes || 0,
    previous: fromArray(view.previous || []),
    komi: view.komi,
  };
  state.lastMove = view.lastMove || null;
  renderAll();
  if (view.status === 'finished' && !state.locked) {
    state.locked = true;
    const s = view.score;
    const isDraw = !s?.winner;
    if (isDraw) state.series.draw++;
    else if (s.winner === BLACK) state.series.d++;
    else state.series.l++;
    saveSeries(currentSetupKey(), state.series);
    renderMiniSeries();
    stopOnlinePoll();
    setTimeout(() => showOverlay(isDraw, s?.winner, s), 450);
  }
}

function sendOnlineMove(idx) {
  state.online.busy = true;
  onlineApi('/go/' + encodeURIComponent(state.online.code) + '/move', {
    guestId: onlineGuestId(),
    idx: idx === null ? null : idx,
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

/* ---- share ------------------------------------------------------------------------------- */

function shareText() {
  const url = 'https://pigzap.com/games/go/';
  const score = '⚫ ' + state.series.d + ' · ⚪ ' + state.series.l + ' · draws ' + state.series.draw;
  if (state.mode === '2p') return t('share2p', { score, url });
  return t('share1p', { setup: 'Go 9×9 vs the computer (' + state.difficulty + ')', score, url });
}

function shareUrls() {
  const url = 'https://pigzap.com/games/go/';
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

/* ---- wiring --------------------------------------------------------------------------------- */

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
  savePrefs({ mode: state.mode, difficulty: state.difficulty, komi: state.komi });
}

function init() {
  els.screenMenu = document.getElementById('screen-menu');
  els.screenPlaying = document.getElementById('screen-playing');
  els.board = document.getElementById('board');
  els.turn = document.getElementById('turn');
  els.hintLine = document.getElementById('hint-line');
  els.barDark = document.getElementById('bar-dark');
  els.barCount = document.getElementById('bar-count');
  els.capDark = document.getElementById('cap-dark');
  els.capLight = document.getElementById('cap-light');
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
  bindSegmented(document.getElementById('komi-segmented'), 'data-komi', (raw) => {
    const komi = Number(raw);
    if (KOMIS.indexOf(komi) === -1) return;
    state.komi = komi;
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
  document.getElementById('btn-pass').addEventListener('click', pass);

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
    const cell = e.target.closest('.intersection');
    if (!cell) return;
    onPointTap(Number(cell.dataset.idx));
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

  // storage.js keys the level as `difficulty` and the handicap as `komi`
  const prefs = loadPrefs();
  if (prefs) {
    state.mode = prefs.mode;
    state.difficulty = prefs.difficulty;
    state.komi = prefs.komi ?? DEFAULT_KOMI;
    applyModeUi(state.mode);
    syncSegmented(document.getElementById('mode-segmented'), 'data-mode', state.mode);
    syncSegmented(document.getElementById('difficulty-segmented'), 'data-difficulty', state.difficulty);
    syncSegmented(document.getElementById('komi-segmented'), 'data-komi', String(state.komi));
  }

  refreshSeriesFromStorage();
  renderSeriesCard();
  showScreen('menu');

  const goCode = new URLSearchParams(window.location.search).get('go');
  if (goCode) {
    state.mode = 'online';
    applyModeUi('online');
    syncSegmented(document.getElementById('mode-segmented'), 'data-mode', 'online');
    renderSeriesCard();
    els.onlineCode.value = goCode.toUpperCase().slice(0, 6);
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
  if (new URLSearchParams(window.location.search).has('debug')) {
    window.__GO = state;
  }
}

/* share-count pings (prod API; fire-and-forget, best-effort). */
(function () {
  var API = 'https://api.pigzap.com/api/v1/share-counts';
  var SLUG = 'go';
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
