/**
 * ============================================================================
 * Flying Snake — main.js (Game 06, plan/games/06-flying-snake.md)
 * ============================================================================
 * Plain ESM, no build step (same convention as games 01/02/03). The pure
 * model lives in core.js — the test surface; this file owns the run
 * lifecycle: the menu/ready/playing/dying/paused/gameover state machine, the
 * fixed-timestep loop (1/120 s accumulator, 250 ms frame clamp), input,
 * guarded storage, WebAudio, and the end-card. It only auto-inits when the
 * canvas exists in the DOM, so importing it (jest / harnesses) has no side
 * effects. Per plan §11, no analytics and no site coupling.
 * ============================================================================
 */
import { t } from './config.js';
import {
  FIRST_PIPE_X,
  MEDAL_THRESHOLDS,
  PIPE_SPACING,
  PIPE_W,
  VIEW_H,
  VIEW_W,
  WORLD_SPEED,
  createSnake,
  createSpawner,
  groundY,
  hitRadius,
  isNearMiss,
  makePipe,
  medalFor,
  nextGap,
  nextMedalFor,
  pipePassed,
  readyHintKind,
  snakeHit,
  stepSnake,
  setViewSize,
} from './core.js';
import { drawScene } from './render.js';
import {
  getBest as loadBest,
  getMuted as loadMuted,
  saveBest,
  setMuted as saveMuted,
} from './storage.js';

/* ==========================================================================
 * 0. Share text (pure — plan §9 P2 + master README §2 format)
 * ======================================================================= */

export function shareText(score, url) {
  return t('share', { score, url });
}

/* ==========================================================================
 * 1. Audio (README §3 audio.js equivalent — context on first user gesture)
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

function vibrate(pattern) {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch {
    /* unsupported — fine */
  }
}

/* ==========================================================================
 * 2. State
 * ======================================================================= */

/** Medal label lookups — names + emoji live in config.js strings (plan §12). */
function medalName(medal) {
  return t('medalName' + medal[0].toUpperCase() + medal.slice(1));
}

function medalEmoji(medal) {
  return t('medalEmoji' + medal[0].toUpperCase() + medal.slice(1));
}

const state = {
  mode: 'menu', // menu | ready | playing | dying | paused | gameover
  snake: createSnake(),
  pipes: [],
  spawner: createSpawner(),
  score: 0,
  worldX: 0,
  trail: [], // past {y}, newest first — the 5 body segments (plan §2)
  trailAcc: 0,
  flapQueue: 0, // taps buffered for the fixed-step loop
  deathAt: 0, // seconds — flash + shake anchor
  scorePopAt: -10,
  nearMissAt: -10, // seconds — gold glow anchor for a threaded-by-a-hair pass
  runsFinished: 0, // session counter — drives the ready-hint swap (suggestion 03)
  muted: false,
};

const FIXED_DT = 1 / 120; // plan §2: fixed timestep physics
const TRAIL_DT = 0.04; // sample a body segment every 40 ms
const FLASH_S = 0.12; // white flash length (plan §2)
const SHAKE_S = 0.3; // screen shake length (plan §2)
const DEATH_MAX_S = 0.9; // fall animation cap before the gameover card
const NEAR_MISS_S = 0.35; // gold "close one" glow decay (suggestion 03)

const els = {};
let canvas = null;
let ctx = null;
let debug = false;
let clockNow = 0; // seconds, updated once per frame

function lastPipe() {
  return state.pipes[state.pipes.length - 1];
}

/** A fresh run: world with the first pair at FIRST_PIPE_X, snake at the
 *  safe mid-screen height, everything zeroed (plan §7.1). */
function buildWorld() {
  state.snake = createSnake();
  state.spawner = createSpawner();
  state.pipes = [];
  for (let x = FIRST_PIPE_X; x < VIEW_W + PIPE_SPACING; x += PIPE_SPACING) {
    const gap = nextGap(state.spawner, 0);
    state.pipes.push(makePipe(x, gap.gap, gap.centerY));
  }
  state.score = 0;
  state.worldX = 0;
  state.trail = [];
  state.trailAcc = 0;
  state.flapQueue = 0;
}

/* ==========================================================================
 * 3. Screens
 * ======================================================================= */

function showScreen(mode) {
  els.screenMenu.classList.toggle('hidden', mode !== 'menu');
  els.overlayPause.classList.toggle('hidden', mode !== 'paused');
  els.overlayOver.classList.toggle('hidden', mode !== 'gameover');
  // BUG-034: the All-games exit pill must not sit over live gameplay — visible
  // again the moment the run is paused (or on any non-playing screen). 'dying'
  // is the brief crash transition into 'gameover', gameplay is already over.
  els.backLink.classList.toggle('hidden', mode === 'playing' || mode === 'dying');
  if (mode === 'menu') renderMenuBest();
}

