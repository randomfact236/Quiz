# Game 07 — Spirit Runner (Complete Plan)

> Complete plan (supersedes the 2026-09-09 sample). Status: **built 2026-09-11** —
> Phases A–D complete in `apps/frontend/public/games/spirit-runner/` (`engine.js`
> forked from Game 05 with slide + swipe grammar, `gates.js`, `core.js`, `render.js`,
> `main.js`); §8 jest suite (`src/__tests__/games-spirit-runner.test.ts`) and the
> folder's `core.test.html` harness green. Outstanding: balance pass (§9 Phase D)
> and the 10-minute manual session (master README §5); P3 deferred below.

## 1. Overview

Mystical-forest endless runner with light puzzle choices: run, dodge, collect spirit
orbs for powers, and at path splits pick the right **rune gate** — wrong pick banishes
you to the riskier, richer **shadow realm**. Depth from choices, not controls (one thumb).

## 2. Complete game spec

### Phase A — core run (fork of Game 05)

- Jump (as 05: coyote/buffer/cut) **plus slide**: swipe down / ↓ / S — 600 ms, hitbox
  drops to 40 % height; slide-jump cancels into a hop.
- Obstacles:

| Type                   | Clearance  | Look (procedural)                                                         | Introduced |
| ---------------------- | ---------- | ------------------------------------------------------------------------- | ---------- |
| Fallen log             | jump       | brown rounded rect                                                        | 0 m        |
| Low branch             | slide      | green bar at head height                                                  | 300 m      |
| Spirit guardian (tall) | jump only  | glowing wisp column                                                       | 800 m      |
| Spirit guardian (low)  | slide only | hovering wisp disc                                                        | 800 m      |
| Rune trap              | time it    | floor spikes pulsing: 1.2 s cycle — 0.7 s dark (safe), 0.5 s lit (lethal) | 1200 m     |

- Speed ramp as 05 (320→900 px/s). **Hearts: 2**; hit = −1 heart + 1.2 s invulnerability
  (blink); 0 → game over (deliberately softer than 05 — longer-form run).
- Palette shifts by depth tier (dawn → dusk → night forest).

### Phase B — orbs & powers

- Orbs spawn in arcs/lines riding the spawner (arc of 5–7 over a jump, line of 4 on flat).
  Meter: 10 orbs → full. Power = next in a **fixed cycle** (readable): Double jump →
  Dash → Slow time (durations in the table below).

| Power       | Duration | Effect                                                     |
| ----------- | -------- | ---------------------------------------------------------- |
| Double jump | 8 s      | second mid-air jump                                        |
| Dash        | 1.5 s    | invulnerable, destroys the next obstacle hit (exactly one) |
| Slow time   | 4 s      | world ×0.6 (audio pitch drops too)                         |

- Power button (bottom-right, thumb reach) lights when meter full; keyboard E; optional
  auto-trigger setting.

### Phase C — rune gates & shadow realm (the twist)

- Every **600 m ± 100** the path splits into two gates; a hint banner shows 2 s before.
  `gates.js` (pure) defines **5 rules**:

| Rule        | Hint text                          | Correct gate                                  |
| ----------- | ---------------------------------- | --------------------------------------------- |
| Parity      | "Even spirits walk the left path." | side matching `orbsSinceLastGate % 2`         |
| Shape echo  | "Follow the doubled symbol."       | gate whose rune == the previous gate's rune   |
| Negation    | "The moon door lies."              | NOT the gate matching the banner's shape hint |
| Sequence    | "▲ ▲ ▲ …"                          | gate continuing the shown 3-symbol pattern    |
| Color trail | "Trust the last light you caught." | side matching last orb's color                |

- API: `makeGate(ruleId, rng, runState) → { correctSide, hintText, runes }`;
  `resolveChoice(gate, side) → 'correct' | 'shadow'`. Rules cycle in order per run
  (learnable), order shuffles per run via seed.
- **Correct** → +100 points, continue forest. **Wrong** → **shadow realm**: 45 s,
  darker palette, obstacle density ×1.5, orbs worth ×2, guaranteed **+1 spirit shard**
  on survival; timer HUD countdown; auto-returns to forest (no soft-lock).

### Phase D — characters & meta

- **Spirit shards:** `floor(meters/1000) + shadowSurvives + floor(correctGates/3)` per run.
- **Characters** (pick on menu; modifiers):

