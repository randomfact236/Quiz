/**
 * ============================================================================
 * Spirit Runner — main.js (Game 07, plan/games/07-spirit-runner.md §6)
 * ============================================================================
 * Plain ESM, no build step (games 01–06 convention). The pure model lives in
 * core.js + gates.js (the test surfaces); engine.js owns loop + input;
 * render.js owns drawing; storage.js owns the guarded save facade. This file
 * owns the run lifecycle — the menu/playing/paused/gameover state machine, the
 * gate + shadow-realm flow, the meta (spirit shards, characters, unlocks,
 * settings — plan §2 Phase D) and WebAudio. It only auto-inits when the canvas
 * exists in the DOM, so importing it (jest / harnesses) has no side effects.
 * Per the master README §7 isolation decision: no analytics, no site coupling.
 * ============================================================================
 */
import {
  CULL_X,
  GATE_SPAN,
  GROUND_Y,
  HEARTS_MAX,
  INVULN_S,
  METER_FULL,
  MONK_SLOW_SPAWN_SCALE,
  PLAYER_X,
  SCROLL_START,
  SHADOW_DENSITY,
  SHADOW_ORB_WORTH,
  SLOW_TIME_SCALE,
  SPAWN_X,
  VIEW_H,
  VIEW_W,
  aabbHit,
  applyPower,
  chargedPower,
  createPlayer,
  createRun,
  createSpawner,
  dashDestroy,
  enterShadow,
  gateReady,
  groupRightX,
  makeObstacle,
  meters,
  minGap,
  mulberry32,
  nextSpawn,
  obstacleBox,
  orbHit,
  playerBox,
  reanchorGates,
  scoreFor,
  shardsFor,
  spawnOrbArc,
  spawnOrbLine,
  speedAt,
  stepPlayer,
  tickPowers,
  tickShadow,
  trapLit,
} from './core.js';
import { createCamera, advanceCamera, createLoop, createRunnerInput } from './engine.js';
import { DEPTH_LABELS, drawScene, paletteFor, POWER_GLYPH, POWER_LABEL } from './render.js';
import { makeGate, resolveChoice, shuffledRules } from './gates.js';
import { GAME_CONFIG, t } from './config.js';
import { loadSave, saveSave, setRemoteAdapter } from './storage.js';

/* ==========================================================================
 * 0. Share text (plan §2 Phase D format inside the master README §2 wrapper)
 * ======================================================================= */

export function shareText(distanceM, characterLabel, score, url) {
  return t('share', { distance: distanceM, character: characterLabel, score, url });
}

/* ==========================================================================
 * 1. Meta: characters (plan §2 Phase D)
 * ======================================================================= */

export const CHARACTERS = {
  spirit: { label: 'Forest Spirit', unlockAt: 0, blurb: 'Power durations +50%' },
  hunter: { label: 'Hunter', unlockAt: 5, blurb: 'Every run starts with Dash charged' },
  monk: { label: 'Monk', unlockAt: 12, blurb: 'Slow time also slows spawns ×0.7' },
};

