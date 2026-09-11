/**
 * Pure-logic tests for the static game at
 * public/games/hurdle-runner/core.js (plan/games/05-continuous-runner.md §8:
 * the max-jump-clears-a-tall-barrier proof, the jump-cut height delta, the
 * spawner sweep 320→900 px/s with the minGap fairness invariant, the inset
 * AABB corner cases, and the once-per-obstacle scoring). The same assertions
 * ship in the game's own core.test.html harness; this suite keeps them
 * running in CI.
 */
import {
  BEST_KEY,
  DOUBLE_INNER_MAX,
  DOUBLE_INNER_MIN,
  GRAVITY,
  GROUND_Y,
  HITBOX_INSET,
  HURDLE_H_MAX,
  HURDLE_H_MIN,
  HURDLE_W,
  JUMP_CUT,
  JUMP_VY,
  PREFS_KEY,
  PLAYER_X,
  SCROLL_START,
  SPAWN_X,
  TALL_H,
  TALL_W,
  TIER_START_M,
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
  pickupBox,
  pickupHit,
  playerBox,
  speedAt,
  stepPlayer,
  tierFor,
} from '../../public/games/hurdle-runner/core';
import { shareText } from '../../public/games/hurdle-runner/main';

/** Deterministic rng (mulberry32) — the spawner sweep must be reproducible. */
function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DT = 1 / 120;

interface Player {
  y: number;
  vy: number;
  onGround: boolean;
  jumped: boolean;
  landed: boolean;
  [k: string]: unknown;
}

interface FlyResult {
  player: Player;
  rise: number; // max height the feet gained
  jumps: number; // steps on which a jump fired
  landStep: number; // first step index with a ground contact
}

/**
 * Fly a purely physical trajectory: fixed steps, press edges at the given
 * times, the first press held until `releaseAt` (Infinity = hold forever).
 * Counting jump steps lets tests assert that a buffered tap really fires.
 */
function fly(durationS: number, presses: number[], releaseAt = Infinity, dt = DT): FlyResult {
  const player = createPlayer() as Player;
  let minFeet = player.y;
  let jumps = 0;
  let landStep = -1;
  const steps = Math.round(durationS / dt);
  for (let i = 0; i < steps; i++) {
    const t0 = i * dt;
    const pressed = presses.some((p) => p >= t0 && p < t0 + dt);
    const held = presses.length > 0 && t0 >= presses[0] && t0 < releaseAt;
    stepPlayer(player, dt, { pressed, held });
    if (player.jumped) {
      jumps++;
      player.jumped = false; // main.js consumes the transient flag each step
    }
    if (player.landed && landStep < 0) landStep = i;
    minFeet = Math.min(minFeet, player.y);
  }
  return { player, rise: GROUND_Y - minFeet, jumps, landStep };
}

describe('storage keys (plan §5)', () => {
  it('are namespaced under the game slug', () => {
    expect(BEST_KEY).toBe('game:hurdle-runner:best');
    expect(PREFS_KEY).toBe('game:hurdle-runner:prefs');
  });
});

describe('speed ramp + meters + tiers (plan §2)', () => {
  it('speed starts at 320, ramps +6 px/s per second, caps at 900', () => {
    expect(speedAt(0)).toBe(320);
    expect(speedAt(10)).toBe(380);
    expect(speedAt(60)).toBe(680);
    expect(speedAt(100)).toBe(900); // 320 + 600 capped
    expect(speedAt(1000)).toBe(900);
  });

  it('meters = px / 10', () => {
    expect(meters(3200)).toBe(320);
    expect(meters(0)).toBe(0);
    expect(meters(12345)).toBeCloseTo(1234.5, 9);
  });

  it('tiers flip at 500 m and 1500 m', () => {
    expect(tierFor(0)).toBe(1);
    expect(tierFor(499.9)).toBe(1);
    expect(tierFor(500)).toBe(2);
    expect(tierFor(1499.9)).toBe(2);
    expect(tierFor(1500)).toBe(3);
    expect(TIER_START_M).toEqual([0, 500, 1500]);
  });

  it('a full jump always fits the minGap at every speed (fairness identity)', () => {
    // full-jump airtime = 2·|JUMP_VY|/GRAVITY; the horizontal distance during
    // it must stay below minGap(speed) = speed·1.05 + 120
    const airtime = (2 * Math.abs(JUMP_VY)) / GRAVITY;
    for (let speed = SCROLL_START; speed <= 900; speed += 20) {
      expect(airtime * speed).toBeLessThan(minGap(speed));
    }
  });
});