| Character     | Unlock    | Modifier                                |
| ------------- | --------- | --------------------------------------- |
| Forest Spirit | start     | power durations +50 %                   |
| Hunter        | 5 shards  | every run starts with Dash charged      |
| Monk          | 12 shards | Slow time also ×0.7 obstacle spawn rate |

- Save persists shards + unlocks forever (best scores separate).

## 3. Screens & UI

| State      | Elements                                                                                |
| ---------- | --------------------------------------------------------------------------------------- |
| `menu`     | Title, character cards (locked show shard cost), best distance/shards, ▶ Run, mute      |
| `playing`  | World + HUD: hearts, orbs → power meter + button, distance, depth tier                  |
| `gate`     | In-world split + hint banner (run continues — no separate screen)                       |
| `shadow`   | Palette swap + "SHADOW REALM" banner + shard countdown                                  |
| `paused`   | Overlay (auto on `visibilitychange`)                                                    |
| `gameover` | Distance, orbs, gates correct, shards earned, unlocks, [↻ Retry] [Character] [📤 Share] |

Virtual viewport 900×500 like 05; `?debug=1` draws hitboxes + gate rule id (dev aid).

## 4. Controls

- Jump: tap / Space / ↑ (double jump while empowered). Slide: swipe down / ↓ / S.
- Power: button (bottom-right) / E; auto-trigger accessibility setting.
- Swipe-up = jump, swipe-down = slide (pointer gesture thresholds: 30 px, 120 ms).
- **Gate choice (built 2026-09-11, plan left it open):** while a split is live the
  outer thirds of the screen are the doors — tap the left third for the left door,
  right third for the right (← / → on keyboard); the middle third keeps jumping and
  slides still work. While the doors are on the track the spawner holds and the
  spawn cursor jumps past them, so no obstacle ever overlaps the choice window; a
  split answered by nothing (the doors pass the runner) resolves as `shadow` — the
  realm takes you, never a soft-lock (§7.7).

## 5. Data model (localStorage)

```
game:spirit-runner:save → {
  bestDistanceM: 2340, shards: 17, unlocked: ['spirit'],
  character: 'spirit', settings: { autoPower: false, muted: false }
}
```

## 6. File structure & function inventory

```
spirit-runner/
  index.html
  style.css
  engine.js   # forked from 05: loop, camera, parallax, input (jump+slide+swipes)
  core.js     # pure: obstacles, orbs, powers, gates resolution, shards — test surface
  gates.js    # pure: the 5 rune rules + hint text
  render.js   # palettes (forest/shadow), glow (lighter composite), particles, HUD
  main.js     # state machine + meta (characters, unlocks)
```

`gates.js`: `RULES` array, `makeGate(ruleId, rng, runState)`, `resolveChoice(gate, side)`,
`hintFor(ruleId, runState)`. `core.js`: `stepPlayer` (jump/slide states), spawner
extensions (`spawnOrbArc`, `spawnTrap`, `spawnGuardian`), `applyPower(run, kind)`,
`tickPowers(run, dt)` (timers incl. character modifiers), `shardsFor(run)`.

## 7. Edge cases

