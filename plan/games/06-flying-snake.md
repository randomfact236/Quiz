# Game 06 — Flying Snake / Flappy (Complete Plan)

> Complete plan (supersedes the 2026-09-09 sample). Status: **Built** (P0–P2 complete,
> 2026-09-11) — full trio in `apps/frontend/public/games/flying-snake/` (core/render/main),
> jest suite + `core.test.html` green; P3 extras (moving pipes, night palette, ghost run)
> deferred. Slug `flying-snake`; folder `apps/frontend/public/games/flying-snake/`.
> Branding decided: page title "Flying Snake" (master README §8 #8).

## 1. Overview

Flappy-style: tap to flap against gravity, thread the gaps. One-tap, instantly
restartable, brutally scoreable. Success metric: median session ≥ 8 runs ("one more try"
loop confirmed); death always reads as fair.

## 2. Complete game spec

### Physics (fixed timestep 1/120 s, accumulator, 250 ms frame clamp)

| Constant      | Value      | Notes                                           |
| ------------- | ---------- | ----------------------------------------------- |
| `GRAVITY`     | 1800 px/s² |                                                 |
| `FLAP_VY`     | −480 px/s  | one flap per press (no hold-to-fly)             |
| `TERMINAL_VY` | +700 px/s  | max fall speed                                  |
| `SNAKE_X`     | 30 % width | fixed; world scrolls left                       |
| `SNAKE_R`     | 14 px      | visual radius; hitbox radius ×0.9 (forgiving)   |
| `WORLD_SPEED` | 160 px/s   | constant — difficulty scales via gap, not speed |

### Obstacles (pipe/vine pairs)

- **Gap:** 170 px, shrinks 2 px per point, floor 120 px.
- **Spacing:** 300 px horizontal, constant (density feels fairer than shrinking both axes).
- **Gap center:** random, ≥ 80 px + gap/2 from top and bottom edges.
- **Ceiling grace:** first 2 s of a run the ceiling clamps (no death); ground always lethal.
- **Collision:** circle (×0.9) vs pipe rects + ground strip; circle-rect standard clamp test.
- **Score:** +1 when the snake's x passes a pair's right edge (counted once per pair).
- **Medals:** bronze 10 · silver 20 · gold 40 · platinum 75 (gameover card).

### Feel carriers

- **Tilt:** angle = `clamp(map(vy, −480…+700, −25°…+80°))` — the snake reads velocity.
- **Trailing segments:** 5 circles sampled from past positions every 40 ms with a small
  sinusoidal wiggle — sells "flying snake" with zero art assets.
- Death: white flash 120 ms + 300 ms screen shake + fall animation, then gameover card.

## 3. Screens & UI

| State      | Elements                                                                        |
| ---------- | ------------------------------------------------------------------------------- |
| `menu`     | Title, best score + medal, bobbing snake animation, "Tap to start"              |
| `ready`    | World visible + frozen, "Tap to flap" hint; first tap starts physics mid-screen |
| `playing`  | World + HUD score (large, top-center) + mute toggle                             |
| `paused`   | Overlay (auto on `visibilitychange`)                                            |
| `gameover` | Score, best, medal, [↻ Retry] [📤 Share]                                        |

Virtual viewport 720×960 logical (portrait), scaled/letterboxed, `devicePixelRatio` aware.
`?debug=1` draws hitbox circle + pipe rects (dev aid).

## 4. Controls

Tap anywhere / Space / ↑ = flap. `pointerdown` based; multi-touch extra flaps within
50 ms ignored; `touch-action:none`. No other input at MVP.

## 5. Data model (localStorage)

```
game:flying-snake:best   → { score: 23 }
game:flying-snake:prefs  → { muted: false }
```

## 6. File structure & function inventory

```
flying-snake/
  index.html
  style.css
  core.js     # pure: physics step, spawner, collision, scoring — test surface
  render.js   # procedural draw: snake segments, vines, ground, HUD
  main.js     # state machine (menu/ready/playing/paused/gameover) + glue
```

`core.js` exports: `createSnake()`, `stepSnake(snake, dt, flapped)` (gravity/terminal/
flap), `createSpawner(rng)`, `nextGap(spawner, score)` (margins + shrink rule),
`circleRectHit(cx, cy, r, rect)`, `tiltFor(vy)`, `medalFor(score)`. `main.js` owns the
run lifecycle: `ready` starts frozen; first flap starts physics; score-on-pass check in
the update loop.

## 7. Edge cases

1. `ready` state: physics frozen, snake bobs at safe y (never inside a spawn line);
   first flap both starts the run and applies the flap.
2. Backgrounded → pause via shared loop; resume continues the exact fall state.
3. Flap during `gameover` → ignored; retry is a deliberate button (prevents skip-death).
4. Gap center RNG can't place a gap within margins (assert in spawner tests).
5. Score increments once per pair even if the snake weaves back (x only moves forward —
   snake x is fixed; world moves — so structurally impossible, test asserts it).
6. Storage disabled → no best/medal, playable.
7. Tab-titling: document.title swap on death is P3 fluff — skip.

## 8. Testing plan (core.js)

- Flap arc: from gap center y, a single flap clears the smallest gap (120 px) without
  a second flap when centered; two flaps suffice from gap edges (assert math).
- Spawner sweep: 1,000 gaps across scores 0–80 → all margins ≥ 80 px + gap/2; gap ≥ 120.
- `circleRectHit`: corner cases (corner clamp), 1 px inside/outside inset behavior.
- `tiltFor`: endpoints (−25° at min vy, +80° at terminal), monotonic.
- `medalFor`: 9/10/19/20/39/40/74/75 boundaries.

## 9. Task breakdown

### P0 — playable core

- [x] `core.js` physics + spawner + circle-rect collision + score-once (+ tests §8)
- [x] World rendering: pipes, ground, snake body with tilt + trailing segments
- [x] menu/ready/playing/gameover states; ceiling grace; death flash/shake; instant retry
- [x] Best score persistence; pause via `visibilitychange`

### P1 — full rules & feel

- [x] Gap shrink ramp; medals on gameover card; score pop animation
- [x] WebAudio flap/score/hit + mute; menu bobbing animation

### P2 — persistence/share/QA

- [x] Share (`Flew through {n} gaps — beat that!`); `?debug=1` hitboxes
- [x] QA gate (master README §5): fps check, offline, isolation greps
      (browser smoke test at 420×860 covered every state + persistence; a human
      10-minute session is still owed before calling it player-proof)

### P3 — polish

- [ ] Moving pipes (gentle bob) after score 50; night palette every 25 points;
      ghost of best run flying alongside _(deferred)_

## 10. Acceptance criteria

- §8 tests green; 1,000-gap sweep proof stored in the test file.
- Deterministic physics across 60/144 Hz (sim log comparison).
- First flap from `ready` never spawns the snake into a pipe.
- Restart ≤ 1 tap, < 300 ms to playable; 60 fps mid-range phone.

## 11. Deferred coupling (intentionally NOT built)

Footer/nav links, analytics events, achievements, leaderboards — per master README §7.