describe('stepPlayer (gravity / jump / cut / buffer / coyote — plan §2, §4)', () => {
  it('integrates gravity exactly under semi-implicit Euler (velocity first)', () => {
    const player = createPlayer();
    const start = createPlayer().y;
    player.y = start - 1000; // free fall: start airborne or the ground clamp zeroes vy
    player.onGround = false;
    const steps = 30; // 0.25 s of free fall
    for (let i = 0; i < steps; i++) stepPlayer(player, DT, { pressed: false, held: false });
    expect(player.vy).toBeCloseTo(GRAVITY * 0.25, 6);
    expect(player.y).toBeCloseTo(start - 1000 + GRAVITY * DT * DT * ((steps * (steps + 1)) / 2), 6);
  });

  it('a grounded runner stays grounded; the feet sit on the ground line', () => {
    const player = createPlayer();
    for (let i = 0; i < 120; i++) stepPlayer(player, DT, { pressed: false, held: false });
    expect(player.y).toBe(GROUND_Y);
    expect(player.onGround).toBe(true);
    const box = playerBox(player);
    expect(box.y + box.h).toBe(GROUND_Y); // feet-anchored box
    expect(box.x).toBe(PLAYER_X - box.w / 2);
  });

  it('a press on the ground jumps immediately with exactly JUMP_VY', () => {
    const player = createPlayer();
    stepPlayer(player, DT, { pressed: true, held: true });
    expect(player.jumped).toBe(true);
    expect(player.vy).toBe(JUMP_VY + GRAVITY * DT); // set, then one step of gravity
    expect(player.onGround).toBe(false);
  });
});

/* ---- plan §8: jump arc vs the 90 px tall barrier ----------------------------
 * Closed form: a full jump rises JUMP_VY²/2g = 152.8 px. The inset lifts the
 * lethal box bottom by 44·0.075 = 3.3 px, so clearing the 90 px barrier needs
 * feet ≥ 93.3 px high through the whole horizontal overlap — proven below
 * both in closed form and by flying the pass at the minimum speed.
 * -------------------------------------------------------------------------- */

describe('jump arc (plan §8: max jump clears a 90 px barrier at 320 px/s)', () => {
  const INSET_BOTTOM_LIFT = 44 * (HITBOX_INSET / 2);

  it('closed form: full-hold apex 152.8 px clears 90 + inset', () => {
    const apex = (JUMP_VY * JUMP_VY) / (2 * GRAVITY);
    expect(apex).toBeCloseTo(152.8, 1);
    expect(apex).toBeGreaterThan(TALL_H + INSET_BOTTOM_LIFT);
  });

  it('integrated: a full-hold rise clears 93.3 px (Euler lands ≈ 149)', () => {
    const { rise } = fly(0.8, [0]);
    expect(rise).toBeGreaterThan(TALL_H + INSET_BOTTOM_LIFT);
    expect(rise).toBeLessThan((JUMP_VY * JUMP_VY) / (2 * GRAVITY)); // sanity vs closed form
  });

  function runBarrierPass(jump: boolean): boolean {
    // world coords: the camera advances at the minimum speed while the tall
    // barrier waits 120 px ahead; the jump is pressed exactly at t=0, full hold
    const player = createPlayer();
    let camX = 0;
    let obsX = PLAYER_X + 120; // screen x of the barrier's left edge
    let hit = false;
    for (let i = 0; i < 240; i++) {
      stepPlayer(player, DT, { pressed: jump && i === 0, held: jump });
      camX += SCROLL_START * DT;
      obsX -= SCROLL_START * DT;
      const box = obstacleBox({ worldX: obsX, w: TALL_W, h: TALL_H, kind: 'tall', cleared: false });
      if (aabbHit(playerBox(player), box, HITBOX_INSET)) hit = true;
    }
    return hit;
  }

  it('flying the pass: the jump clears the barrier where running into it dies', () => {
    expect(runBarrierPass(true)).toBe(false);
    expect(runBarrierPass(false)).toBe(true); // proves the test is not vacuous
  });
});

