/**
 * ============================================================================
 * Spirit Runner — core.js (Game 07, plan/games/07-spirit-runner.md §6)
 * ============================================================================
 * Pure model, zero DOM access — this module is the test surface (plan §8),
 * forked from Game 05's core (plan/games/05-continuous-runner.md) with the
 * Phase A–D extensions: slide, the five mystical obstacles, spirit orbs,
 * the fixed power cycle, the shadow realm and spirit-shard math. Plain ESM,
 * no build step: engine.js / render.js / main.js import it in the browser;
 * the jest suite (src/__tests__/games-spirit-runner.test.ts) and the folder's
 * core.test.html harness import it directly.
 *
 * World = 900×500 logical viewport, ground line at y=420 (§3, like 05).
 * The runner sits at a fixed x (25 %); the world scrolls left, ramping
 * 320→900 px/s exactly like Game 05 (plan §2: "Speed ramp as 05").
 *
 * Coordinates: obstacles/orbs/gates live in WORLD space (worldX fixed at
 * spawn); the camera converts to screen space via `worldX - camera`. The
 * player's world x is `camera + PLAYER_X`.
 * ============================================================================
 */

import { ORB_COLORS } from './gates.js';

/* ---- persistence key (plan §5, verbatim) ------------------------------------ */

export const SAVE_KEY = 'game:spirit-runner:save';

/* ---- viewport (plan §3: virtual viewport 900×500 like 05) ------------------- */

export const VIEW_W = 900;
export const VIEW_H = 500;
export const GROUND_Y = 420;
export const PLAYER_X = 225; // fixed 25 % of the width

/* ---- physics (plan §2: jump exactly as 05; slide is new) --------------------- */

export const SCROLL_START = 320; // px/s at t=0 …
export const SPEED_RAMP = 6; // … +6 px/s per second …
export const SPEED_CAP = 900; // … capped here
export const JUMP_VY = -820; // px/s on jump (as 05)
export const GRAVITY = 2200; // px/s²
export const JUMP_CUT = 0.55; // releasing early caps upward velocity at 55 %
export const COYOTE_MS = 80; // grace after leaving ground
export const BUFFER_MS = 100; // early tap counts when landing
export const HITBOX_INSET = 0.15; // forgiveness on the player AABB (×0.85)

export const PLAYER_W = 34;
export const PLAYER_H = 44; // standing; sliding drops the hitbox to 40 %

/* slide (plan §2 Phase A: 600 ms, hitbox 40 % height, slide-jump hop) */
export const SLIDE_MS = 600;
export const SLIDE_H_FACTOR = 0.4;
export const SLIDE_BUFFER_MS = 100; // early down-swipe counts when landing
export const SLIDE_HOP_VY = -500; // slide-jump cancels into a hop

export const HEARTS_MAX = 2; // plan §2: hearts 2 — deliberately softer than 05
export const INVULN_S = 1.2; // hit → 1.2 s invulnerability (blink)

/* ---- speed / distance / depth tiers ------------------------------------------ */

/** Scroll speed for a run elapsed time (plan §2: ramp as 05). */
export function speedAt(elapsedS) {
  return Math.min(SPEED_CAP, SCROLL_START + SPEED_RAMP * elapsedS);
}

/** Meters conversion (as 05): distance meters = px / 10. */
export function meters(px) {
  return px / 10;
}

/** First meter of each obstacle tier (plan §2 table "Introduced" column). */
export const TIER_START_M = [0, 300, 800, 1200];

/**
 * Obstacle tier for a distance in meters (plan §2 table):
 * 1 logs · 2 +low branches · 3 +spirit guardians · 4 +rune traps.
 */
export function tierFor(m) {
  if (m < TIER_START_M[1]) return 1;
  if (m < TIER_START_M[2]) return 2;
  if (m < TIER_START_M[3]) return 3;
  return 4;
}

/* ---- player (jump as 05 + slide states) --------------------------------------- */