1. Gate while a power is active → power timers keep running through the split.
2. Wrong-gate during invulnerability → shadow realm still triggers (it's not damage).
3. Dash inside shadow realm destroys one obstacle only, as in forest.
4. Slow time stacks with Monk modifier → world ×0.6, spawn ×0.7 (multiplicative, capped
   once each — no double application).
5. Shadow realm timer always expires exactly (fixed-step accumulation; pause-safe);
   pays shards exactly once.
6. Unlocks persist across character switching; switching mid-menu only (never mid-run).
7. Rule sequence: 5 rules cycle; run seed shuffles the order; no rule repeats within a
   cycle; gates ≥ 600 m apart never overlap the shadow realm window (spawner defers).
8. Storage disabled → unlocks lost per session, playable.

## 8. Testing plan (gates.js + core.js)

- All 5 rules: `makeGate` + `resolveChoice` → correct side deterministic given a fixed
  `runState` (table tests per rule, 20 rng seeds each).
- Hint text present and never empty for any rule/state.
- Shard math: boundaries at 999/1000 m, 1/2/3 correct gates, shadow survive.
- Power timers: durations incl. Forest Spirit ×1.5; Dash single-destroy assertion.
- Shadow realm: density multiplier applied; timer expiry; single shard payout.
- Spawner: gate deferral rule (§7.7) over 1,000 simulated runs.

## 9. Task breakdown

### Phase A — core run (≈2 days)

- [x] Fork engine from 05; slide + low-branch/log/guardian/trap obstacles; trap pulse cycle
- [x] 2 hearts + invulnerability; depth palettes; pause/blur; menu/gameover; best distance

### Phase B — orbs & powers (≈1.5 days)

- [x] Orb arcs in spawner; power meter + cycle; DJ/Dash/Slow implementations
- [x] Power button + auto-trigger setting; WebAudio (collect/power/hit) + mute

### Phase C — rune gates & shadow realm (≈2 days)

- [x] `gates.js` 5 rules + hints (+ tests); split-path rendering; resolution flow
- [x] Shadow realm: palette, density ×1.5, ×2 orbs, shard payout, timed return, banner

### Phase D — characters & meta (≈1.5 days)

- [x] Shard earning; unlock thresholds; 3 character modifiers; picker UI
- [ ] Balance pass: median first-run 30–45 s, each gate rule learnable ≤ 3 exposures
      (analytically tuned — obstacle intro at 0/300/800/1200 m, splits 600±100 m,
      hearts 2 — but no human playtest yet)
- [x] Share (`Ran {m} m as {character}… {pts}`); QA gate (master README §5) — automated
      parts done (§8 suites green, offline static, isolation greps clean); the 10-minute
      manual phone-width session remains for the owner

### P3 — polish

- [ ] Sprite/hand-drawn art slot (post-MVP); music track; daily depth seed; extra rules
- [ ] Achievements/leaderboards: only if isolation decision is reversed (master §7)

## 10. Acceptance criteria

- Each phase ships playable alone (A = good runner; A+B = powered; +C = full twist; D = meta).
- §8 tests green — all gate rules proven deterministic per state.
- Shadow realm never soft-locks; pays exactly once; always exits.
- 60 fps mid-range phone with particles + glow on; pause never desyncs timers.
- One-thumb: jump, slide, power reachable at 360 px width.

## 11. Deferred coupling (intentionally NOT built)

Footer/nav links, analytics events, platform achievements integration, leaderboards —
per master README §7 (revisit only if the owner reverses isolation).

## 12. Rev 2 architecture upgrade (2026-09-11) — reference: `03-sliding-puzzle.md`

> Owner-approved architecture reference for all games (Sliding Puzzle Rev 2), applied
> per this game's nature: spirit runner already has seeded, choice-rich runs (the run
> seed shuffles gate-rule order), so async "same seed" challenges compare runs fairly;
> the upgrade is persistence hygiene + config extraction. Isolation contract unchanged.

### Target additions

```
spirit-runner/
  index.html
  style.css
  engine.js     # unchanged
  core.js       # unchanged (obstacles, orbs, powers, shards — test surface)
  gates.js      # unchanged (5 rune rules)
  render.js     # unchanged
  main.js       # unchanged
  config.js     # tuning constants (power durations, spawn densities), flags + per-locale
                # strings (share template, gate hint copy), host-overridable
  storage.js    # guarded facade: versioned `game:spirit-runner:save` (shards, unlocks,
                # character, settings) + migrations + remote adapter slot
```

### Why versioning matters here

This is the composite save most likely to need a migration later (shards, unlocks,
character, settings in one document) — version it **before** players accumulate shards,
and migrate on read.

### config.js

The §2 tuning tables (power durations, densities, shard formula) remain the spec of
record; `config.js` is where the shipped values live so balancing passes (§9 Phase D)
are data edits. Per-locale strings for gate hints, share template, character copy. Host
override `window.__SPIRIT_RUNNER_CONFIG__` → `?locale=` → defaults. `prefs` may override
copy but is a cache, not the source of truth.

### Multiplayer (per this game's nature)

- **Async seeded run — the natural fit:** share the run seed → identical gate-rule order
  and spawner stream; compare distance/shards. Gate choices stay the human skill, so the
  comparison is fair without a server.
- **Hot-seat:** alternate runs on one device, compare shards/distance — trivial.
- **Live co-op/race (incl. shadow realm):** **gated** — backend + server timing + §7
  reversal. Not planned.

### Phases

- [ ] R2-1 Hygiene: `config.js` (move shipped tuning values; §2 tables stay
      authoritative) + versioned `storage.js` (migration for the composite save).
- [ ] R2-2 Async seeded-run challenge (`?seed=` + share template carrying it).
- [ ] R2-3 Still owed from §9 Phase D: the balance pass and the owner's 10-minute
      manual session — unchanged by Rev 2.
