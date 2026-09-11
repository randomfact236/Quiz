/**
 * ============================================================================
 * Flying Snake — core.js (Game 06, plan/games/06-flying-snake.md §6)
 * ============================================================================
 * Pure model, zero DOM access — this module is the test surface (plan §8).
 * Plain ESM, no build step (same convention as games 01/02/03): render.js and
 * main.js import it in the browser, and the jest suite
 * (src/__tests__/games-flying-snake.test.ts) plus the folder's own
 * core.test.html harness import it directly.
 *
 * World = 720×960 logical viewport, portrait, ground strip at the bottom.
 * The snake sits at a fixed x (30 % of the width); the world — vine pairs,
 * ground texture — scrolls left at a constant speed. Difficulty scales only
 * through the gap (§2): it starts at 170 px and shrinks 2 px per point to a
 * 120 px floor. Physics constants are exactly the plan's §2 table.
 * ============================================================================
 */

/* ---- persistence keys (plan §5) -------------------------------------------- */

export const BEST_KEY = 'game:flying-snake:best'; // → { score: 23 }
export const PREFS_KEY = 'game:flying-snake:prefs'; // → { muted: false }

/* ---- viewport ------------------------------------------------------------- */

export const VIEW_W = 720;
export const VIEW_H = 960;
export const GROUND_H = 90;

/* ---- physics (plan §2 table, verbatim) ------------------------------------ */

export const GRAVITY = 1800; // px/s²
export const FLAP_VY = -480; // px/s — one flap per press, no hold-to-fly
export const TERMINAL_VY = 700; // px/s — max fall speed
export const WORLD_SPEED = 160; // px/s — constant; difficulty scales via gap
export const SNAKE_X_FRACTION = 0.3; // fixed 30 % width
export const SNAKE_R = 14; // visual radius …
export const HITBOX_SCALE = 0.9; // … hitbox radius ×0.9 (forgiving)

/* ---- vines (pipe pairs) ---------------------------------------------------- */

export const PIPE_W = 64;
export const PIPE_SPACING = 300; // horizontal, constant (plan §2)
export const GAP_START = 170;
export const GAP_SHRINK = 2; // per point
export const GAP_MIN = 120;
export const EDGE_MARGIN = 80; // gap center ≥ margin + gap/2 from both edges
export const FIRST_PIPE_X = 520; // left edge of the first pair of a run —
// > snakeX() + hitRadius(), so the frozen `ready` world can never overlap
// the snake (plan §10: the first flap never spawns the snake into a pipe).

/* ---- ceiling grace (plan §2): first 2 s the ceiling clamps, never kills --- */

export const CEILING_GRACE_S = 2;

/** Fixed snake x for the whole run (world scrolls, snake does not). */
export function snakeX() {
  return VIEW_W * SNAKE_X_FRACTION;
}

/** y where the ground strip starts. */
export function groundY() {
  return VIEW_H - GROUND_H;
}

/** Collision radius — the visual radius ×0.9 (plan §2, forgiving hitbox). */
export function hitRadius() {
  return SNAKE_R * HITBOX_SCALE;
}

/* ---- snake ------------------------------------------------------------------ */

export function createSnake() {
  return {
    y: Math.round(VIEW_H * 0.42), // safe mid-screen bob height for `ready`
    vy: 0,
    elapsed: 0, // seconds since the run started — drives the ceiling grace
  };
}

/**
 * One physics step (called at a fixed 1/120 s by main.js's accumulator loop,
 * so `dt` is constant in practice — the pure function stays deterministic
 * whatever the caller feeds it). Mutates and returns the snake. `flapped`
 * applies exactly one flap (vy is SET to FLAP_VY, never accumulated — one
 * flap per press, no hold-to-fly, plan §4). During the ceiling grace the
 * position clamps at the ceiling instead of dying (plan §2); afterwards the
 * ceiling is lethal — that check lives in snakeHit().
 */
export function stepSnake(snake, dt, flapped) {
  if (flapped) snake.vy = FLAP_VY;
  snake.vy = Math.min(TERMINAL_VY, snake.vy + GRAVITY * dt);
  snake.y += snake.vy * dt;
  snake.elapsed += dt;
  if (snake.elapsed <= CEILING_GRACE_S && snake.y < hitRadius()) {
    snake.y = hitRadius();
    if (snake.vy < 0) snake.vy = 0;
  }
  return snake;
}

