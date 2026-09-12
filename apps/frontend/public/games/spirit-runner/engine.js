/**
 * ============================================================================
 * Spirit Runner — engine.js (Game 07, plan/games/07-spirit-runner.md §6)
 * ============================================================================
 * Forked from Game 05's engine (public/games/hurdle-runner/engine.js), as the
 * plan directs ("forks engine.js"). Unchanged: the fixed-timestep loop and the
 * camera helper. Extended: the input layer gains the slide and
 * the pointer swipe grammar (plan §4: swipe-up = jump, swipe-down = slide,
 * thresholds 30 px / 120 ms) while keeping 05's jump feel — coyote/buffer/
 * cut read the live `jumpHeld` flag exactly as before.
 *
 * No game rules live here (core.js), no drawing (render.js), no state
 * machine (main.js). Plain ESM, no build step, no DOM access at import time.
 * ============================================================================
 */

/**
 * Fixed-timestep loop (master README §2/§3 `shared/loop.js` contract):
 * rAF + accumulator, physics at `fixedDt` (1/120 s), frame clamp 250 ms so a
 * stalled tab can never tunnel the sim through obstacles, and auto-pause on
 * `visibilitychange` — time never silently elapses (plan §7). Returns
 * { start, stop, setPaused }; `onAutoPause` fires when the tab hides and
 * resuming is always an explicit `setPaused(false)` from main.js, which also
 * resets the clock so the first frame back contributes dt = 0.
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
    if (dt > 0.25) dt = 0.25; // frame clamp — no tunneling through obstacles
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
 * Pointer gesture grammar (plan §4: swipe-up = jump, swipe-down = slide,
 * thresholds 30 px / 120 ms). A press is classified by the first of:
 *  - the finger crossing 30 px DOWN  → slide edge fires right there
 *  - the finger crossing 30 px UP    → jump edge fires, held until release
 *  - the finger lifting inside 120 ms with < 30 px travel → tap = jump edge
 *    (a short press cuts itself, 05's tap feel)
 *  - 120 ms elapsing still-down      → hold-jump edge fires, held until
 *    release (hold = higher, exactly 05's jump cut)
 * Keyboard mirrors it instantly: Space/↑ = jump (held until keyup),
 * ↓ / S = slide edge. Actions arrive as
 *   { type: 'jump' | 'slide', fx }
 * where fx is a 0..1 fraction of the stage box width (main maps the gate
 * door zones from it; keyboard actions carry no fx).
 *
 * Returns { jumpHeld } — the live hold state driving the jump cut (pointer
 * jump-presses and the key flag OR together; lifting one finger while
 * another holds keeps it truthful, as in 05).
 */
export function createRunnerInput(stage, onAction) {
  const SWIPE_PX = 30;
  const SWIPE_MS = 120;

  const pointers = new Map(); // pointerId → { x0, y0, timer, kind ('jump'|'slide'|null) }
  let keyHeld = false;
  const input = { jumpHeld: false };

  function refresh() {
    for (const p of pointers.values()) {
      if (p.kind === 'jump') {
        input.jumpHeld = true;
        return;
      }
    }
    input.jumpHeld = keyHeld;
  }

  function classify(p, kind) {
    if (p.kind) return;
    p.kind = kind;
    if (p.timer) {
      clearTimeout(p.timer);
      p.timer = 0;
    }
    onAction({ type: kind, fx: p.fx });
    refresh();
  }

  stage.addEventListener('pointerdown', (e) => {
    if (e.target && e.target.closest && e.target.closest('button, a')) return;
    e.preventDefault();
    try {
      stage.setPointerCapture(e.pointerId);
    } catch {
      /* capture unsupported — window pointerup still catches the release */
    }
    const rect = stage.getBoundingClientRect();
    const p = {
      x0: e.clientX,
      y0: e.clientY,
      fx: rect.width ? (e.clientX - rect.left) / rect.width : 0.5,
      kind: null,
      timer: 0,
    };
    pointers.set(e.pointerId, p);
    // still down and directionless at 120 ms → it's a hold-jump (05 feel)
    p.timer = setTimeout(() => {
      if (pointers.get(e.pointerId) === p) classify(p, 'jump');
    }, SWIPE_MS);
  });

  stage.addEventListener('pointermove', (e) => {
    const p = pointers.get(e.pointerId);
    if (!p || p.kind) return;
    const dy = e.clientY - p.y0;
    if (dy <= -SWIPE_PX)
      classify(p, 'jump'); // swipe-up = jump
    else if (dy >= SWIPE_PX) classify(p, 'slide'); // swipe-down = slide
  });

  const lift = (e) => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    pointers.delete(e.pointerId);
    if (p.timer) clearTimeout(p.timer);
    if (!p.kind) {
      // released inside the window with < 30 px travel → tap = jump edge
      onAction({ type: 'jump', fx: p.fx });
    }
    refresh();
  };
  window.addEventListener('pointerup', lift);
  window.addEventListener('pointercancel', lift);

  document.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    const jumpKey = e.code === 'Space' || e.code === 'ArrowUp';
    const slideKey = e.code === 'ArrowDown' || e.code === 'KeyS';
    if (!jumpKey && !slideKey) return;
    if (e.target && e.target.closest && e.target.closest('button, a, input, textarea, select')) {
      return; // a focused control keeps the key for itself
    }
    e.preventDefault(); // no page scroll, no focused-button double-fire
    if (jumpKey) {
      if (!keyHeld) {
        keyHeld = true;
        refresh();
        onAction({ type: 'jump' });
      }
    } else {
      onAction({ type: 'slide' });
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
 * the caller's speedAt() and returns this frame's scroll delta so world
 * objects move by the same amount. (Identical to 05.)
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
