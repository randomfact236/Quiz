/**
 * ============================================================================
 * Memory Quiz — game.js (Game 08, upgrade architecture: thin shell)
 * ============================================================================
 * Plain ESM, no build step. The pure model lives in core.js (spec-driven);
 * data/levels.js is the level ladder, data/questions.js the question-type
 * registry, data/modes.js the mode table, data/packs.js the content packs;
 * audio.js owns the blips, config.js the host-overridable flags/strings and
 * storage.js the versioned persistence facade (v2). This file renders the
 * screens, takes input and runs the countdowns. It only auto-inits when the
 * grid exists in the DOM, so importing it (jest / harnesses) has no side
 * effects. Per plan §11, no analytics and no site coupling.
 *
 * Run loop: MENU → MEMORIZE → (QUESTION → FEEDBACK)×N → BLANK → next board …
 * - campaign mode: one board per level → LEVEL CLEAR card → next level
 * - ladder modes (endless/zen/hard/kids/time-attack/daily): boards climb
 *   levelFor(position, 'ladder') until the hearts run out
 * PAUSED holds every countdown (plan §7.1). One rAF ticker drives all phases
 * through a single phaseLeft accumulator.
 * ============================================================================
 */
import {
  FEEDBACK_BLANK_MS,
  FEEDBACK_MS,
  dailySeed,
  formatCountdown,
  itemName,
  lintPacks,
  localPercentile,
  mulberry32,
  pickQuestions,
  buildBoard,
  starsFor,
} from './core.js';
import { QUESTION_TYPES } from './data/questions.js';
import {
  LEVELS,
  drawShuffleCards,
  levelFor,
  levelUnlocked,
  lintLevels,
  nextLevelId,
} from './data/levels.js';
import { MODES, MODE_ORDER, modeById, rulesFor } from './data/modes.js';
import { PACKS, DEFAULT_PACK_ID, packById } from './data/packs.js';
import { blip, ensureAudio, setMuted } from './audio.js';
import {
  loadBest,
  loadDailyRecord,
  loadHistory,
  loadLevelRecords,
  loadPrefs,
  saveDailyRecord,
  saveLevelResult,
  savePrefs,
  saveRunResult,
} from './storage.js';
import { GAME_CONFIG, t } from './config.js';

/* ==========================================================================
 * 0. State + element registry
 * ======================================================================= */

const state = {
  screen: 'menu', // menu | play | shuffle
  paused: false,
  phase: 'idle', // idle | memorize | question | feedback | blank | gameover
  phaseLeft: 0, // ms remaining in the current phase
  phaseTotal: 0, // ms the phase started with (ring fraction)
  mode: 'campaign', // campaign | endless | zen | hard | kids | timeAttack | daily | shuffle
  modePref: 'campaign', // menu selection (persisted)
  selectedLevelId: 'l01', // campaign tile selection (persisted)
  levelId: null, // the level being played (campaign / shuffle card)
  level: null, // active level spec
  effectiveLevel: null, // level spec with the mode's rules merged in
  shuffleCard: null, // { cardId, levelId, modeId } while a Mystery Mix card is played
  position: 1, // 1-based ladder position (ladder modes)
  questionWindowS: 10,
  board: null, // { cells, items, pack } from buildBoard
  questions: [],
  questionIndex: 0,
  removedCell: -1, // socket shown while a missing question is active
  hearts: 3,
  score: 0,
  streak: 0,
  bestStreak: 0,
  boardsCleared: 0,
  pack: PACKS[0],
  muted: false,
  lastPointerAt: 0, // 50 ms double-tap debounce (plan §7.5)
};

// Mystery Mix session (suggestion 08 task 2): one draw per menu entry, held
// in memory — returning from a run re-renders it (stars refreshed), only a
// fresh entry from the menu re-draws.
let shuffleDraw = [];
const shuffleRevealed = new Set();

const els = {};
let cellEls = [];

const RING_CIRCUMFERENCE = 62.83; // 2π × r(10) — matches the viewBox in index.html

const isTimedPhase = () =>
  state.phase === 'memorize' ||
  state.phase === 'question' ||
  state.phase === 'feedback' ||
  state.phase === 'blank';

const activeMode = () => modeById(state.mode);
const isCampaign = () => state.mode === 'campaign';
const isDaily = () => state.mode === 'daily';

/* ==========================================================================
 * 1. The one ticker — rAF + phaseLeft accumulator
 * ======================================================================= */

let raf = 0;
let lastTick = 0;
let ticking = false;

function startTicker() {
  if (ticking) return;
  ticking = true;
  lastTick = performance.now();
  raf = requestAnimationFrame(onTick);
}

function stopTicker() {
  ticking = false;
  cancelAnimationFrame(raf);
}

function onTick(now) {
  if (!ticking) return;
  const dt = now - lastTick;
  lastTick = now;
  if (!state.paused && isTimedPhase()) {
    state.phaseLeft -= dt;
    if (state.phaseLeft <= 0) {
      state.phaseLeft = 0;
      phaseExpired();
    }
  }
  renderPhase();
  if (ticking) raf = requestAnimationFrame(onTick);
}

/** The current phase ran out — advance the run loop. */
function phaseExpired() {
  switch (state.phase) {
    case 'memorize':
      beginQuestion(0);
      break;
    case 'question':
      state.unanswered += 1; // BUG-021: an expired question counts as unanswered
      gradeMiss(1, 'timeout');
      break;
    case 'feedback':
      endFeedback();
      break;
    case 'blank':
      startBoard();
      break;
  }
}

