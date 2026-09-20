/**
 * ============================================================================
 * Word Puzzle — game.js (Game 04, plan/games/04-word-puzzle.md)
 * ============================================================================
 * Plain ESM, no build step (same convention as games 01/02/03). The pure
 * model lives in core.js — the test surface; this file renders it, takes
 * drag/tap/keyboard input, runs the timer, awards stars and keeps per-level
 * progress. It only auto-inits when the board exists in the DOM, so
 * importing it (harnesses) has no side effects. Per plan §11, no analytics
 * and no site coupling.
 *
 * Input model (plan §2/§7.5): pointerdown anchors. A drag through cells
 * live-highlights the straight line; releasing evaluates it. A tap (down+up
 * on one cell) leaves the anchor pulsing — a second tap on a collinear cell
 * submits, on the anchor cancels, on a stray cell re-anchors. Keyboard:
 * arrows rove focus, Enter anchors/submits, Escape cancels.
 *
 * QA hook: ?seed=<int>&theme=<id>&level=1..3 regenerates a deterministic
 * board (same idea as flying-snake's ?debug=1; the P3 daily puzzle builds
 * on the same seeding).
 * ============================================================================
 */
import {
  formatTime,
  generateLevel,
  lettersAt,
  lineCells,
  matchesWord,
  reverseAllowed,
  starsFor,
  themeSummary,
} from './core.js';
import { getMuted, loadLevels, saveResult, setMuted } from './storage.js';
import { t } from './config.js';
import THEMES from './data/themes.js';

/* ==========================================================================
 * 0. Data + pure presentation helpers
 * ======================================================================= */

/**
 * Fixed 10-color accessible palette (plan §4): [light, dark] pairs per
 * word — the light entries keep 4.5:1 on white, the dark ones on #1e293b.
 * Colors are assigned in find order; a level never ships more than 10 words.
 */
const WORD_COLORS = [
  ['#1d4ed8', '#93c5fd'], // blue
  ['#b91c1c', '#fca5a5'], // red
  ['#047857', '#6ee7b7'], // emerald
  ['#b45309', '#fcd34d'], // amber
  ['#6d28d9', '#c4b5fd'], // violet
  ['#be185d', '#f9a8d4'], // pink
  ['#0e7490', '#67e8f9'], // cyan
  ['#4d7c0f', '#bef264'], // lime
  ['#9a3412', '#fdba74'], // orange
  ['#334155', '#cbd5e1'], // slate
];

/* ==========================================================================
 * 1. Persistence — storage.js facade (Rev 2: versioned save + migrations)
 * ======================================================================= */

function loadProgress() {
  return loadLevels();
}

/* ==========================================================================
 * 2. Audio (README §3 audio.js equivalent — context on first user gesture)
 * ======================================================================= */

let audioCtx = null;

function ensureAudio() {
  try {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  } catch {
    /* no audio — fine */
  }
  return audioCtx;
}

function blip(freq, ms = 60, type = 'triangle', when = 0) {
  if (state.muted) return;
  try {
    const ctx = ensureAudio();
    if (!ctx) return;
    const t = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.setValueAtTime(0.0001, t);
    gain.exponentialRampToValueAtTime(0.12, t + 0.01);
    gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + ms / 1000 + 0.02);
  } catch {
    /* audio must never break gameplay */
  }
}

/* ==========================================================================
 * 3. State + rendering
 * ======================================================================= */

const state = {
  screen: 'menu', // menu | level
  themeIndex: 0,
  levelIndex: 0,
  theme: null,
  level: null,
  grid: null, // Array(size) of row strings
  placements: [],
  unfound: new Set(), // lowercase words still to find
  foundColors: new Map(), // word → palette index (find order)
  hintedWords: new Set(), // words whose first letter currently rings
  hintsUsed: 0,
  wrongPicks: 0,
  started: false, // clock only runs from the first interaction on
  running: false,
  playedMs: 0,
  turnStartedAt: 0,
  resultShown: false,
  resultStars: 0,
  resultTimeMs: 0,
  anchor: null, // pending tap-tap anchor {row, col}
  dragging: false,
  dragAnchor: null,
  lastDragCell: null,
  selection: [], // cells currently live-highlighted
  hintToastShown: false, // first-hint star warning, per level attempt
  seedOverride: null, // ?seed= QA hook
  muted: false,
  cellEls: new Map(), // 'r:c' → button element
  chipEls: new Map(), // word → chip element
};

