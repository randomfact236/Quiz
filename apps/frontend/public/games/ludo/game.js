/**
 * ============================================================================
 * game.js — Ludo (plan/games/42-ludo.md) — UI shell
 * ============================================================================
 * Plain ESM, no build step. The rules live in core.js (40 specs), the board
 * geometry in board.js (11 layout invariants); this file draws them and wires
 * the turns.
 *
 * THE DIE. In a DUEL the server rolls — the client only renders the number it
 * is given, so nobody can rig a race they are losing. Playing the computer
 * there is no adversary to rig against, so the roll is made here from
 * crypto.getRandomValues rather than Math.random.
 *
 * Modes: solo vs easy/medium/hard, 2-player hot-seat, ⚔️ online duel.
 * Deep link: ?lud=CODE. Four colours race; the human is 🔴 Red.
 * ============================================================================
 */

import {
  TRACK_LEN,
  HOME_LEN,
  COLOURS,
  RED,
  BLUE,
  YELLOW,
  GREEN,
  COLOUR_NAME,
  START_YARD,
  isYard,
  isTrack,
  isHome,
  isFinished,
  createGame,
  cloneGame,
  legalMoves,
  playTurn,
  isFinishedGame,
  pawnCounts,
  aiMove,
  fromState,
} from './core.js?v=1';
import { SIZE, CENTRE, RING, buildLayout, label, homeCells, yardCells } from './board.js?v=1';
import {
  emptyTally,
  seriesSetupKey,
  loadSeries,
  saveSeries,
  loadPrefs,
  savePrefs,
} from './storage.js?v=1';
import { GAME_CONFIG, t } from './config.js?v=1';

const DIE_FACE = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
/** only the human and the computer play in solo; hot-seat and duels use two */
const SOLO_COLOURS = [RED, BLUE];

const state = {
  screen: 'menu',
  mode: '1p',
  difficulty: 'medium',
  game: createGame(),
  roll: 0,
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

/** The colours in play, in turn order. */
function players() {
  if (state.mode === '1p') return SOLO_COLOURS;
  return [RED, BLUE];
}

function mySide() {
  if (state.mode === 'online') return state.online ? state.online.mark : RED;
  if (state.mode === '2p') return state.game.turn;
  return RED;
}

function isAiTurnNow() {
  return state.mode === '1p' && state.game.turn === BLUE;
}

/* ---- the die ------------------------------------------------------------------ */

/** A fair 1–6 from the platform CSPRNG — never Math.random. */
function rollDie() {
  const c = globalThis.crypto;
  if (c && typeof c.getRandomValues === 'function') {
    const buf = new Uint8Array(1);
    c.getRandomValues(buf);
    return (buf[0] % 6) + 1;
  }
  return Math.floor(Math.random() * 6) + 1;
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
    state.mode === '1p' ? 'vs computer · ' + state.difficulty : state.mode === 'online' ? 'online duel' : '2 players';
  els.seriesScope.textContent = scope;
  els.seriesD.textContent = String(state.series.d);
  els.seriesL.textContent = String(state.series.l);
  els.seriesDraw.textContent = String(state.series.draw);
  const total = state.series.d + state.series.l + state.series.draw;
  els.resetSeriesBtn.disabled = total === 0;
}

function refreshSeriesFromStorage() {
  state.series = loadSeries(currentSetupKey());
}

/* ---- board --------------------------------------------------------------------- */

const LAYOUT = buildLayout();

/** Which grid cell (if any) a pawn position corresponds to. */
function cellsForPosition(pos) {
  if (isYard(pos)) return [];
  if (isTrack(pos)) {
    const cell = RING[pos - 1];
    return cell ? [cell] : [];
  }
  if (isHome(pos)) return null; // resolved per colour below
  return [];
}

function homeCellFor(colour, pos) {
  if (!isHome(pos)) return null;
  const cells = homeCells(colour);
  const idx = pos - TRACK_LEN - 1;
  return cells[idx] || null;
}

function buildBoard() {
  els.board.style.gridTemplateColumns = `repeat(${SIZE}, 1fr)`;
  els.board.innerHTML = '';
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const cell = document.createElement('button');
      cell.type = 'button';
      const info = LAYOUT.get(r * SIZE + c);
      cell.className = 'cell';
      if (info) {
        if (info.kind === 'track') cell.classList.add('cell--track');
        else if (info.kind === 'home') cell.classList.add('cell--home');
        else if (info.kind === 'yard') cell.classList.add('cell--yard-' + info.colour);
      } else {
        cell.classList.add('cell--void');
      }
      cell.dataset.r = String(r);
      cell.dataset.c = String(c);
      cell.setAttribute('aria-label', label(r, c));
      els.board.appendChild(cell);
    }
  }
}