/* ==========================================================================
 * 2. Screens + HUD
 * ======================================================================= */

function showScreen(name) {
  state.screen = name;
  els.screenMenu.classList.toggle('screen--active', name === 'menu');
  els.screenPlay.classList.toggle('screen--active', name === 'play');
  els.screenShuffle.classList.toggle('screen--active', name === 'shuffle');
  if (name === 'menu') {
    stopTicker();
    state.paused = false;
    hideOverlays();
    renderLevelPicker();
    renderMenuBests();
    renderDaily();
  }
  if (name === 'shuffle') renderShuffle();
}

function renderHearts() {
  const max = state.maxHearts;
  if (!Number.isFinite(max)) {
    els.hudHearts.textContent = '';
    const zen = document.createElement('span');
    zen.textContent = '♾️';
    zen.setAttribute('aria-hidden', 'true');
    els.hudHearts.appendChild(zen);
    els.hudHearts.setAttribute('aria-label', 'Endless hearts');
    return;
  }
  els.hudHearts.textContent = '';
  for (let i = 0; i < max; i++) {
    const heart = document.createElement('span');
    heart.textContent = i < state.hearts ? '❤️' : '🤍';
    heart.setAttribute('aria-hidden', 'true');
    els.hudHearts.appendChild(heart);
  }
  els.hudHearts.setAttribute('aria-label', state.hearts + ' of ' + max + ' hearts');
}

function renderScore() {
  els.hudScore.textContent = String(state.score);
}

function renderPhase() {
  if (state.phase === 'memorize') {
    els.bannerText.textContent = t('memorizeBanner', { seconds: formatCountdown(state.phaseLeft) });
  }
  const timed = state.phase === 'memorize' || state.phase === 'question';
  els.ring.style.visibility = timed ? 'visible' : 'hidden';
  const frac = state.phaseTotal > 0 ? state.phaseLeft / state.phaseTotal : 0;
  els.ring.style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - frac));
}

/** Polite live-region update so non-visual players hear the run (plan §4). */
function announce(message) {
  if (els.playStatus) els.playStatus.textContent = message;
}

/* ==========================================================================
 * 3. Run + board flow
 * ======================================================================= */

/**
 * Start a run. Campaign plays the level `levelId` (one board); ladder modes
 * climb from level 1; daily replays today's seeded board (Snacks, fixed —
 * deterministic for everyone, plan §2); shuffle plays one Mystery Mix card:
 * a specific level under the card mode's hearts + rules (suggestion 08).
 */
function startRun(modeId, levelId, shuffleCard = null) {
  const mode = modeById(modeId);
  state.mode = mode.id;
  state.shuffleCard = mode.id === 'shuffle' && shuffleCard ? shuffleCard : null;
  // A card's own mode carries the hearts (hard card = 1 heart, zen = no fail).
  const heartsMode = state.shuffleCard ? modeById(state.shuffleCard.modeId) : mode;
  state.levelId =
    mode.levelSource === 'campaign' || state.shuffleCard ? levelId || state.selectedLevelId : null;
  state.pack = isDaily() ? packById(DEFAULT_PACK_ID) : state.pack;
  state.position = 1;
  state.maxHearts = heartsMode.hearts;
  state.hearts = heartsMode.hearts;
  state.score = 0;
  state.streak = 0;
  state.bestStreak = 0;
  state.boardsCleared = 0;
  showScreen('play');
  hideOverlays();
  renderHearts();
  renderScore();
  startBoard();
}

function startBoard() {
  const mode = activeMode();
  if (mode.levelSource === 'campaign') {
    state.level = LEVELS.find((l) => l.id === state.levelId) || LEVELS[0];
    state.position = LEVELS.indexOf(state.level) + 1;
  } else {
    state.level = levelFor(state.position, 'ladder');
  }
  // A Mystery Mix card merges its own mode's rules too (card mode wins —
  // e.g. a time-attack card tightens the window on any level).
  const cardMode = state.shuffleCard ? modeById(state.shuffleCard.modeId) : null;
  state.effectiveLevel = {
    ...state.level,
    rules: cardMode
      ? { ...(state.level.rules || {}), ...(cardMode.rules || {}), ...(mode.rules || {}) }
      : rulesFor(mode, state.level),
  };
  state.questionWindowS = state.effectiveLevel.rules.questionS || state.level.questionS;

  const seed = isDaily()
    ? (dailySeed(new Date()) * 100 + state.position) >>> 0
    : (Math.random() * 0xffffffff) >>> 0; // campaign/ladder boards are random per attempt (D3)
  state.board = buildBoard(state.pack, state.level, seed);
  state.questions = pickQuestions(
    state.board,
    state.level,
    mulberry32((seed ^ 0x5bf03635) >>> 0),
    QUESTION_TYPES
  );
  state.questionIndex = 0;
  state.removedCell = -1;
  state.unanswered = 0; // BUG-021: timeouts block the next-level advance

  // Campaign levels are gated by completion; ladder modes climb waves — the
  // HUD never calls a wave a "level" so the two can't be confused.
  els.hudLevelLabel.textContent = mode.levelSource === 'campaign' ? 'Level' : 'Wave';
  els.hudLevel.textContent = String(
    mode.levelSource === 'campaign' ? LEVELS.indexOf(state.level) + 1 : state.position
  );
  els.hudBoardWrap.classList.toggle('hidden', mode.levelSource === 'campaign');
  els.hudBoard.textContent = String(state.position);
  renderHearts();

  renderBoard();
  const windowS = state.effectiveLevel.memorizeS + (state.effectiveLevel.rules.memorizeBonusS || 0);
  state.phase = 'memorize';
  state.phaseTotal = state.phaseLeft = windowS * 1000;
  els.bannerText.textContent = t('memorizeBanner', { seconds: windowS });
  announce(
    (mode.levelSource === 'campaign'
      ? 'Level ' + state.position + '. '
      : 'Board ' + state.position + '. ') + t('memorizeBanner', { seconds: windowS })
  );
  blip(430, 50);
  startTicker();
}

