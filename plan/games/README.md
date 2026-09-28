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

| Game                    | Slug                  | Solo                                      | Hot-seat | Online duel                                            |
| ----------------------- | --------------------- | ----------------------------------------- | -------- | ------------------------------------------------------ |
| Tic Tac Toe (prototype) | `tic-tac-toe`         | easy/medium/hard AI (+ misère toggle)     | ✅       | ✅ (`/tictactoe` backend, `?ttt=CODE` links)           |
| Connect Four            | `connect-four`        | easy/medium/hard AI                       | ✅       | ✅ (`/connectfour` backend, `?c4=CODE` links)          |
| Gomoku                  | `gomoku`              | easy/medium/hard AI (15×15 or 11×11)      | ✅       | ✅ (`/gomoku` backend, `?g5=CODE` links)               |
| Dots and Boxes          | `dots-and-boxes`      | easy/medium/hard AI (3×3 / 4×4 / 5×5)     | ✅       | ✅ (`/dots-and-boxes` backend, `?dbb=CODE` links)      |
| Battleship              | `battleship`          | easy/medium/hard AI (you place the fleet) | ✅       | ✅ (`/battleship` backend, `?bs=CODE` links)           |
| Rock Paper Scissors     | `rock-paper-scissors` | easy/medium/hard AI (best of 5)           | ✅       | ✅ (`/rock-paper-scissors` backend, `?rps=CODE` links) |
| Pig Dice                | `pig-dice`            | easy/medium/hard AI (the server rolls)    | ✅       | ✅ (`/pig-dice` backend, `?pd=CODE` links)             |

## 3. Roadmap — build order (owner reorder 2026-09-28: famous/common games first)

**Built games are untouched:** Tic Tac Toe, Connect Four, Gomoku, Dots & Boxes,
Battleship and Pig Dice keep their current hub order in `games-registry.ts`.
The queue below reorders the UNBUILT confirmed games so the famous/common names
get built first (owner ask 2026-09-28). Flagged: Rock Paper Scissors has a hub
registry entry but no `public/games/rock-paper-scissors/` folder yet — verify
before promoting it anywhere.

| Order | Game               | Plan                                                     | Batch | Why it is here now                           |
| ----- | ------------------ | -------------------------------------------------------- | ----- | -------------------------------------------- |
| 1     | Checkers           | [06-checkers.md](06-checkers.md)                         | S     | the most famous buildable board classic      |
| 2     | Othello            | [12-othello.md](12-othello.md)                           | M     | world-known flip classic                     |
| 3     | Mastermind         | [34-mastermind.md](34-mastermind.md)                     | S     | household code-breaker; friend sets the code |
| 4     | Ultimate TTT       | [08-ultimate-tic-tac-toe.md](08-ultimate-tic-tac-toe.md) | S     | modern classic on the ttt shape              |
| 5     | Mancala (Kalah)    | [14-mancala-kalah.md](14-mancala-kalah.md)               | S     | sowing classic known worldwide               |
| 6     | Bulls & Cows       | [36-bulls-and-cows.md](36-bulls-and-cows.md)             | XS    | the digit form is a household game           |
| 7     | Quoridor           | [16-quoridor.md](16-quoridor.md)                         | M     | strong brand in modern abstracts             |
| 8     | Hive               | [17-hive.md](17-hive.md)                                 | M     | acclaimed modern abstract                    |
| 9     | Santorini          | [19-santorini.md](19-santorini.md)                       | M     | acclaimed modern abstract                    |
| 10    | Quarto             | [15-quarto.md](15-quarto.md)                             | M     | award-winning classic                        |
| 11    | Connect6           | [24-connect6.md](24-connect6.md)                         | S     | familiar six-in-row shape                    |
| 12    | Pente              | [23-pente.md](23-pente.md)                               | S     | gomoku's famous cousin                       |
| 13    | Pentago            | [22-pentago.md](22-pentago.md)                           | S     | connect-four with a twist                    |
| 14    | Notakto            | [37-notakto.md](37-notakto.md)                           | XS    | misère ttt, near-zero rules                  |
| 15    | Nim                | [09-nim.md](09-nim.md)                                   | XS    | ancient stick classic                        |
| 16    | Chomp              | [10-chomp.md](10-chomp.md)                               | XS    | paper classic                                |
| 17    | SOS                | [29-sos.md](29-sos.md)                                   | XS    | school-paper famous                          |
| 18    | Three Men's Morris | [33-three-mens-morris.md](33-three-mens-morris.md)       | XS    | ancient familiar shape                       |
| 19    | Domineering        | [28-domineering.md](28-domineering.md)                   | XS    | one-rule duel                                |
| 20    | Sim                | [30-sim.md](30-sim.md)                                   | XS    | paper triangle duel                          |
| 21    | Breakthrough       | [25-breakthrough.md](25-breakthrough.md)                 | S     | clean pawn race                              |
| 22    | Ataxx              | [27-ataxx.md](27-ataxx.md)                               | S     | infection race                               |
| 23    | Blokus Duo         | [20-blokus-duo.md](20-blokus-duo.md)                     | M     | famous brand, 2P edition                     |
| 24    | Abalone            | [21-abalone.md](21-abalone.md)                           | M     | known modern abstract                        |
| 25    | Lines of Action    | [26-lines-of-action.md](26-lines-of-action.md)           | M     | connoisseur abstract                         |
| 26    | Sprouts            | [31-sprouts.md](31-sprouts.md)                           | S     | pencil-game curiosity                        |
| 27    | Paper Soccer       | [32-paper-soccer.md](32-paper-soccer.md)                 | S     | regional paper classic                       |
| 28    | Go 9x9             | [39-go-9x9.md](39-go-9x9.md)                             | L     | deep boss — after the M waves                |
| 29    | Chess              | [40-chess.md](40-chess.md)                               | L     | the final boss — always last                 |

