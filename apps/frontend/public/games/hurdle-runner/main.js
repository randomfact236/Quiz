/**
 * ============================================================================
 * Hurdle Runner — main.js (Game 05, plan/games/05-continuous-runner.md §6)
 * ============================================================================
 * Plain ESM, no build step (same convention as games 01–03/06). The pure
 * model lives in core.js — the test surface; engine.js owns loop + input;
 * render.js owns drawing. This file owns the run lifecycle: the
 * menu/playing/paused/gameover state machine, guarded storage, WebAudio,
 * the 💚 pickup + heart consumption, and the end card. It only auto-inits
 * when the canvas exists in the DOM, so importing it (jest / harnesses) has
 * no side effects. Per plan §11, no analytics and no site coupling.
 * ============================================================================
 */
import { t } from './config.js';
import {
  CULL_X,
  CLEAR_BONUS,
  GROUND_Y,
  HITBOX_INSET,
  PLAYER_X,
  PICKUP_AT_MAX_M,
  PICKUP_AT_MIN_M,
  SPAWN_X,
  SCROLL_START,
  TIER_START_M,
  VIEW_H,
  VIEW_W,
  aabbHit,
  createPickup,
  createPlayer,
  createSpawner,
  groupRightX,
  makeObstacle,
  meters,
  minGap,
  nextSpawn,
  obstacleBox,
  obstaclePassed,
  pickupHit,
  playerBox,
  speedAt,
  stepPlayer,
  tierFor,
} from './core.js';
import { advanceCamera, createCamera, createJumpInput, createLoop } from './engine.js';
import { drawScene } from './render.js';
import {
  getBest as loadBest,
  getMuted as loadMuted,
  saveBest,
  setMuted as saveMuted,
} from './storage.js';

/* ==========================================================================
 * 0. Share text (plan §9 P2 "Ran {m} m — beat that!" in the master README §2
 *    wrapper format)
 * ======================================================================= */

export function shareText(distanceM, url) {
  return t('share', { m: distanceM, url });
}

/* ==========================================================================
 * 1. Persistence — storage.js facade (Rev 2: versioned save + migrations).
 *    Disabled storage means no best score, still fully playable (§7.6).
 * ======================================================================= */

/* ==========================================================================
 * 2. Audio (master README §3 audio.js equivalent — context on first gesture)
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
 * 3. State
 * ======================================================================= */

const FIXED_DT = 1 / 120; // plan §2: fixed timestep physics
const SPAWN_LEAD = 160; // keep groups spawned at least this far past the right edge
const FLASH_S = 0.12; // white flash length on death
const SHAKE_S = 0.3; // screen shake length on death
const HEART_FLASH_S = 0.18; // softer flash when the 💚 absorbs a hit
const DUST_LIFE_S = 0.45;
const FLOATER_LIFE_S = 0.8;
const ANNOUNCE_S = 1.6; // "Speed up!" on screen

const state = {
  mode: 'menu', // menu | playing | paused | gameover
  player: createPlayer(),
  obstacles: [],
  pickup: null,
  pickupSpawned: false,
  pickupAtM: 0, // meters mark chosen once per run (600–900)
  spawner: createSpawner(),
  lastRightX: 0, // world x of the last group's right edge
  cam: createCamera(),
  hearts: 0,
  cleared: 0,
  tier: 1,
  announceUntil: -1,
  pressQueue: 0, // taps buffered for the fixed-step loop
  dust: [],
  floaters: [],
  deathAt: 0, // seconds — flash + shake anchor
  heartHitAt: -10, // seconds — softer flash when a heart is consumed
  muted: false,
};

const els = {};
let canvas = null;
let ctx = null;
let debug = false;
let clockNow = 0; // seconds, updated once per frame
let jumpInput = { held: false };

function distanceM() {
  return Math.floor(meters(state.cam.x));
}

/** A fresh run: everything zeroed, first group at ≥ SPAWN_X (plan §7.7: no
 *  mid-run persistence — a lost tab loses the run, by design). */
function buildRun() {
  state.player = createPlayer();
  state.spawner = createSpawner();
  state.obstacles = [];
  state.pickup = null;
  state.pickupSpawned = false;
  // plan §9 P2 spawn window
  state.pickupAtM = PICKUP_AT_MIN_M + Math.random() * (PICKUP_AT_MAX_M - PICKUP_AT_MIN_M);
  state.lastRightX = SPAWN_X - minGap(SCROLL_START); // first gap → x ≥ SPAWN_X
  state.cam = createCamera();
  state.hearts = 0;
  state.cleared = 0;
  state.tier = 1;
  state.announceUntil = -1;
  state.pressQueue = 0;
  state.dust = [];
  state.floaters = [];
}