const els = {};

const cellKey = (row, col) => row + ':' + col;

/** Played time, exact across pause/resume (README §2). */
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

let hudTimer = null;

function tickHud() {
  if (state.screen !== 'level' || state.resultShown) {
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
  els.screenLevel.classList.toggle('screen--active', name === 'level');
  if (name === 'menu') renderMenu();
}

/* ---- board ---------------------------------------------------------------- */

function buildBoard() {
  const n = state.level.size;
  els.board.style.setProperty('--n', String(n));
  els.board.setAttribute('aria-label', 'Word search grid, ' + n + ' by ' + n);
  els.board.innerHTML = '';
  state.cellEls.clear();
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'cell';
      cell.dataset.row = String(r);
      cell.dataset.col = String(c);
      cell.textContent = state.grid[r][c].toUpperCase();
      cell.setAttribute('tabindex', r === 0 && c === 0 ? '0' : '-1');
      cell.setAttribute(
        'aria-label',
        'row ' + (r + 1) + ' column ' + (c + 1) + ', letter ' + state.grid[r][c]
      );
      state.cellEls.set(cellKey(r, c), cell);
      els.board.appendChild(cell);
    }
  }
}

function buildWordList() {
  els.words.innerHTML = '';
  state.chipEls.clear();
  state.level.words.forEach((word, i) => {
    const li = document.createElement('li');
    li.className = 'word-chip';
    li.dataset.word = word.toLowerCase();
    li.textContent = word;
    li.setAttribute('aria-label', 'word ' + (i + 1) + ', ' + word.length + ' letters'); // plan §7.6
    state.chipEls.set(word.toLowerCase(), li);
    els.words.appendChild(li);
  });
}

function cellAt(row, col) {
  return state.cellEls.get(cellKey(row, col));
}

function readCell(el) {
  return { row: Number(el.dataset.row), col: Number(el.dataset.col) };
}

function sameCell(a, b) {
  return !!a && !!b && a.row === b.row && a.col === b.col;
}

/* ---- selection ------------------------------------------------------------ */

function setSelection(cells) {
  for (const { row, col } of state.selection) {
    const el = cellAt(row, col);
    if (el) el.classList.remove('cell--sel');
  }
  state.selection = cells || [];
  for (const { row, col } of state.selection) {
    const el = cellAt(row, col);
    if (el) el.classList.add('cell--sel');
  }
}

function setAnchor(cell) {
  clearAnchor();
  state.anchor = cell;
  const el = cellAt(cell.row, cell.col);
  if (el) el.classList.add('cell--anchor');
  blip(700, 35);
}

function clearAnchor() {
  if (state.anchor) {
    const el = cellAt(state.anchor.row, state.anchor.col);
    if (el) el.classList.remove('cell--anchor');
  }
  state.anchor = null;
}

/* ---- menu ----------------------------------------------------------------- */

function themeProgress(progress, theme) {
  let stars = 0;
  let complete = true;
  for (let l = 0; l < theme.levels.length; l++) {
    const rec = progress[theme.id + ':' + (l + 1)];
    if (rec && rec.stars > 0) stars += rec.stars;
    else complete = false;
  }
  return { stars, complete };
}

function firstIncomplete(progress) {
  for (let t = 0; t < THEMES.themes.length; t++) {
    const theme = THEMES.themes[t];
    for (let l = 0; l < theme.levels.length; l++) {
      const rec = progress[theme.id + ':' + (l + 1)];
      if (!rec || rec.stars === 0) return { themeIndex: t, levelIndex: l };
    }
  }
  return null;
}