export function createPlayer() {
  return {
    x: PLAYER_X,
    y: GROUND_Y, // feet y; standing on the ground line
    vy: 0,
    onGround: true,
    coyoteMs: COYOTE_MS,
    bufferMs: 0, // jump press buffer
    slideBufferMs: 0, // down press buffer — slide starts on landing
    sliding: false,
    slideMs: 0, // remaining slide time
    airJumps: 0, // spent mid-air jumps (double-jump power allows 1)
    fullJump: true, // false right after a slide hop — the cut must not shrink it
    invulnS: 0,
    jumped: false, // transient: a jump/hop fired this step (main consumes)
    landed: false, // transient: air→ground this step (main consumes)
  };
}

/**
 * One physics step at a fixed 1/120 s (deterministic whatever the caller
 * feeds). `input` = { pressed (jump edge), held (live hold → jump cut),
 * slidePressed (down edge), doubleJump (power active → one mid-air jump) }.
 *
 * Pipeline: slide-press → buffer or start; jump-press while sliding → hop
 * cancel; press → buffer; buffer + (grounded or coyote) → jump; airborne +
 * buffer + doubleJump power + airJumps < 1 → second jump; rising + released
 * (full jumps only) → vy capped; gravity → integrate → ground resolve
 * (landed flag, slide buffer, coyote refresh). Mutates and returns player.
 */
export function stepPlayer(player, dt, input) {
  const slideH = PLAYER_H * SLIDE_H_FACTOR;

  if (input.slidePressed) {
    if (player.onGround) {
      player.sliding = true;
      player.slideMs = SLIDE_MS;
    } else {
      player.slideBufferMs = SLIDE_BUFFER_MS;
    }
  }

  if (input.pressed) {
    if (player.sliding) {
      // slide-jump cancels into a hop (plan §2 Phase A)
      player.sliding = false;
      player.slideMs = 0;
      player.vy = SLIDE_HOP_VY;
      player.onGround = false;
      player.coyoteMs = 0;
      player.bufferMs = 0;
      player.fullJump = false;
      player.jumped = true;
    } else {
      player.bufferMs = BUFFER_MS;
    }
  }

  if (player.sliding) {
    player.slideMs -= dt * 1000;
    if (player.slideMs <= 0) {
      player.sliding = false;
      player.slideMs = 0;
    }
  }

  if (player.bufferMs > 0 && (player.onGround || player.coyoteMs > 0)) {
    player.vy = JUMP_VY;
    player.onGround = false;
    player.coyoteMs = 0;
    player.bufferMs = 0;
    player.airJumps = 0; // a ground jump resets the mid-air budget
    player.fullJump = true;
    player.jumped = true;
  } else if (
    player.bufferMs > 0 &&
    !player.onGround &&
    player.coyoteMs <= 0 &&
    input.doubleJump &&
    player.airJumps < 1
  ) {
    // double-jump power (plan §2 Phase B): exactly one second mid-air jump
    player.vy = JUMP_VY;
    player.bufferMs = 0;
    player.airJumps++;
    player.fullJump = true;
    player.jumped = true;
  }
  if (player.bufferMs > 0) player.bufferMs = Math.max(0, player.bufferMs - dt * 1000);

  // jump cut (as 05) — never applied to a slide hop, which is already small
  if (player.fullJump && !input.held && player.vy < JUMP_VY * JUMP_CUT) {
    player.vy = JUMP_VY * JUMP_CUT;
  }

  player.vy += GRAVITY * dt;
  player.y += player.vy * dt;

  if (player.y >= GROUND_Y) {
    if (!player.onGround) {
      player.landed = true;
      player.airJumps = 0;
      player.fullJump = true;
      if (player.slideBufferMs > 0) {
        player.sliding = true;
        player.slideMs = SLIDE_MS;
        player.slideBufferMs = 0;
      }
    }
    player.y = GROUND_Y;
    player.vy = 0;
    player.onGround = true;
    player.coyoteMs = COYOTE_MS;
  } else {
    player.onGround = false;
    player.coyoteMs = Math.max(0, player.coyoteMs - dt * 1000);
  }
  if (player.slideBufferMs > 0) {
    player.slideBufferMs = Math.max(0, player.slideBufferMs - dt * 1000);
  }

  if (player.invulnS > 0) player.invulnS = Math.max(0, player.invulnS - dt);
  return player;
}