function beginQuestion(index) {
  state.questionIndex = index;
  const q = state.questions[index];
  const type = QUESTION_TYPES[q.type];
  hideCandidates();
  hideReveals();
  setBoardHidden(true); // memorize is over — the items vanish (plan §4)
  state.removedCell = -1;
  if (q.effect && q.effect.kind === 'hideItem') {
    state.removedCell = q.effect.cell;
    markRemovedCell(q.effect.cell);
  }
  const banner = type.banner(q, { locale: GAME_CONFIG.locale });
  els.bannerText.textContent = t(banner.key, banner.vars);
  const candidateItems = type.candidates(q);
  if (type.answerUi === 'candidates' && candidateItems) {
    renderCandidates(candidateItems);
    announce(
      t(banner.key, banner.vars) +
        ' ' +
        candidateItems.map((it) => itemName(it, GAME_CONFIG.locale)).join(', ') +
        '.'
    );
  } else {
    announce(t(banner.key, banner.vars));
  }
  state.phase = 'question';
  state.phaseTotal = state.phaseLeft = state.questionWindowS * 1000;
}

/**
 * Grade one answer. `picked` is a cell index (grid-answer types) or an item
 * (candidate-answer types). Empty-cell picks are real wrong answers, not
 * false starts (plan §7.2).
 */
function answer(picked) {
  if (state.screen !== 'play' || state.paused || state.phase !== 'question') return;
  const q = state.questions[state.questionIndex];
  const type = QUESTION_TYPES[q.type];
  const res = type.resolve(q, picked, {
    streak: state.streak,
    level: state.effectiveLevel,
    timeLeftMs: state.phaseLeft,
    locale: GAME_CONFIG.locale,
  });
  if (res.outcome === 'hit') {
    state.score += res.points;
    state.streak += 1;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    renderScore();
    gradeHit(res.points);
  } else {
    gradeMiss(res.heartsLost);
  }
}

function gradeHit(points) {
  applyTruth(activeTruth(false));
  setBoardHidden(false); // BUG-021: the clicked answer reveals the board images
  showFeedback(true, t('feedbackHit', { points }));
  announce('Correct. Plus ' + points + ' points.');
  blip(523, 70);
  blip(659, 90, 'triangle', 0.08);
  vibrate(20);
  toFeedbackPhase();
}

/** `heartsLost` comes from the question type's resolve (expiry included). */
function gradeMiss(heartsLost, reason = 'wrong') {
  const q = state.questions[state.questionIndex];
  const type = QUESTION_TYPES[q.type];
  const message =
    reason === 'timeout'
      ? t('feedbackTimeout')
      : (() => {
          const m = type.missMessage(q, { locale: GAME_CONFIG.locale });
          return t(m.key, m.vars);
        })();
  // The truth is always revealed (plan §10), pulsing on a miss.
  applyTruth(activeTruth(true));
  setBoardHidden(false); // BUG-021: the clicked answer reveals the board images
  showFeedback(false, message);
  state.hearts -= heartsLost;
  state.streak = 0;
  renderHearts();
  announce('Wrong. ' + message);
  blip(160, 120, 'square');
  vibrate([30, 50, 30]);
  toFeedbackPhase();
}

/** The active question type's reveal, or an empty list. */
function activeTruth(wasMiss) {
  const q = state.questions[state.questionIndex];
  const type = QUESTION_TYPES[q.type];
  return type.truth ? type.truth(q, state.board, wasMiss) : [];
}

function toFeedbackPhase() {
  state.phase = 'feedback';
  state.phaseTotal = state.phaseLeft = FEEDBACK_MS;
}

/** A question ended — next question, next board, level clear or game over. */
function endFeedback() {
  hideFeedback();
  if (state.hearts <= 0) {
    showGameover();
    return;
  }
  if (state.questionIndex + 1 < state.questions.length) {
    beginQuestion(state.questionIndex + 1);
  } else if (activeMode().levelSource === 'campaign') {
    state.boardsCleared = 1;
    showLevelClear();
  } else {
    state.boardsCleared = state.position;
    state.position += 1; // next board — the ladder escalates
    state.phase = 'blank';
    state.phaseTotal = state.phaseLeft = FEEDBACK_BLANK_MS;
    els.bannerText.textContent = ''; // blank beat: clear the stale question
    els.board.classList.add('grid--blank');
  }
}

/* ==========================================================================
 * 4. Board rendering + a11y labels
 * ======================================================================= */