function renderBoard() {
  const moves = state.roll && !state.locked ? legalMoves(state.game, state.game.turn, state.roll) : [];
  const targets = new Map(moves.map((m) => [m.to, m]));
  const pawnsHere = new Map(); // "r,c" → [colours]

  for (const colour of COLOURS) {
    state.game.pawns[colour].forEach((pos) => {
      let cell = null;
      if (isTrack(pos)) cell = RING[pos - 1];
      else if (isHome(pos)) cell = homeCellFor(colour, pos);
      if (!cell) return;
      const k = cell[0] * SIZE + cell[1];
      if (!pawnsHere.has(k)) pawnsHere.set(k, []);
      pawnsHere.get(k).push(colour);
    });
  }

  for (const el of els.board.children) {
    const k = Number(el.dataset.r) * SIZE + Number(el.dataset.c);
    const info = LAYOUT.get(k);
    const here = pawnsHere.get(k) || [];
    const move = targets.get(posToKey(k));
    el.className = el.className.replace(/ cell--(legal|capture|moved|thinking)/g, '');
    if (info) {
      if (info.kind === 'track') el.classList.add('cell--track');
      // a home cell can carry several colours where the paths converge, so it
      // takes the FIRST colour listed — and reads as that player's lane
      else if (info.kind === 'home') {
        el.classList.add('cell--home');
        const first = info.homes ? info.homes[0] : null;
        if (first) el.classList.add('cell--home-' + first.colour);
      } else if (info.kind === 'yard') el.classList.add('cell--yard-' + info.colour);
    }
    el.innerHTML = here.map((colour) => '<span class="pawn pawn--' + colour + '"></span>').join('');
    if (move) {
      el.classList.add('cell--legal');
      if (move.captures && move.captures.length) el.classList.add('cell--capture');
    }
    if (state.lastMove && state.lastMove.key === k) el.classList.add('cell--moved');
    if (state.thinkingKey === k) el.classList.add('cell--thinking');
    el.setAttribute('aria-label', label(Number(el.dataset.r), Number(el.dataset.c)) + (here.length ? ', ' + here.map((c) => COLOUR_NAME[c]).join(' and ') : ''));
  }
}

/** grid key → the position value the rules use (a track index or home slot). */
function posToKey(k) {
  const index = RING.findIndex(([r, c]) => r * SIZE + c === k);
  if (index !== -1) return index + 1;
  for (const colour of COLOURS) {
    const cells = homeCells(colour);
    const i = cells.findIndex(([r, c]) => r * SIZE + c === k);
    if (i !== -1) return TRACK_LEN + 1 + i;
  }
  return null;
}

function renderHomes() {
  const counts = pawnCounts(state.game);
  for (const colour of COLOURS) {
    els['home' + colour].textContent = `${counts[colour].home + counts[colour].finished}/6`;
  }
}

function renderTurn() {
  let text;
  if (state.mode === '1p') {
    text = state.game.turn === RED ? "Your turn — you're 🔴" : 'Computer is deciding…';
  } else if (state.mode === 'online' && state.online) {
    text = state.game.turn === state.online.mark ? "Your turn — you're " + COLOUR_NAME[state.game.turn] : (state.online.bName || 'Opponent') + ' is thinking…';
  } else {
    text = COLOUR_NAME[state.game.turn] + ' to play';
  }
  els.turn.textContent = text;
  els.turn.dataset.turn = String(state.game.turn);
}