/* ==========================================================================
 * 4. Screens
 * ======================================================================= */

function showScreen(mode) {
  els.screenMenu.classList.toggle('hidden', mode !== 'menu');
  els.overlayPause.classList.toggle('hidden', mode !== 'paused');
  els.overlayOver.classList.toggle('hidden', mode !== 'gameover');
  els.btnPause.classList.toggle('hidden', mode !== 'playing');
  if (mode === 'menu') renderMenuBest();
}

function renderMenuBest() {
  const best = loadBest();
  els.menuBest.textContent = best ? t('best', { m: best.distanceM }) : t('noBest');
}

function toMenu() {
  buildRun();
  state.mode = 'menu';
  showScreen('menu');
}

/** Straight into the run — restart is one tap and instant (plan §10). */
function toPlay() {
  buildRun();
  state.mode = 'playing';
  showScreen('playing');
}

/* ==========================================================================
 * 5. Run lifecycle
 * ======================================================================= */

function die() {
  state.mode = 'gameover';
  state.deathAt = clockNow;
  state.pressQueue = 0;
  blip(130, 200, 'square');
  blip(90, 260, 'sawtooth', 0.06);
  vibrate([60, 40, 60]);

  const m = distanceM();
  const newBest = m > 0 && saveBest(m);
  const best = loadBest();
  els.overDistance.textContent = m + ' m';
  els.overDetail.textContent =
    state.cleared + ' cleared · score ' + (m + state.cleared * CLEAR_BONUS);
  els.badgeNew.classList.toggle('hidden', !newBest);
  els.overBest.textContent = t('best', { m: best ? best.distanceM : m });
  if (newBest) {
    blip(523, 90, 'triangle', 0.25);
    blip(659, 90, 'triangle', 0.35);
    blip(784, 160, 'triangle', 0.45);
  }
  showScreen('gameover');
  els.btnRetry.focus();
}

/** 💚 absorbs one fatal hit: heart gone, exactly 1 s of invulnerability
 *  (plan §7.5 — no double-consume; stepPlayer drains invulnS). */
function consumeHeart() {
  state.hearts = 0;
  state.player.invulnS = 1;
  state.heartHitAt = clockNow;
  blip(392, 90, 'square');
  blip(494, 120, 'square', 0.08);
  vibrate(30);
}

/** Pause (plan §3): auto on visibilitychange / ⏸; resume continues the exact
 *  sim state — the engine resets its clock, so no dt spike on return. */
function pauseGame() {
  if (state.mode !== 'playing') return;
  state.mode = 'paused';
  loop.setPaused(true);
  showScreen('paused');
}

function resumeGame() {
  if (state.mode !== 'paused') return;
  state.mode = 'playing';
  loop.setPaused(false);
  showScreen('playing');
}

/* ==========================================================================
 * 6. Fixed-step update (core owns the rules; this only orchestrates)
 * ======================================================================= */

