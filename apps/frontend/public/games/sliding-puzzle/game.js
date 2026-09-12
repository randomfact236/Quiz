/**
 * ============================================================================
 * Sliding Puzzle — game.js (Game 03, plan/games/03-sliding-puzzle.md)
 * ============================================================================
 * Plain ESM, no build step (same convention as games 01/02/04). The pure model
 * lives in core.js — the test surface; scenes.js paints the picture rounds,
 * audio.js owns the blips, config.js the host-overridable strings and
 * storage.js the versioned persistence facade. This file renders the screens,
 * takes input and runs the timer. It only auto-inits when the board exists in
 * the DOM, so importing it (jest / harnesses) has no side effects. Per plan
 * §11, no analytics and no site coupling.
 * ============================================================================
 */
import {
  SHUFFLE_MOVES,
  SIZES,
  blankAt,
  dailySeed,
  formatTime,
  isSolved,
  mulberry32,
  scoreFor,
  shuffle,
  slideTile,
  solvedBoard,
} from './core.js';
import { SCENES, makePicture, sliceBackground } from './scenes.js';
import { blip, ensureAudio, setMuted } from './audio.js';
import {
  loadBest,
  loadDailyRecord,
  loadPrefs,
  saveBest,
  saveDailyRecord,
  savePrefs,
} from './storage.js';
import { t } from './config.js';

/* ==========================================================================
 * 0. State + rendering
 * ======================================================================= */

const state = {
  screen: 'menu', // menu | playing | paused | won
  size: 3,
  board: solvedBoard(3),
  moves: 0,
  started: false, // first move made — the clock only runs from there on
  running: false, // clock is ticking right now
  playedMs: 0, // accumulated played time across pauses
  turnStartedAt: 0, // performance.now() when the current run began
  muted: false,
  mode: 'numbers', // 'numbers' | 'picture' (P3 picture mode)
  hard: false, // pref: hard free play — picture only, no preview, no peek
  hardActive: false, // the current round runs under hard rules
  daily: false, // the current round is today's daily challenge (seeded 4×4)
  picture: null, // data URL of this round's picture (null → numbers look)
  peek: false, // picture mode: show the number pills over the slices
  tiles: new Map(), // tile value → button element
};

const els = {};

/** Fold the current menu prefs into the versioned save (storage.js facade). */
function persistPrefs() {
  savePrefs({ size: state.size, muted: state.muted, mode: state.mode, hard: state.hard });
}

/** Played time, exact across pause/resume (plan §10: ±50 ms of wall clock). */
function playedMs() {
  return state.playedMs + (state.running ? performance.now() - state.turnStartedAt : 0);
}

function startClock() {
  if (state.running) return;
  state.running = true;
  state.turnStartedAt = performance.now();
}

function holdClock() {
  if (!state.running) return;
  state.playedMs += performance.now() - state.turnStartedAt;
  state.running = false;
}

// The HUD clock is a readout, not an animation — an interval keeps it
// ticking even when rAF is throttled (occluded panes), and the tab-hidden
// auto-pause makes the hidden case moot anyway.
let hudTimer = null;

function tickHud() {
  if (state.screen !== 'playing') {
    clearInterval(hudTimer);
    hudTimer = null;
    return;
  }
  els.hudTime.textContent = formatTime(playedMs());
}

function ensureHudTicker() {
  if (!hudTimer) hudTimer = setInterval(tickHud, 200);
}

function showScreen(name) {
  state.screen = name;
  els.screenMenu.classList.toggle('screen--active', name === 'menu');
  els.screenPlaying.classList.toggle('screen--active', name !== 'menu');
  els.overlayPause.classList.toggle('hidden', name !== 'paused');
  els.overlayWin.classList.toggle('hidden', name !== 'won');
  if (name === 'menu') {
    closePreview(false);
    // a daily round forces 4×4 — the menu reflects the saved free-play size
    state.size = loadPrefs().size;
    renderMenuBests();
    renderDaily();
  }
  if (name === 'paused') els.btnResume.focus();
  if (name === 'won') els.btnAgain.focus();
  if (name === 'playing') ensureHudTicker();
}

/** Tiles are keyed by value (plan §6); each is told its board cell via --x/--y. */
function renderTiles(delays) {
  const n = state.size;
  const pos = new Array(state.board.length);
  for (let i = 0; i < state.board.length; i++) pos[state.board[i]] = i;
  for (let v = 1; v < state.board.length; v++) {
    const el = state.tiles.get(v);
    const i = pos[v];
    el.style.transitionDelay = delays && delays.has(v) ? delays.get(v) + 'ms' : '';
    el.style.setProperty('--x', String(i % n));
    el.style.setProperty('--y', String(Math.floor(i / n)));
    // Position travels with the tile, so a screen reader can follow the board
    // (the visible number is aria-hidden; this label is the tile's identity).
    el.setAttribute(
      'aria-label',
      'Tile ' + v + ', row ' + (Math.floor(i / n) + 1) + ', column ' + ((i % n) + 1)
    );
  }
}