function renderMenu() {
  if (!THEMES) return;
  const progress = loadProgress();
  const cards = THEMES.themes.map((theme, ti) => {
    const tp = themeProgress(progress, theme);
    const chips = theme.levels
      .map((_, l) => {
        const rec = progress[theme.id + ':' + (l + 1)];
        const stars = rec ? rec.stars : 0;
        return (
          '<button type="button" class="level-chip" data-level="' +
          l +
          '" aria-label="' +
          theme.name +
          ' level ' +
          (l + 1) +
          (stars ? ', ' + stars + ' stars' : ', not solved yet') +
          '"><span>L' +
          (l + 1) +
          '</span><span class="chip-stars">' +
          (stars ? '★'.repeat(stars) : '·') +
          '</span></button>'
        );
      })
      .join('');
    return (
      '<div class="theme-card' +
      (tp.complete ? ' is-complete' : '') +
      '" data-theme="' +
      ti +
      '">' +
      '<span class="theme-emoji">' +
      theme.emoji +
      '</span>' +
      '<span class="theme-name">' +
      theme.name +
      (tp.complete ? ' 🏆' : '') +
      '</span>' +
      '<span class="theme-stars">' +
      tp.stars +
      '/9 stars</span>' +
      '<div class="level-chips">' +
      chips +
      '</div>' +
      '</div>'
    );
  });
  els.themeCards.innerHTML = cards.join('');

  const next = firstIncomplete(progress);
  state.continueTarget = next;
  els.btnContinue.classList.toggle('hidden', !next);
  if (next) {
    const theme = THEMES.themes[next.themeIndex];
    els.continueSub.textContent = theme.name + ' · Level ' + (next.levelIndex + 1);
  }
}

/* ---- game flow ------------------------------------------------------------ */

function startLevel(themeIndex, levelIndex) {
  const theme = THEMES.themes[themeIndex];
  const level = theme.levels[levelIndex];
  state.themeIndex = themeIndex;
  state.levelIndex = levelIndex;
  state.theme = theme;
  state.level = level;

  const seed =
    state.seedOverride !== null ? state.seedOverride : Math.floor(Math.random() * 0x7fffffff);
  const gen = generateLevel(level, seed);
  state.grid = gen.grid;
  state.placements = gen.placements;

  state.unfound = new Set(gen.placements.map((p) => p.word));
  state.foundColors = new Map();
  state.hintedWords = new Set();
  state.hintsUsed = 0;
  state.wrongPicks = 0;
  state.started = false;
  state.playedMs = 0;
  state.running = false;
  state.resultShown = false;
  state.anchor = null;
  state.dragging = false;
  state.selection = [];
  state.hintToastShown = false;
  els.overlayResult.classList.add('hidden');
  els.board.classList.remove('board--drag-invalid');

  holdClock(); // no-op safety if a previous round was still ticking
  state.playedMs = 0;
  els.hudTime.textContent = formatTime(0);
  els.hudHints.textContent = String(MAX_HINTS);
  els.btnHint.disabled = false;

  clearAnchor();
  setSelection([]);
  buildBoard();
  buildWordList();
  showScreen('level');
}

/**
 * Judge a released selection (plan §2): match against the unfound words
 * (or their reverse on L3). A refound word is a correct-but-noop; anything
 * else is a wrong pick — red flash, +1, selection clears.
 */
function evaluate(cells) {
  clearAnchor();
  if (state.screen !== 'level' || state.resultShown) return;
  setSelection([]);
  if (!cells || cells.length < 2) return; // a stray single tap is not a pick

  const letters = lettersAt(state.grid, cells);
  const allowRev = reverseAllowed(state.level.size);

  for (const word of state.foundColors.keys()) {
    if (matchesWord(letters, word, allowRev)) {
      toast(t('alreadyFound')); // plan §7.3: correct-but-noop, no penalty
      return;
    }
  }
  for (const word of state.unfound) {
    if (matchesWord(letters, word, allowRev)) {
      lockWord(word, cells);
      return;
    }
  }
  wrongPick(cells);
}