function update(dt) {
  if (state.mode !== 'playing') return;

  advanceCamera(state.cam, dt, speedAt);
  const pressed = state.pressQueue > 0;
  if (pressed) state.pressQueue--;
  stepPlayer(state.player, dt, { pressed, held: jumpInput.held });

  if (state.player.jumped) {
    state.player.jumped = false;
    blip(560, 65);
  }
  if (state.player.landed) {
    state.player.landed = false;
    spawnDust();
    blip(170, 45, 'sine');
  }

  // spawner: refresh its meter view, then fill the lead window (plan §2)
  state.spawner.meters = meters(state.cam.x);
  while (state.lastRightX < state.cam.x + VIEW_W + SPAWN_LEAD) {
    const spawn = nextSpawn(state.spawner, state.cam.speed, state.lastRightX);
    for (const item of spawn.items) state.obstacles.push(makeObstacle(spawn.x + item.dx, item));
    state.lastRightX = groupRightX(spawn.x, spawn.items);
  }
  while (
    state.obstacles.length &&
    state.obstacles[0].worldX + state.obstacles[0].w < state.cam.x + CULL_X
  ) {
    state.obstacles.shift();
  }

  // scoring: meters + 10 per obstacle cleared (plan §2)
  const playerWorldX = state.cam.x + PLAYER_X;
  for (const obs of state.obstacles) {
    if (obstaclePassed(obs, playerWorldX)) {
      state.cleared++;
      state.floaters.push({ x: PLAYER_X + 26, y: GROUND_Y - 60, born: clockNow });
      blip(880, 55);
    }
  }

  // 💚 pickup: spawn once per run inside the 600–900 m window (plan §9 P2).
  // Grab test runs in WORLD space — the pickup's worldX vs the player's
  // world x (playerBox alone is screen-space and would never overlap).
  if (!state.pickupSpawned && distanceM() >= state.pickupAtM) {
    state.pickup = createPickup(state.cam.x + VIEW_W + 80);
    state.pickupSpawned = true;
  }
  const pbPickup = playerBox(state.player);
  const pbWorld = {
    x: state.cam.x + PLAYER_X - pbPickup.w / 2,
    y: pbPickup.y,
    w: pbPickup.w,
    h: pbPickup.h,
  };
  if (state.pickup && !state.pickup.taken && pickupHit(state.pickup, pbWorld)) {
    state.pickup.taken = true;
    state.hearts = 1;
    blip(660, 70);
    blip(880, 70, 'triangle', 0.08);
    blip(1174, 110, 'triangle', 0.16);
    vibrate(20);
  }

  // collision: one hit = game over — unless the 💚 absorbs it (master
  // README §8 #9, plan §7.5). Invulnerable steps ignore hits entirely.
  // aabbHit runs in WORLD space (obstacle boxes carry worldX).
  if (state.player.invulnS <= 0) {
    for (const obs of state.obstacles) {
      if (obs.worldX > playerWorldX + pbWorld.w) break; // sorted by spawn x — nothing ahead can touch
      if (aabbHit(pbWorld, obstacleBox(obs), HITBOX_INSET)) {
        if (state.hearts > 0) consumeHeart();
        else die();
        break;
      }
    }
  }

  // tier announcement (plan §2)
  const tier = tierFor(meters(state.cam.x));
  if (tier > state.tier) {
    state.tier = tier;
    state.announceUntil = clockNow + ANNOUNCE_S;
    blip(740, 90);
    blip(988, 140, 'triangle', 0.09);
  }

  // prune cosmetic particles
  state.dust = state.dust.filter((p) => clockNow - p.born < DUST_LIFE_S);
  state.floaters = state.floaters.filter((f) => clockNow - f.born < FLOATER_LIFE_S);
}

function spawnDust() {
  for (let i = 0; i < 6; i++) {
    state.dust.push({
      x: PLAYER_X + (Math.random() - 0.5) * 16,
      y: state.player.y - 2,
      vx: (Math.random() - 0.5) * 90 - 30,
      vy: -(20 + Math.random() * 70),
      born: clockNow,
    });
  }
}

/* ==========================================================================
 * 7. Render
 * ======================================================================= */