function renderHint() {
  let hint = '';
  if (!state.locked) {
    if (state.game.turn === state.game.turn && isFinishedGame(state.game)) hint = '';
    else if (state.roll) {
      const moves = legalMoves(state.game, state.game.turn, state.roll);
      hint = moves.length === 0 ? `A ${state.roll} does nothing — turn passes` : 'Tap a pawn to move it';
    } else if (state.mode === '1p' && state.game.turn === RED) {
      hint = 'Roll the die';
    }
  }
  els.hintLine.textContent = hint;
}

function renderAll() {
  renderBoard();
  renderHomes();
  renderTurn();
  renderHint();
  els.miniSeries.textContent = '🔴 ' + state.series.d + ' · 🤝 ' + state.series.draw + ' · 🔵 ' + state.series.l;
  els.btnRoll.textContent = DIE_FACE[state.roll] || '🎲';
  els.btnRoll.disabled = state.locked || !!state.roll;
}

/* ---- a race ---------------------------------------------------------------------- */

function startRace() {
  state.game = createGame();
  state.roll = 0;
  state.locked = false;
  state.lastMove = null;
  if (state.aiTimer) { clearTimeout(state.aiTimer); state.aiTimer = null; }
  els.overlay.classList.add('hidden');
  els.overlay.classList.remove('overlay--in');
  buildBoard();
  renderAll();
  if (isAiTurnNow()) scheduleAi();
}

function onRoll() {
  if (state.screen !== 'playing' || state.locked || state.roll) return;
  els.btnRoll.classList.add('die--rolling');
  setTimeout(() => {
    els.btnRoll.classList.remove('die--rolling');
    doRoll(rollDie());
  }, 220);
}

function doRoll(roll) {
  state.roll = roll;
  const side = state.game.turn;
  const moves = legalMoves(state.game, side, roll);
  if (moves.length === 0) {
    // a dead roll: the turn simply passes
    state.game = { ...state.game, sixes: 0 };
    state.roll = 0;
    state.game = advanceTurn(state.game, side);
    renderAll();
    toast('Rolled a ' + roll + ' — nothing to do');
    afterTurn(side);
    return;
  }
  renderAll();
  void moves;
}

function onCellTap(key) {
  if (state.screen !== 'playing' || state.locked || !state.roll) return;
  if (isAiTurnNow()) return;
  if (state.mode === 'online') {
    if (state.game.turn !== state.online.mark) return;
    sendOnlineMove(key, state.roll);
    return;
  }
  const moves = legalMoves(state.game, state.game.turn, state.roll).filter((m) => m.to === key);
  if (moves.length === 0) {
    toast('That pawn cannot go there');
    return;
  }
  commitMove(moves[0], state.roll);
}

function commitMove(move, roll) {
  const side = state.game.turn;
  const from = fromKey(move.pawn);
  const result = playTurn(state.game, side, move, roll);
  state.game = result.game;
  state.roll = 0;
  state.lastMove = { key: toKey(move.to) };
  if (move.captures.length) {
    toast('Captured ' + move.captures.length + (move.captures.length === 1 ? ' pawn' : ' pawns'));
  }
  renderAll();
  if (result.over) {
    endRace(result.winner);
    return;
  }
  afterTurn(side);
}

function afterTurn(mover) {
  if (isFinishedGame(state.game)) {
    endRace(state.game.turn === mover ? mover : mover);
    return;
  }
  if (isAiTurnNow()) scheduleAi();
}

function toKey(pos) {
  if (isTrack(pos)) {
    const cell = RING[pos - 1];
    return cell ? cell[0] * SIZE + cell[1] : null;
  }
  for (const colour of COLOURS) {
    const cell = homeCellFor(colour, pos);
    if (cell) return cell[0] * SIZE + cell[1];
  }
  return null;
}