/* ==========================================================================
 * 2. Audio (context on first gesture; slow time drops the pitch — plan §2)
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
  if (save.settings.muted) return;
  try {
    const ctx = ensureAudio();
    if (!ctx) return;
    // slow time drops every pitch to 60 % (plan §2 Phase B)
    const pitch = state.run && state.run.powers.timers.slow > 0 ? SLOW_TIME_SCALE : 1;
    const t = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq * pitch;
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

const FIXED_DT = 1 / 120; // fixed-timestep physics (as 05)
const SPAWN_LEAD = 160; // groups spawned at least this far past the right edge
const FLASH_S = 0.14; // white flash length on death
const SHAKE_S = 0.3; // screen shake on death
const HIT_FLASH_S = 0.16; // softer tinted flash on a heart hit
const ORB_CHANCE = 0.5; // a formation rides each obstacle group this often
const GATE_ARRIVAL_S = 2; // hint banner leads the doors by ≥ 2 s (plan §2)
const GATE_RESUME_DELAY_S = 0.8; // spawns hold briefly after a resolution

const state = {
  mode: 'menu', // menu | playing | paused | gameover
  player: createPlayer(),
  obstacles: [],
  orbs: [],
  gate: null, // { worldX, gate, resolved, resolvedAt, outcome }
  gateOrder: [],
  gateIndex: 0,
  run: null,
  spawner: createSpawner(),
  lastRightX: 0,
  spawnHoldS: 0, // spawner deferral timer (gate window / post-resolution)
  cam: createCamera(),
  worldS: 0,
  hearts: 0,
  depthIndex: 0,
  pressQueue: 0,
  slideQueue: 0,
  particles: [],
  floaters: [],
  deathAt: 0,
  hitAt: -10,
  hitFlashColor: '255,255,255',
  announceText: '',
  announceUntil: -1,
  announceColor: '#ffd76a',
};

const save = loadSave();
if (GAME_CONFIG.remoteAdapter) setRemoteAdapter(GAME_CONFIG.remoteAdapter);

const els = {};
let canvas = null;
let ctx = null;
let debug = false;
let clockNow = 0; // seconds, updated once per frame
let input = { jumpHeld: false };
let powerBtnState = ''; // cached "charged|glyph" to avoid per-frame DOM writes

function distanceM() {
  return Math.floor(meters(state.cam.x));
}

/** A fresh run: everything zeroed; the seed shuffles the gate rule order
 *  (plan §2 Phase C: learnable within a run, fresh across runs). */
function buildRun() {
  state.player = createPlayer();
  state.spawner = createSpawner();
  state.obstacles = [];
  state.orbs = [];
  state.gate = null;
  state.run = createRun(save.character, mulberry32((Math.random() * 0xffffffff) >>> 0));
  state.gateOrder = shuffledRules(state.run.seedRng);
  state.gateIndex = 0;
  state.run.nextGateM = 500 + state.run.seedRng() * 200; // first split 600 ± 100
  state.lastRightX = SPAWN_X - minGap(SCROLL_START); // first gap → x ≥ SPAWN_X
  state.spawnHoldS = 0;
  state.cam = createCamera();
  state.worldS = 0;
  state.hearts = HEARTS_MAX; // plan §2: hearts 2
  state.depthIndex = 0;
  state.pressQueue = 0;
  state.slideQueue = 0;
  state.particles = [];
  state.floaters = [];
  state.hitAt = -10;
  powerBtnState = '';
}

/* ==========================================================================
 * 4. Screens + meta UI
 * ======================================================================= */

function showScreen(mode) {
  els.screenMenu.classList.toggle('hidden', mode !== 'menu');
  els.overlayPause.classList.toggle('hidden', mode !== 'paused');
  els.overlayOver.classList.toggle('hidden', mode !== 'gameover');
  els.btnPause.classList.toggle('hidden', mode !== 'playing');
  els.btnPower.classList.toggle('hidden', mode !== 'playing');
  if (mode === 'menu') renderMenu();
}

function renderMenu() {
  const best = loadSave();
  els.menuBest.textContent = best.bestDistanceM
    ? 'Best ' + best.bestDistanceM + ' m'
    : 'No best yet — how deep can you go?';
  els.menuShards.textContent =
    best.shards + ' spirit shard' + (best.shards === 1 ? '' : 's') + ' ✦';
  els.toggleAuto.checked = save.settings.autoPower;
  renderCharCards();
}

