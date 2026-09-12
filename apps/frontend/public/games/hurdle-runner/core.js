/**
 * ============================================================================
 * Hurdle Runner — core.js (Game 05, plan/games/05-continuous-runner.md §6)
 * ============================================================================
 * Pure model, zero DOM access — this module is the test surface (plan §8).
 * Plain ESM, no build step (same convention as games 01–03/06): engine.js,
 * render.js and main.js import it in the browser, and the jest suite
 * (src/__tests__/games-hurdle-runner.test.ts) imports it directly.
 *
 * World = 900×500 logical viewport, landscape, ground line at y=420 (§2).
 * The runner sits at a fixed x (25 % of the width); the world — hurdles,
 * barriers, scenery — scrolls left at a ramping speed (320 px/s, +6 px/s per
 * second, cap 900). Physics constants are exactly the plan's §2 table, stepped
 * at a fixed 1/120 s by main.js's accumulator loop.
 *
 * Coordinates: obstacles live in WORLD space (worldX is fixed at spawn); the
 * camera (`camera`, the px scrolled so far) converts to screen space via
 * `worldX - camera`. The player's world x is therefore `camera + PLAYER_X`,
 * which is also what scoring compares against.
 * ============================================================================
 */

/* ---- persistence keys (plan §5) -------------------------------------------- */

export const BEST_KEY = 'game:hurdle-runner:best'; // → { distanceM: 1204 }
export const PREFS_KEY = 'game:hurdle-runner:prefs'; // → { muted: false }

/* ---- viewport (plan §2, verbatim) ------------------------------------------ */

export const VIEW_W = 900;
export const VIEW_H = 500;
export const GROUND_Y = 420;
export const PLAYER_X = 225; // fixed 25 % of the width

/* ---- physics (plan §2 table, verbatim) ------------------------------------- */

export const SCROLL_START = 320; // px/s at t=0 …
export const SPEED_RAMP = 6; // … +6 px/s per second …
export const SPEED_CAP = 900; // … capped here
export const JUMP_VY = -820; // px/s on jump
export const GRAVITY = 2200; // px/s²
export const JUMP_CUT = 0.55; // releasing early caps upward velocity at 55 %
export const COYOTE_MS = 80; // grace after leaving ground
export const BUFFER_MS = 100; // early tap counts when landing
export const HITBOX_INSET = 0.15; // forgiveness on the player AABB (×0.85)

/* Player box: 34×44 px, feet at `player.y` (bottom-anchored so the feet are
 * the trusted collision reference). The inset shrinks it toward the center. */
export const PLAYER_W = 34;
export const PLAYER_H = 44;

/* ---- speed / distance / tiers ----------------------------------------------- */

/** Scroll speed for a run elapsed time (§2 ramp). `speedAt(0)` = 320. */
export function speedAt(elapsedS) {
  return Math.min(SPEED_CAP, SCROLL_START + SPEED_RAMP * elapsedS);
}

/** Meters conversion (§2): distance meters = px / 10. */
export function meters(px) {
  return px / 10;
}

/** First meter of each tier — tier 1 at 0, tier 2 at 500, tier 3 at 1500 (§2). */
export const TIER_START_M = [0, 500, 1500];

/** Tier for a distance in meters: 1 hurdles · 2 +tall · 3 +doubles (§2). */
export function tierFor(m) {
  if (m < TIER_START_M[1]) return 1;
  if (m < TIER_START_M[2]) return 2;
  return 3;
}

/* ---- player ------------------------------------------------------------------ */

export function createPlayer() {
  return {
    x: PLAYER_X,
    y: GROUND_Y, // feet y; standing on the ground line
    vy: 0,
    onGround: true,
    coyoteMs: COYOTE_MS, // refreshed every grounded step, drains while airborne
    bufferMs: 0, // set on press, drains always, consumed by a jump
    invulnS: 0, // 💚 invulnerability seconds, drained every step
    jumped: false, // transient: set on the step a jump fires (main consumes)
    landed: false, // transient: set on the step air→ground (main consumes)
  };
}

/**
 * One physics step (called at a fixed 1/120 s; `dt` is constant in practice —
 * the pure function stays deterministic whatever the caller feeds it).
 * `input` = { pressed, held }: `pressed` is the press EDGE this step (main
 * queues taps between fixed steps so none are lost), `held` is the live hold
 * state that drives the jump cut.
 *
 * Feel pipeline, exactly plan §4: press → buffer; buffer + (grounded or
 * coyote) → jump; rising + released → vy capped at JUMP_VY × JUMP_CUT;
 * gravity → integrate → ground resolve (landed flag + coyote refresh).
 * Mutates and returns the player.
 */
