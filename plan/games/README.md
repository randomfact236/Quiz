# plan/games — the empty-board family (owner decision 2026-09-28)

> **Owner decision 2026-09-28:** the games family pivoted to **empty-board games** —
> nothing pre-filled, every element on the board placed by a player's own decision
> (the tic-tac-toe model). The seven pre-filled/pattern games were archived to
> `_archive/games/` (kept in the repo, **not served**) — their per-game plans moved
> to `_archive/games/plans/`.

## 1. The standard template (every game in this family follows it)

- **Solo vs Computer** — three AI tiers:
  - **Easy** — plays loosely, makes mistakes; beginners always win some
  - **Medium** — blocks and attacks correctly, misses sneaky plays
  - **Hard** — searches ahead, near-perfect; the wall to climb
- **Duel** — online, two phones: create → invite code/link → 3-second poll sync →
  the server validates every move and decides the winner (the tic-tac-toe backend
  pattern: server-authoritative state, no websockets)
- **2 Players** (same-device hot-seat) — kept where it costs nothing
- **No levels, no pre-filled data.** A round is 1–5 minutes; "one more" is the loop.
- Round flow: menu → play → result overlay → instant rematch.
- The AI lives client-side in the game's `core.js`; duels reuse the shared backend.

**The retention loop:** duel a friend → lose → practice against the computer →
rematch. Solo and social feed each other.

## 2. Live today

| Game                    | Slug          | Solo                                  | Hot-seat | Online duel                                  |
| ----------------------- | ------------- | ------------------------------------- | -------- | -------------------------------------------- |
| Tic Tac Toe (prototype) | `tic-tac-toe` | easy/medium/hard AI (+ misère toggle) | ✅       | ✅ (`/tictactoe` backend, `?ttt=CODE` links) |

## 3. Roadmap (owner-approved direction, build in order)

1. **Connect Four** — drop discs, first to connect four; the strongest friend-duel fit
2. **Gomoku** — five-in-a-row on a bigger board; nearly free off the ttt engine
3. **Dots & Boxes**, **Battleship** (players place their own ships — player-created
   data), **Pig dice** (luck keeps beginners competitive) — candidates; owner confirms
   each via the 9-line spec

**The 9-line spec** the owner fills for any new game: Name · One-liner · How to win ·
The board + what a move is · Turn-based? · Solo AI expectations · Duel mode · Rules
toggles · Never-has (e.g. "no levels, no pre-filled data").

## 4. Architecture rules (unchanged from the family's earlier standard)

- Dependency-free static folders under `apps/frontend/public/games/<slug>/`:
  `index.html` + `config.js` + `core.js` (pure model) + `game.js` (UI shell) +
  `storage.js` + `style.css`; plain ESM, no build step; `?v=N` cache-busting on edit.
- Theme follows the site's `ai-quiz-theme` via `/shared/theme.js`.
- Network (per AGENTS.md, owner-approved): POSTs only to `/api/v1/share-counts`,
  `/comments` (via `/shared/pig-feedback.js`), and `/api/v1/game-challenges` +
  `/tictactoe` (via `/shared/game-challenge.js` and the duel flow) — games-CSP-gated
  and rate-limited. No other outbound calls.
- Registry: `apps/frontend/src/lib/games-registry.ts` feeds the hub, sitemap and OG
  images — one source of truth.