function buildBoard() {
  els.board.style.setProperty('--n', String(state.size));
  els.board.setAttribute('aria-label', 'Sliding puzzle board, ' + state.size + ' by ' + state.size);
  els.board.innerHTML = '';
  state.tiles.clear();
  const pictureUsable = !!state.picture; // startRound already decided who gets a picture
  els.board.classList.toggle('board--picture', pictureUsable);
  els.board.classList.toggle('board--peek', pictureUsable && state.peek);
  for (let v = 1; v < state.size * state.size; v++) {
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'tile';
    tile.dataset.value = String(v);
    const num = document.createElement('span');
    num.className = 'tile-num';
    num.textContent = String(v);
    num.setAttribute('aria-hidden', 'true'); // the button's label already says it
    tile.appendChild(num);
    if (pictureUsable) {
      // Each tile owns the fixed slice matching its value (plan P3) — the
      // picture assembles exactly when the board reaches the solved state.
      const slice = sliceBackground(v - 1, state.size);
      tile.style.backgroundImage = 'url("' + state.picture + '")';
      tile.style.backgroundSize = slice.size;
      tile.style.backgroundPosition = slice.position;
    }
    tile.setAttribute('aria-label', 'Tile ' + v);
    state.tiles.set(v, tile);
    els.board.appendChild(tile);
  }
  renderTiles();
}

/* ---- menu ---------------------------------------------------------------- */

function bestLine(size) {
  const best = loadBest(size);
  if (!best) return 'No record yet';
  return 'Best ' + formatTime(best.timeMs) + ' · ' + best.moves + ' moves';
}

function renderMenuBests() {
  for (const size of SIZES) {
    document.getElementById('best-' + size).textContent = bestLine(size);
    document
      .getElementById('card-' + size)
      .setAttribute('aria-checked', state.size === size ? 'true' : 'false');
  }
}

const DATE_FMT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

/** The daily button's sub-line: today's date and, once solved, the result. */
function renderDaily() {
  const now = new Date();
  const rec = loadDailyRecord(now);
  let sub = DATE_FMT.format(now) + ' · 4×4';
  if (rec) sub += ' · ✓ ' + formatTime(rec.timeMs) + ' · ' + rec.moves + ' moves';
  els.dailySub.textContent = sub;
}

/* ---- game flow ------------------------------------------------------------ */

/**
 * `daily` starts today's challenge: the classic 4×4, seeded with the date so
 * every player — and every replay — gets the exact same board. Hard free
 * play forces the picture look and takes the aids away (plan: challenge).
 */
function startRound(daily = false) {
  closePreview(false);
  if (daily) state.size = 4;
  state.daily = daily;
  state.hardActive = state.hard && !daily;
  const wantPicture = state.hardActive || state.mode === 'picture';
  state.board = shuffle(
    state.size,
    SHUFFLE_MOVES[state.size],
    daily ? mulberry32(dailySeed(new Date())) : Math.random
  );
  state.moves = 0;
  state.started = false;
  state.playedMs = 0;
  state.running = false;
  state.peek = false;
  // Picture mode renders a fresh procedural scene every round (plan P3);
  // a null result (no canvas) silently falls back to the numbers look.
  state.picture = wantPicture ? makePicture(Math.floor(Math.random() * SCENES.length)) : null;
  els.btnPeek.classList.toggle('hidden', !state.picture || state.hardActive);
  els.btnPeek.setAttribute('aria-pressed', 'false');
  // Daily boards are seeded, so shuffling cannot change them — hide the
  // button rather than offer an action that does nothing.
  els.btnShuffle.classList.toggle('hidden', daily);
  els.picPreview.classList.toggle('hidden', !state.picture || state.hardActive);
  if (state.picture) {
    // corner reference: full target picture + the n×n grid overlaid
    els.picPreview.style.backgroundImage = 'url("' + state.picture + '")';
    els.picPreview.style.setProperty('--n', String(state.size));
  }
  buildBoard();
  els.hudTime.textContent = formatTime(0);
  els.hudMoves.textContent = '0';
  showScreen('playing');
}