function lockWord(word, cells) {
  state.unfound.delete(word);
  const paletteIndex = state.foundColors.size;
  state.foundColors.set(word, paletteIndex);
  const [light, dark] = WORD_COLORS[paletteIndex % WORD_COLORS.length];

  for (const { row, col } of cells) {
    const el = cellAt(row, col);
    if (!el) continue;
    if (!el.classList.contains('cell--found')) {
      // the first word to claim a shared letter keeps its color
      el.style.setProperty('--wc', light);
      el.style.setProperty('--wc-d', dark);
      el.classList.add('cell--found');
    }
    restartPop(el);
  }

  // the hint ring comes off once its word is found
  if (state.hintedWords.has(word)) {
    state.hintedWords.delete(word);
    const p = state.placements.find((pl) => pl.word === word);
    if (p) {
      const el = cellAt(p.row, p.col);
      if (el) el.classList.remove('cell--hinted');
    }
  }

  const chip = state.chipEls.get(word);
  if (chip) {
    chip.style.setProperty('--wc', light);
    chip.style.setProperty('--wc-d', dark);
    chip.classList.add('word-chip--found');
    chip.setAttribute('aria-label', chip.getAttribute('aria-label') + ', found');
  }

  blip(523, 70);
  blip(784, 90, 'triangle', 0.07);
  if (state.unfound.size === 0) winLevel();
}

function wrongPick(cells) {
  state.wrongPicks++;
  blip(140, 90, 'square');
  for (const { row, col } of cells) {
    const el = cellAt(row, col);
    if (!el || el.classList.contains('cell--found')) continue;
    el.classList.remove('cell--wrong');
    void el.offsetWidth; // restart the animation on rapid repeats
    el.classList.add('cell--wrong');
    setTimeout(() => el.classList.remove('cell--wrong'), 320);
  }
}

function restartPop(el) {
  el.classList.remove('cell--pop');
  void el.offsetWidth;
  el.classList.add('cell--pop');
  setTimeout(() => el.classList.remove('cell--pop'), 350);
}

/* ---- hints (3 per level — ring the first letter of an unfound word) ------- */

const MAX_HINTS = 3;

function useHint() {
  if (state.screen !== 'level' || state.resultShown) return;
  if (state.hintsUsed >= MAX_HINTS || state.unfound.size === 0) return;
  const remaining = [...state.unfound];
  const word = remaining[Math.floor(Math.random() * remaining.length)];
  const p = state.placements.find((pl) => pl.word === word);
  if (!p) return;
  state.hintsUsed++;
  state.hintedWords.add(word);
  // First hint of this attempt: name the cost while there's still time to
  // play without it (suggestion 03 item 2 — session flag, never persists).
  if (!state.hintToastShown) {
    state.hintToastShown = true;
    toast(t('hintStarToast'));
  }
  const el = cellAt(p.row, p.col);
  if (el) el.classList.add('cell--hinted');
  els.hudHints.textContent = String(MAX_HINTS - state.hintsUsed);
  if (state.hintsUsed >= MAX_HINTS) els.btnHint.disabled = true;
  blip(880, 90);
}

/* ---- win ------------------------------------------------------------------ */

function winLevel() {
  holdClock();
  state.resultShown = true;
  const timeMs = Math.round(playedMs());
  const timeSec = Math.round(timeMs / 1000);
  const stars = starsFor(state.level.parSec, timeSec, state.hintsUsed, state.wrongPicks);
  const levelNo = state.levelIndex + 1;
  const { record, newBest } = saveResult(state.theme.id, levelNo, stars, timeMs);

  // result overlay (plan §4): time, stars, words found; theme-complete variant
  const themeComplete = state.levelIndex === state.theme.levels.length - 1;
  state.resultStars = stars;
  state.resultTimeMs = timeMs;
  els.resultEmoji.textContent = themeComplete ? '🏆' : '🎉';
  els.resultTitle.textContent = themeComplete
    ? t('themeCompleteTitle', { theme: state.theme.name })
    : 'Level complete!';
  els.resultStars.innerHTML = [0, 1, 2]
    .map(
      (i) => '<span class="star' + (i < stars ? ' star--on' : '') + '" aria-hidden="true">⭐</span>'
    )
    .join('');
  els.resultStars.setAttribute('aria-label', stars + ' of 3 stars');
  els.resultStats.textContent = formatTime(timeMs) + ' · ' + state.level.words.length + ' words';
  const progress = loadProgress();
  const tp = themeProgress(progress, state.theme);
  let sub;
  if (themeComplete) {
    sub =
      t('themeCompleteSub', { stars: tp.stars }) +
      (tp.stars === 9 ? t('themeCompletePerfect') : '') +
      (newBest ? t('themeCompleteNewBest') : '');
  } else {
    sub =
      'Best ' +
      formatTime(record.bestTimeMs) +
      (newBest ? ' — new!' : '') +
      ' · ' +
      state.wrongPicks +
      ' wrong · ' +
      state.hintsUsed +
      ' hints';
  }
  els.resultSub.textContent = sub;

  els.btnNext.textContent = themeComplete ? '⌂ All themes' : 'Next level →';
  els.hudTime.textContent = formatTime(timeMs);
  renderThemeStrip(themeComplete, progress);
  blip(523, 90, 'triangle', 0);
  blip(659, 90, 'triangle', 0.1);
  blip(784, 160, 'triangle', 0.2);
  vibrate([30, 50, 30]);

  els.overlayResult.classList.remove('hidden');
  els.btnNext.focus();
}

