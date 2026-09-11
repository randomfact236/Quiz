# Game 02 — Tic Tac Toe (Complete Plan)

> Complete plan (supersedes the 2026-09-09 sample). Status: **built** — P0–P2 complete
> plus misère from P3; X/O theme picker skipped. `apps/frontend/public/games/tic-tac-toe/`
> (`index.html`, `style.css`, ESM `game.js`, `game.test.html`); jest twin at
> `src/__tests__/games-tic-tac-toe.test.ts` incl. the exhaustive minimax sweep.
> Constants below are the spec of record; §9–§11 list the only remaining work.

## 1. Overview

Classic tic tac toe: two players on one device, or single player vs. the computer at
three AI levels. Hook is the running series score ("first to 5?") and a provably
unbeatable Hard AI.

## 2. Complete game spec

- 3×3 board; **X moves first in round 1**; alternate marks each round; the **loser of a
  round starts the next**; after a draw, the alternating starter flips.
- Win = 3 in a row (8 lines: 3 rows, 3 cols, 2 diagonals). Draw = full board, no win.
- **Modes:** `2P local` (pass-and-play) · `1P` vs computer with levels:
  - **Easy** — uniformly random legal move.
  - **Medium** — win/block heuristic:
    1. take a winning move if one exists
    2. block an opponent win
    3. otherwise random legal move
  - **Hard** — full minimax (unbeatable); ties broken by first-found move in scan order
    (deterministic for tests).
- **Misère variant** (toggle): completing 3-in-a-row **loses**. Win detection is the same
  `checkWinner`; the _interpretation_ flips (winner of a line loses the round). Draw rules
  unchanged.
- Illegal input impossible: occupied cell, finished round, or out-of-turn tap are no-ops;
  input locked during AI "thinking" tick (~300 ms artificial delay for feel).

## 3. Series model

Series = per-mode running tally. Persisted per `(mode, level)` key; Reset zeroes the
current series only.

## 4. Screens & UI

| State      | Elements                                                                           |
| ---------- | ---------------------------------------------------------------------------------- |
| `menu`     | Mode pick (1P/2P), level pick (1P), misère toggle, series scoreboard, ▶ Play       |
| `playing`  | Board grid, turn indicator (mark + color), series mini-score, ⌂ Menu               |
| `roundEnd` | Overlay: "X wins! 🎉" / "O wins!" / "Draw 🤝" (misère wording flips), winning line |
|            | highlighted through the 3 marks, [Next round] [Menu]                               |

Board = CSS grid; marks render as inline SVG strokes with draw-in animation. Winning line
gets a distinct highlight class. Fits 360 px viewport with no scroll.

## 5. Data model (localStorage)

```
game:tic-tac-toe:series:<modeKey>  → { x: 3, o: 2, d: 1 }   # modeKey = '2p' | '1p-easy' | '1p-medium' | '1p-hard'
game:tic-tac-toe:prefs             → { mode, level, misere, muted }
game:tic-tac-toe:best              → n/a (no score; share uses the series line)
```

## 6. File structure & function inventory

```
tic-tac-toe/
  index.html       # menu / playing / roundEnd sections
  style.css        # grid, marks, win highlight, overlays
  game.js          # ESM: pure logic exported + DOM wiring
  game.test.html   # browser twin of the jest suite
```

Pure exported logic: `newBoard()`, `applyMove(board, i, mark)`, `checkWinner(board) →
{ winner, line } | 'draw' | null`, `legalMoves(board)`, `minimaxScore(board, mark)`,
`bestMove(board, mark)` (hard), `mediumMove(board, mark)`, `easyMove(board, mark, rng)`,
`resolveMisere(result)`. DOM layer: screens, `renderBoard/renderCell`,
`highlightWin(line)`, `isAiTurnNow()`, series storage, share.

## 7. Edge cases

1. occupied / finished / out-of-turn taps = no-ops; double-tap debounce 50 ms.
2. AI never acts during `roundEnd`; Next-round resets board but not series.
3. Misère + AI: Hard minimax optimizes the _misère_ objective (inverted leaf scores) —
   covered by the exhaustive test at this variant too.
4. Storage disabled → defaults, no persistence, no crash.
5. Series key changes when mode/level changes (no cross-mode pollution).
6. Draw starter alternation persists only within a session (not in storage) — stated.