/** Full (uninset) player AABB — bottom-anchored; slide drops height to 40 %. */
export function playerBox(player) {
  const h = player.sliding ? PLAYER_H * SLIDE_H_FACTOR : PLAYER_H;
  return { x: player.x - PLAYER_W / 2, y: player.y - h, w: PLAYER_W, h };
}

/* ---- obstacles (plan §2 Phase A table) ----------------------------------------- */

export const LOG_W = 72;
export const LOG_H_MIN = 30;
export const LOG_H_MAX = 40; // even a jump-cut tap (apex ≈ 46) clears a log
export const BRANCH_W = 100; // hanging bough — the box reaches up past any jump
export const BRANCH_TOP = 300; // box top, px above the ground line
export const BRANCH_BOTTOM = 28; // box bottom, px above the ground (slide clears)
export const GUARDIAN_TALL_W = 30;
export const GUARDIAN_TALL_H = 96; // grounded column — jump only
export const GUARDIAN_LOW_BOTTOM = 34; // hovering disc — slide only
export const GUARDIAN_LOW_TOP = 260; // trail reaches up past any jump
export const GUARDIAN_LOW_W = 84;
export const TRAP_W = 64;
export const TRAP_H = 26;
export const TRAP_CYCLE_S = 1.2; // 0.7 s dark (safe) → 0.5 s lit (lethal)
export const TRAP_DARK_S = 0.7;
export const TRAP_WARN_S = 0.15; // pre-glow before the lethal window (render)
export const SPAWN_X = 950;
export const CULL_X = -100;

export function logH(rng) {
  return LOG_H_MIN + Math.round(rng() * (LOG_H_MAX - LOG_H_MIN));
}

/**
 * A rune trap's phase in its 1.2 s cycle: p < 0.7 dark (safe), p ≥ 0.7 lit
 * (lethal). `worldS` is the accumulated world time (slow time slows the
 * cycle — timing a trap is easier under Slow time, as it should be).
 */
export function trapPhase(trap, worldS) {
  return (worldS + trap.phase) % TRAP_CYCLE_S;
}

export function trapLit(trap, worldS) {
  return trapPhase(trap, worldS) >= TRAP_DARK_S;
}

/**
 * Spawner fairness (as 05): gap sampled 380–700 px, never below
 * minGap(speed) = speed × 1.05 + 120 — a full jump always fits. `density`
 * (shadow realm ×1.5, plan §2 Phase C) divides BOTH the sample and the
 * floor; a smaller floor stays fair because the full-jump airtime distance
 * (≈ 671 px at cap) stays under floor/1.5 at every speed (test-proven).
 * `spawnScale` (Monk: spawns ×0.7 while slow) multiplies the result —
 * multiplicative with density, capped once each (plan §7.4).
 */
export function minGap(speed, density = 1, spawnScale = 1) {
  return ((speed * 1.05 + 120) / density) * spawnScale;
}

/** A spawner owns its rng stream and the caller-refreshed meters view. */
export function createSpawner(rng = Math.random) {
  return { rng, meters: 0, density: 1, spawnScale: 1 };
}

/**
 * Next obstacle group, ≥ the scaled fair gap after `lastRightX`. Type by
 * tier (plan §2 Phase A table): 1 log · 2 +branch · 3 +guardians · 4 +trap.
 * Rolls within a tier keep earlier types represented (nothing disappears).
 */
export function nextSpawn(spawner, speed, lastRightX) {
  const sampled = (380 + spawner.rng() * (700 - 380)) / spawner.density;
  const gap = Math.max(sampled, minGap(speed, spawner.density, spawner.spawnScale));
  const x = lastRightX + gap;
  const tier = tierFor(spawner.meters);
  const roll = spawner.rng();

  if (tier === 1) return logGroup(spawner, x);
  if (tier === 2) return roll < 0.6 ? logGroup(spawner, x) : branchGroup(spawner, x);
  if (tier === 3) {
    if (roll < 0.3) return logGroup(spawner, x);
    if (roll < 0.55) return branchGroup(spawner, x);
    if (roll < 0.8) return guardianGroup(spawner, x, 'guardian-tall');
    return guardianGroup(spawner, x, 'guardian-low');
  }
  if (roll < 0.2) return logGroup(spawner, x);
  if (roll < 0.4) return branchGroup(spawner, x);
  if (roll < 0.6) return guardianGroup(spawner, x, 'guardian-tall');
  if (roll < 0.8) return guardianGroup(spawner, x, 'guardian-low');
  return trapGroup(spawner, x);
}