/**
 * Theme-complete momentum strip (suggestion 03 item 3): the other themes
 * with their star totals, one tap from jumping into the next theme's first
 * unsolved level. Only shown when the finished level completes its theme.
 */
function renderThemeStrip(themeComplete, progress) {
  els.themeStrip.innerHTML = '';
  els.themeStrip.classList.toggle('hidden', !themeComplete);
  if (!themeComplete) return;
  THEMES.themes.forEach((theme, ti) => {
    if (ti === state.themeIndex) return;
    const summary = themeSummary(theme, progress);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-strip-chip';
    btn.innerHTML =
      '<span class="ts-emoji">' +
      theme.emoji +
      '</span><span class="ts-name">' +
      theme.name +
      '</span><span class="ts-stars">' +
      summary.stars +
      '/' +
      summary.max +
      '</span>';
    btn.setAttribute(
      'aria-label',
      theme.name +
        ', ' +
        summary.stars +
        ' of ' +
        summary.max +
        ' stars — play level ' +
        (summary.nextLevelIndex + 1)
    );
    btn.addEventListener('click', () => startLevel(ti, summary.nextLevelIndex));
    els.themeStrip.appendChild(btn);
  });
}

/* ---- share (README §2 chain: Web Share → clipboard → prompt) --------------- */

function shareText() {
  const url = window.location.origin + window.location.pathname;
  const stars = '⭐'.repeat(Math.max(1, Math.min(3, state.resultStars || 0)));
  return t('share', {
    words: state.level.words.length,
    time: formatTime(state.resultTimeMs || Math.round(playedMs())),
    stars,
    url,
  });
}

function shareUrls() {
  const url = window.location.origin + window.location.pathname;
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
      () => toast(t('copiedToast')),
      () => window.prompt(t('copyPrompt'), text)
    );
    return;
  }
  window.prompt(t('copyPrompt'), text);
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
 * 4. Input — pointer (drag + tap-tap) and keyboard (plan §2/§7.5–7.6)
 * ======================================================================= */

function noteStarted() {
  if (!state.started) {
    state.started = true;
    startClock();
    ensureHudTicker();
  }
}

function onPointerDown(e) {
  if (state.screen !== 'level' || state.resultShown) return;
  const cellEl = e.target.closest('.cell');
  if (!cellEl) return;
  ensureAudio();
  noteStarted();
  const cell = readCell(cellEl);

  if (state.anchor) {
    // second tap of tap-tap (plan §7.5): submit, cancel, or re-anchor
    tapCell(cell);
    return;
  }

  // drag start
  state.dragging = true;
  state.dragAnchor = cell;
  state.lastDragCell = cell;
  setSelection([cell]);
  try {
    els.board.setPointerCapture(e.pointerId);
  } catch {
    /* capture is best-effort — elementFromPoint works regardless */
  }
  e.preventDefault(); // no text selection / scroll while dragging
}