/**
 * One slide, per plan §7.6: state updates immediately and the transition
 * animation catches up — input is never queued behind animation.
 */
function attemptSlide(index) {
  if (state.screen !== 'playing') return; // menu / paused / won — input locked (§7.7)
  const result = slideTile(state.board, state.size, index);
  if (!result) {
    shakeTile(index);
    return;
  }
  if (!state.started) {
    state.started = true;
    startClock();
    ensureHudTicker();
  }
  state.board = result.board;
  state.moves += result.moved;
  els.hudMoves.textContent = String(state.moves);
  renderTiles(staggerDelays(result.moved > 1 ? result.pushed : null));
  announceMove(result.moved);
  if (result.moved === 1) {
    blip(520, 45);
  } else {
    blip(430, 40);
    blip(520, 40, 'triangle', 0.04);
  }
  if (isSolved(state.board)) win();
}

/** Segment pushes glide tile by tile (plan §7.1): 40 ms stagger, blank-first. */
function staggerDelays(pushed) {
  if (!pushed) return null;
  const delays = new Map();
  for (let k = 0; k < pushed.length; k++) delays.set(pushed[k], k * 40);
  return delays;
}

/** Polite live-region update so non-visual players hear each move (plan §7.4). */
function announceMove(movedCount) {
  if (!els.boardStatus) return;
  const blank = state.board.indexOf(0);
  const row = Math.floor(blank / state.size) + 1;
  const col = (blank % state.size) + 1;
  els.boardStatus.textContent =
    'Moved ' +
    movedCount +
    (movedCount === 1 ? ' tile' : ' tiles') +
    '. ' +
    state.moves +
    (state.moves === 1 ? ' move' : ' moves') +
    '. Blank at row ' +
    row +
    ', column ' +
    col +
    '.';
}

function shakeTile(index) {
  const v = state.board[index];
  if (!v) return; // blank or out of range — nothing to shake
  const el = state.tiles.get(v);
  el.classList.remove('tile--shake');
  void el.offsetWidth; // restart the animation on rapid repeat taps
  el.classList.add('tile--shake');
  blip(140, 80, 'square');
  setTimeout(() => el.classList.remove('tile--shake'), 320);
}

/* ---- win ------------------------------------------------------------------ */

function win() {
  holdClock();
  const timeMs = Math.round(playedMs());
  // Score and the HUD clock must agree: formatTime floors, so floor here too.
  const seconds = Math.floor(timeMs / 1000);
  const score = scoreFor(state.size, state.moves, seconds);
  const variant = state.hardActive ? 'hard' : null;

  // A daily run updates today's record (badges compare against it) and,
  // since it is a real assisted 4×4 solve, the normal 4×4 best as well.
  let best;
  let newTime;
  let newMoves;
  if (state.daily) {
    ({ best, newTime, newMoves } = saveDailyRecord(new Date(), timeMs, state.moves));
    saveBest(state.size, timeMs, state.moves);
  } else {
    ({ best, newTime, newMoves } = saveBest(state.size, timeMs, state.moves, variant));
  }

  els.winStats.textContent =
    formatTime(timeMs) + ' · ' + state.moves + ' moves · ' + score + ' points';
  els.badgeTime.classList.toggle('hidden', !newTime);
  els.badgeMoves.classList.toggle('hidden', !newMoves);
  els.winBest.textContent =
    (state.daily ? "Today's best " : 'Best ') +
    formatTime(best.timeMs) +
    ' · ' +
    best.moves +
    ' moves';
  if (state.size < SIZES[SIZES.length - 1] && !state.daily) {
    els.btnBigger.classList.remove('hidden');
    els.btnBigger.textContent = 'Bigger grid — ' + (state.size + 1) + '×' + (state.size + 1);
  } else {
    els.btnBigger.classList.add('hidden');
  }

  els.hudTime.textContent = formatTime(timeMs);
  blip(523, 90, 'triangle', 0);
  blip(659, 90, 'triangle', 0.1);
  blip(784, 160, 'triangle', 0.2);
  vibrate([30, 50, 30]);

  // Input is locked right now (plan §7.7); in picture mode the blank gets
  // its slice back so the player briefly sees the completed picture before
  // the overlay slides in. The guard keeps a stale reveal from firing after
  // a fast Restart.
  state.screen = 'won';
  if (state.picture) {
    fillBlankSlice();
    setTimeout(() => {
      if (state.screen === 'won') showScreen('won');
    }, 900);
  } else {
    showScreen('won');
  }
}