function logGroup(spawner, x) {
  return { x, kind: 'log', items: [{ dx: 0, w: LOG_W, h: logH(spawner.rng), kind: 'log' }] };
}

function branchGroup(spawner, x) {
  return { x, kind: 'branch', items: [{ dx: 0, w: BRANCH_W, h: 0, kind: 'branch' }] };
}

function guardianGroup(spawner, x, kind) {
  return {
    x,
    kind,
    items: [{ dx: 0, w: kind === 'guardian-tall' ? GUARDIAN_TALL_W : GUARDIAN_LOW_W, h: 0, kind }],
  };
}

function trapGroup(spawner, x) {
  const w = TRAP_W;
  const h = TRAP_H;
  return {
    x,
    kind: 'trap',
    items: [{ dx: 0, w, h, kind: 'trap', phase: spawner.rng() * TRAP_CYCLE_S }],
  };
}

/** Right edge of a group's item list — feed back as `lastRightX`. */
export function groupRightX(groupX, items) {
  let right = groupX;
  for (const item of items) right = Math.max(right, groupX + item.dx + item.w);
  return right;
}

/** A placed obstacle in world space (one item of a group at its spawn x). */
export function makeObstacle(worldX, item) {
  return {
    worldX,
    w: item.w,
    h: item.h,
    kind: item.kind,
    phase: item.phase || 0,
    destroyed: false,
    cleared: false,
  };
}

/**
 * Full collision box of a placed obstacle. Grounded kinds (log / guardian
 * tall / trap) sit on the ground line; the branch and the low guardian hang
 * from above — their boxes run from BRANCH_TOP / GUARDIAN_LOW_TOP px above
 * the ground down to BRANCH_BOTTOM / GUARDIAN_LOW_BOTTOM px above it, which
 * is exactly what makes them slide-only. Trap boxes are lethal only while
 * lit — main checks trapLit() before calling aabbHit.
 */
export function obstacleBox(obs) {
  if (obs.kind === 'branch') {
    return { x: obs.worldX, y: GROUND_Y - BRANCH_TOP, w: obs.w, h: BRANCH_TOP - BRANCH_BOTTOM };
  }
  if (obs.kind === 'guardian-low') {
    return {
      x: obs.worldX,
      y: GROUND_Y - GUARDIAN_LOW_TOP,
      w: obs.w,
      h: GUARDIAN_LOW_TOP - GUARDIAN_LOW_BOTTOM,
    };
  }
  return { x: obs.worldX, y: GROUND_Y - obs.h, w: obs.w, h: obs.h };
}

/**
 * AABB hit with the player-side inset (as 05: player ×0.85, obstacles full;
 * strict overlap — exactly touching is NOT a hit).
 */
export function aabbHit(playerB, obsB, inset = HITBOX_INSET) {
  const w = playerB.w * (1 - inset);
  const h = playerB.h * (1 - inset);
  const px = playerB.x + (playerB.w - w) / 2;
  const py = playerB.y + (playerB.h - h) / 2;
  return px < obsB.x + obsB.w && px + w > obsB.x && py < obsB.y + obsB.h && py + h > obsB.y;
}

/* ---- orbs (plan §2 Phase B) ------------------------------------------------------ */

export const ORB_R = 13; // collision radius → a generous 26×26 grab box
export const ORB_LINE_COUNT = 4; // line of 4 on flat …
export const ORB_ARC_MIN = 5; // … arc of 5–7 over a jump
export const ORB_ARC_MAX = 7;
export const ORB_SPACING_MIN = 36;
export const ORB_SPACING_MAX = 58;
export const ORB_LINE_H_MIN = 40; // line height window (running-grabbable)
export const ORB_LINE_H_MAX = 60;
export const ORB_ARC_BASE = 34; // arc heights ride a sine over these bounds
export const ORB_ARC_AMP_MIN = 60;
export const ORB_ARC_AMP_MAX = 120;
export const METER_FULL = 10; // 10 orbs → power charged

