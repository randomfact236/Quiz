/**
 * Pure-logic tests for the static game at
 * public/games/flying-snake/core.js (plan/games/06-flying-snake.md §8:
 * flap-arc math, the 1,000-gap spawner sweep with margin proof, circle-rect
 * corner/edge cases, tilt endpoints + monotonicity, medal boundaries).
 * The same assertions ship in the game's own core.test.html harness; this
 * suite keeps them running in CI.
 */
import {
  BEST_KEY,
  EDGE_MARGIN,
  FIRST_PIPE_X,
  GAP_MIN,
  GAP_START,
  GRAVITY,
  PIPE_SPACING,
  PIPE_W,
  PREFS_KEY,
  TERMINAL_VY,
  VIEW_H,
  VIEW_W,
  circleRectHit,
  createSnake,
  createSpawner,
  gapForScore,
  groundY,
  hitRadius,
  makePipe,
  medalFor,
  nextGap,
  pipePassed,
  pipeRects,
  snakeHit,
  snakeX,
  stepSnake,
  tiltFor,
} from '../../public/games/flying-snake/core';
import { shareText } from '../../public/games/flying-snake/main';

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

/** Fly a purely physical trajectory: fixed steps, flaps at the given times. */
function fly(durationS: number, flapTimesS: number[], dt: number) {
  const snake = createSnake();
  let minY = snake.y;
  const steps = Math.round(durationS / dt);
  let nextFlap = 0;
  for (let i = 0; i < steps; i++) {
    const t0 = i * dt;
    const flapped =
      nextFlap < flapTimesS.length && flapTimesS[nextFlap] >= t0 && flapTimesS[nextFlap] < t0 + dt;
    if (flapped) nextFlap++;
    stepSnake(snake, dt, flapped);
    minY = Math.min(minY, snake.y);
  }
  return { snake, minY, rise: createSnake().y - minY };
}

describe('storage keys (plan §5)', () => {
  it('are namespaced under the game slug', () => {
    expect(BEST_KEY).toBe('game:flying-snake:best');
    expect(PREFS_KEY).toBe('game:flying-snake:prefs');
  });
});

describe('stepSnake (gravity / flap / terminal / ceiling grace)', () => {
  it('integrates gravity exactly under semi-implicit Euler (velocity first)', () => {
    const snake = createSnake();
    const start = createSnake().y;
    const dt = 1 / 120;
    const steps = 30; // 0.25 s — well below terminal
    for (let i = 0; i < steps; i++) stepSnake(snake, dt, false);
    // vy is exact: g·t; y is start + the Euler sum g·dt²·(1+…+N)
    expect(snake.vy).toBeCloseTo(GRAVITY * 0.25, 6);
    expect(snake.y).toBeCloseTo(start + GRAVITY * dt * dt * ((steps * (steps + 1)) / 2), 6);
  });

  it('a flap sets vy to exactly FLAP_VY, never accumulates (one flap per press)', () => {
    const snake = createSnake();
    snake.vy = TERMINAL_VY;
    stepSnake(snake, 1 / 120, true);
    expect(snake.vy).toBe(-480 + GRAVITY / 120); // set, then one step of gravity
  });

  it('fall speed clamps at terminal velocity', () => {
    const snake = createSnake();
    for (let i = 0; i < 120; i++) stepSnake(snake, 1 / 120, false); // 1 s
    expect(snake.vy).toBe(TERMINAL_VY);
  });

  it('one flap from rest rises the flap arc v²/2g = 64 px (Euler: within 3 px)', () => {
    const { rise } = fly(0.6, [0.01], 1 / 120);
    expect(rise).toBeGreaterThan(61); // closed form 64, Euler sum lands ~62
    expect(rise).toBeLessThan(64);
  });

  it('clamps at the ceiling during the 2 s grace and never dies there', () => {
    const snake = createSnake();
    for (let i = 0; i < 240; i++) stepSnake(snake, 1 / 120, true); // 2 s of flap spam
    expect(snake.elapsed).toBeGreaterThanOrEqual(2 - 1e-9); // fp accumulation
    expect(snake.y).toBe(hitRadius()); // clamped, not killed
    expect(snakeHit(snake, [])).toBeNull(); // grace → ceiling is not lethal
    // just past the grace window the same position is lethal
    stepSnake(snake, 1 / 120, true);
    expect(snake.elapsed).toBeGreaterThan(2);
    expect(snakeHit(snake, [])).toBe('ceiling');
  });
});