function onPointerMove(e) {
  if (!state.dragging) return;
  const under = document.elementFromPoint(e.clientX, e.clientY);
  const cellEl = under && under.closest ? under.closest('.cell') : null;
  if (!cellEl) return; // left the grid — clamp to the last valid cell (§7.2)
  const cell = readCell(cellEl);
  if (sameCell(cell, state.lastDragCell)) return;
  const cells = lineCells(state.grid, state.dragAnchor, cell);
  if (!cells) {
    // not a straight line from the anchor — live "invalid direction" state on
    // the held highlight (suggestion 03 item 1); the release-time check is the
    // SAME lineCells call, so live and final validity can never drift.
    els.board.classList.add('board--drag-invalid');
    return; // keep the last valid line highlighted underneath
  }
  els.board.classList.remove('board--drag-invalid');
  state.lastDragCell = cell;
  setSelection(cells);
}

function onPointerUp() {
  if (!state.dragging) return;
  state.dragging = false;
  els.board.classList.remove('board--drag-invalid');
  const cells = state.selection;
  setSelection([]);
  if (cells.length > 1) {
    evaluate(cells);
  } else {
    setAnchor(state.dragAnchor); // a tap without drag → tap-tap anchor
  }
}

function onPointerCancel() {
  state.dragging = false;
  state.lastDragCell = null;
  els.board.classList.remove('board--drag-invalid');
  setSelection([]);
}

/** Tap-tap resolution (plan §7.5) — the pointer's second tap and keyboard Enter/Space both land here. */
function tapCell(cell) {
  noteStarted();
  if (!state.anchor) {
    setAnchor(cell);
    return;
  }
  if (sameCell(cell, state.anchor)) {
    clearAnchor();
    return;
  }
  const cells = lineCells(state.grid, state.anchor, cell);
  if (cells && cells.length > 1) {
    clearAnchor();
    evaluate(cells);
  } else {
    clearAnchor();
    setAnchor(cell);
  }
}

function handleBoardKeys(e) {
  if (state.screen !== 'level' || state.resultShown) return;
  const active = document.activeElement;
  const focused =
    active && active.classList && active.classList.contains('cell') ? readCell(active) : null;
  const n = state.level.size;

  if (e.key === 'Escape') {
    if (state.anchor || state.selection.length) {
      e.preventDefault();
      clearAnchor();
      setSelection([]);
    }
    return;
  }

  const deltas = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
  if (deltas[e.key]) {
    e.preventDefault();
    const from = focused || { row: 0, col: 0 };
    const row = Math.max(0, Math.min(n - 1, from.row + deltas[e.key][0]));
    const col = Math.max(0, Math.min(n - 1, from.col + deltas[e.key][1]));
    const el = cellAt(row, col);
    if (el) {
      el.setAttribute('tabindex', '0');
      if (focused) active.setAttribute('tabindex', '-1');
      el.focus();
    }
    return;
  }

  if ((e.key === 'Enter' || e.key === ' ') && focused) {
    e.preventDefault(); // no native click — tapCell owns the semantics
    tapCell(focused);
  }
}

function handleCellFocus(e) {
  const cellEl = e.target.closest('.cell');
  if (!cellEl) return;
  // roving tabindex: the grid is one tab stop (plan §7.6)
  for (const el of state.cellEls.values()) {
    if (el !== cellEl) el.setAttribute('tabindex', '-1');
  }
  cellEl.setAttribute('tabindex', '0');
}

/* ==========================================================================
 * 5. Wiring + init
 * ======================================================================= */

function bindEls() {
  els.screenMenu = document.getElementById('screen-menu');
  els.screenLevel = document.getElementById('screen-level');
  els.board = document.getElementById('board');
  els.words = document.getElementById('words');
  els.hudTime = document.getElementById('hud-time');
  els.hudHints = document.getElementById('hud-hints');
  els.btnHint = document.getElementById('btn-hint');
  els.btnMenu = document.getElementById('btn-menu');
  els.overlayResult = document.getElementById('overlay-result');
  els.resultEmoji = document.getElementById('result-emoji');
  els.resultTitle = document.getElementById('result-title');
  els.resultStars = document.getElementById('result-stars');
  els.resultStats = document.getElementById('result-stats');
  els.resultSub = document.getElementById('result-sub');
  els.themeStrip = document.getElementById('theme-strip');
  els.btnNext = document.getElementById('btn-next');
  els.btnReplay = document.getElementById('btn-replay');
  els.btnMenu3 = document.getElementById('btn-menu3');
  els.themeCards = document.getElementById('theme-cards');
  els.btnContinue = document.getElementById('btn-continue');
  els.continueSub = document.getElementById('continue-sub');
  els.muteToggle = document.getElementById('mute-toggle');
  els.toast = document.getElementById('toast');
}

