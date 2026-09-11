/**
 * ============================================================================
 * Hurdle Runner — engine.js (Game 05, plan/games/05-continuous-runner.md §6)
 * ============================================================================
 * Generic engine plumbing, deliberately game-agnostic so Spirit Runner (07)
 * can fork this file as its base: the fixed-timestep loop, the jump input
 * (press edge + live hold state, pointer + keyboard), and the camera /
 * parallax helpers. No game rules live here — those are core.js; no drawing —
 * that is render.js; no state machine — that is main.js.
 *
 * Plain ESM, no build step, no DOM access at import time (jest imports its
 * consumers safely).
 * ============================================================================
 */

/**
 * Fixed-timestep loop (master README §2/§3 `shared/loop.js` contract):
 * rAF + accumulator, physics at `fixedDt` (1/120 s), frame clamp 250 ms so a
 * stalled tab can never tunnel the sim through obstacles, and auto-pause on
 * `visibilitychange` — time never silently elapses (plan §7.1).
 *
 * Returns { start, stop, setPaused }. `onAutoPause` fires when the tab hides;
 * resuming is always an explicit `setPaused(false)` from the owner (main.js),
 * which also resets the clock so the first frame back contributes dt = 0 and
 * the exact sim state continues (plan §7.1: resume continues the same arc).
 */
export function createLoop({ update, render, fixedDt = 1 / 120, onAutoPause }) {
  let rafId = 0;
  let lastMs = 0;
  let accumulator = 0;
  let paused = false;

  function frame(nowMs) {
    rafId = requestAnimationFrame(frame);
    const t = nowMs / 1000;
    let dt = lastMs ? (nowMs - lastMs) / 1000 : 0;
    lastMs = nowMs;
    if (dt > 0.25) dt = 0.25; // frame clamp — no tunneling through obstacles (§7.3)
    if (!paused) {
      accumulator += dt;
      let guard = 0;
      while (accumulator >= fixedDt && guard++ < 240) {
        update(fixedDt);
        accumulator -= fixedDt;
      }
      if (guard >= 240) accumulator = 0; // pathological catch-up: drop the debt
    }
    render(t);
  }

  function onVisibility() {
    if (document.hidden) {
      paused = true;
      lastMs = 0; // first frame after resume contributes dt = 0
      if (onAutoPause) onAutoPause();
    }
  }

  return {
    start() {
      if (!rafId) rafId = requestAnimationFrame(frame);
      document.addEventListener('visibilitychange', onVisibility);
    },
    stop() {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
      document.removeEventListener('visibilitychange', onVisibility);
    },
    setPaused(p) {
      paused = p;
      if (!p) {
        lastMs = 0;
        accumulator = 0;
      }
    },
  };
}

/**
 * The one action's input: a press EDGE (`onPress` callback) plus a live
 * `held` flag read by the physics step for the jump cut. Presses come from
 * pointerdown on `stage` (tap anywhere) and Space/↑ keydown; taps on buttons
 * and links act for themselves and never reach the game. The pointer set +
 * key flag are tracked separately, so lifting one finger while another holds
 * — or releasing Space while a finger is down — keeps `held` truthful.
 *
 * Returns the live { held } object (pass it into stepPlayer each step).
 */
export function createJumpInput(stage, onPress) {
  const pointers = new Set();
  let keyHeld = false;
  const input = { held: false };

  function refresh() {
    input.held = pointers.size > 0 || keyHeld;
  }

  stage.addEventListener('pointerdown', (e) => {
    if (e.target && e.target.closest && e.target.closest('button, a')) return;
    e.preventDefault();
    // Capture so the release always lands on us, even if the finger slides off.
    try {
      stage.setPointerCapture(e.pointerId);
    } catch {
      /* capture unsupported — window pointerup still catches the release */
    }
    pointers.add(e.pointerId);
    refresh();
    onPress();
  });
  const lift = (e) => {
    pointers.delete(e.pointerId);
    refresh();
  };
  window.addEventListener('pointerup', lift);
  window.addEventListener('pointercancel', lift);

  document.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    if (e.code !== 'Space' && e.code !== 'ArrowUp') return;
    if (e.target && e.target.closest && e.target.closest('button, a, input, textarea, select')) {
      return; // a focused control keeps the key for itself
    }
    e.preventDefault(); // no page scroll, no focused-button double-fire
    if (!keyHeld) {
      keyHeld = true;
      refresh();
      onPress();
    }
  });
  document.addEventListener('keyup', (e) => {
    if (e.code !== 'Space' && e.code !== 'ArrowUp') return;
    keyHeld = false;
    refresh();
  });

  return input;
}

/**
 * Camera: the scrolled distance in px. `advance()` ramps the speed through
 * core's speedAt() and returns this frame's scroll delta so callers can move
 * world objects by the same amount.
 */
export function createCamera() {
  return { x: 0, elapsed: 0, speed: 0 };
}

export function advanceCamera(cam, dt, speedFn) {
  cam.elapsed += dt;
  cam.speed = speedFn(cam.elapsed);
  const dx = cam.speed * dt;
  cam.x += dx;
  return dx;
}

/** Parallax offset for a layer (§2: far hills ×0.2, near trees ×0.5, ground ×1). */
export function parallax(camX, factor) {
  return camX * factor;
}