function fitCanvas() {
  // Contain-fit the 900×500 world into the stage box; the CSS size is set
  // explicitly (not via auto/intrinsic) so resizing the buffer never feeds
  // back into layout.
  const box = els.stage.getBoundingClientRect();
  const padX = 20;
  const padY = 18;
  const scale = Math.max(0.1, Math.min((box.width - padX) / VIEW_W, (box.height - padY) / VIEW_H));
  const cssW = Math.floor(VIEW_W * scale);
  const cssH = Math.floor(VIEW_H * scale);
  if (canvas.style.width !== cssW + 'px') canvas.style.width = cssW + 'px';
  if (canvas.style.height !== cssH + 'px') canvas.style.height = cssH + 'px';
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  const w = Math.max(1, Math.round(cssW * dpr));
  const h = Math.max(1, Math.round(cssH * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
}

function draw(t) {
  fitCanvas();
  ctx.setTransform(canvas.width / VIEW_W, 0, 0, canvas.height / VIEW_H, 0, 0);
  clockNow = t; // events below anchor to this frame's timestamp

  const sinceDeath = t - state.deathAt;
  const gameOvering = state.mode === 'gameover';
  const flash = gameOvering
    ? Math.max(0, 1 - sinceDeath / FLASH_S)
    : Math.max(0, 1 - (t - state.heartHitAt) / HEART_FLASH_S) *
      (t - state.heartHitAt < HEART_FLASH_S ? 0.45 : 0);
  const shake = { x: 0, y: 0 };
  if (gameOvering && sinceDeath < SHAKE_S) {
    const mag = 9 * (1 - sinceDeath / SHAKE_S);
    shake.x = mag * Math.sin(t * 73);
    shake.y = mag * Math.cos(t * 61);
  }

  const m = meters(state.cam.x);
  const tier = tierFor(m);
  const segStart = TIER_START_M[tier - 1];
  const segEnd = tier < 3 ? TIER_START_M[tier] : segStart + 1;
  drawScene(ctx, {
    mode: state.mode,
    player: state.player,
    obstacles: state.obstacles,
    pickup: state.pickup,
    cam: state.cam,
    distanceM: Math.floor(m),
    hearts: state.hearts,
    tier,
    tierProgress: tier < 3 ? (m - segStart) / (segEnd - segStart) : 1,
    announceUntil: state.announceUntil,
    dust: state.dust,
    floaters: state.floaters,
    fx: { dustLifeS: DUST_LIFE_S, floaterLifeS: FLOATER_LIFE_S, announceS: ANNOUNCE_S },
    debugInfo: { spawnCursor: state.lastRightX, minGap: minGap(state.cam.speed) },
    flash,
    shake,
    t,
    paletteM: m,
    debug,
  });
}

/* ==========================================================================
 * 8. Loop (engine: fixed 1/120 steps via accumulator, 250 ms clamp,
 *    auto-pause on visibilitychange — identical physics at 60 and 120 Hz)
 * ======================================================================= */

const loop = createLoop({ update, render: draw, fixedDt: FIXED_DT, onAutoPause: pauseGame });

/* ==========================================================================
 * 9. Input (plan §4: tap anywhere / Space / ↑ = jump; hold = higher via the
 *    jump cut; presses during paused/gameover are ignored §7.4)
 * ======================================================================= */

function onPress() {
  if (state.mode === 'menu') {
    ensureAudio();
    toPlay(); // starting a run is the same one action — no surprise jump
    return;
  }
  if (state.mode === 'playing') {
    state.pressQueue++;
  }
  // paused / gameover: deliberately ignored (plan §7.4)
}

/* ==========================================================================
 * 10. Share (master README §2 chain: Web Share → clipboard → prompt)
 * ======================================================================= */

function share() {
  const text = shareText(distanceM(), window.location.origin + window.location.pathname);
  if (navigator.share) {
    navigator.share({ title: 'Hurdle Runner', text }).catch(() => {
      /* user dismissed the sheet */
    });
    return;
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(
      () => toast(t('copied')),
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
 * 11. Wiring + init
 * ======================================================================= */

function init() {
  canvas = document.getElementById('world');
  ctx = canvas.getContext('2d');
  debug = new URLSearchParams(window.location.search).get('debug') === '1';

  els.stage = document.getElementById('stage');
  els.screenMenu = document.getElementById('screen-menu');
  els.overlayPause = document.getElementById('overlay-pause');
  els.overlayOver = document.getElementById('overlay-over');
  els.menuBest = document.getElementById('menu-best');
  els.overDistance = document.getElementById('over-distance');
  els.overDetail = document.getElementById('over-detail');
  els.overBest = document.getElementById('over-best');
  els.badgeNew = document.getElementById('badge-new');
  els.btnMute = document.getElementById('btn-mute');
  els.btnPause = document.getElementById('btn-pause');
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
    toPlay();
  });
  document.getElementById('btn-resume').addEventListener('click', resumeGame);
  document.getElementById('btn-pmenu').addEventListener('click', toMenu);
  els.btnRetry.addEventListener('click', () => {
    ensureAudio();
    toPlay(); // instant retry: one tap, straight back into the run (plan §10)
  });
  document.getElementById('btn-share').addEventListener('click', share);
  document.getElementById('btn-omenu').addEventListener('click', toMenu);
  els.btnPause.addEventListener('click', pauseGame);

  jumpInput = createJumpInput(els.stage, onPress);

  // Escape / P toggle the pause overlay (the ⏸ button's keyboard twin)
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' && e.key !== 'p' && e.key !== 'P') return;
    if (e.target && e.target.closest && e.target.closest('button, a, input, textarea, select'))
      return;
    if (state.mode === 'playing') pauseGame();
    else if (state.mode === 'paused') resumeGame();
  });

  // WebAudio contexts may only be created from a user gesture.
  document.addEventListener('pointerdown', ensureAudio, { once: true });

  buildRun();
  state.mode = 'menu';
  showScreen('menu');
  loop.start();
}

if (typeof document !== 'undefined' && document.getElementById('world')) {
  init();
}