export function createOrb(worldX, y, color) {
  return { worldX, y, color, taken: false };
}

/** Generous grab: strict overlap of the orb box against the FULL player box. */
export function orbHit(orb, pBox) {
  const b = { x: orb.worldX - ORB_R, y: orb.y - ORB_R, w: ORB_R * 2, h: ORB_R * 2 };
  return b.x < pBox.x + pBox.w && b.x + b.w > pBox.x && b.y < pBox.y + pBox.h && b.y + b.h > pBox.y;
}

/** A random orb color from the gates module's trail palette. */
export function orbColor(rng) {
  return ORB_COLORS[Math.floor(rng() * ORB_COLORS.length)];
}

/**
 * Arc of 5–7 orbs over a jump: a sine bump rising from ORB_ARC_BASE to
 * base+amp. Spacing shrinks (clamped) so the whole formation fits inside a
 * fair gap minus a 70 px lead and a 140 px tail — the next obstacle group
 * can never overlap it (plan §2: formations "ride the spawner").
 */
export function spawnOrbArc(rng, x, speed) {
  const n = ORB_ARC_MIN + Math.floor(rng() * (ORB_ARC_MAX - ORB_ARC_MIN + 1));
  const amp = ORB_ARC_AMP_MIN + rng() * (ORB_ARC_AMP_MAX - ORB_ARC_AMP_MIN);
  const color = orbColor(rng);
  const spacing = Math.max(
    ORB_SPACING_MIN,
    Math.min(ORB_SPACING_MAX, (minGap(speed) - 210) / (n - 1))
  );
  const orbs = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const y = GROUND_Y - (ORB_ARC_BASE + Math.sin(t * Math.PI) * amp);
    orbs.push(createOrb(x + i * spacing, y, color));
  }
  return orbs;
}

/** Line of 4 orbs on flat at running-grabbable height. */
export function spawnOrbLine(rng, x, speed) {
  const h = ORB_LINE_H_MIN + rng() * (ORB_LINE_H_MAX - ORB_LINE_H_MIN);
  const color = orbColor(rng);
  const spacing = Math.max(
    ORB_SPACING_MIN,
    Math.min(ORB_SPACING_MAX, (minGap(speed) - 210) / (ORB_LINE_COUNT - 1))
  );
  const orbs = [];
  for (let i = 0; i < ORB_LINE_COUNT; i++) {
    orbs.push(createOrb(x + i * spacing, GROUND_Y - h, color));
  }
  return orbs;
}

/* ---- powers (plan §2 Phase B: fixed, readable cycle) ------------------------------ */

export const POWER_CYCLE = ['double', 'dash', 'slow'];
export const POWER_DURATION = { double: 8, dash: 1.5, slow: 4 };
export const SLOW_TIME_SCALE = 0.6; // world ×0.6 while slow is active
export const MONK_SLOW_SPAWN_SCALE = 1 / 0.7; // Monk: spawn rate ×0.7 → wider gaps

/** Fresh power state for a run (`character`: 'spirit' | 'hunter' | 'monk'). */
export function createPowers(character) {
  return {
    character: character || 'spirit',
    meter: 0,
    cycleIdx: 0,
    forcedFirst: character === 'hunter' ? 'dash' : null, // Hunter: dash pre-charged
    timers: { double: 0, dash: 0, slow: 0 },
  };
}

/** The power the next full meter activates (fixed cycle → readable). */
export function chargedPower(powers) {
  if (powers.forcedFirst) return powers.forcedFirst;
  return POWER_CYCLE[powers.cycleIdx % POWER_CYCLE.length];
}

/**
 * Activate the charged power: meter resets, the cycle advances, and the
 * timer is set — Forest Spirit's +50 % duration applies here (plan §2
 * Phase D). Refreshing an already-active power resets its timer.
 */
export function applyPower(powers, kind) {
  const mult = powers.character === 'spirit' ? 1.5 : 1;
  powers.timers[kind] = POWER_DURATION[kind] * mult;
  powers.meter = 0;
  if (powers.forcedFirst === kind) powers.forcedFirst = null;
  else powers.cycleIdx = (powers.cycleIdx + 1) % POWER_CYCLE.length;
  return powers;
}