function renderBoard() {
  const level = state.level;
  els.board.style.setProperty('--cols', String(level.cols));
  els.board.setAttribute('aria-label', 'Memory grid, ' + level.cols + ' by ' + level.rows);
  els.board.classList.remove('grid--blank');
  els.board.classList.remove('grid--hidden'); // fresh board: memorize shows items
  els.board.innerHTML = '';
  cellEls = [];
  const namesUnderItems = !!state.effectiveLevel.rules.namesUnderItems;
  // Grids are exactly filled (items === cols×rows) — every cell is a block.
  for (let i = 0; i < state.board.cells.length; i++) {
    const item = state.board.cells[i];
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'cell';
    cell.dataset.index = String(i);
    const glyph = document.createElement('span');
    glyph.setAttribute('aria-hidden', 'true');
    glyph.className = 'glyph';
    glyph.textContent = item.emoji;
    glyph.dataset.fallback = item.emoji.slice(0, 2); // first grapheme (surrogate pair aware enough)
    if (namesUnderItems) {
      const small = document.createElement('small');
      small.textContent = itemName(item, GAME_CONFIG.locale);
      glyph.appendChild(small);
    }
    cell.appendChild(glyph);
    applyCellAria(cell, i, item);
    cellEls.push(cell);
    els.board.appendChild(cell);
  }
  ensureGlyphs();
}

/**
 * Glyph fallback for devices that cannot render an emoji (plan §7.7): a span
 * that takes no width is swapped for the item's first letter — a plain,
 * text-shadow-free letter, still aria-hidden.
 */
function ensureGlyphs() {
  for (const glyph of els.board.querySelectorAll('.glyph')) {
    if (glyph.offsetWidth === 0 && glyph.textContent) {
      glyph.textContent = (glyph.dataset.fallback || '?').toUpperCase();
      glyph.className = 'glyph-fallback';
    }
  }
}

function applyCellAria(cell, index, item) {
  const pos = spokenCell(index);
  cell.setAttribute(
    'aria-label',
    item ? pos + ', ' + itemName(item, GAME_CONFIG.locale) : pos + ', empty'
  );
}

function spokenCell(index) {
  return (
    'row ' +
    (Math.floor(index / state.level.cols) + 1) +
    ', column ' +
    ((index % state.level.cols) + 1)
  );
}

/**
 * Hide/show the board's items for the question phase (plan §4: the grid
 * stays visible — the structure, not the answers). While hidden, cell
 * aria-labels stop naming items so the announced grid cannot leak answers.
 */
function setBoardHidden(hidden) {
  els.board.classList.toggle('grid--hidden', hidden);
  for (let i = 0; i < cellEls.length; i++) {
    if (hidden) cellEls[i].setAttribute('aria-label', spokenCell(i));
    else applyCellAria(cellEls[i], i, state.board.cells[i]);
  }
}

/** Clear the feedback reveals — the next question is answered from memory. */
function hideReveals() {
  for (const cell of cellEls) cell.classList.remove('cell--reveal');
}

/**
 * Apply the active question type's truth reveal: restore the item glyph
 * (or empty a socket), name it again for screen readers, punch through the
 * hidden grid, and pulse when the answer was missed.
 */
function applyTruth(entries, pulse) {
  for (const entry of entries) {
    const cell = cellEls[entry.cell];
    if (!cell) continue;
    cell.classList.add('cell--reveal');
    const glyph = cell.firstChild;
    glyph.textContent = entry.item ? entry.item.emoji : '';
    glyph.className = 'glyph';
    if (entry.item) {
      cell.setAttribute(
        'aria-label',
        spokenCell(entry.cell) + ', ' + itemName(entry.item, GAME_CONFIG.locale)
      );
    } else {
      cell.setAttribute('aria-label', spokenCell(entry.cell) + ', empty');
    }
    if (entry.pulse && pulse) pulseCell(entry.cell);
  }
  state.removedCell = -1;
}

/** The missing item's cell becomes a truthful empty socket (plan §7.3). */
function markRemovedCell(index) {
  const cell = cellEls[index];
  if (!cell) return;
  cell.classList.add('cell--removed');
  cell.firstChild.textContent = '';
  applyCellAria(cell, index, null);
}

function pulseCell(index) {
  const cell = cellEls[index];
  if (!cell) return;
  cell.classList.remove('cell--pulse');
  void cell.offsetWidth; // restart the animation on rapid repeats
  cell.classList.add('cell--pulse');
  setTimeout(() => cell.classList.remove('cell--pulse'), 900);
}

/* ---- candidate row (candidate-answer question types) -------------------------- */

function renderCandidates(candidates) {
  els.candidates.innerHTML = '';
  for (const item of candidates) {
    const btn = document.createElement('button');
    btn.type = 'button';
    const emoji = document.createElement('span');
    emoji.className = 'cand-emoji';
    emoji.textContent = item.emoji;
    emoji.setAttribute('aria-hidden', 'true');
    const name = document.createElement('span');
    name.className = 'cand-name';
    name.textContent = itemName(item, GAME_CONFIG.locale);
    btn.appendChild(emoji);
    btn.appendChild(name);
    btn.setAttribute('aria-label', itemName(item, GAME_CONFIG.locale));
    btn.addEventListener('click', () => answer(item));
    els.candidates.appendChild(btn);
  }
  els.candidates.classList.remove('hidden');
}

function hideCandidates() {
  els.candidates.classList.add('hidden');
  els.candidates.innerHTML = '';
}

/* ==========================================================================
 * 5. Feedback + overlays
 * ======================================================================= */

function showFeedback(hit, message) {
  els.feedbackCard.textContent = (hit ? '✓ ' : '✗ ') + message;
  els.feedbackCard.classList.toggle('feedback-card--hit', hit);
  els.feedbackCard.classList.toggle('feedback-card--miss', !hit);
  els.overlayFeedback.classList.remove('hidden');
}

function hideFeedback() {
  els.overlayFeedback.classList.add('hidden');
}