function renderCharCards() {
  els.charCards.innerHTML = '';
  for (const id of Object.keys(CHARACTERS)) {
    const meta = CHARACTERS[id];
    const unlocked = save.unlocked.includes(id);
    const card = document.createElement('button');
    card.type = 'button';
    card.className =
      'char-card' + (save.character === id ? ' selected' : '') + (unlocked ? '' : ' locked');
    card.setAttribute(
      'aria-label',
      meta.label +
        (unlocked ? ' — selected character' : ' — locked, costs ' + meta.unlockAt + ' shards')
    );
    const emoji = id === 'spirit' ? '🧚' : id === 'hunter' ? '🏹' : '🧘';
    card.innerHTML =
      '<span class="char-emoji">' +
      emoji +
      '</span>' +
      '<span class="char-name">' +
      meta.label +
      '</span>' +
      '<span class="char-blurb">' +
      meta.blurb +
      '</span>' +
      (unlocked
        ? save.character === id
          ? '<span class="char-state">✔ chosen</span>'
          : '<span class="char-state">tap to choose</span>'
        : '<span class="char-state char-cost">🔒 ' + meta.unlockAt + ' shards</span>');
    card.addEventListener('click', () => pickCharacter(id));
    els.charCards.appendChild(card);
  }
}

/** Characters switch mid-menu only — never mid-run (plan §7.6). */
function pickCharacter(id) {
  if (state.mode !== 'menu') return;
  if (!save.unlocked.includes(id)) {
    toast(
      CHARACTERS[id].label +
        ' needs ' +
        CHARACTERS[id].unlockAt +
        ' shards — you have ' +
        save.shards
    );
    blip(180, 90, 'square');
    return;
  }
  save.character = id;
  saveSave(save);
  blip(660, 60);
  renderCharCards();
}

function toMenu() {
  buildRun();
  state.mode = 'menu';
  showScreen('menu');
}

/** Straight into the run — restart is one tap and instant (as 05). */
function toPlay() {
  buildRun();
  state.mode = 'playing';
  showScreen('playing');
}

/* ==========================================================================
 * 5. Run lifecycle
 * ======================================================================= */

function announce(text, color) {
  state.announceText = text;
  state.announceColor = color || '#ffd76a';
  state.announceUntil = clockNow + 1.6;
}

function die() {
  state.mode = 'gameover';
  state.deathAt = clockNow;
  state.pressQueue = 0;
  state.slideQueue = 0;
  blip(130, 200, 'square');
  blip(90, 260, 'sawtooth', 0.06);
  vibrate([60, 40, 60]);

  const m = distanceM();
  const earned = shardsFor(state.run, m);
  const score = scoreFor(state.run, m);

  // meta: shards + unlocks persist forever; best distance separate (plan §2)
  const prevBest = save.bestDistanceM;
  const newBest = m > 0 && m > prevBest;
  save.shards += earned;
  if (newBest) save.bestDistanceM = m;
  const newUnlocks = [];
  for (const id of Object.keys(CHARACTERS)) {
    if (!save.unlocked.includes(id) && save.shards >= CHARACTERS[id].unlockAt) {
      save.unlocked.push(id);
      newUnlocks.push(CHARACTERS[id].label);
    }
  }
  saveSave(save);

  els.overDistance.textContent = m + ' m';
  els.overDetail.textContent =
    state.run.orbsCollected +
    ' orbs · ' +
    state.run.correctGates +
    ' gates correct · score ' +
    score;
  els.overShards.textContent =
    '+' + earned + ' shard' + (earned === 1 ? '' : 's') + ' · ' + save.shards + ' total';
  els.overUnlock.textContent = newUnlocks.length
    ? '✦ Unlocked: ' + newUnlocks.join(' · ')
    : save.shards >= CHARACTERS.monk.unlockAt
      ? ''
      : nextUnlockHint();
  els.overUnlock.classList.toggle('hidden', !els.overUnlock.textContent);
  els.badgeNew.classList.toggle('hidden', !newBest);
  els.overBest.textContent = 'Best ' + save.bestDistanceM + ' m';
  if (newBest) {
    blip(523, 90, 'triangle', 0.25);
    blip(659, 90, 'triangle', 0.35);
    blip(784, 160, 'triangle', 0.45);
  }
  showScreen('gameover');
  els.btnRetry.focus();
}

function nextUnlockHint() {
  for (const id of ['hunter', 'monk']) {
    if (!save.unlocked.includes(id)) {
      return CHARACTERS[id].unlockAt - save.shards + ' shards to ' + CHARACTERS[id].label;
    }
  }
  return '';
}