describe('tiltFor (plan §2: −25° at flap, +80° at terminal, monotonic)', () => {
  it('hits both endpoints and clamps beyond them', () => {
    expect(tiltFor(-480)).toBe(-25);
    expect(tiltFor(700)).toBe(80);
    expect(tiltFor(-2000)).toBe(-25);
    expect(tiltFor(3000)).toBe(80);
  });

  it('is linear: the velocity midpoint maps to the angle midpoint', () => {
    expect(tiltFor(110)).toBe(27.5);
  });

  it('is monotonically non-decreasing across the whole range', () => {
    let prev = tiltFor(-480);
    for (let vy = -470; vy <= 700; vy += 10) {
      const t = tiltFor(vy);
      expect(t).toBeGreaterThanOrEqual(prev);
      prev = t;
    }
  });
});

describe('gapForScore (170 px, −2/point, floor 120)', () => {
  it('starts at 170 and shrinks 2 px per point', () => {
    expect(gapForScore(0)).toBe(GAP_START);
    expect(gapForScore(1)).toBe(168);
    expect(gapForScore(10)).toBe(150);
  });

  it('floors at 120 px from score 25 on', () => {
    expect(gapForScore(24)).toBe(122);
    expect(gapForScore(25)).toBe(GAP_MIN);
    expect(gapForScore(80)).toBe(GAP_MIN);
  });
});

/* ---- the plan §8 proof: 1,000-gap spawner sweep ----------------------------
 * Every gap across scores 0–80 must respect both margins (center ≥
 * 80 px + gap/2 from the top edge and from the ground), stay within the
 * 120–170 px size window, and the seeded run must be reproducible.
 * -------------------------------------------------------------------------- */

describe('spawner sweep (1,000 gaps, scores 0–80 — plan §8)', () => {
  const rng = seededRng(20260911);
  const spawner = createSpawner(rng);
  const seen: { score: number; gap: number; centerY: number }[] = [];

  it('every gap sits inside the margins and the size window', () => {
    for (let i = 0; i < 1000; i++) {
      const score = i % 81; // 0…80
      const { gap, centerY } = nextGap(spawner, score);
      expect(gap).toBe(gapForScore(score));
      expect(gap).toBeGreaterThanOrEqual(GAP_MIN);
      expect(gap).toBeLessThanOrEqual(GAP_START);
      expect(centerY - gap / 2).toBeGreaterThanOrEqual(EDGE_MARGIN - 1e-9);
      expect(groundY() - (centerY + gap / 2)).toBeGreaterThanOrEqual(EDGE_MARGIN - 1e-9);
      expect(centerY).toBeGreaterThan(0);
      expect(centerY).toBeLessThan(groundY());
      seen.push({ score, gap, centerY });
    }
    expect(seen).toHaveLength(1000);
  });

  it('is deterministic for a fixed rng stream', () => {
    const a = createSpawner(seededRng(7));
    const b = createSpawner(seededRng(7));
    for (const score of [0, 5, 25, 60]) {
      expect(nextGap(a, score)).toEqual(nextGap(b, score));
    }
  });
});

describe('circleRectHit (standard clamp test, plan §8)', () => {
  const rect = { x: 0, y: 0, w: 10, h: 10 };

  it('center inside the rect always hits', () => {
    expect(circleRectHit(5, 5, 1, rect)).toBe(true);
    expect(circleRectHit(0.5, 9.5, 0.1, rect)).toBe(true);
  });

  it('resolves the corner via the clamp point', () => {
    // corner (10,10): distance √18 ≈ 4.243
    expect(circleRectHit(13, 13, 5, rect)).toBe(true);
    expect(circleRectHit(13, 13, 4, rect)).toBe(false);
  });

  it('1 px outside is a miss at small radii, overlap at larger ones', () => {
    expect(circleRectHit(11, 5, 0.9, rect)).toBe(false); // 1 px gap
    expect(circleRectHit(11, 5, 1.5, rect)).toBe(true); // 0.5 px overlap
  });

  it('exactly touching is NOT a hit (strict inequality)', () => {
    expect(circleRectHit(11, 5, 1, rect)).toBe(false);
  });
});