function openOverlay(name) {
  els.overlayPause.classList.toggle('hidden', name !== 'pause');
  els.overlayGameover.classList.toggle('hidden', name !== 'gameover');
  els.overlayLevelClear.classList.toggle('hidden', name !== 'levelclear');
}

function hideOverlays() {
  openOverlay('none');
  hideFeedback();
}

/* ---- pause (plan §7.1: countdowns hold, not restart) -------------------------- */

function pauseGame() {
  if (state.screen !== 'play' || state.paused || state.phase === 'gameover') return;
  state.paused = true;
  // Pausing during memorize must not become free studying (game 03's rule:
  // the board stays hidden) — questions already play with items hidden.
  if (state.phase === 'memorize') setBoardHidden(true);
  openOverlay('pause');
  els.btnResume.focus();
}

function resumeGame() {
  if (!state.paused) return;
  state.paused = false;
  if (state.phase === 'memorize') setBoardHidden(false); // study time resumes
  openOverlay('none');
}

/* ---- level clear (campaign, plan §4.5 stars) ------------------------------------- */

function showLevelClear() {
  state.phase = 'gameover';
  stopTicker();
  hideCandidates();
  // Stars count the hearts the run STARTED with (a shuffle card's mode may
  // carry fewer) — and no-fail modes (zen) have none to lose: 0 lost.
  const heartsLost = Number.isFinite(state.maxHearts) ? state.maxHearts - state.hearts : 0;
  const stars = starsFor(heartsLost, true);
  const { record, newBest, newStars } = saveLevelResult(
    state.levelId,
    state.score,
    state.bestStreak,
    stars
  );

  els.clearTitle.textContent = t('levelCleared', { n: LEVELS.indexOf(state.level) + 1 });
  els.clearStars.textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
  els.clearStats.textContent =
    state.score + (state.score === 1 ? ' point' : ' points') + ' · best streak ' + state.bestStreak;
  els.badgeLevelBest.classList.toggle('hidden', !newBest);
  els.badgeLevelStars.classList.toggle('hidden', !newStars);
  els.clearBest.textContent =
    'Level best ' + record.best.score + ' · best streak ' + record.best.bestStreak;
  const onShuffleCard = state.mode === 'shuffle';
  const nextId = onShuffleCard ? null : nextLevelId(state.levelId);
  // BUG-021: a question left unanswered (timer ran out) blocks the next level —
  // the player must replay it instead of advancing.
  const blockedByTimeout = state.unanswered > 0;
  els.btnNext.classList.toggle('hidden', !nextId || blockedByTimeout);
  els.btnCards.classList.toggle('hidden', !onShuffleCard);
  els.clearTimeoutNote.classList.toggle('hidden', !blockedByTimeout);
  // BUG-021: the congratulations card shows every image of the board — the
  // ones the questions clicked plus all the others.
  els.clearItems.innerHTML = '';
  for (const cell of state.board.cells) {
    if (!cell) continue; // sockets stay out of the gallery
    const chip = document.createElement('span');
    chip.className = 'clear-item';
    chip.textContent = cell.emoji;
    chip.setAttribute('aria-label', itemName(cell, GAME_CONFIG.locale));
    els.clearItems.appendChild(chip);
  }
  openOverlay('levelclear');
  (blockedByTimeout
    ? els.btnRetry2
    : nextId
      ? els.btnNext
      : onShuffleCard
        ? els.btnCards
        : els.btnRetry2
  ).focus();
  blip(523, 90, 'triangle', 0);
  blip(659, 90, 'triangle', 0.1);
  blip(784, 160, 'triangle', 0.2);
  vibrate([30, 50, 30]);
}

/* ---- game over (ladder runs + failed campaign levels) ----------------------------- */

function showGameover() {
  state.phase = 'gameover';
  stopTicker();
  hideCandidates();
  const priorHistory = loadHistory().map((run) => run.score);
  const { best, newBest } = saveRunResult(
    state.score,
    state.bestStreak,
    state.boardsCleared,
    Date.now(),
    { mode: state.mode, level: state.levelId || '' }
  );
  if (isDaily()) saveDailyRecord(new Date(), state.score);

  els.goStats.textContent =
    state.score +
    (state.score === 1 ? ' point' : ' points') +
    ' · best streak ' +
    state.bestStreak +
    ' · ' +
    state.boardsCleared +
    (state.boardsCleared === 1 ? ' board' : ' boards');
  els.badgeBest.classList.toggle('hidden', !newBest);
  const pct = localPercentile(state.score, priorHistory);
  els.badgeTop.textContent = 'Top ' + pct + '%';
  els.badgeTop.classList.remove('hidden');
  els.goBest.textContent = 'Best score ' + best.score + ' · best streak ' + best.bestStreak;
  els.btnCards2.classList.toggle('hidden', state.mode !== 'shuffle');
  openOverlay('gameover');
  els.btnAgain.focus();
  blip(392, 110);
  blip(330, 110, 'triangle', 0.12);
  blip(262, 180, 'triangle', 0.24);
}

/* ---- share (README §2 chain: Web Share → clipboard → prompt) ---------------- */