function renderMenuBest() {
  const best = loadBest();
  if (!best) {
    els.menuBest.textContent = 'No best yet — how far can you get?';
    return;
  }
  const medal = medalFor(best.score);
  els.menuBest.textContent =
    'Best ' + best.score + (medal ? ' · ' + medalEmoji(medal) + ' ' + medalName(medal) : '');
}

function toMenu() {
  buildWorld();
  state.mode = 'menu';
  showScreen('menu');
}

function toReady() {
  buildWorld();
  state.mode = 'ready';
  showScreen('ready');
}

/* ==========================================================================
 * 4. Run lifecycle
 * ======================================================================= */

function die() {
  state.mode = 'dying';
  state.deathAt = clockNow;
  state.flapQueue = 0;
  blip(130, 200, 'square');
  blip(90, 260, 'sawtooth', 0.06);
  vibrate([60, 40, 60]);
}

function gameOver() {
  state.mode = 'gameover';
  state.runsFinished += 1;
  const newBest = state.score > 0 && saveBest(state.score);
  const best = loadBest();
  const medal = medalFor(state.score);
  // Distance to the NEXT tier (suggestion 03 item 3) — the bronze line below
  // already covers sub-bronze scores; nothing extra once platinum is reached.
  const next = nextMedalFor(state.score);
  els.overScore.textContent = String(state.score);
  els.badgeNew.classList.toggle('hidden', !newBest);
  els.overBest.textContent = 'Best ' + (best ? best.score : state.score);
  els.overMedal.textContent = medal
    ? medalEmoji(medal) +
      ' ' +
      medalName(medal) +
      ' medal' +
      (next
        ? ' · ' +
          t('nextMedal', {
            n: next.remaining,
            medal: medalEmoji(next.medal) + ' ' + medalName(next.medal),
          })
        : '')
    : t('noMedal', { bronzeAt: MEDAL_THRESHOLDS.bronze });
  if (newBest) {
    blip(523, 90, 'triangle', 0.25);
    blip(659, 90, 'triangle', 0.35);
    blip(784, 160, 'triangle', 0.45);
  }
  showScreen('gameover');
  els.btnRetry.focus();
}

/** Pause (plan §3): auto on visibilitychange; resume continues the exact
 *  fall state — the loop keeps ticking `last`, so no dt spike on return. */
function pauseGame() {
  if (state.mode !== 'playing') return;
  state.mode = 'paused';
  showScreen('paused');
}

function resumeGame() {
  if (state.mode !== 'paused') return;
  state.mode = 'playing';
  showScreen('playing');
}

/* ==========================================================================
 * 5. Fixed-step update
 * ======================================================================= */

function update(dt) {
  if (state.mode === 'playing') {
    const flapped = state.flapQueue > 0;
    if (flapped) state.flapQueue--;
    stepSnake(state.snake, dt, flapped);
    scrollWorld(dt);
    sampleTrail(dt);
    for (const pipe of state.pipes) {
      if (pipePassed(pipe)) {
        state.score += 1;
        state.scorePopAt = clockNow;
        blip(880, 70, 'triangle');
        if (state.score % 10 === 0) blip(1174, 90, 'triangle', 0.07);
        // Threaded by a hair (suggestion 03 item 1) — a gold "close one" cue;
        // visual/audio polish only, no score bonus.
        if (isNearMiss(state.snake, pipe)) {
          state.nearMissAt = clockNow;
          blip(1318, 90, 'triangle', 0.05);
        }
      }
    }
    const hit = snakeHit(state.snake, state.pipes);
    if (hit) die();
  } else if (state.mode === 'dying') {
    // world frozen, snake keeps falling (plan §2 death sequence) — but lands
    // on the ground strip instead of sinking through it
    stepSnake(state.snake, dt, false);
    const restingY = groundY() - hitRadius();
    if (state.snake.y > restingY) state.snake.y = restingY;
    if (state.snake.y > VIEW_H + 60 || clockNow - state.deathAt > DEATH_MAX_S) gameOver();
  }
}

function scrollWorld(dt) {
  const dx = WORLD_SPEED * dt;
  state.worldX += dx;
  for (const pipe of state.pipes) pipe.x -= dx;
  // spawn ahead, cull behind
  while (lastPipe() && lastPipe().x < VIEW_W + PIPE_SPACING) {
    const gap = nextGap(state.spawner, state.score);
    state.pipes.push(makePipe(lastPipe().x + PIPE_SPACING, gap.gap, gap.centerY));
  }
  while (state.pipes.length && state.pipes[0].x + PIPE_W < -40) state.pipes.shift();
}