export function stepPlayer(player, dt, input) {
  if (input.pressed) player.bufferMs = BUFFER_MS;

  if (player.bufferMs > 0 && (player.onGround || player.coyoteMs > 0)) {
    player.vy = JUMP_VY;
    player.onGround = false;
    player.coyoteMs = 0; // a jump consumes the coyote window
    player.bufferMs = 0;
    player.jumped = true;
  }
  if (player.bufferMs > 0) player.bufferMs = Math.max(0, player.bufferMs - dt * 1000);

  // Jump cut: only caps a rise FASTER than the cap (plan §2: releasing early
  // caps upward velocity at 55 % — a late release past that point is a full jump).
  if (!input.held && player.vy < JUMP_VY * JUMP_CUT) player.vy = JUMP_VY * JUMP_CUT;

  player.vy += GRAVITY * dt;
  player.y += player.vy * dt;

  if (player.y >= GROUND_Y) {
    if (!player.onGround) player.landed = true;
    player.y = GROUND_Y;
    player.vy = 0;
    player.onGround = true;
    player.coyoteMs = COYOTE_MS;
  } else {
    player.onGround = false;
    player.coyoteMs = Math.max(0, player.coyoteMs - dt * 1000);
  }

  if (player.invulnS > 0) player.invulnS = Math.max(0, player.invulnS - dt);
  return player;
}

/** Full (uninset) player AABB — aabbHit() applies the inset. */
export function playerBox(player) {
  return {
    x: player.x - PLAYER_W / 2,
    y: player.y - PLAYER_H,
    w: PLAYER_W,
    h: PLAYER_H,
  };
}

/* ---- obstacles (§2: spawned ahead, culled behind; AABB collision) ------------ */

export const HURDLE_W = 24;
export const HURDLE_H_MIN = 40;
export const HURDLE_H_MAX = 60;
export const TALL_W = 28;
export const TALL_H = 90;
export const DOUBLE_INNER_MIN = 140; // px between the two hurdles of a double
export const DOUBLE_INNER_MAX = 180;
export const SPAWN_X = 950; // first obstacle starts at/after this world x
export const CULL_X = -100; // culled once its right edge is behind this (screen)

export function hurdleH(rng) {
  return HURDLE_H_MIN + Math.round(rng() * (HURDLE_H_MAX - HURDLE_H_MIN));
}

/**
 * Spawner fairness (§2): the gap between consecutive obstacle groups is
 * sampled 380–700 px but never below minGap(speed) = speed × 1.05 + 120, so a
 * full jump always fits. Doubles count their inner spacing toward the next
 * gap too: the NEXT group's x is measured from the double's right edge, so
 * first-hurdle → next-obstacle distance = inner + hurdleW + gap.
 */
export function minGap(speed) {
  return speed * 1.05 + 120;
}

/**
 * A spawner owns the rng stream (injectable — tests use a seeded rng) and the
 * current run distance in meters, which the CALLER refreshes before every
 * nextSpawn() call — it picks the obstacle types through tierFor(meters).
 */
export function createSpawner(rng = Math.random) {
  return { rng, meters: 0 };
}

/**
 * Next obstacle group, starting `gap ≥ minGap(speed)` px after `lastRightX`
 * (the right edge, in world x, of the previous group — pass
 * `SPAWN_X - minGap(speed)` for a run's first call so the first group lands
 * at ≥ SPAWN_X). Returns { x, items, kind } where `items` are relative boxes
 * ({ dx, w, h, kind }) and `kind` is the group type for render emphasis.
 * Types by tier (§2): tier 1 hurdles only · tier 2 +tall · tier 3 +doubles.
 */