## 8. Testing plan (jest twin + game.test.html)

- `checkWinner`: all 8 lines, draw, empty, mid-game null.
- Hard AI: exhaustive sweep — never loses from any reachable position (both normal and
  misère objectives).
- Medium: always takes an available win; always blocks an immediate threat.
- Series persistence round-trip; mode-key isolation.
- Misère interpretation flips round outcome without changing `checkWinner`.

## 9. Task breakdown

### P0/P1/P2 — DONE (2026-09-09/10 build pass)

- [x] 2P local, win/draw detection, win-line highlight, round flow, series scoreboard
- [x] 1P Easy/Medium/Hard (minimax), misère variant, SVG marks + animations
- [x] Persistence, tests (incl. exhaustive unbeatable sweep), game.test.html

### P2 — remaining

- [x] **Resolve analytics coupling** — done 2026-09-11 (Rev 2 R2-1): the POST block was
      deleted; the game makes zero network calls (isolation greps clean).
- [x] QA gate (master README §5): offline play + isolation greps clean (2026-09-11).

### P3 — remaining polish

- [x] Misère variant — done
- [x] Board flip animation — done
- [ ] X/O theme picker (skipped by owner decision — keep skipped unless requested)

## 10. Acceptance criteria

- §7 cases verified; §8 tests green in jest and browser twin.
- Hard AI unbeatable in exhaustive sweep (both objectives).
- Series survives reload; Reset works; 360 px fits with no scroll.

## 11. Deferred coupling (intentionally NOT built)

Online multiplayer (needs backend rooms), footer/nav links, Play Hub card, achievements —
per master README §7. Existing analytics POST block is the one live violation; flagged
above, not silently removed.

## 12. Rev 2 architecture upgrade (2026-09-11) — reference: `03-sliding-puzzle.md`

> Owner-approved architecture reference for all games (Sliding Puzzle Rev 2), applied
> per this game's nature: tic tac toe is turn-based, so its multiplayer story is
> "hot-seat is already shipped; async position challenges are a cheap future add; live
> online stays gated." The upgrade is otherwise persistence hygiene + structure.

### Target file layout

```
tic-tac-toe/
  index.html
  style.css
  config.js     # flags + per-locale strings (round-end/series copy, AI think-delay),
                # host-overridable: window.__TIC_TAC_TOE_CONFIG__ → ?locale= → defaults
  storage.js    # guarded facade: versioned save (series tallies + prefs) + migrations,
                # remote adapter slot (host-injected only)
  core.js       # extracted pure logic (board, checkWinner, minimax/medium/easy, misère)
                # — the test surface; jest suite + game.test.html re-pointed here
  game.js       # UI shell: screens, rendering, series wiring
  game.test.html
```

### config.js

Constants currently living in `game.js` (AI think-delay ms, mark order) plus per-locale
strings for round-end and series copy. `prefs` may override copy but is a cache, not the
source of truth.

### storage.js facade

One versioned save document (series tallies + prefs together, `version` field) migrated
from the loose per-modeKey series keys. Remote adapter slot reserved for future account
sync of series — the game never checks auth; **guests keep full local persistence**.
Mid-round resume: N/A (rounds are fast by design).

### Multiplayer (per this game's nature)

- Hot-seat 2P: **already shipped** (pass-and-play + series scoreboard).
- Future/optional: **async position challenge** — share a mid-game position + turn as a
  link ("can you win from here?"); a pure function of the board, no backend.
- Live online rooms: **gated** — backend + §7 reversal (§11). Not planned.

### Phases

- [x] R2-1 Hygiene (2026-09-11): analytics POST block deleted (greps clean); pure logic
      extracted to `core.js`; `config.js` (locale, AI think-delay, share templates,
      host-overridable) and `storage.js` (versioned `save` document migrating the loose
      series/prefs keys, remote adapter slot) introduced; jest suite + `game.test.html`
      re-pointed (23 tests green incl. the exhaustive minimax sweep).
- [x] R2-2 A11y (2026-09-11): already largely present (roving board focus, per-cell
      labels, roundEnd focus on Next); verified — no further changes needed.
- [ ] R2-3 (deferred, optional) async position challenge — only if there's demand.