/** A heart absorbs the hit: −1 heart, 1.2 s invulnerability blink (plan §2). */
function hitHeart() {
  state.hearts--;
  state.player.invulnS = INVULN_S;
  state.hitAt = clockNow;
  state.hitFlashColor = '255,120,140';
  blip(392, 90, 'square');
  blip(294, 120, 'square', 0.08);
  vibrate(40);
}

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
 * 6. Powers + gates (thin orchestration over core/gates)
 * ======================================================================= */

function activatePower() {
  if (state.mode !== 'playing') return;
  const powers = state.run.powers;
  if (powers.meter < METER_FULL) return;
  const kind = chargedPower(powers);
  applyPower(powers, kind);
  state.floaters.push({
    x: PLAYER_X + 26,
    y: GROUND_Y - 90,
    born: clockNow,
    life: 0.9,
    text: POWER_LABEL[kind] + '!',
    color: '#ffe9b0',
  });
  if (kind === 'double') {
    blip(587, 80);
    blip(880, 110, 'triangle', 0.07);
  } else if (kind === 'dash') {
    blip(196, 70, 'sawtooth');
    blip(392, 90, 'sawtooth', 0.06);
    blip(784, 120, 'sawtooth', 0.12);
    vibrate(25);
  } else {
    blip(392, 160, 'sine');
    blip(262, 220, 'sine', 0.08);
  }
}

/** The split resolves where the thumb landed: outer thirds are the doors. */
function chooseGate(side) {
  const wrapper = state.gate;
  if (!wrapper || wrapper.resolved || state.mode !== 'playing') return;
  wrapper.resolved = true;
  wrapper.resolvedAt = clockNow;
  wrapper.outcome = resolveChoice(wrapper.gate, side);
  state.run.orbsSinceGate = 0;
  state.gateIndex++;
  state.spawnHoldS = GATE_RESUME_DELAY_S;
  if (wrapper.outcome === 'correct') {
    state.run.correctGates++;
    state.floaters.push({
      x: PLAYER_X + 26,
      y: GROUND_Y - 110,
      born: clockNow,
      life: 0.9,
      text: '+100',
      color: '#b7f5c4',
    });
    blip(523, 90, 'triangle');
    blip(659, 90, 'triangle', 0.08);
    blip(784, 140, 'triangle', 0.16);
  } else {
    // wrong gate → banished to the shadow realm (plan §2 Phase C). This is
    // not damage: it fires through invulnerability too (plan §7.2).
    enterShadow(state.run, meters(state.cam.x));
    state.hitAt = clockNow;
    state.hitFlashColor = '190,90,230';
    announce('SHADOW REALM', '#f2a0ff');
    blip(147, 260, 'sawtooth');
    blip(110, 320, 'sawtooth', 0.09);
    vibrate([50, 30, 50]);
  }
}

/* ==========================================================================
 * 7. Fixed-step update (core owns the rules; this only orchestrates)
 * ======================================================================= */