describe('jump cut (plan §8: release at 50 % rise → lower apex)', () => {
  it('releasing mid-rise caps the apex well below the full hold', () => {
    const full = fly(0.8, [0]);
    // ~50 % rise reached at ≈ 0.1 s (vy ≈ −600, still above the −451 cut cap)
    const cut = fly(0.8, [0], 0.1);
    expect(cut.rise).toBeLessThan(full.rise - 20);
    expect(cut.rise).toBeGreaterThan(full.rise / 2); // still a real jump
  });

  it('only caps a rise faster than JUMP_VY × JUMP_CUT (late release = full jump)', () => {
    const player = createPlayer();
    // rise until vy is already slower than the cut cap, then release
    stepPlayer(player, DT, { pressed: true, held: true });
    while (player.vy < JUMP_VY * JUMP_CUT) stepPlayer(player, DT, { pressed: false, held: true });
    const vyAtRelease = player.vy;
    stepPlayer(player, DT, { pressed: false, held: false });
    expect(vyAtRelease).toBeGreaterThanOrEqual(JUMP_VY * JUMP_CUT);
    // one step later vy only grew by gravity — the cut never re-accelerated
    expect(player.vy).toBeCloseTo(vyAtRelease + GRAVITY * DT, 9);
  });

  it('the cut cap is exactly 55 % of JUMP_VY (plan §2 table)', () => {
    expect(JUMP_CUT).toBe(0.55);
    expect(JUMP_VY * JUMP_CUT).toBeCloseTo(-451, 9);
  });
});

describe('jump buffer (plan §2: 100 ms — an early tap counts when landing)', () => {
  it('a tap ~80 ms before landing fires a second jump on touchdown', () => {
    const probe = fly(1.2, [0]);
    expect(probe.landStep).toBeGreaterThan(0);
    const tapAt = probe.landStep * DT - 0.08; // inside the 100 ms window, fp-safe
    const result = fly(1.5, [0, tapAt]);
    expect(result.jumps).toBe(2); // the initial jump + the buffered landing jump
  });

  it('a tap ~130 ms before landing expires and does NOT fire', () => {
    const probe = fly(1.2, [0]);
    const tapAt = probe.landStep * DT - 0.13; // beyond the 100 ms window
    const result = fly(1.5, [0, tapAt]);
    expect(result.jumps).toBe(1);
  });
});

describe('coyote time (plan §2: 80 ms grace after leaving the ground)', () => {
  function airbornePlayer(msAgo: number) {
    const player = createPlayer();
    player.onGround = false;
    player.y = GROUND_Y - 60; // high enough that 0.25 s of fall cannot land
    player.coyoteMs = 80;
    for (let i = 0; i < Math.round(msAgo / 1000 / DT); i++) {
      stepPlayer(player, DT, { pressed: false, held: false });
    }
    return player;
  }

  it('a press within the 80 ms window still jumps', () => {
    const player = airbornePlayer(40);
    expect(player.coyoteMs).toBeGreaterThan(0);
    expect(player.onGround).toBe(false);
    stepPlayer(player, DT, { pressed: true, held: true });
    expect(player.jumped).toBe(true);
  });

  it('a press after the window does not jump', () => {
    const player = airbornePlayer(92);
    expect(player.coyoteMs).toBe(0);
    expect(player.onGround).toBe(false);
    stepPlayer(player, DT, { pressed: true, held: true });
    expect(player.jumped).toBe(false);
  });
});

/* ---- plan §8: the spawner sweep ----------------------------------------------
 * 30 speeds (320→900 step 20) × 500 spawns each: every gap respects
 * minGap(speed), the first group lands at ≥ SPAWN_X, sizes/heights stay in
 * their windows, doubles keep 140–180 px inner spacing, and the tier gating
 * is exact. A fixed rng stream reproduces the same sequence.
 * -------------------------------------------------------------------------- */