function sampleTrail(dt) {
  state.trailAcc += dt;
  while (state.trailAcc >= TRAIL_DT) {
    state.trailAcc -= TRAIL_DT;
    state.trail.unshift({ y: state.snake.y });
    if (state.trail.length > 5) state.trail.pop();
  }
}

/* ==========================================================================
 * 6. Render
 * ======================================================================= */

function fitCanvas() {
  // Contain-fit the 720×960 world into the stage box; the CSS size is set
  // explicitly (not via auto/intrinsic) so resizing the buffer never feeds
  // back into layout.
  const box = els.stage.getBoundingClientRect();
  /* BUG-018: full-screen game — the canvas fills the stage exactly and the
     logical world flexes to the stage aspect (uniform scale anchored to the
     width; the ground line rides the flexed height). */
  const cssW = Math.max(1, Math.floor(box.width));
  const cssH = Math.max(1, Math.floor(box.height));
  if (canvas.style.width !== cssW + 'px') canvas.style.width = cssW + 'px';
  if (canvas.style.height !== cssH + 'px') canvas.style.height = cssH + 'px';
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  const w = Math.max(1, Math.round(cssW * dpr));
  const h = Math.max(1, Math.round(cssH * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const fillScale = Math.min(cssW / VIEW_W, cssH / VIEW_H);
  setViewSize(cssW / fillScale, cssH / fillScale);
}

/** The ready hint (suggestion 03 item 2): plain instruction for the first
 *  two runs, then a momentum pull from the player's own best. */
function readyHintText() {
  if (readyHintKind(state.runsFinished) !== 'challenge') return 'Tap to flap';
  const best = loadBest();
  return best && best.score > 0 ? 'Beat ' + best.score + '? Tap to flap' : 'Tap to flap';
}

function draw(t) {
  fitCanvas();
  ctx.setTransform(canvas.width / VIEW_W, 0, 0, canvas.height / VIEW_H, 0, 0);

  // menu/ready: the world is frozen and the snake bobs at its safe y (§7.1)
  const bobbing = state.mode === 'menu' || state.mode === 'ready';
  const snakeY = bobbing ? state.snake.y + Math.sin(t * 2.3) * 14 : state.snake.y;

  // death flash (120 ms) + shake (300 ms), plan §2
  const sinceDeath = t - state.deathAt;
  const flash =
    state.mode === 'dying' || state.mode === 'gameover' ? Math.max(0, 1 - sinceDeath / FLASH_S) : 0;
  const shake = { x: 0, y: 0 };
  if ((state.mode === 'dying' || state.mode === 'gameover') && sinceDeath < SHAKE_S) {
    const mag = 9 * (1 - sinceDeath / SHAKE_S);
    shake.x = mag * Math.sin(t * 73);
    shake.y = mag * Math.cos(t * 61);
  }

  // score pop: 1 + 0.35 decaying over 180 ms after the last point
  const sincePop = t - state.scorePopAt;
  const scorePop = 1 + 0.35 * Math.max(0, 1 - sincePop / 0.18);
  // near-miss gold glow: 1 → 0 over 350 ms after a threaded pass
  const sinceNear = t - state.nearMissAt;
  const nearMiss = Math.max(0, 1 - sinceNear / NEAR_MISS_S);

  drawScene(ctx, {
    mode: state.mode,
    snakeY,
    snakeVy: state.snake.vy,
    trail: bobbing ? [] : state.trail,
    pipes: state.pipes,
    score: state.score,
    worldX: state.worldX,
    t,
    flash,
    shake,
    scorePop,
    nearMiss,
    hintText: readyHintText(),
    debug,
  });
}

/* ==========================================================================
 * 7. Loop (fixed 1/120 steps via accumulator, 250 ms clamp — README §2;
 *    identical physics at 60 and 144 Hz)
 * ======================================================================= */

let rafId = 0;
let lastMs = 0;
let accumulator = 0;

function frame(nowMs) {
  rafId = requestAnimationFrame(frame);
  const t = nowMs / 1000;
  clockNow = t; // updates read it (death timestamps anchor to this frame)
  let dt = lastMs ? (nowMs - lastMs) / 1000 : 0;
  lastMs = nowMs;
  if (dt > 0.25) dt = 0.25;
  accumulator += dt;
  while (accumulator >= FIXED_DT) {
    update(FIXED_DT);
    accumulator -= FIXED_DT;
  }
  draw(t);
}

function startLoop() {
  if (!rafId) rafId = requestAnimationFrame(frame);
}

/* ==========================================================================
 * 8. Input (plan §4: tap anywhere / Space / ↑ = flap; multi-touch flaps
 *    within 50 ms collapse to one; flap during gameover is ignored §7.3)
 * ======================================================================= */

/** The one action: start from menu, start physics + flap from ready, flap. */
function primaryAction() {
  if (state.mode === 'menu') {
    toReady();
    return;
  }
  if (state.mode === 'ready') {
    state.mode = 'playing';
    showScreen('playing');
    state.flapQueue++; // first flap both starts the run and applies (§7.1)
    blip(600, 55);
    return;
  }
  if (state.mode === 'playing') {
    state.flapQueue++;
    blip(600, 55);
  }
  // dying / paused / gameover: deliberately ignored (§7.3)
}

function bindTap() {
  let lastTapAt = 0;
  els.stage.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button, a')) return; // buttons act for themselves
    e.preventDefault();
    ensureAudio();
    const now = performance.now();
    if (now - lastTapAt < 50) return; // multi-touch debounce (plan §4)
    lastTapAt = now;
    primaryAction();
  });
}