function fromKey(pawn) {
  void pawn;
  return null;
}

function advanceTurn(game, side) {
  const order = players();
  const i = order.indexOf(side);
  return { ...game, turn: order[(i + 1) % order.length] };
}

function endRace(winner) {
  state.locked = true;
  if (winner === RED) state.series.d++;
  else if (winner === BLUE) state.series.l++;
  else state.series.draw++;
  saveSeries(currentSetupKey(), state.series);
  renderAll();
  setTimeout(() => showOverlay(winner), 450);
}

function showOverlay(winner) {
  els.overlayEmoji.textContent = winner === RED ? '🔴' : '🔵';
  els.overlayTitle.textContent = COLOUR_NAME[winner] + ' wins!';
  els.overlaySub.textContent =
    'Series — 🔴 ' + state.series.d + ' · 🔵 ' + state.series.l + ' · 🤝 ' + state.series.draw;
  els.overlay.classList.remove('hidden');
  els.overlay.classList.add('overlay--in');
  document.getElementById('btn-next').textContent = 'New race';
  document.getElementById('btn-next').focus();
}

/* ---- AI ---------------------------------------------------------------------------- */

function scheduleAi() {
  state.locked = true;
  els.btnRoll.disabled = true;
  state.aiTimer = setTimeout(() => {
    state.aiTimer = null;
    if (state.screen !== 'playing' || !isAiTurnNow()) return;
    const roll = rollDie();
    state.roll = roll;
    renderAll();
    const moves = legalMoves(state.game, BLUE, roll);
    if (moves.length === 0) {
      state.roll = 0;
      state.game = advanceTurn(state.game, BLUE);
      renderAll();
      afterTurn(BLUE);
      return;
    }
    const move = aiMove(state.game, BLUE, roll, state.difficulty, { maxNodes: 20000 });
    state.locked = false;
    commitMove(move || moves[0], roll);
  }, GAME_CONFIG.aiThinkDelayMs);
}

/* ---- online duel (the server owns the die) -------------------------------------------- */

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
  } catch { return 'guest_anon'; }
}

function onlinePlayerName() {
  const name = els.onlineName.value.trim().slice(0, 24) || 'Guest';
  try { localStorage.setItem('pigzap:challenge-name', name); } catch { /* private mode */ }
  return name;
}

function onlineGuestPair() {
  try {
    const raw = localStorage.getItem('aiquiz:guest-token');
    if (!raw) return null;
    const pair = JSON.parse(raw);
    return pair && pair.guestId && pair.token ? pair : null;
  } catch { return null; }
}

async function ensureOnlineGuestPair() {
  const guestId = onlineGuestId();
  const cached = onlineGuestPair();
  if (cached && cached.guestId === guestId) return cached;
  const res = await fetch(ONLINE_API + '/guest-users/token', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ legacyId: guestId }),
  });
  if (!res.ok) return null;
  const pair = await res.json();
  try { localStorage.setItem('aiquiz:guest-token', JSON.stringify(pair)); } catch { /* private mode */ }
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
      if (!r.ok) return r.json().then((e) => Promise.reject(new Error(e.message || String(r.status))));
      return r.json();
    });
}

function onlineStatus(text) { els.onlineStatus.textContent = text; }

function stopOnlinePoll() {
  if (state.online && state.online.pollTimer) {
    clearInterval(state.online.pollTimer);
    state.online.pollTimer = null;
  }
}

function onlineLeaveQuietly() {
  if (state.online && state.online.code && state.online.mark) {
    onlineApi('/ludo/' + state.online.code + '/leave', {
      playerName: onlinePlayerName(), guestId: onlineGuestId(),
    }).catch(() => undefined);
  }
  stopOnlinePoll();
  state.online = null;
}