describe('spawner sweep (30 speeds × 500 spawns — plan §8)', () => {
  const TIERS = [0, 600, 1600]; // meters → tiers 1, 2, 3

  it('never spawns an impossible gap; sizes and types stay legal', () => {
    let doublesSeen = 0;
    for (let speed = SCROLL_START; speed <= 900; speed += 20) {
      const spawner = createSpawner(seededRng(speed * 7919));
      let lastRight = SPAWN_X - minGap(SCROLL_START);
      for (let i = 0; i < 500; i++) {
        spawner.meters = TIERS[i % 3];
        const spawn = nextSpawn(spawner, speed, lastRight);
        const gap = spawn.x - lastRight;
        expect(gap).toBeGreaterThanOrEqual(minGap(speed) - 1e-9);
        expect(gap).toBeLessThanOrEqual(Math.max(700, minGap(speed)));
        if (i === 0) expect(spawn.x).toBeGreaterThanOrEqual(SPAWN_X);

        const tier = tierFor(spawner.meters);
        if (spawn.kind === 'double') {
          doublesSeen += tier === 3 ? 1 : 0;
          expect(tier).toBe(3);
          expect(spawn.items).toHaveLength(2);
          const inner = spawn.items[1].dx - spawn.items[0].w;
          expect(inner).toBeGreaterThanOrEqual(DOUBLE_INNER_MIN);
          expect(inner).toBeLessThanOrEqual(DOUBLE_INNER_MAX);
        } else {
          expect(spawn.items).toHaveLength(1);
          const item = spawn.items[0];
          if (item.kind === 'tall') {
            expect(tier).toBeGreaterThanOrEqual(2);
            expect(item.w).toBe(TALL_W);
            expect(item.h).toBe(TALL_H);
          } else {
            expect(item.w).toBe(HURDLE_W);
            expect(item.h).toBeGreaterThanOrEqual(HURDLE_H_MIN);
            expect(item.h).toBeLessThanOrEqual(HURDLE_H_MAX);
          }
        }
        if (tier === 1) expect(spawn.kind).toBe('hurdle');
        lastRight = groupRightX(spawn.x, spawn.items);
      }
    }
    // tier 3's ~35 % double band must really fire — a regression that made
    // doubles unreachable would otherwise pass this sweep silently
    expect(doublesSeen).toBeGreaterThan(100);
  });

  it('is deterministic for a fixed rng stream', () => {
    const run = (seed: number) => {
      const spawner = createSpawner(seededRng(seed));
      let lastRight = SPAWN_X - minGap(SCROLL_START);
      const out: number[] = [];
      for (let i = 0; i < 50; i++) {
        spawner.meters = 1600;
        const spawn = nextSpawn(spawner, 640, lastRight);
        out.push(spawn.x, groupRightX(spawn.x, spawn.items));
        lastRight = groupRightX(spawn.x, spawn.items);
      }
      return out;
    };
    expect(run(424242)).toEqual(run(424242));
    expect(run(424242)).not.toEqual(run(99));
  });
});

describe('aabbHit inset math (plan §8 corner cases)', () => {
  // player box 34×44 at the origin; the ×0.85 inset box is
  // x 2.55…31.45, y 3.3…40.7
  const pb = { x: 0, y: 0, w: 34, h: 44 };

  it('overlap inside the inset forgiveness zone is NOT a hit', () => {
    // overlaps the full box by 1.5 px horizontally, but sits inside the inset
    expect(aabbHit(pb, { x: 32.5, y: 0, w: 5, h: 5 })).toBe(false);
    // same vertically: 1 px into the full box, 0.3 px short of the inset
    expect(aabbHit(pb, { x: 10, y: 40.8, w: 5, h: 5 })).toBe(false);
  });

  it('1 px past the inset edge IS a hit (strict inequality misses only true touches)', () => {
    expect(aabbHit(pb, { x: 31, y: 10, w: 2, h: 2 })).toBe(true); // 0.45 px in
    expect(aabbHit(pb, { x: 31.46, y: 10, w: 2, h: 2 })).toBe(false); // 0.01 px out
    expect(aabbHit(pb, { x: 10, y: 40, w: 2, h: 2 })).toBe(true);
    expect(aabbHit(pb, { x: 10, y: 40.75, w: 2, h: 2 })).toBe(false);
  });

  it('deep overlap always hits, and the default inset is the plan constant', () => {
    expect(aabbHit(pb, { x: 10, y: 10, w: 4, h: 4 })).toBe(true);
    expect(HITBOX_INSET).toBe(0.15);
  });

  it('a sliver box probes the exact inset boundary', () => {
    expect(aabbHit(pb, { x: 31.44, y: 20, w: 0.01, h: 0.01 })).toBe(true);
    expect(aabbHit(pb, { x: 31.46, y: 20, w: 0.01, h: 0.01 })).toBe(false);
  });
});