/** Drops the final slice into the blank socket — the picture completes. */
function fillBlankSlice() {
  const n = state.size;
  const ghost = document.createElement('div');
  ghost.className = 'tile tile--ghost';
  ghost.setAttribute('aria-hidden', 'true');
  const slice = sliceBackground(n * n - 1, n);
  ghost.style.backgroundImage = 'url("' + state.picture + '")';
  ghost.style.backgroundSize = slice.size;
  ghost.style.backgroundPosition = slice.position;
  ghost.style.transform = 'translate(calc(' + (n - 1) + ' * 100%), calc(' + (n - 1) + ' * 100%))';
  els.board.appendChild(ghost);
}

/* ---- target-picture preview (picture mode): corner thumb → enlarge ------- */

let previewOpen = false;

function openPreview() {
  if (!state.picture || state.screen === 'menu') return;
  els.previewImage.style.backgroundImage = 'url("' + state.picture + '")';
  els.overlayPreview.classList.remove('hidden');
  previewOpen = true;
  els.btnPreviewClose.focus();
}

function closePreview(restoreFocus = true) {
  if (!previewOpen) return;
  previewOpen = false;
  els.overlayPreview.classList.add('hidden');
  if (restoreFocus && !els.picPreview.classList.contains('hidden')) {
    els.picPreview.focus();
  }
}

/* ---- pause (plan §4/§7.3: opaque overlay, board hidden, clock held) -------- */

function pauseGame() {
  if (state.screen !== 'playing') return;
  closePreview(false);
  holdClock();
  showScreen('paused');
}

function resumeGame() {
  if (state.screen !== 'paused') return;
  if (state.started) startClock(); // clock only ever ran after the first move
  showScreen('playing');
}

/* ---- share (README §2 chain: Web Share → clipboard → prompt) --------------- */

function shareText() {
  const url = window.location.origin + window.location.pathname;
  const result = formatTime(playedMs()) + ' · ' + state.moves + ' moves';
  if (state.daily) {
    return t('shareDaily', { result, url });
  }
  const mode = state.hardActive ? ' on hard mode' : '';
  return t('share', { size: state.size, mode, result, url });
}