function shareUrls() {
  const url = window.location.origin + window.location.pathname;
  const vars = { score: state.score, boards: state.boardsCleared, streak: state.bestStreak, url };
  let text;
  if (isCampaign() && state.levelId) {
    const stars =
      (loadLevelRecords()[state.levelId] && loadLevelRecords()[state.levelId].stars) || 0;
    text = t('shareLevel', {
      level: state.level.label,
      stars: '★'.repeat(stars) + '☆'.repeat(3 - stars),
      score: state.score,
      url,
    });
  } else if (isDaily()) {
    text = t('shareDaily', vars);
  } else {
    text = t('share', vars);
  }
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
 * 6. Input
 * ======================================================================= */

/** 50 ms pointerdown debounce keeps a rapid double-tap a single answer (§7.5). */
function debounced() {
  const now = performance.now();
  if (now - state.lastPointerAt < 50) return true;
  state.lastPointerAt = now;
  return false;
}

function handleBoardPointerDown(e) {
  const cell = e.target.closest('.cell');
  if (!cell) return;
  if (debounced()) return;
  handleCellTap(Number(cell.dataset.index));
}

function handleBoardClick(e) {
  const cell = e.target.closest('.cell');
  if (!cell) return;
  if (e.detail > 0) return; // pointer path already handled above; click = keyboard only
  handleCellTap(Number(cell.dataset.index));
}

function handleCellTap(index) {
  // Studying is free — taps during MEMORIZE are ignored (plan §2.1). Grid
  // taps only answer grid-answer question types (candidates have their own row).
  if (state.screen !== 'play' || state.paused || state.phase !== 'question') return;
  const q = state.questions[state.questionIndex];
  if (!q || QUESTION_TYPES[q.type].answerUi !== 'grid') return;
  answer(index);
}

/* ==========================================================================
 * 7. Menu (mode chips, level picker, pack chips, best line, daily)
 * ======================================================================= */

function selectChip(container, chip) {
  for (const other of container.querySelectorAll('button')) {
    other.setAttribute('aria-checked', other === chip ? 'true' : 'false');
  }
}

function renderModePicker() {
  els.modePicker.innerHTML = '';
  for (const id of MODE_ORDER) {
    const mode = MODES[id];
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.setAttribute('role', 'radio');
    chip.dataset.mode = mode.id;
    chip.textContent = mode.label;
    chip.setAttribute('aria-checked', mode.id === state.modePref ? 'true' : 'false');
    chip.addEventListener('click', () => {
      state.modePref = mode.id;
      selectChip(els.modePicker, chip);
      persistPrefs();
      renderLevelPicker();
      blip(480, 40);
    });
    els.modePicker.appendChild(chip);
  }
}

function renderLevelPicker() {
  const campaign = state.modePref === 'campaign';
  els.levelPickerWrap.classList.toggle('hidden', !campaign);
  if (!campaign) return;
  const records = loadLevelRecords();
  const unlockOpts = { unlockAll: !!GAME_CONFIG.flags.unlockAll, grants: GAME_CONFIG.grants };
  els.levelPicker.innerHTML = '';
  LEVELS.forEach((level, i) => {
    const unlocked = levelUnlocked(level, records, unlockOpts);
    const record = records[level.id];
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.setAttribute('role', 'radio');
    tile.className = 'level-tile';
    tile.dataset.level = level.id;
    const num = document.createElement('span');
    num.textContent = String(i + 1);
    tile.appendChild(num);
    if (!unlocked) {
      tile.disabled = true;
      const lock = document.createElement('span');
      lock.className = 'lv-lock';
      lock.textContent = '🔒';
      tile.appendChild(lock);
      tile.setAttribute('aria-label', 'Level ' + (i + 1) + ', locked');
    } else {
      const starsEl = document.createElement('span');
      starsEl.className = 'lv-stars';
      const stars = (record && record.stars) || 0;
      starsEl.textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
      tile.appendChild(starsEl);
      tile.setAttribute(
        'aria-label',
        'Level ' +
          (i + 1) +
          ', ' +
          stars +
          ' of 3 stars' +
          (level.id === state.selectedLevelId ? ', selected' : '')
      );
    }
    tile.setAttribute('aria-checked', level.id === state.selectedLevelId ? 'true' : 'false');
    tile.addEventListener('click', () => {
      if (tile.disabled) return;
      state.selectedLevelId = level.id;
      selectChip(els.levelPicker, tile);
      persistPrefs();
      blip(480, 40);
    });
    els.levelPicker.appendChild(tile);
  });
}

function renderPackPicker() {
  els.packPicker.innerHTML = '';
  for (const pack of PACKS) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.setAttribute('role', 'radio');
    chip.dataset.pack = pack.id;
    chip.textContent = pack.items[0].emoji + ' ' + pack.title;
    chip.setAttribute('aria-checked', pack.id === state.pack.id ? 'true' : 'false');
    chip.addEventListener('click', () => {
      state.pack = pack;
      selectChip(els.packPicker, chip);
      persistPrefs();
      blip(480, 40);
    });
    els.packPicker.appendChild(chip);
  }
}

function renderMenuBests() {
  const best = loadBest();
  const records = loadLevelRecords();
  const totalStars = Object.values(records).reduce((sum, r) => sum + r.stars, 0);
  let line;
  if (best.score > 0) {
    line = 'Best score ' + best.score + ' · best streak ' + best.bestStreak;
  } else {
    line = 'No best score yet — play a run!';
  }
  if (totalStars > 0) line += ' · ⭐ ' + totalStars + '/' + LEVELS.length * 3;
  els.menuBest.textContent = line;
}

const DATE_FMT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

function renderDaily() {
  if (!GAME_CONFIG.flags.dailyEnabled) {
    els.btnDaily.classList.add('hidden');
    return;
  }
  els.btnDaily.classList.remove('hidden');
  const now = new Date();
  const rec = loadDailyRecord(now);
  let sub = DATE_FMT.format(now) + ' · Snacks';
  if (rec) sub += ' · ✓ ' + rec.score + ' points';
  els.dailySub.textContent = sub;
}