function update(dt) {
  if (state.mode !== 'playing') return;
  const run = state.run;
  const powers = run.powers;

  // slow time: the whole world runs ×0.6 (plan §2 Phase B) — power timers
  // and the shadow countdown use their own clocks (core)
  const worldScale = powers.timers.slow > 0 ? SLOW_TIME_SCALE : 1;
  const sdt = dt * worldScale;

  advanceCamera(state.cam, sdt, speedAt);
  state.worldS += sdt;
  const m = meters(state.cam.x);

  // spawner modifiers: shadow density ×1.5 (plan §2 Phase C); Monk slows
  // spawns ×0.7 while slow time is active (plan §2 Phase D; §7.4 caps both)
  state.spawner.meters = m;
  state.spawner.density = run.shadowS > 0 ? SHADOW_DENSITY : 1;
  state.spawner.spawnScale =
    powers.timers.slow > 0 && run.character === 'monk' ? MONK_SLOW_SPAWN_SCALE : 1;

  const pressed = state.pressQueue > 0;
  if (pressed) state.pressQueue--;
  const slidePressed = state.slideQueue > 0;
  if (slidePressed) state.slideQueue--;
  stepPlayer(state.player, sdt, {
    pressed,
    held: input.jumpHeld,
    slidePressed,
    doubleJump: powers.timers.double > 0,
  });

  if (state.player.jumped) {
    state.player.jumped = false;
    blip(560, 65);
  }
  if (state.player.landed) {
    state.player.landed = false;
    spawnDust();
    blip(170, 45, 'sine');
  }

  // powers tick on real time (slow time must not extend itself); dash draws
  tickPowers(powers, dt);
  state.player.dashTrail = powers.timers.dash > 0;
  if (save.settings.autoPower && powers.meter >= METER_FULL) activatePower();

  // spawner: gate window holds everything (the split reads clean); the
  // cursor jumped past the doors at spawn, so resume lands beyond them
  if (state.spawnHoldS > 0) state.spawnHoldS -= sdt;
  const gateLive = state.gate && !state.gate.resolved;
  if (!gateLive && state.spawnHoldS <= 0) {
    while (state.lastRightX < state.cam.x + VIEW_W + SPAWN_LEAD) {
      const spawn = nextSpawn(state.spawner, state.cam.speed, state.lastRightX);
      for (const item of spawn.items) state.obstacles.push(makeObstacle(spawn.x + item.dx, item));
      state.lastRightX = groupRightX(spawn.x, spawn.items);
      // a formation of orbs rides the spawner (plan §2 Phase B)
      if (state.spawner.rng() < ORB_CHANCE) {
        const orbs =
          state.spawner.rng() < 0.6
            ? spawnOrbArc(state.spawner.rng, state.lastRightX + 70, state.cam.speed)
            : spawnOrbLine(state.spawner.rng, state.lastRightX + 70, state.cam.speed);
        state.orbs.push(...orbs);
        state.lastRightX += Math.max(0, (orbs.length - 1) * 46);
      }
    }
  }
  while (
    state.obstacles.length &&
    (state.obstacles[0].destroyed ||
      state.obstacles[0].worldX + state.obstacles[0].w < state.cam.x + CULL_X)
  ) {
    state.obstacles.shift();
  }
  while (
    state.orbs.length &&
    (state.orbs[0].taken || state.orbs[0].worldX < state.cam.x + CULL_X)
  ) {
    state.orbs.shift();
  }

  // orbs: generous grab vs the full player box — in WORLD space (ob/orb
  // worldX vs the player's world x); shadow realm pays ×2
  const pb = playerBox(state.player);
  const pbWorld = { x: state.cam.x + PLAYER_X - pb.w / 2, y: pb.y, w: pb.w, h: pb.h };
  const worth = run.shadowS > 0 ? SHADOW_ORB_WORTH : 1;
  const wasFull = powers.meter >= METER_FULL;
  for (const orb of state.orbs) {
    if (orb.taken) continue;
    if (orb.worldX > state.cam.x + VIEW_W + 60) break; // sorted by spawn x
    if (orbHit(orb, pbWorld)) {
      orb.taken = true;
      run.orbsCollected++;
      run.orbsSinceGate++;
      run.lastOrbColor = orb.color;
      powers.meter = Math.min(METER_FULL, powers.meter + worth);
      spawnOrbBurst(orb);
      blip(620 + powers.meter * 26, 55, 'triangle');
      if (!wasFull && powers.meter >= METER_FULL) {
        announce(POWER_LABEL[chargedPower(powers)] + ' ready!', '#ffe9b0');
        blip(523, 70, 'triangle');
        blip(784, 100, 'triangle', 0.08);
      }
    }
  }

  // the split: spawn 2 s ahead, doors swallow the forest beyond them
  if (!state.gate || (state.gate.resolved && state.gate.worldX + GATE_SPAN < state.cam.x - 60)) {
    if (state.gate) state.gate = null;
    if (gateReady(run, m)) {
      const worldX = Math.max(
        state.cam.x + VIEW_W + 40,
        state.cam.x + PLAYER_X + state.cam.speed * GATE_ARRIVAL_S
      );
      const ruleId = state.gateOrder[state.gateIndex % state.gateOrder.length];
      const gate = makeGate(ruleId, run.seedRng, run);
      state.gate = { worldX, gate, resolved: false, resolvedAt: 0, outcome: null };
      // the doors own the track: the spawn cursor jumps past them and any
      // spawned-ahead obstacles/orbs beyond the doors dissolve into mist
      state.lastRightX = Math.max(state.lastRightX, worldX + GATE_SPAN + 120);
      state.obstacles = state.obstacles.filter((o) => o.worldX + o.w < worldX - 40);
      state.orbs = state.orbs.filter((o) => o.worldX < worldX - 40);
    }
  }
  if (state.gate && !state.gate.resolved) {
    const playerWorldX = state.cam.x + PLAYER_X;
    if (state.gate.worldX + GATE_SPAN < playerWorldX) {
      chooseGate(null); // the doors passed unanswered — the realm takes you
    }
  }

  // shadow realm: timer on the world clock; expiry re-anchors the gates
  if (tickShadow(run, sdt)) {
    reanchorGates(run, m, run.seedRng);
    state.hitAt = clockNow;
    state.hitFlashColor = '150,255,220';
    announce('The forest returns', '#b7f5c4');
    blip(523, 90, 'triangle');
    blip(659, 120, 'triangle', 0.09);
  }

  // collision: hearts absorb (plan §2), dash destroys exactly one (§7.3),
  // invulnerability ignores everything (§7.2 only gates pass through it)
  if (state.player.invulnS <= 0) {
    const playerWorldX = state.cam.x + PLAYER_X;
    for (const obs of state.obstacles) {
      if (obs.destroyed) continue;
      if (obs.worldX > playerWorldX + pbWorld.w) break; // sorted by spawn x
      if (obs.kind === 'trap' && !trapLit(obs, state.worldS)) continue; // dark = safe
      if (!aabbHit(pbWorld, obstacleBox(obs))) continue;
      if (dashDestroy(powers, obs)) {
        spawnDashBurst(obs);
        blip(880, 70, 'sawtooth');
        vibrate(20);
      } else {
        if (state.hearts > HEARTS_MAX - 1) hitHeart();
        else {
          hitHeart();
          die();
          return;
        }
      }
      break;
    }
  }

  // depth announcement (palette shifts dawn → dusk → night)
  const depth = paletteFor(m).depthIndex;
  if (depth > state.depthIndex) {
    state.depthIndex = depth;
    announce(DEPTH_LABELS[depth], '#ffe9b0');
    blip(740, 90);
    blip(988, 140, 'triangle', 0.09);
  }

  // prune cosmetics
  state.particles = state.particles.filter((p) => clockNow - p.born < p.life);
  state.floaters = state.floaters.filter((f) => clockNow - f.born < f.life);
}