/**
 * Body tilt in DEGREES, reading the velocity (plan §2): −25° at a fresh flap,
 * +80° at terminal velocity, linear in between, clamped outside the range.
 * render.js converts to radians.
 */
export function tiltFor(vy) {
  const t = (vy - FLAP_VY) / (TERMINAL_VY - FLAP_VY);
  return -25 + Math.min(1, Math.max(0, t)) * (80 - -25);
}

/* ---- vine spawner ----------------------------------------------------------- */

/** Gap for a given score: 170 px shrinking 2 px/point, floored at 120 (§2). */
export function gapForScore(score) {
  return Math.max(GAP_MIN, GAP_START - GAP_SHRINK * score);
}

/**
 * A spawner owns the rng stream (injectable — tests use a seeded rng) and
 * counts the pairs it has produced.
 */
export function createSpawner(rng = Math.random) {
  return { rng, made: 0 };
}

/**
 * Next gap: size from the score ramp, center uniformly random in the only
 * band the margins allow — ≥ EDGE_MARGIN + gap/2 from the top edge and from
 * the ground (plan §2). With the constants above the band is never empty
 * (widest gap 170: lo = 165, hi = 705 on the 960 tall viewport).
 */
export function nextGap(spawner, score) {
  const gap = gapForScore(score);
  const lo = EDGE_MARGIN + gap / 2;
  const hi = VIEW_H - GROUND_H - EDGE_MARGIN - gap / 2;
  const center = lo + (hi - lo) * spawner.rng();
  spawner.made += 1;
  return { gap, centerY: center };
}

/** A pipe pair: left edge x, gap size, gap center, scored-once flag. */
export function makePipe(x, gap, centerY) {
  return { x, gap, centerY, scored: false };
}

/** The two collision rects of a pair — top vine (ceiling to gap top) and
 *  bottom vine (gap bottom to ground). */
export function pipeRects(pipe) {
  const topH = pipe.centerY - pipe.gap / 2;
  const bottomY = pipe.centerY + pipe.gap / 2;
  return [
    { x: pipe.x, y: 0, w: PIPE_W, h: topH },
    { x: pipe.x, y: bottomY, w: PIPE_W, h: Math.max(0, groundY() - bottomY) },
  ];
}

/**
 * Standard circle-vs-rect clamp test: nearest point of the rect to the
 * circle center, then a radius check. Strict `<`, so exactly touching does
 * not count (the forgiving 0.9 hitbox already buys the margin back).
 */
export function circleRectHit(cx, cy, r, rect) {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

/**
 * Death check for one physics position (plan §2): ground is always lethal,
 * the ceiling is lethal only after the 2 s grace (before that stepSnake
 * clamps instead), and vine pairs use the circle-rect test on both rects.
 * Returns 'ground' | 'ceiling' | 'pipe' | null.
 */
export function snakeHit(snake, pipes) {
  const r = hitRadius();
  const x = snakeX();
  if (snake.y + r >= groundY()) return 'ground';
  if (snake.elapsed > CEILING_GRACE_S && snake.y - r <= 0) return 'ceiling';
  for (let i = 0; i < pipes.length; i++) {
    if (pipes[i].x > x + r || pipes[i].x + PIPE_W < x - r) continue; // out of reach
    const rects = pipeRects(pipes[i]);
    if (circleRectHit(x, snake.y, r, rects[0])) return 'pipe';
    if (circleRectHit(x, snake.y, r, rects[1])) return 'pipe';
  }
  return null;
}

/**
 * Score rule (plan §2): +1 when the snake's x passes a pair's right edge,
 * counted once per pair — the `scored` flag flips structurally, so a pair
 * can never pay twice (plan §7.5). Returns true exactly when the point is
 * scored.
 */
export function pipePassed(pipe) {
  if (pipe.scored) return false;
  if (pipe.x + PIPE_W < snakeX()) {
    pipe.scored = true;
    return true;
  }
  return false;
}

/* ---- medals (plan §2): bronze 10 · silver 20 · gold 40 · platinum 75 ------- */

export function medalFor(score) {
  if (score >= 75) return 'platinum';
  if (score >= 40) return 'gold';
  if (score >= 20) return 'silver';
  if (score >= 10) return 'bronze';
  return null;
}