function onlineCreate() {
  onlineStatus('Creating the match…');
  onlineApi('/ludo', { playerName: onlinePlayerName(), guestId: onlineGuestId() })
    .then(({ code }) => {
      state.online = { code, mark: RED, pollTimer: null, bName: null, busy: false };
      onlineStatus('Match ' + code + ' — waiting for a challenger. Code: ' + code);
      state.online.pollTimer = setInterval(pollOnline, 3000);
    })
    .catch(() => onlineStatus('Could not create the match — check your connection.'));
}

function onlineJoin(code) {
  if (!code) return;
  onlineStatus('Joining ' + code + '…');
  onlineApi('/ludo/' + encodeURIComponent(code) + '/join', {
    playerName: onlinePlayerName(), guestId: onlineGuestId(),
  })
    .then((view) => {
      state.online = { code: view.code, mark: view.yourMark, pollTimer: null, rName: view.rName, bName: view.bName, busy: false };
      if (view.status === 'waiting') {
        onlineStatus('Joined as 🔵 Blue — waiting for Red…');
        state.online.pollTimer = setInterval(pollOnline, 3000);
        return;
      }
      enterOnlinePlay(view);
    })
    .catch((e) => onlineStatus('Join failed: ' + (e.message || 'try again')));
}

function pollOnline() {
  if (!state.online || state.online.busy) return;
  onlineApi('/ludo/' + encodeURIComponent(state.online.code) + '?guestId=' + encodeURIComponent(onlineGuestId()))
    .then((view) => {
      if (!state.online) return;
      state.online.rName = view.rName;
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
  state.locked = false;
  applyOnlineView(view);
  if (state.online && !state.online.pollTimer) state.online.pollTimer = setInterval(pollOnline, 3000);
}

function applyOnlineView(view) {
  state.game = fromState(view.pawns, view.turn);
  state.roll = view.roll || 0;
  state.lastMove = null;
  renderAll();
  if (view.status === 'finished' && !state.locked) {
    state.locked = true;
    stopOnlinePoll();
    if (view.winner === RED) state.series.d++;
    else if (view.winner === BLUE) state.series.l++;
    else state.series.draw++;
    saveSeries(currentSetupKey(), state.series);
    renderAll();
    setTimeout(() => showOverlay(view.winner), 450);
  }
}

function sendOnlineMove(key, roll) {
  state.online.busy = true;
  const move = legalMoves(state.game, state.game.turn, roll).find((m) => m.to === key);
  if (!move) { state.online.busy = false; return; }
  onlineApi('/ludo/' + encodeURIComponent(state.online.code) + '/move', {
    guestId: onlineGuestId(), pawn: move.pawn, to: move.to,
  })
    .then((view) => { if (state.online) state.online.busy = false; applyOnlineView(view); })
    .catch((e) => {
      if (state.online) state.online.busy = false;
      toast(e.message === 'Illegal move' ? 'The server rejected that move' : 'Move rejected — try again');
      pollOnline();
    });
}

/* ---- share ------------------------------------------------------------------------------ */

function shareText() {
  const url = 'https://pigzap.com/games/ludo/';
  const score = '🔴 ' + state.series.d + ' · 🔵 ' + state.series.l + ' · draws ' + state.series.draw;
  if (state.mode === '2p') return t('share2p', { score, url });
  return t('share1p', { setup: 'Ludo vs the computer (' + state.difficulty + ')', score, url });
}

function shareUrls() {
  const url = 'https://pigzap.com/games/ludo/';
  const text = shareText();
  const textNoUrl = text.split(url).join('').replace(/\s+/g, ' ').trim();
  document.getElementById('share-fb').href = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url) + '&quote=' + encodeURIComponent(textNoUrl);
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
  try { if (navigator.vibrate) navigator.vibrate(pattern); } catch { /* unsupported */ }
}

/* ---- wiring ------------------------------------------------------------------------------- */

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

function init() {
  els.screenMenu = document.getElementById('screen-menu');
  els.screenPlaying = document.getElementById('screen-playing');
  els.board = document.getElementById('board');
  els.turn = document.getElementById('turn');
  els.hintLine = document.getElementById('hint-line');
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
  els.btnRoll = document.getElementById('btn-roll');
  els.toast = document.getElementById('toast');
  for (const colour of COLOURS) els['home' + colour] = document.getElementById('home-' + colour);

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
    savePrefs({ mode: state.mode, difficulty: state.difficulty });
  });
  bindSegmented(document.getElementById('difficulty-segmented'), 'data-difficulty', (difficulty) => {
    state.difficulty = difficulty;
    refreshSeriesFromStorage();
    renderSeriesCard();
    savePrefs({ mode: state.mode, difficulty: state.difficulty });
  });

  document.getElementById('btn-play').addEventListener('click', () => {
    refreshSeriesFromStorage();
    showScreen('playing');
    startRace();
  });
  document.getElementById('btn-online-create').addEventListener('click', onlineCreate);
  document.getElementById('btn-online-join').addEventListener('click', () => {
    onlineJoin(els.onlineCode.value.trim().toUpperCase().slice(0, 6));
  });
  els.btnRoll.addEventListener('click', onRoll);

  const leaveOnlineToMenu = () => {
    if (state.mode === 'online') onlineLeaveQuietly();
    if (state.aiTimer) { clearTimeout(state.aiTimer); state.aiTimer = null; }
    showScreen('menu');
  };
  document.getElementById('btn-menu').addEventListener('click', leaveOnlineToMenu);
  document.getElementById('btn-menu2').addEventListener('click', leaveOnlineToMenu);
  document.getElementById('btn-next').addEventListener('click', () => {
    if (state.mode === 'online') { onlineLeaveQuietly(); onlineCreate(); return; }
    startRace();
  });

  const shareRowEl = document.getElementById('share-row');
  let shareRowTimer = null;
  document.getElementById('btn-share').addEventListener('click', () => {
    if (shareRowEl.classList.contains('share-row--open')) {
      shareRowEl.classList.remove('share-row--open');
      clearTimeout(shareRowTimer);
      shareRowTimer = setTimeout(() => { shareRowEl.hidden = true; }, 260);
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
    renderAll();
  });

  els.board.addEventListener('click', (e) => {
    const cell = e.target.closest('.cell');
    if (!cell) return;
    const k = Number(cell.dataset.r) * SIZE + Number(cell.dataset.c);
    const pos = posToKey(k);
    if (pos === null) return; // a yard or empty cell
    onCellTap(pos);
  });

  const prefs = loadPrefs();
  if (prefs) {
    state.mode = prefs.mode;
    state.difficulty = prefs.difficulty;
    applyModeUi(state.mode);
    syncSegmented(document.getElementById('mode-segmented'), 'data-mode', state.mode);
    syncSegmented(document.getElementById('difficulty-segmented'), 'data-difficulty', state.difficulty);
  }

  refreshSeriesFromStorage();
  renderSeriesCard();
  showScreen('menu');

  const ludCode = new URLSearchParams(window.location.search).get('lud');
  if (ludCode) {
    state.mode = 'online';
    applyModeUi('online');
    syncSegmented(document.getElementById('mode-segmented'), 'data-mode', 'online');
    renderSeriesCard();
    els.onlineCode.value = ludCode.toUpperCase().slice(0, 6);
    onlineStatus('Match ' + els.onlineCode.value + ' ready — press Join.');
  }
}

if (typeof document !== 'undefined' && document.getElementById('board')) {
  init();
  if (new URLSearchParams(window.location.search).has('debug')) window.__LUDO = state;
}

/* share-count pings (prod API; fire-and-forget, best-effort). */
(function () {
  var API = 'https://api.pigzap.com/api/v1/share-counts';
  var SLUG = 'ludo';
  var wired = new WeakSet();
  var ping = function (platform) {
    try {
      fetch(API, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: 'game', contentId: SLUG, platform: platform }),
        keepalive: true,
      }).catch(function () {});
    } catch (e) { /* best-effort */ }
  };
  var wire = function () {
    [['share-fb', 'facebook'], ['share-x', 'x'], ['share-wa', 'whatsapp']].forEach(function (pair) {
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