function share() {
  const text = shareText();
  if (navigator.share) {
    navigator.share({ title: 'Sliding Puzzle', text }).catch(() => {
      /* user dismissed the sheet */
    });
    return;
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(
      () => toast('Result copied to clipboard 📋'),
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

/* ==========================================================================
 * 1. Input
 * ======================================================================= */

function handleBoardClick(e) {
  const tile = e.target.closest('.tile');
  if (!tile) return;
  attemptSlide(state.board.indexOf(Number(tile.dataset.value)));
}

/**
 * Keyboard play (plan §7.4): arrows move the tile *into* the blank — the
 * tile travels in the arrow direction (ArrowLeft slides the tile right of
 * the blank leftwards). Enter/Space on a focused tile is the native button
 * click. Focus rings stay visible (:focus-visible in CSS).
 */
function handleKeys(e) {
  if (e.key === 'Escape' && previewOpen) {
    e.preventDefault();
    closePreview();
    return;
  }
  if (state.screen !== 'playing' || previewOpen) return; // arrows locked while peeking at the target
  const n = state.size;
  const blank = blankAt(state.board);
  const row = Math.floor(blank / n);
  const col = blank % n;
  let target = null;
  if (e.key === 'ArrowLeft' && col < n - 1) target = blank + 1;
  else if (e.key === 'ArrowRight' && col > 0) target = blank - 1;
  else if (e.key === 'ArrowUp' && row < n - 1) target = blank + n;
  else if (e.key === 'ArrowDown' && row > 0) target = blank - n;
  if (target !== null) {
    e.preventDefault();
    attemptSlide(target);
  }
}

/* ==========================================================================
 * 2. Wiring + init
 * ======================================================================= */

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

/** Keep Tab inside the open dialog (pause / win / target-preview). */
function openDialog() {
  return [els.overlayPause, els.overlayWin, els.overlayPreview].find(
    (el) => el && !el.classList.contains('hidden')
  );
}

function handleDialogTab(e) {
  if (e.key !== 'Tab') return;
  const dialog = openDialog();
  if (!dialog) return;
  const focusables = dialog.querySelectorAll(
    'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (!dialog.contains(document.activeElement)) {
    e.preventDefault();
    first.focus();
    return;
  }
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

function init() {
  els.screenMenu = document.getElementById('screen-menu');
  els.screenPlaying = document.getElementById('screen-playing');
  els.board = document.getElementById('board');
  els.hudTime = document.getElementById('hud-time');
  els.hudMoves = document.getElementById('hud-moves');
  els.overlayPause = document.getElementById('overlay-pause');
  els.overlayWin = document.getElementById('overlay-win');
  els.winStats = document.getElementById('win-stats');
  els.winBest = document.getElementById('win-best');
  els.badgeTime = document.getElementById('badge-time');
  els.badgeMoves = document.getElementById('badge-moves');
  els.btnResume = document.getElementById('btn-resume');
  els.btnAgain = document.getElementById('btn-again');
  els.btnBigger = document.getElementById('btn-bigger');
  els.btnPeek = document.getElementById('btn-peek');
  els.dailySub = document.getElementById('daily-sub');
  els.picPreview = document.getElementById('pic-preview');
  els.overlayPreview = document.getElementById('overlay-preview');
  els.boardStatus = document.getElementById('board-status');
  els.btnShuffle = document.getElementById('btn-shuffle');
  els.previewImage = document.getElementById('preview-image');
  els.btnPreviewClose = document.getElementById('btn-preview-close');
  els.toast = document.getElementById('toast');

  const prefs = loadPrefs();
  state.size = prefs.size;
  state.muted = prefs.muted;
  state.mode = prefs.mode;
  state.hard = prefs.hard;
  setMuted(state.muted);
  const muteToggle = document.getElementById('mute-toggle');
  muteToggle.checked = state.muted;
  muteToggle.addEventListener('change', () => {
    state.muted = muteToggle.checked;
    setMuted(state.muted);
    persistPrefs();
    if (!state.muted) blip(660, 80); // audible confirmation the sound is back
  });

  const hardToggle = document.getElementById('hard-toggle');
  hardToggle.checked = state.hard;
  hardToggle.addEventListener('change', () => {
    state.hard = hardToggle.checked;
    persistPrefs();
  });

  const pictureMode = document.getElementById('picture-mode');
  for (const btn of pictureMode.querySelectorAll('button[data-pmode]')) {
    btn.setAttribute(
      'aria-checked',
      btn.getAttribute('data-pmode') === state.mode ? 'true' : 'false'
    );
  }
  bindSegmented(pictureMode, 'data-pmode', (mode) => {
    state.mode = mode;
    persistPrefs();
  });

  els.btnPeek.addEventListener('click', () => {
    state.peek = !state.peek;
    els.btnPeek.setAttribute('aria-pressed', state.peek ? 'true' : 'false');
    els.board.classList.toggle('board--peek', state.peek && !!state.picture);
  });

  els.picPreview.addEventListener('click', openPreview);
  els.btnPreviewClose.addEventListener('click', () => closePreview());
  els.overlayPreview.addEventListener('click', (e) => {
    if (e.target === els.overlayPreview) closePreview(); // tap on the backdrop
  });

  bindSegmented(document.getElementById('size-cards'), 'data-size', (raw) => {
    state.size = Number(raw);
    persistPrefs();
    renderMenuBests();
  });

  document.getElementById('btn-play').addEventListener('click', () => {
    ensureAudio();
    startRound(false);
  });
  document.getElementById('btn-daily').addEventListener('click', () => {
    ensureAudio();
    startRound(true);
  });
  document.getElementById('btn-menu').addEventListener('click', () => showScreen('menu'));
  document.getElementById('btn-pause').addEventListener('click', pauseGame);
  document.getElementById('btn-restart').addEventListener('click', () => startRound(state.daily));
  document.getElementById('btn-shuffle').addEventListener('click', () => startRound(state.daily));
  els.btnResume.addEventListener('click', resumeGame);
  document.getElementById('btn-restart2').addEventListener('click', () => startRound(state.daily));
  document.getElementById('btn-menu2').addEventListener('click', () => showScreen('menu'));
  els.btnAgain.addEventListener('click', () => startRound(state.daily));
  document.getElementById('btn-menu3').addEventListener('click', () => showScreen('menu'));
  els.btnBigger.addEventListener('click', () => {
    state.size = Math.min(state.size + 1, SIZES[SIZES.length - 1]);
    persistPrefs();
    startRound(false); // leaves the daily — bigger grids are free play
  });
  document.getElementById('btn-share').addEventListener('click', share);

  els.board.addEventListener('click', handleBoardClick);
  document.addEventListener('keydown', handleKeys);
  document.addEventListener('keydown', handleDialogTab);

  // The clock never elapses while the tab is hidden (§2/§7.3).
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseGame();
  });

  // WebAudio contexts may only be created from a user gesture.
  document.addEventListener('pointerdown', ensureAudio, { once: true });

  renderMenuBests();
  showScreen('menu');
}

if (typeof document !== 'undefined' && document.getElementById('board')) {
  init();
}