/* ==========================================================================
 * 8. Particles
 * ======================================================================= */

const PARTICLE_LIFE_S = 0.55;

function spawnDust() {
  for (let i = 0; i < 6; i++) {
    state.particles.push({
      x: PLAYER_X + (Math.random() - 0.5) * 16,
      y: state.player.y - 2,
      vx: (Math.random() - 0.5) * 90 - 30,
      vy: -(20 + Math.random() * 70),
      r: 2.5,
      color: 'rgba(200,190,170,0.5)',
      gravity: true,
      born: clockNow,
      life: 0.45,
    });
  }
}

function spawnOrbBurst(orb) {
  const colors = {
    cyan: 'rgba(110,231,255,0.8)',
    violet: 'rgba(196,148,255,0.8)',
    gold: 'rgba(255,208,106,0.8)',
  };
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2;
    state.particles.push({
      x: orb.worldX - state.cam.x,
      y: orb.y,
      vx: Math.cos(ang) * (60 + Math.random() * 60),
      vy: Math.sin(ang) * (60 + Math.random() * 60),
      r: 2.6,
      color: colors[orb.color] || colors.cyan,
      gravity: false,
      born: clockNow,
      life: PARTICLE_LIFE_S,
    });
  }
}

function spawnDashBurst(obs) {
  for (let i = 0; i < 12; i++) {
    state.particles.push({
      x: obs.worldX - state.cam.x + obs.w / 2,
      y: GROUND_Y - obs.h / 2,
      vx: (Math.random() - 0.5) * 260,
      vy: -(Math.random() * 220),
      r: 3,
      color: 'rgba(174,255,229,0.85)',
      gravity: true,
      born: clockNow,
      life: 0.5,
    });
  }
}