**The 9-line spec** the owner fills for any new game: Name — One-liner — How to win —
The board + what a move is — Turn-based? — Solo AI expectations — Duel mode — Rules
toggles — Never-has (e.g. "no levels, no pre-filled data").

**Decision-required — deliberately NO plans yet** (owner call pending, see
`50-game-ideas.md` review): #18 Onitama (random opening deal of fixed move-cards),
#35 Hangman Duel (solo needs a word list), #38 Word Duel (needs a dictionary),
#41-50 luck tier (dice/deck RNG approval pending; Pig Dice's server-roll already
sets the precedent). Each gets a plan the day the owner decides.

## 3b. Multiplayer party (3P/4P) — owner decision 2026-09-28

Party play is approved: 3–4 seats per table, **empty seats filled by bots** (same
easy/medium/hard tiers; host picks one lobby tier), abandoned humans convert to bots
so tables always finish. Roster + seat rules: [multiplayer-party.md](multiplayer-party.md).
Shared N-player engine plan (one `party_matches` table + per-game adapters, not more
clones): [multiplayer-party-plan.md](multiplayer-party-plan.md). Now-scope: Dots &
Boxes, Ultimate TTT, SOS, Notakto, Pig Dice (P1–P5); dice/card tables join after the
RNG decision; Ludo stays its own L build.

## 3c. Native three-player games — owner decision 2026-09-28

A dedicated 3-player set (T1–T10), separate numbering — not ports of the 2-player
queue. Seat rule: 3 seats, humans join by code, **empty seats default to bots**
(one lobby-wide tier), abandoned humans convert to bots, placement 1st/2nd/3rd
recorded. All ten designs are RNG-free (no dice/decks) — nothing waits on the
luck-tier decision. Roster + sketches: [three-player-games.md](three-player-games.md).
Engine + Wave 1 plan (TP1: shared `tp_matches` table, adapters for T1/T2/T8/T9/T3/T4):
[three-player-plan.md](three-player-plan.md). If the MP1 party engine lands first,
TP games ride the same registry.

## 3d. Expansion lists — 50 in 3P and 4P (owner decision 2026-09-28)

The base sets (T1–T10 native 3P, F1–F10 party 4P) stay the build-now scope. Expansion
lists take both to 50 rows each on the same engines (adapters only, no new plumbing):
[three-player-50.md](three-player-50.md) (T1–T50) and [four-player-50.md](four-player-50.md)
(F1–F50). **Owner reorder 2026-09-28:** the **Build** column in each list is the
fame-first build sequence — common games before less common; IDs (T#/F#) are stable and
never renumber. Tags: [native] / [variant] / [original] / [RNG] / [RNG·pre] (Pig-precedent
RNG builds now). RNG rows build only after the luck-tier decision. Team rows (F40/F41)
need the 2v2 seat layer in MP1 first. Expansion plans:
[three-player-50-plan.md](three-player-50-plan.md) (TP2, waves A–D on the TP1 engine) and
[four-player-50-plan.md](four-player-50-plan.md) (MP2, waves A–D on the MP1 engine, with
the team-seat layer and the server-held deck view as flagged prerequisites).

## 3b. Play-path smoke (run after game changes)

```bash
cd apps/frontend && node scripts/games-smoke.mjs
```

Loads every live game in a real browser, enters play, makes real moves, and fails
on any JS error or a game that will not accept input. The unit specs and API tests
cover the RULES; this covers the PLAY path — four real bugs shipped past both
(battleship hot-seat loop + attribution, dots-and-boxes null read, pig-dice AI
hang, rps hot-seat gate). Run it before calling a game done.

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

## 5. Hub rules: play-preview + player-count tabs (owner asks 2026-09-28 — every AI writing game code)

**Player-count tabs (owner rule 2026-09-28):** the hub opens with three VISIBLE tabs —
**2 Players / 3 Players / 4 Players** — rendered by
`apps/apps/frontend/src/components/games/GamesBrowser.tsx. Numbers sit outside the tabs
(no dropdown, nothing hidden): one tap selects the group. Every game in
`games-registry.ts`MUST declare`players: number[]`(its supported seat counts); it
appears in every matching tab, and each card carries a player-count badge. Games that
support both 3 and 4 seats appear in BOTH tabs. Adding a game without its`players`
annotation and preview case is an incomplete build.

Every game card on the `/games` hub MUST show a **play-preview**: a small static
snapshot of how the game looks mid-play, rendered as an inline SVG by
`apps/frontend/src/components/games/GamePlayPreview.tsx`, with the **game name
written directly below the preview**, then the blurb. The hub card layout is
vertical: preview tile → title → blurb (share button floats top-right).

- Adding a game to `games-registry.ts` is INCOMPLETE without a matching preview
  case (`switch (slug)`) in `GamePlayPreview.tsx` — treat it as part of the
  game's definition of done, alongside the registry entry.
- Previews are server-safe inline SVG (no client JS, no new deps, no images),
  aria-hidden decoration; unknown slugs fall back to a neutral placeholder.
- This rule is mirrored in the repo-root `AGENTS.md` §2D Games. Do not remove
  or bypass it without an explicit owner instruction.
