/**
 * ============================================================================
 * game.js — Tap or Don't Tap (Go/No-Go reaction game) — UI shell
 * ============================================================================
 * DOM-only state machine per plan/games/01-tap-or-dont-tap.md (Rev 2):
 *   menu → waiting → signal → feedback → (next round | gameover)
 *
 * Rev 2 structure (§13): the pure model lives in core.js, persistence in
 * storage.js (versioned + migrated), feedback output in audio.js, flags/strings
 * in config.js. This file is only the state machine + DOM wiring. The engine
 * auto-inits when the game root exists, so importing this module in tests has
 * no side effects.
 *
 * All reaction timing uses performance.now() — never Date.now(). Every timer
 * is registered in `timers` and cleared on pause, so visibilitychange can
 * safely kill an in-flight wait/signal (resume restarts the current round).
 * ============================================================================
 */

import {
  SLUG,
  TOTAL_HEARTS,
  MIN_WAIT_MS,
  MAX_WAIT_MS,
  RESIST_POINTS,
  DECOY_IGNORE_POINTS,
  SWAP_FROM_ROUND,
  SWAP_CHANCE,
  SWAP_ROUNDS,
  windowMsForRound,
  generateRound,
  resolveRound,
  localPercentile,
  sparklinePoints,
} from './core.js';
import { GAME_CONFIG, t } from './config.js';
import { getBest, getHistory, getMuted, setMuted, recordRun } from './storage.js';
import { blip, buzz, setMuted as setAudioMuted } from './audio.js';

/** Feedback overlay dwell: the outcome shows, then the next round begins (ms). */
const FEEDBACK_MS = 400;

/* ------------------------------ engine ------------------------------ */

const $ = (id) => document.getElementById(id);

const els = {};
let state = 'menu';
let score = 0;
let hearts = TOTAL_HEARTS;
let round = 0;
let streak = 0;
let bestMsThisRun = null;
let signalSpec = null;
let signalShownAt = 0;
let swapStartRound = null; // round the current rule flip started on (null = off)
let runStartScoreHistory = [];
let pausedFrom = null;
const timers = new Set();
let lastFeedbackWasStroop = false;

function after(ms, fn) {
  const t = setTimeout(() => {
    timers.delete(t);
    fn();
  }, ms);
  timers.add(t);
  return t;
}

function clearTimers() {
  for (const t of timers) clearTimeout(t);
  timers.clear();
}

/* ----- state machine ----- */

function setState(next) {
  state = next;
  els.root.dataset.state = next; // test/e2e hook — kept in sync with the machine
  const sections = {
    menu: els.stateMenu,
    waiting: els.stateWaiting,
    signal: els.stateSignal,
    gameover: els.stateGameover,
  };
  for (const [name, el] of Object.entries(sections)) {
    el.hidden = name !== next;
  }
  // 'feedback' hides every section (dark under the overlay). HUD shows in play.
  els.hud.hidden = next === 'menu' || next === 'gameover';
  els.swapBanner.hidden = !isSwapActive();
}

function isSwapActive() {
  return swapStartRound !== null && round >= swapStartRound && round < swapStartRound + SWAP_ROUNDS;
}

function renderHud() {
  els.hearts.textContent = '❤️'.repeat(hearts) + '🖤'.repeat(TOTAL_HEARTS - hearts);
  els.hearts.setAttribute('aria-label', `${hearts} of ${TOTAL_HEARTS} hearts remaining`);
  els.score.textContent = score.toLocaleString(GAME_CONFIG.locale);
  els.roundEl.textContent = `R${round}`;
}

function startRun() {
  score = 0;
  hearts = TOTAL_HEARTS;
  round = 0;
  streak = 0;
  bestMsThisRun = null;
  swapStartRound = null;
  runStartScoreHistory = getHistory().map((h) => h.score);
  clearTimers();
  beginRound(1, { advance: false });
}

/**
 * Enter the dark wait for round `n`. advance=true rolls the rule-flip event
 * (only when moving forward — a resumed round must not re-roll it).
 */
function beginRound(n, { advance = true } = {}) {
  round = n;
  if (advance && !isSwapActive() && n >= SWAP_FROM_ROUND && Math.random() < SWAP_CHANCE) {
    swapStartRound = n;
  }
  setState('waiting');
  renderHud();
  after(MIN_WAIT_MS + Math.random() * (MAX_WAIT_MS - MIN_WAIT_MS), showSignal);
}

function showSignal() {
  signalSpec = generateRound(round, Math.random, { plainOnly: isSwapActive() });
  lastFeedbackWasStroop = signalSpec.word !== null;
  setState('signal');
  els.signalSurface.className = `flash-${signalSpec.color}`;
  els.signalWord.textContent = signalSpec.word || '';
  els.signalWord.hidden = !signalSpec.word;
  // Screen-reader description of the visual signal (the game is color-driven,
  // so the label carries the meaning, including the Stroop lie).
  const meaning = {
    green: 'Green signal — tap now',
    red: 'Red signal — do not tap',
    yellow: 'Yellow decoy — do not tap',
    blue: 'Blue decoy — do not tap',
  };
  const label =
    meaning[signalSpec.color] +
    (signalSpec.word ? `. It reads "${signalSpec.word}" — trust the color, not the word` : '');
  els.signalSurface.setAttribute('role', 'img');
  els.signalSurface.setAttribute('aria-label', label);
  signalShownAt = performance.now();
  after(windowMsForRound(round), () => expireSignal());
}