/** Drain all active power timers (REAL dt — slow time must not extend itself). */
export function tickPowers(powers, dt) {
  for (const kind of POWER_CYCLE) {
    if (powers.timers[kind] > 0) powers.timers[kind] = Math.max(0, powers.timers[kind] - dt);
  }
  return powers;
}

/**
 * Dash consumes itself on the first obstacle it touches: destroy `obs`,
 * end the dash. Returns true exactly when the dash absorbed this hit
 * (plan §2: "destroys the next obstacle hit (exactly one)" — §7.3: same in
 * the shadow realm as in the forest).
 */
export function dashDestroy(powers, obs) {
  if (powers.timers.dash <= 0) return false;
  powers.timers.dash = 0;
  obs.destroyed = true;
  return true;
}

/* ---- shadow realm (plan §2 Phase C) ------------------------------------------------- */

export const SHADOW_S = 45; // seconds per visit
export const SHADOW_DENSITY = 1.5; // obstacle density ×1.5
export const SHADOW_ORB_WORTH = 2; // orbs worth ×2 (meter feeds double)
export const SHARD_CORRECT_GATE_DIVISOR = 3; // floor(correctGates/3)
export const SHARD_DISTANCE_DIVISOR = 1000; // floor(meters/1000)

/* gate geometry (render.js draws to these; main.js uses the span for the
 * spawn-cursor jump and the miss test) */
export const GATE_DOOR_W = 104;
export const GATE_GAP = 46;
export const GATE_H = 250;
export const GATE_SPAN = GATE_DOOR_W * 2 + GATE_GAP;

/** Enter the shadow realm; the gate schedule defers (plan §7.7). */
export function enterShadow(run, m) {
  run.shadowS = SHADOW_S;
  run.shadowShardPaid = false;
  run.nextGateM = m + 1e9; // deferred — re-anchored on exit
  return run;
}

/**
 * Drain the shadow timer on the world-time step (fixed-step accumulation →
 * pause-safe, plan §7.5). Returns true exactly once, on the step it expires.
 */
export function tickShadow(run, dt) {
  if (run.shadowS <= 0) return false;
  run.shadowS = Math.max(0, run.shadowS - dt);
  if (run.shadowS === 0) {
    run.shadowSurvives++;
    run.shadowShardPaid = true;
    return true;
  }
  return false;
}

/** Re-anchor the gate schedule after a shadow visit: 600 m ± 100 ahead. */
export function reanchorGates(run, m, rng) {
  run.nextGateM = m + 500 + rng() * 200;
  return run;
}

/** True when a split may spawn here: never during the shadow realm (§7.7). */
export function gateReady(run, m) {
  return run.shadowS <= 0 && m >= run.nextGateM;
}

/* ---- run aggregate + scoring ---------------------------------------------------------- */

export const GATE_BONUS = 100; // +100 points per correct gate (plan §2 Phase C)

export function createRun(character, seedRng) {
  return {
    character: character || 'spirit',
    powers: createPowers(character),
    orbsSinceGate: 0, // parity rule input, reset on each gate
    lastOrbColor: null, // color rule input
    correctGates: 0,
    shadowSurvives: 0,
    shadowShardPaid: false,
    shadowS: 0,
    nextGateM: 600, // first split lands 600 m ± 100 (main offsets by seed)
    seedRng: seedRng || Math.random,
    orbsCollected: 0,
  };
}

/** Spirit shards earned by a run (plan §2 Phase D formula, verbatim). */
export function shardsFor(run, metersRan) {
  return (
    Math.floor(metersRan / SHARD_DISTANCE_DIVISOR) +
    run.shadowSurvives +
    Math.floor(run.correctGates / SHARD_CORRECT_GATE_DIVISOR)
  );
}

/** Score: distance meters + 100 per correct gate. */
export function scoreFor(run, metersRan) {
  return Math.floor(metersRan) + run.correctGates * GATE_BONUS;
}

/* ---- deterministic rng (mulberry32) — runs seed their gate order with it */

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