describe('scoring (plan §2: meters + 10 per obstacle, exactly once)', () => {
  it('obstaclePassed pays +10 exactly once, when its right edge passes the player', () => {
    const obs = makeObstacle(500, { dx: 0, w: HURDLE_W, h: 50, kind: 'hurdle' });
    expect(obstaclePassed(obs, 500 + HURDLE_W)).toBe(false); // touching ≠ passed
    expect(obstaclePassed(obs, 500 + HURDLE_W + 1)).toBe(true);
    expect(obstaclePassed(obs, 2000)).toBe(false); // structurally impossible to double
  });

  it('makeObstacle marks new obstacles uncleared', () => {
    const obs = makeObstacle(0, { dx: 0, w: 10, h: 10, kind: 'hurdle' });
    expect(obs.cleared).toBe(false);
  });
});

describe('💚 pickup (plan §9 P2)', () => {
  it('floats 95 px above the ground, out of a grounded runner’s reach', () => {
    const pickup = createPickup(PLAYER_X); // directly overhead
    expect(pickup.y).toBe(GROUND_Y - 95);
    expect(pickupHit(pickup, playerBox(createPlayer()))).toBe(false);
  });

  it('is grabbable by a jumping runner mid-arc', () => {
    const pickup = createPickup(PLAYER_X);
    const jumper = createPlayer();
    jumper.y = GROUND_Y - 70; // mid-jump feet height (apex ≈ 149)
    expect(pickupHit(pickup, playerBox(jumper))).toBe(true);
  });

  it('exposes a box matching its size', () => {
    const box = pickupBox(createPickup(100));
    expect(box.w).toBe(26);
    expect(box.h).toBe(24);
  });
});

/* ---- plan §10: deterministic physics across frame rates --------------------
 * The loop feeds core a fixed 1/120 s step whatever the display runs at;
 * here the core side of that contract is pinned: identical step sequences
 * give identical outcomes, and halving the step converges (≤ 2.5 px over ⅓ s).
 * -------------------------------------------------------------------------- */

describe('fixed-timestep determinism (plan §10: identical arcs at 60/120 Hz)', () => {
  it('the same fixed-step sequence is exactly reproducible', () => {
    const a = fly(1 / 3, [0.05], 0.18);
    const b = fly(1 / 3, [0.05], 0.18);
    expect(a.player.y).toBe(b.player.y);
    expect(a.player.vy).toBe(b.player.vy);
  });

  it('halving the step converges (Euler error shrinks, vy is exact)', () => {
    const fine = fly(1 / 3, [0.05], 0.18, 1 / 240);
    const coarse = fly(1 / 3, [0.05], 0.18, DT);
    expect(coarse.player.vy).toBeCloseTo(fine.player.vy, 3);
    expect(Math.abs(coarse.rise - fine.rise)).toBeLessThan(2.5);
  });
});

describe('misc geometry + share text', () => {
  it('the spawn horizon clears the right edge of the 900 px viewport', () => {
    expect(SPAWN_X).toBeGreaterThanOrEqual(VIEW_W);
  });

  it('shareText matches "Ran {m} m in Hurdle Runner — beat that! {url}"', () => {
    expect(shareText(1204, 'http://x/y')).toBe(
      'Ran 1204 m in Hurdle Runner — beat that! http://x/y'
    );
  });
});