function handleTap() {
  if (pausedFrom) return; // paused — no taps count (and none are false starts)
  if (state === 'waiting') {
    // False start: tapping during the dark wait loses a heart.
    clearTimers();
    loseHeart(t('tooEarly'));
    return;
  }
  if (state !== 'signal') return;
  clearTimers();
  finishRound({ tapped: true, elapsedMs: performance.now() - signalShownAt });
}

function expireSignal() {
  finishRound({ tapped: false, elapsedMs: null });
}

function finishRound({ tapped, elapsedMs }) {
  const result = resolveRound(signalSpec, {
    rulesSwapped: isSwapActive(),
    tapped,
    elapsedMs,
    streak,
  });
  score += result.points;
  renderHud();
  // 'feedback' is a real state: the flash drops and taps are ignored until the
  // next round begins (otherwise a second tap could resolve the round twice).
  setState('feedback');
  els.signalSurface.className = '';

  if (result.outcome === 'hit') {
    streak += 1;
    if (bestMsThisRun === null || result.reactionMs < bestMsThisRun)
      bestMsThisRun = result.reactionMs;
    blip(880, 90);
    showFeedback(
      t('hitMs', { ms: result.reactionMs, emoji: lastFeedbackWasStroop ? '🧠' : '🔥' }),
      'good'
    );
  } else if (result.outcome === 'resist') {
    streak += 1;
    blip(520, 120, 'triangle');
    showFeedback(t('resisted', { points: RESIST_POINTS }), 'good');
  } else if (result.outcome === 'decoy-ignored') {
    streak += 1;
    blip(520, 120, 'triangle');
    showFeedback(t('ignored', { points: DECOY_IGNORE_POINTS }), 'good');
  } else {
    const msg =
      result.outcome === 'miss'
        ? t('tooSlow')
        : lastFeedbackWasStroop
          ? t('stroopLie')
          : t('wasRed');
    loseHeart(msg);
    return;
  }
  after(FEEDBACK_MS, () => beginRound(round + 1));
}

function loseHeart(message) {
  hearts -= 1;
  streak = 0;
  renderHud();
  buzz();
  blip(140, 220, 'sawtooth');
  showFeedback(message, 'bad');
  after(FEEDBACK_MS, hearts <= 0 ? gameOver : () => beginRound(round + 1));
}

function showFeedback(text, tone) {
  els.feedback.textContent = text;
  els.feedback.className = tone;
  els.feedback.hidden = false;
  after(FEEDBACK_MS, () => {
    els.feedback.hidden = true;
  });
}

/* ----- game over: best, history, badge, share ----- */

function gameOver() {
  if (state === 'gameover') return; // re-entry guard — one card per run
  setState('gameover');
  const { best, isRecord } = recordRun({ score, bestMs: bestMsThisRun });

  els.goScore.textContent = score.toLocaleString(GAME_CONFIG.locale);
  els.goBestMs.textContent = bestMsThisRun !== null ? `${bestMsThisRun}ms 🔥` : '—';
  // No green tapped this run ⇒ no reaction to report; drop the segment entirely.
  els.goBestLabel.hidden = bestMsThisRun === null;
  els.goRounds.textContent = String(round);
  els.goBadge.textContent = t('topBadge', { pct: localPercentile(score, runStartScoreHistory) });
  els.goBadge.hidden = false;
  els.goRecord.hidden = !isRecord;
  els.shareNote.hidden = true;
  els.btnRetry.focus(); // keyboard flow lands on the primary action
}

async function shareScore() {
  const bestMs = bestMsThisRun ?? getBest().bestMs;
  const text = t('share', {
    bestMs: bestMs !== null ? `${bestMs}ms` : '??',
    score: score.toLocaleString(GAME_CONFIG.locale),
    url: `${location.origin}/games/${SLUG}/`,
  });
  try {
    if (navigator.share) {
      await navigator.share({ title: "Tap or Don't Tap", text });
      return;
    }
    throw new Error('no web share');
  } catch (err) {
    if (err && err.name === 'AbortError') return; // user closed the share sheet
    try {
      await navigator.clipboard.writeText(text);
      els.shareNote.hidden = false;
    } catch {
      /* clipboard blocked — nothing else to try */
    }
  }
}

/* ----- pause on visibilitychange (plan §5: resume restarts the wait).
   Pausing mid-feedback instead flushes the pending transition first, so a
   heart-loss round can't resume into a 0-heart round. ----- */

function pauseRun() {
  if (pausedFrom) return;
  if (state === 'feedback') {
    clearTimers();
    els.feedback.hidden = true;
    if (hearts <= 0) {
      gameOver();
      return;
    }
    beginRound(round + 1); // now waiting — fall through and pause it
  }
  if (state === 'waiting' || state === 'signal') {
    pausedFrom = state;
    clearTimers();
    els.pauseOverlay.hidden = false;
  }
}