/* ==========================================================================
 * 9. Render
 * ======================================================================= */

function fitCanvas() {
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
  clockNow = t;

  const sinceDeath = t - state.deathAt;
  const gameOvering = state.mode === 'gameover';
  const sinceHit = t - state.hitAt;
  const flash = gameOvering
    ? Math.max(0, 1 - sinceDeath / FLASH_S)
    : Math.max(0, 1 - sinceHit / HIT_FLASH_S) * (sinceHit < HIT_FLASH_S ? 0.5 : 0);

  const shake = { x: 0, y: 0 };
  if (gameOvering && sinceDeath < SHAKE_S) {
    const mag = 9 * (1 - sinceDeath / SHAKE_S);
    shake.x = mag * Math.sin(t * 73);
    shake.y = mag * Math.cos(t * 61);
  }

  const m = meters(state.cam.x);
  const run = state.run;
  drawScene(ctx, {
    mode: state.mode,
    player: state.player,
    obstacles: state.obstacles,
    orbs: state.orbs,
    gate: state.gate,
    cam: state.cam,
    worldS: state.worldS,
    worldScale: run && run.powers.timers.slow > 0 ? SLOW_TIME_SCALE : 1,
    distanceM: Math.floor(m),
    hearts: state.hearts,
    powers: run ? run.powers : { meter: 0, timers: { double: 0, dash: 0, slow: 0 } },
    chargedPower: run ? chargedPower(run.powers) : 'double',
    depthLabel: DEPTH_LABELS[paletteFor(m).depthIndex],
    shadowS: run ? run.shadowS : 0,
    announceText: state.announceText,
    announceUntil: state.announceUntil,
    announceColor: state.announceColor,
    particles: state.particles,
    floaters: state.floaters,
    character: save.character,
    flash,
    flashColor: state.hitFlashColor,
    shake,
    t,
    paletteM: m,
    debug,
  });

  // power button liveness (DOM write only on change)
  if (run) {
    const ready = run.powers.meter >= METER_FULL;
    const key = (ready ? '1' : '0') + chargedPower(run.powers);
    if (key !== powerBtnState) {
      powerBtnState = key;
      els.btnPower.textContent = ready ? POWER_GLYPH[chargedPower(run.powers)] : '✦';
      els.btnPower.classList.toggle('charged', ready);
      els.btnPower.setAttribute(
        'aria-label',
        ready
          ? 'Activate ' + POWER_LABEL[chargedPower(run.powers)]
          : 'Power meter — ' + run.powers.meter + ' of ' + METER_FULL + ' orbs'
      );
    }
  }
}

/* ==========================================================================
 * 10. Loop + input
 * ======================================================================= */

const loop = createLoop({ update, render: draw, fixedDt: FIXED_DT, onAutoPause: pauseGame });

function onAction(action) {
  if (state.mode === 'menu') {
    if (action.type === 'jump') {
      ensureAudio();
      toPlay(); // starting a run is the same one action — no surprise jump
    }
    return;
  }
  if (state.mode !== 'playing') return; // paused / gameover: ignored (as 05)
  const gateLive = state.gate && !state.gate.resolved;
  if (gateLive && action.type === 'jump' && typeof action.fx === 'number') {
    // outer thirds are the doors; the middle keeps jumping (plan §4: one thumb)
    if (action.fx < 1 / 3) {
      chooseGate('left');
      return;
    }
    if (action.fx > 2 / 3) {
      chooseGate('right');
      return;
    }
  }
  if (action.type === 'jump') state.pressQueue++;
  else if (action.type === 'slide') state.slideQueue++;
}