function bindKeys() {
  document.addEventListener('keydown', (e) => {
    if (e.repeat) return; // holding a key is no hold-to-fly (plan §4)
    if (e.key !== ' ' && e.key !== 'ArrowUp') return;
    if (state.mode === 'menu' || state.mode === 'ready' || state.mode === 'playing') {
      e.preventDefault(); // no page scroll, no focused-button double-fire
      ensureAudio();
      primaryAction();
    }
    // paused / gameover: fall through so a focused button keeps working
  });
}

/* ==========================================================================
 * 9. Share (README §2 chain: Web Share → clipboard → prompt)
 * ======================================================================= */

function shareUrls() {
  const url = 'https://pigzap.com/games/flying-snake/';
  const text = shareText(state.score, url);
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

/* ==========================================================================
 * 10. Wiring + init
 * ======================================================================= */

function init() {
  canvas = document.getElementById('world');
  ctx = canvas.getContext('2d');
  debug = new URLSearchParams(window.location.search).get('debug') === '1';

  els.stage = document.getElementById('stage');
  els.screenMenu = document.getElementById('screen-menu');
  els.overlayPause = document.getElementById('overlay-pause');
  els.overlayOver = document.getElementById('overlay-over');
  els.backLink = document.getElementById('back-link');
  els.menuBest = document.getElementById('menu-best');
  els.overScore = document.getElementById('over-score');
  els.overBest = document.getElementById('over-best');
  els.overMedal = document.getElementById('over-medal');
  els.badgeNew = document.getElementById('badge-new');
  els.btnMute = document.getElementById('btn-mute');
  els.btnRetry = document.getElementById('btn-retry');
  els.toast = document.getElementById('toast');

  state.muted = loadMuted();
  els.btnMute.textContent = state.muted ? '🔇' : '🔊';
  els.btnMute.setAttribute('aria-pressed', String(state.muted));
  els.btnMute.addEventListener('click', () => {
    state.muted = !state.muted;
    saveMuted(state.muted);
    els.btnMute.textContent = state.muted ? '🔇' : '🔊';
    els.btnMute.setAttribute('aria-pressed', String(state.muted));
    if (!state.muted) blip(660, 80); // audible confirmation the sound is back
  });

  document.getElementById('btn-play').addEventListener('click', () => {
    ensureAudio();
    toReady();
  });
  document.getElementById('btn-resume').addEventListener('click', resumeGame);
  document.getElementById('btn-pmenu').addEventListener('click', toMenu);
  els.btnRetry.addEventListener('click', () => {
    ensureAudio();
    toReady(); // instant retry: one tap, straight back into `ready` (§10)
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
  document.getElementById('btn-omenu').addEventListener('click', toMenu);

  bindTap();
  bindKeys();

  // The run auto-pauses when the tab hides — time never silently elapses (§2).
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseGame();
  });
  // WebAudio contexts may only be created from a user gesture.
  document.addEventListener('pointerdown', ensureAudio, { once: true });

  buildWorld();
  state.mode = 'menu';
  showScreen('menu');
  startLoop();
}

if (typeof document !== 'undefined' && document.getElementById('world')) {
  init();
}

/* BUG-048: share-count pings (prod API; fire-and-forget, best-effort). */
(function () {
  var API = 'https://api.pigzap.com/api/v1/share-counts';
  var SLUG = 'flying-snake';
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
        a.addEventListener(
          'click',
          function () {
            ping(pair[1]);
          },
          { once: true, capture: true }
        );
      }
    });
    var copy = document.getElementById('share-copy');
    if (copy && !wired.has(copy)) {
      wired.add(copy);
      copy.addEventListener(
        'click',
        function () {
          ping('copy');
        },
        { once: true, capture: true }
      );
    }
  };
  var btn = document.getElementById('btn-share');
  if (btn) btn.addEventListener('click', wire);
  wire();
})();