function resumeRun() {
  if (!pausedFrom) return;
  pausedFrom = null;
  els.pauseOverlay.hidden = true;
  beginRound(round, { advance: false }); // restart the current round's wait
}

/* ----- menu rendering ----- */

function renderMenu() {
  const best = getBest();
  els.menuBest.hidden = !(best.score > 0 || best.bestMs !== null);
  els.menuBestScore.textContent = (best.score || 0).toLocaleString(GAME_CONFIG.locale);
  els.menuBestMs.textContent = best.bestMs !== null ? `${best.bestMs}ms` : '—';
  const scores = getHistory().map((h) => h.score);
  els.sparkline.hidden = scores.length < 2;
  els.sparkline.setAttribute('viewBox', '0 0 200 40');
  let polyline = els.sparkline.querySelector('polyline');
  if (!polyline) {
    polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    els.sparkline.appendChild(polyline);
  }
  polyline.setAttribute('points', sparklinePoints(scores));
  renderMuteButton();
}

function renderMuteButton() {
  const muted = getMuted();
  els.mute.textContent = muted ? '🔇 Sound off' : '🔊 Sound on';
  els.mute.setAttribute('aria-pressed', String(muted));
}

/* ----- init ----- */

function init() {
  Object.assign(els, {
    root: $('game-root'),
    hud: $('hud'),
    hearts: $('hud-hearts'),
    score: $('hud-score'),
    roundEl: $('hud-round'),
    swapBanner: $('swap-banner'),
    stateMenu: $('state-menu'),
    menuTagline: $('menu-tagline'),
    stateWaiting: $('state-waiting'),
    stateSignal: $('state-signal'),
    stateGameover: $('state-gameover'),
    signalSurface: $('signal-surface'),
    signalWord: $('signal-word'),
    feedback: $('feedback'),
    pauseOverlay: $('pause-overlay'),
    menuBest: $('menu-best'),
    menuBestScore: $('menu-best-score'),
    menuBestMs: $('menu-best-ms'),
    sparkline: $('sparkline'),
    goTitle: $('go-title'),
    goScore: $('go-score'),
    goBestMs: $('go-best-ms'),
    goBestLabel: $('go-best-label'),
    goBestText: $('go-best-text'),
    goRounds: $('go-rounds'),
    goBadge: $('go-badge'),
    goRecord: $('go-record'),
    shareNote: $('share-note'),
    mute: $('btn-mute'),
    btnRetry: $('btn-retry'),
    btnShare: $('btn-share'),
    btnMenu: $('btn-menu'),
  });

  // Keep the audio module's runtime flag in sync with the persisted pref.
  setAudioMuted(getMuted());

  // Static copy is config-driven too (plan §13) — the rule line keeps its
  // <b> markup, so it is the one string assigned as HTML.
  els.menuTagline.innerHTML = t('menuRule');
  els.swapBanner.textContent = t('swapBanner');
  els.goTitle.textContent = t('goTitle');
  els.goBestText.textContent = t('bestReaction');
  els.goRecord.textContent = t('newRecord');
  els.btnShare.textContent = t('shareScoreBtn');
  els.btnRetry.textContent = t('retryBtn');
  els.btnMenu.textContent = t('backToMenu');
  els.shareNote.textContent = t('copiedNote');

  // Whole screen is the tap target — pointerdown, not click (lower latency).
  els.root.addEventListener(
    'pointerdown',
    (e) => {
      if (e.target.closest('button, a')) return; // real buttons handle themselves
      e.preventDefault();
      handleTap();
    },
    { passive: false }
  );
  els.root.addEventListener('contextmenu', (e) => e.preventDefault());
  document.addEventListener(
    'keydown',
    (e) => {
      if (e.repeat) return;
      if (e.code !== 'Space' && e.code !== 'Enter') return;
      if (e.target.closest('button, a, input, textarea')) return;
      e.preventDefault();
      if (state === 'menu' || state === 'gameover') startRun();
      else handleTap();
    },
    true
  );

  $('btn-start').addEventListener('click', startRun);
  $('btn-retry').addEventListener('click', startRun);
  $('btn-menu').addEventListener('click', () => {
    clearTimers();
    setState('menu');
    renderMenu();
  });
  $('btn-share').addEventListener('click', shareScore);
  $('btn-resume').addEventListener('click', resumeRun);
  // Tap anywhere on the overlay to resume — stopPropagation so the fresh wait
  // doesn't immediately eat a "false start" from the same tap bubbling to root.
  els.pauseOverlay.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    resumeRun();
  });
  els.mute.addEventListener('click', () => {
    const next = !getMuted();
    setMuted(next);
    setAudioMuted(next);
    renderMuteButton();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseRun();
  });

  setState('menu');
  renderMenu();
}

// Only auto-init in a real browser host — importing this module from jest
// must stay side-effect free (the pure modules above are what tests exercise).
if (typeof document !== 'undefined' && document.getElementById('game-root')) {
  init();
}