function persistPrefs() {
  savePrefs({
    muted: state.muted,
    pack: state.pack.id,
    mode: state.modePref,
    levelId: state.selectedLevelId,
  });
}

/* ==========================================================================
 * 8. Wiring + init
 * ======================================================================= */

/** Keep Tab inside the open dialog (pause / game over / level clear). */
function handleDialogTab(e) {
  if (e.key !== 'Tab' || state.screen !== 'play') return;
  const dialog = [els.overlayPause, els.overlayGameover, els.overlayLevelClear].find(
    (el) => el && !el.classList.contains('hidden')
  );
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

function handleKeys(e) {
  if (e.key === 'Escape' && state.screen === 'play' && state.phase !== 'gameover') {
    e.preventDefault();
    if (state.paused) resumeGame();
    else pauseGame();
  }
}

/** Replay exactly what is on screen (campaign level / daily / ladder / card). */
function replayCurrent() {
  startRun(state.mode, state.levelId || state.selectedLevelId, state.shuffleCard);
}

/* ==========================================================================
 * 7½. Mystery Mix (suggestion 08 task 2)
 * ======================================================================= */

/** Fresh entry from the menu: re-draw the hand, forget any reveals. */
function enterShuffle() {
  const records = loadLevelRecords();
  const opts = { unlockAll: !!GAME_CONFIG.flags.unlockAll, grants: GAME_CONFIG.grants };
  shuffleDraw = drawShuffleCards(MODE_ORDER, records, { count: 6, opts });
  shuffleRevealed.clear();
  showScreen('shuffle');
}

function renderShuffle() {
  els.shuffleGrid.innerHTML = '';
  els.shuffleTagline.textContent =
    shuffleDraw.length === 0
      ? 'Unlock a level or two, then come back for a mix.'
      : shuffleDraw.length + ' cards · flip as many as you like — no limits, no timer.';
  const records = loadLevelRecords();
  for (const card of shuffleDraw) {
    const level = LEVELS.find((l) => l.id === card.levelId);
    const cardMode = modeById(card.modeId);
    const open = shuffleRevealed.has(card.cardId);
    const cardEl = document.createElement(open ? 'div' : 'button');
    if (!open) {
      cardEl.type = 'button';
      cardEl.className = 'shuffle-card';
      cardEl.textContent = '🂠';
      cardEl.setAttribute('aria-label', 'Mystery card — tap to flip');
      cardEl.addEventListener('click', () => {
        shuffleRevealed.add(card.cardId);
        blip(480, 40);
        renderShuffle();
      });
    } else {
      cardEl.className = 'shuffle-card shuffle-card--open';
      const levelEl = document.createElement('span');
      levelEl.className = 'sc-level';
      levelEl.textContent = String(LEVELS.indexOf(level) + 1);
      const modeEl = document.createElement('span');
      modeEl.className = 'sc-mode';
      modeEl.textContent = cardMode.label;
      const stars = (records[card.levelId] && records[card.levelId].stars) || 0;
      const starsEl = document.createElement('span');
      starsEl.className = 'sc-stars';
      starsEl.textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
      starsEl.setAttribute('aria-label', stars + ' of 3 stars');
      const play = document.createElement('button');
      play.type = 'button';
      play.className = 'primary sc-play';
      play.textContent = '▶ Play';
      play.setAttribute(
        'aria-label',
        'Play level ' + (LEVELS.indexOf(level) + 1) + ', ' + cardMode.label
      );
      play.addEventListener('click', () => {
        ensureAudio();
        startRun('shuffle', card.levelId, card);
      });
      cardEl.appendChild(levelEl);
      cardEl.appendChild(modeEl);
      cardEl.appendChild(starsEl);
      cardEl.appendChild(play);
    }
    els.shuffleGrid.appendChild(cardEl);
  }
}

function init() {
  els.screenMenu = document.getElementById('screen-menu');
  els.screenPlay = document.getElementById('screen-play');
  els.screenShuffle = document.getElementById('screen-shuffle');
  els.board = document.getElementById('board');
  els.candidates = document.getElementById('candidates');
  els.playStatus = document.getElementById('play-status');
  els.hudHearts = document.getElementById('hud-hearts');
  els.hudScore = document.getElementById('hud-score');
  els.hudLevel = document.getElementById('hud-level');
  els.hudLevelLabel = document.getElementById('hud-level-label');
  els.hudBoard = document.getElementById('hud-board');
  els.hudBoardWrap = document.getElementById('hud-board-wrap');
  els.bannerText = document.getElementById('banner-text');
  els.ring = document.getElementById('ring-fill');
  els.modePicker = document.getElementById('mode-picker');
  els.levelPicker = document.getElementById('level-picker');
  els.levelPickerWrap = document.getElementById('level-picker-wrap');
  els.packPicker = document.getElementById('pack-picker');
  els.menuBest = document.getElementById('menu-best');
  els.dailySub = document.getElementById('daily-sub');
  els.btnDaily = document.getElementById('btn-daily');
  els.shuffleGrid = document.getElementById('shuffle-grid');
  els.shuffleTagline = document.getElementById('shuffle-tagline');
  els.overlayFeedback = document.getElementById('overlay-feedback');
  els.feedbackCard = document.getElementById('feedback-card');
  els.overlayPause = document.getElementById('overlay-pause');
  els.overlayGameover = document.getElementById('overlay-gameover');
  els.overlayLevelClear = document.getElementById('overlay-levelclear');
  els.clearTitle = document.getElementById('clear-title');
  els.clearStars = document.getElementById('clear-stars');
  els.clearStats = document.getElementById('clear-stats');
  els.clearBest = document.getElementById('clear-best');
  els.clearItems = document.getElementById('clear-items');
  els.clearTimeoutNote = document.getElementById('clear-timeout-note');
  els.badgeLevelBest = document.getElementById('badge-levelbest');
  els.badgeLevelStars = document.getElementById('badge-levelstars');
  els.btnNext = document.getElementById('btn-next');
  els.btnCards = document.getElementById('btn-cards');
  els.btnCards2 = document.getElementById('btn-cards2');
  els.goStats = document.getElementById('go-stats');
  els.goBest = document.getElementById('go-best');
  els.badgeBest = document.getElementById('badge-best');
  els.badgeTop = document.getElementById('badge-top');
  els.btnResume = document.getElementById('btn-resume');
  els.btnAgain = document.getElementById('btn-again');
  els.toast = document.getElementById('toast');

  // Data bug guard (plan §7.8): linted packs/levels make generation total — a
  // throw here means a bad data edit, surfaced loudly in dev instead of mid-run.
  try {
    lintLevels(LEVELS);
    lintPacks(PACKS, LEVELS, QUESTION_TYPES);
  } catch (err) {
    console.error('Memory Quiz data failed lint:', err);
  }

  const prefs = loadPrefs();
  state.muted = prefs.muted;
  state.pack = packById(prefs.pack);
  state.modePref = MODES[prefs.mode] && MODE_ORDER.includes(prefs.mode) ? prefs.mode : 'campaign';
  // A persisted level selection is honored only if it still exists and is
  // unlocked under the current records + grants.
  const unlockOpts = { unlockAll: !!GAME_CONFIG.flags.unlockAll, grants: GAME_CONFIG.grants };
  const wanted = LEVELS.find((l) => l.id === prefs.levelId);
  state.selectedLevelId =
    wanted && levelUnlocked(wanted, loadLevelRecords(), unlockOpts) ? wanted.id : 'l01';
  setMuted(state.muted);
  const muteToggle = document.getElementById('mute-toggle');
  muteToggle.checked = state.muted;
  muteToggle.addEventListener('change', () => {
    state.muted = muteToggle.checked;
    setMuted(state.muted);
    persistPrefs();
    if (!state.muted) blip(660, 80); // audible confirmation the sound is back
  });

  renderModePicker();
  renderLevelPicker();
  renderPackPicker();
  renderMenuBests();
  renderDaily();

  document.getElementById('btn-start').addEventListener('click', () => {
    ensureAudio();
    startRun(state.modePref, state.selectedLevelId);
  });
  els.btnDaily.addEventListener('click', () => {
    ensureAudio();
    startRun('daily');
  });
  document.getElementById('btn-shuffle').addEventListener('click', () => {
    ensureAudio();
    enterShuffle();
  });
  document.getElementById('btn-shuffle-menu').addEventListener('click', () => showScreen('menu'));
  els.btnCards.addEventListener('click', () => showScreen('shuffle'));
  els.btnCards2.addEventListener('click', () => showScreen('shuffle'));
  document.getElementById('btn-menu').addEventListener('click', () => showScreen('menu'));
  document.getElementById('btn-pause').addEventListener('click', pauseGame);
  els.btnResume.addEventListener('click', resumeGame);
  document.getElementById('btn-restart').addEventListener('click', replayCurrent);
  document.getElementById('btn-menu2').addEventListener('click', () => showScreen('menu'));
  els.btnAgain.addEventListener('click', replayCurrent);
  document.getElementById('btn-menu3').addEventListener('click', () => showScreen('menu'));
  document.getElementById('btn-next').addEventListener('click', () => {
    const nextId = nextLevelId(state.levelId);
    if (nextId) startRun('campaign', nextId);
  });
  document
    .getElementById('btn-retry2')
    .addEventListener('click', () => startRun('campaign', state.levelId));
  document.getElementById('btn-menu4').addEventListener('click', () => showScreen('menu'));
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

  els.board.addEventListener('pointerdown', handleBoardPointerDown);
  els.board.addEventListener('click', handleBoardClick);
  document.addEventListener('keydown', handleKeys);
  document.addEventListener('keydown', handleDialogTab);

  // Countdowns never run while the tab is hidden (plan §7.1) — auto-pause.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseGame();
  });

  // WebAudio contexts may only be created from a user gesture.
  document.addEventListener('pointerdown', ensureAudio, { once: true });

  // Test seam (games 05–07 convention): ?debug=1 exposes the pure run state —
  // read-only, no behavior change.
  try {
    if (
      typeof location !== 'undefined' &&
      new URLSearchParams(location.search).get('debug') === '1'
    ) {
      window.__MEMORY_QUIZ_DEBUG__ = {
        run: () => ({
          mode: state.mode,
          levelId: state.levelId,
          level: state.level && state.level.id,
          position: state.position,
          phase: state.phase,
          paused: state.paused,
          hearts: state.hearts,
          maxHearts: state.maxHearts,
          score: state.score,
          streak: state.streak,
          questionWindowS: state.questionWindowS,
          questionIndex: state.questionIndex,
          board: state.board && state.board.cells.map((c) => (c ? c.emoji : null)),
          questions: state.questions,
        }),
      };
    }
  } catch {
    /* no location (tests) — fine */
  }

  showScreen('menu');
}

if (typeof document !== 'undefined' && document.getElementById('board')) {
  init();
}