describe('pipeRects (vine pair geometry)', () => {
  it('splits the column at the gap, bottom rect ends at the ground', () => {
    const pipe = makePipe(100, 170, 480);
    const [top, bottom] = pipeRects(pipe);
    expect(top).toEqual({ x: 100, y: 0, w: PIPE_W, h: 395 });
    expect(bottom).toEqual({ x: 100, y: 565, w: PIPE_W, h: groundY() - 565 });
  });

  it('a gap pushed against the ground yields a zero-height bottom rect', () => {
    const pipe = makePipe(0, 120, groundY() - 60);
    const [, bottom] = pipeRects(pipe);
    expect(bottom.h).toBe(0);
    expect(circleRectHit(PIPE_W / 2, groundY() - 1, hitRadius(), bottom)).toBe(true);
  });
});

describe('snakeHit (ground always lethal, ceiling after grace, vines)', () => {
  const snakeAt = (y: number, elapsed = 10) => {
    const s = createSnake();
    s.y = y;
    s.elapsed = elapsed;
    return s;
  };

  it('clear flight is null', () => {
    expect(snakeHit(snakeAt(400), [])).toBeNull();
  });

  it('the ground strip kills at and past contact', () => {
    expect(snakeHit(snakeAt(groundY() - hitRadius() - 1), [])).toBeNull();
    expect(snakeHit(snakeAt(groundY() - hitRadius()), [])).toBe('ground');
    expect(snakeHit(snakeAt(VIEW_H - 1), [])).toBe('ground');
  });

  it('the ceiling kills only after the 2 s grace', () => {
    expect(snakeHit(snakeAt(hitRadius() - 1, 1.5), [])).toBeNull();
    expect(snakeHit(snakeAt(hitRadius() - 1, 2.5), [])).toBe('ceiling');
  });

  it('a vine column kills only on the rects, not in the gap', () => {
    const pipe = makePipe(snakeX() - PIPE_W / 2, 170, 480);
    expect(snakeHit(snakeAt(480), [pipe])).toBeNull(); // centered in the gap
    expect(snakeHit(snakeAt(480 - 85 + 6), [pipe])).toBe('pipe'); // 6 px into the top vine
    expect(snakeHit(snakeAt(480 + 85 - 6), [pipe])).toBe('pipe'); // 6 px into the bottom vine
  });

  it('ignores vines beyond the snake’s reach', () => {
    const pipe = makePipe(snakeX() + hitRadius() + 1, 170, 400);
    expect(snakeHit(snakeAt(400), [pipe])).toBeNull();
  });
});

describe('pipePassed (score once per pair — plan §7.5)', () => {
  it('pays exactly once, when the pair’s right edge passes the snake', () => {
    const pipe = makePipe(snakeX(), 170, 480);
    expect(pipePassed(pipe)).toBe(false); // right edge not past the snake yet
    pipe.x = snakeX() - PIPE_W - 1;
    expect(pipePassed(pipe)).toBe(true);
    expect(pipePassed(pipe)).toBe(false); // structurally impossible to double
  });
});

/* ---- plan §10: the first flap never spawns the snake into a pipe -----------
 * The ready world starts the first pair at FIRST_PIPE_X, clear of the
 * snake's fixed column, so the frozen ready state and the first flap are
 * always collision-free.
 * -------------------------------------------------------------------------- */