/* ==========================================================================
 * 11. Share (master README §2 chain: Web Share → clipboard → prompt)
 * ======================================================================= */

function share() {
  const m = distanceM();
  const text = shareText(
    m,
    CHARACTERS[save.character].label,
    scoreFor(state.run, m),
    window.location.origin + window.location.pathname
  );
  if (navigator.share) {
    navigator.share({ title: 'Spirit Runner', text }).catch(() => {
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

/* ==========================================================================
 * 12. Wiring + init
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
  els.menuShards = document.getElementById('menu-shards');
  els.charCards = document.getElementById('char-cards');
  els.toggleAuto = document.getElementById('toggle-auto');
  els.overDistance = document.getElementById('over-distance');
  els.overDetail = document.getElementById('over-detail');
  els.overShards = document.getElementById('over-shards');
  els.overUnlock = document.getElementById('over-unlock');
  els.overBest = document.getElementById('over-best');
  els.badgeNew = document.getElementById('badge-new');
  els.btnMute = document.getElementById('btn-mute');
  els.btnPause = document.getElementById('btn-pause');
  els.btnPower = document.getElementById('btn-power');
  els.btnRetry = document.getElementById('btn-retry');
  els.toast = document.getElementById('toast');

  els.btnMute.textContent = save.settings.muted ? '🔇' : '🔊';
  els.btnMute.setAttribute('aria-pressed', String(save.settings.muted));
  els.btnMute.addEventListener('click', () => {
    save.settings.muted = !save.settings.muted;
    saveSave(save);
    els.btnMute.textContent = save.settings.muted ? '🔇' : '🔊';
    els.btnMute.setAttribute('aria-pressed', String(save.settings.muted));
    if (!save.settings.muted) blip(660, 80);
  });

  els.toggleAuto.addEventListener('change', () => {
    save.settings.autoPower = els.toggleAuto.checked;
    saveSave(save);
  });

  document.getElementById('btn-play').addEventListener('click', () => {
    ensureAudio();
    toPlay();
  });
  document.getElementById('btn-resume').addEventListener('click', resumeGame);
  document.getElementById('btn-pmenu').addEventListener('click', toMenu);
  els.btnRetry.addEventListener('click', () => {
    ensureAudio();
    toPlay();
  });
  document.getElementById('btn-share').addEventListener('click', share);
  document.getElementById('btn-omenu').addEventListener('click', toMenu);
  els.btnPause.addEventListener('click', pauseGame);
  els.btnPower.addEventListener('click', activatePower);

  input = createRunnerInput(els.stage, onAction);

  // ←/→ pick a door during a split; E fires the charged power;
  // Escape / P toggle the pause overlay (codes, not keys — layout-proof)
  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.closest && e.target.closest('button, a, input, textarea, select'))
      return;
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
      if (state.mode === 'playing' && state.gate && !state.gate.resolved) {
        e.preventDefault();
        chooseGate(e.code === 'ArrowLeft' ? 'left' : 'right');
      }
      return;
    }
    if (e.code === 'KeyE') {
      if (state.mode === 'playing') {
        e.preventDefault();
        activatePower();
      }
      return;
    }
    if (e.key !== 'Escape' && e.key !== 'p' && e.key !== 'P') return;
    if (state.mode === 'playing') pauseGame();
    else if (state.mode === 'paused') resumeGame();
  });

  // WebAudio contexts may only be created from a user gesture.
  document.addEventListener('pointerdown', ensureAudio, { once: true });

  buildRun();
  state.mode = 'menu';
  showScreen('menu');
  loop.start();
  // ?debug=1 dev aid: expose live state for console probes / automated smoke
  if (debug) window.__sr = { state: state, save: save };
}

if (typeof document !== 'undefined' && document.getElementById('world')) {
  init();
}