export function nextSpawn(spawner, speed, lastRightX) {
  const sampled = 380 + spawner.rng() * (700 - 380);
  const gap = Math.max(sampled, minGap(speed));
  const x = lastRightX + gap;
  const tier = tierFor(spawner.meters);
  const roll = spawner.rng();

  if (tier === 1 || (tier === 2 && roll < 0.5) || (tier === 3 && roll >= 0.7)) {
    return {
      x,
      kind: 'hurdle',
      items: [{ dx: 0, w: HURDLE_W, h: hurdleH(spawner.rng), kind: 'hurdle' }],
    };
  }
  if (tier === 2 || (tier === 3 && roll >= 0.35)) {
    // tier 2 second half + tier 3 middle band → tall barrier
    return { x, kind: 'tall', items: [{ dx: 0, w: TALL_W, h: TALL_H, kind: 'tall' }] };
  }
  // tier 3 first band → double: two hurdles 140–180 px apart (§2)
  const inner =
    DOUBLE_INNER_MIN + Math.round(spawner.rng() * (DOUBLE_INNER_MAX - DOUBLE_INNER_MIN));
  return {
    x,
    kind: 'double',
    items: [
      { dx: 0, w: HURDLE_W, h: hurdleH(spawner.rng), kind: 'hurdle' },
      { dx: HURDLE_W + inner, w: HURDLE_W, h: hurdleH(spawner.rng), kind: 'hurdle' },
    ],
  };
}

/** Right edge of a group's item list — the value to feed back as `lastRightX`. */
export function groupRightX(groupX, items) {
  let right = groupX;
  for (const item of items) right = Math.max(right, groupX + item.dx + item.w);
  return right;
}

/** A placed obstacle in world space (one item of a group at its spawn x). */
export function makeObstacle(worldX, item) {
  return { worldX, w: item.w, h: item.h, kind: item.kind, cleared: false };
}

/** Full collision box of a placed obstacle — obstacle boxes are NOT inset (§2). */
export function obstacleBox(obs) {
  return { x: obs.worldX, y: GROUND_Y - obs.h, w: obs.w, h: obs.h };
}

/**
 * Shrink a box toward its center by `inset` per axis (side length ×1−inset).
 * Single source for the hitbox inset: aabbHit() tests against this box and
 * render.js's ?debug=1 overlay draws it (plan §10: the debug boxes must match
 * the shipped hitbox math exactly).
 */
export function insetBox(box, inset) {
  const w = box.w * (1 - inset);
  const h = box.h * (1 - inset);
  return { x: box.x + (box.w - w) / 2, y: box.y + (box.h - h) / 2, w, h };
}

/**
 * AABB hit with the player-side inset (§2: player box ×0.85, obstacles full).
 * The player box is shrunk via insetBox(), then a strict overlap test runs —
 * exactly touching is NOT a hit (same forgiving convention as game 06's
 * circle test).
 */
export function aabbHit(playerB, obsB, inset = HITBOX_INSET) {
  const pb = insetBox(playerB, inset);
  return (
    pb.x < obsB.x + obsB.w && pb.x + pb.w > obsB.x && pb.y < obsB.y + obsB.h && pb.y + pb.h > obsB.y
  );
}

/* ---- scoring (§2: meters + 10 per obstacle, exactly once each) ---------------- */

export const CLEAR_BONUS = 10;

/**
 * +10 when an obstacle's right edge passes the player's world x, counted once
 * per obstacle — the `cleared` flag flips structurally, so an obstacle can
 * never pay twice (same pattern as game 06's pipePassed). Returns true
 * exactly when the bonus is awarded.
 */
export function obstaclePassed(obs, playerWorldX) {
  if (obs.cleared) return false;
  if (obs.worldX + obs.w < playerWorldX) {
    obs.cleared = true;
    return true;
  }
  return false;
}

/* ---- 💚 pickup (plan §9 P2: once per run, one extra life) ---------------------- */

export const PICKUP_W = 26;
export const PICKUP_H = 24;
export const PICKUP_LIFT = 95; // heart center height above the ground line
export const PICKUP_AT_MIN_M = 600; // spawn window in meters (§9 P2) …
export const PICKUP_AT_MAX_M = 900; // … chosen once per run

export function createPickup(worldX) {
  return { worldX, y: GROUND_Y - PICKUP_LIFT, taken: false };
}

export function pickupBox(pickup) {
  return {
    x: pickup.worldX - PICKUP_W / 2,
    y: pickup.y - PICKUP_H / 2,
    w: PICKUP_W,
    h: PICKUP_H,
  };
}

/** Generous grab: strict overlap of the pickup box against the FULL player box. */
export function pickupHit(pickup, pBox) {
  const b = pickupBox(pickup);
  return b.x < pBox.x + pBox.w && b.x + b.w > pBox.x && b.y < pBox.y + pBox.h && b.y + b.h > pBox.y;
}