describe('ready world (plan §10 first-flap safety, §7.1 frozen ready)', () => {
  it('no pipe of the initial world can touch the snake', () => {
    const spawner = createSpawner(seededRng(1));
    const pipes = [];
    for (let x = FIRST_PIPE_X; x < VIEW_W + PIPE_SPACING; x += PIPE_SPACING) {
      const gap = nextGap(spawner, 0);
      pipes.push(makePipe(x, gap.gap, gap.centerY));
    }
    for (const pipe of pipes) {
      expect(pipe.x).toBeGreaterThan(snakeX() + hitRadius());
    }
    expect(snakeHit(createSnake(), pipes)).toBeNull();
  });

  it('the snake starts at a safe mid-screen height', () => {
    const snake = createSnake();
    expect(snake.y).toBeGreaterThan(EDGE_MARGIN);
    expect(snake.y).toBeLessThan(groundY() - EDGE_MARGIN);
    expect(snakeHit(snake, [])).toBeNull();
  });
});

/* ---- plan §8: flap-arc fairness math ---------------------------------------
 * One flap rises v²/2g = 64 px. Geometrically that threads a centered
 * default 170 px gap (free band ±72.4 px around the center after the ×0.9
 * hitbox), while the 120 px floor gap (±47.4 px) needs the arc started from
 * one of its edges — both are the fair-threading claims the plan's §8 bullet
 * reaches for, encoded against the real §2 constants.
 * -------------------------------------------------------------------------- */

describe('flap arc vs gaps (plan §8 fairness math)', () => {
  const FREE_DEFAULT = 170 / 2 - hitRadius(); // 72.4 px
  const FREE_FLOOR = GAP_MIN / 2 - hitRadius(); // 47.4 px
  const RISE = (480 * 480) / (2 * GRAVITY); // 64 px

  it('a single flap from the center threads a centered 170 px gap', () => {
    expect(RISE).toBeLessThan(FREE_DEFAULT);
  });

  it('from a floor-gap edge, one flap re-crosses the centerline', () => {
    const { rise } = fly(0.6, [0.01], 1 / 120);
    expect(rise).toBeGreaterThan(FREE_FLOOR); // covers the half-gap to the center
    expect(RISE).toBeGreaterThanOrEqual(FREE_FLOOR - 1);
  });
});

/* ---- plan §10: deterministic physics across frame rates --------------------
 * The loop feeds core a fixed 1/120 s step whatever the display runs at;
 * here the core side of that contract is pinned: identical step sequences
 * give identical outcomes, and halving the step converges (≤ 2 px over ⅓ s).
 * -------------------------------------------------------------------------- */

describe('fixed-timestep determinism (plan §10)', () => {
  it('the same fixed-step sequence is exactly reproducible', () => {
    const a = fly(1 / 3, [0.1, 0.2], 1 / 120);
    const b = fly(1 / 3, [0.1, 0.2], 1 / 120);
    expect(a.snake.y).toBe(b.snake.y);
    expect(a.snake.vy).toBe(b.snake.vy);
  });

  it('halving the step converges (Euler error shrinks, vy is exact)', () => {
    const fine = fly(1 / 3, [0.1, 0.2], 1 / 240);
    const coarse = fly(1 / 3, [0.1, 0.2], 1 / 120);
    expect(coarse.snake.vy).toBeCloseTo(fine.snake.vy, 3);
    expect(Math.abs(coarse.snake.y - fine.snake.y)).toBeLessThan(2.5);
  });
});

describe('medalFor (bronze 10 · silver 20 · gold 40 · platinum 75)', () => {
  it.each([
    [0, null],
    [9, null],
    [10, 'bronze'],
    [19, 'bronze'],
    [20, 'silver'],
    [39, 'silver'],
    [40, 'gold'],
    [74, 'gold'],
    [75, 'platinum'],
    [200, 'platinum'],
  ])('score %i → %s', (score, medal) => {
    expect(medalFor(score)).toBe(medal);
  });
});

describe('shareText (plan §9 P2 format)', () => {
  it('matches “Flew through {n} gaps … beat that! {url}”', () => {
    expect(shareText(12, 'http://x/y')).toBe(
      'Flew through 12 gaps in Flying Snake — beat that! http://x/y'
    );
  });
});