function wire() {
  els.board.addEventListener('pointerdown', onPointerDown);
  els.board.addEventListener('pointermove', onPointerMove);
  els.board.addEventListener('pointerup', onPointerUp);
  els.board.addEventListener('pointercancel', onPointerCancel);
  els.board.addEventListener('focusin', handleCellFocus);
  els.board.addEventListener('keydown', handleBoardKeys);

  els.btnMenu.addEventListener('click', () => showScreen('menu'));
  els.btnHint.addEventListener('click', () => {
    ensureAudio();
    useHint();
  });

  els.btnNext.addEventListener('click', () => {
    const themeComplete = state.levelIndex === state.theme.levels.length - 1;
    if (themeComplete) showScreen('menu');
    else startLevel(state.themeIndex, state.levelIndex + 1);
  });
  els.btnReplay.addEventListener('click', () => startLevel(state.themeIndex, state.levelIndex));
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
  els.btnMenu3.addEventListener('click', () => showScreen('menu'));

  els.themeCards.addEventListener('click', (e) => {
    const chip = e.target.closest('.level-chip');
    const card = e.target.closest('.theme-card');
    if (!card) return;
    const themeIndex = Number(card.dataset.theme);
    if (chip) {
      startLevel(themeIndex, Number(chip.dataset.level));
      return;
    }
    // the card itself starts the theme's first unsolved level (or L1)
    const progress = loadProgress();
    const theme = THEMES.themes[themeIndex];
    let levelIndex = 0;
    for (let l = 0; l < theme.levels.length; l++) {
      const rec = progress[theme.id + ':' + (l + 1)];
      if (!rec || rec.stars === 0) {
        levelIndex = l;
        break;
      }
    }
    startLevel(themeIndex, levelIndex);
  });

  els.btnContinue.addEventListener('click', () => {
    if (state.continueTarget)
      startLevel(state.continueTarget.themeIndex, state.continueTarget.levelIndex);
  });

  els.muteToggle.addEventListener('change', () => {
    state.muted = els.muteToggle.checked;
    setMuted(state.muted);
    if (!state.muted) blip(660, 80); // audible confirmation the sound is back
  });

  // The clock never elapses while the tab is hidden (§2/§7.7) — and it
  // resumes where it left off when the tab comes back.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) holdClock();
    else if (state.screen === 'level' && state.started && !state.resultShown) startClock();
  });

  // WebAudio contexts may only be created from a user gesture.
  document.addEventListener('pointerdown', ensureAudio, { once: true });
}

function init() {
  bindEls();
  wire();
  els.btnHint.textContent = t('hint');

  state.muted = getMuted();
  els.muteToggle.checked = state.muted;

  // Static ESM import (data/themes.js): no fetch, and it loads on every
  // module-capable browser — see the module header for why it is not JSON.
  if (!THEMES || !Array.isArray(THEMES.themes) || THEMES.themes.length === 0) {
    els.toast.textContent = 'Puzzle data failed to load';
    return;
  }

  // QA hook: ?seed=<int>&theme=<id>&level=1..3 (deterministic boards)
  const params = new URLSearchParams(window.location.search);
  const seed = parseInt(params.get('seed'), 10);
  if (Number.isFinite(seed)) state.seedOverride = seed >>> 0;

  renderMenu();
  showScreen('menu');

  const themeId = params.get('theme');
  if (themeId) {
    const themeIndex = THEMES.themes.findIndex((t) => t.id === themeId);
    if (themeIndex >= 0) {
      const lvl = parseInt(params.get('level'), 10);
      const levelIndex = Number.isFinite(lvl) ? Math.max(0, Math.min(2, lvl - 1)) : 0;
      startLevel(themeIndex, levelIndex);
    }
  }
}

if (typeof document !== 'undefined' && document.getElementById('board')) {
  init();
}
