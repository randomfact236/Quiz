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

| Game                    | Slug             | Solo                                      | Hot-seat | Online duel                                       |
| ----------------------- | ---------------- | ----------------------------------------- | -------- | ------------------------------------------------- |
| Tic Tac Toe (prototype) | `tic-tac-toe`    | easy/medium/hard AI (+ misère toggle)     | ✅       | ✅ (`/tictactoe` backend, `?ttt=CODE` links)      |
| Connect Four            | `connect-four`   | easy/medium/hard AI                       | ✅       | ✅ (`/connectfour` backend, `?c4=CODE` links)     |
| Gomoku                  | `gomoku`         | easy/medium/hard AI (15×15 or 11×11)      | ✅       | ✅ (`/gomoku` backend, `?g5=CODE` links)          |
| Dots and Boxes          | `dots-and-boxes` | easy/medium/hard AI (3×3 / 4×4 / 5×5)     | ✅       | ✅ (`/dots-and-boxes` backend, `?dbb=CODE` links) |
| Battleship              | `battleship`     | easy/medium/hard AI (you place the fleet) | ✅       | ✅ (`/battleship` backend, `?bs=CODE` links)      |

## 3. Roadmap — planned games (owner-requested plans, 2026-09-28)

Build in this order. Every plan carries the 9-line spec, rules, pure model, AI tiers,
backend reuse of the tictactoe pattern, and its own verification list.

| #   | Game                | Plan                                                     | Why it earns its place                                         |
| --- | ------------------- | -------------------------------------------------------- | -------------------------------------------------------------- |
| 1   | Connect Four        | [01-connect-four.md](01-connect-four.md)                 | Strongest friend-duel fit                                      |
| 2   | Gomoku              | [02-gomoku.md](02-gomoku.md)                             | Cheapest build — ttt engine, bigger board, never draws         |
| 3   | Dots & Boxes        | [03-dots-and-boxes.md](03-dots-and-boxes.md)             | ✅ **BUILT** — the server resolves the extra turn              |
| 4   | Battleship Lite     | [04-battleship.md](04-battleship.md)                     | ✅ **BUILT** — hidden info; the server redacts the enemy fleet |
| 5   | Pig Dice            | [05-pig-dice.md](05-pig-dice.md)                         | Luck keeps beginners competitive in duels                      |
| 6   | Checkers            | [06-checkers.md](06-checkers.md)                         | The "step up" game — biggest build, scheduled last             |
| 7   | Rock Paper Scissors | [07-rock-paper-scissors.md](07-rock-paper-scissors.md)   | 60-second quickfire duel, near-zero rules                      |
| 8   | Ultimate TTT        | [08-ultimate-tic-tac-toe.md](08-ultimate-tic-tac-toe.md) | Your move picks your opponent's board                          |
| 9   | Nim                 | [09-nim.md](09-nim.md)                                   | Solved math = free perfect AI                                  |
| 10  | Chomp               | [10-chomp.md](10-chomp.md)                               | Poisoned-cookie grid; eat the poison and you lose              |
| 11  | Hex                 | [11-hex.md](11-hex.md)                                   | Connect your two sides; never draws                            |
| 12  | Othello             | [12-othello.md](12-othello.md)                           | Friendly first 20 moves, brutal last 5                         |
| 13  | Nine Men's Morris   | [13-nine-mens-morris.md](13-nine-mens-morris.md)         | Form mills, capture pieces; 2,000 years old                    |
| 14  | Mancala (Kalah)     | [14-mancala-kalah.md](14-mancala-kalah.md)               | Extra-turn chains snowball                                     |
| 15  | Quarto              | [15-quarto.md](15-quarto.md)                             | Shared pieces; you hand your opponent their next piece         |
| 16  | Quoridor            | [16-quoridor.md](16-quoridor.md)                         | Race your pawn, throw walls                                    |
| 17  | Hive                | [17-hive.md](17-hive.md)                                 | Pocket bug-chess, no board at all                              |
| 19  | Santorini           | [19-santorini.md](19-santorini.md)                       | Players place their own builders                               |
| 20  | Blokus Duo          | [20-blokus-duo.md](20-blokus-duo.md)                     | Fit your polyominoes; no moves left = you lose                 |
| 21  | Abalone             | [21-abalone.md](21-abalone.md)                           | Push marbles off the hex ring                                  |
| 22  | Pentago             | [22-pentago.md](22-pentago.md)                           | Connect four + spin a quadrant every move                      |
| 23  | Pente               | [23-pente.md](23-pente.md)                               | Gomoku plus jump-captures; draws almost impossible             |
| 24  | Connect6            | [24-connect6.md](24-connect6.md)                         | Six in a row, two stones per turn                              |
| 25  | Breakthrough        | [25-breakthrough.md](25-breakthrough.md)                 | Pawn race to the far row; 5-minute teach                       |
| 26  | Lines of Action     | [26-lines-of-action.md](26-lines-of-action.md)           | Get all your checkers connected                                |
| 27  | Ataxx               | [27-ataxx.md](27-ataxx.md)                               | Clone/jump to infect the whole board                           |
| 28  | Domineering         | [28-domineering.md](28-domineering.md)                   | Vertical vs horizontal dominoes                                |
| 29  | SOS                 | [29-sos.md](29-sos.md)                                   | Your line or theirs counts - and scores                        |
| 30  | Sim                 | [30-sim.md](30-sim.md)                                   | Your triangle = your loss                                      |
| 31  | Sprouts             | [31-sprouts.md](31-sprouts.md)                           | Two rules, surprisingly deep                                   |
| 32  | Paper Soccer        | [32-paper-soccer.md](32-paper-soccer.md)                 | Bounce the ball into the goal                                  |
| 33  | Three Men's Morris  | [33-three-mens-morris.md](33-three-mens-morris.md)       | The 2,000-year-old ttt ancestor                                |
| 34  | Mastermind          | [34-mastermind.md](34-mastermind.md)                     | Duel: friend sets the code; solo: runtime random               |
| 36  | Bulls & Cows        | [36-bulls-and-cows.md](36-bulls-and-cows.md)             | Numeric mastermind with random digits                          |
| 37  | Notakto             | [37-notakto.md](37-notakto.md)                           | Three boards, all X, three in a row LOSES                      |
| 39  | Go 9x9              | [39-go-9x9.md](39-go-9x9.md)                             | The deepest game, duel-sized (batch L)                         |
| 40  | Chess               | [40-chess.md](40-chess.md)                               | The final boss - build last (batch L)                          |

**Batches** (from the 2026-09-28 50-ideas review): XS = 4-6 h, S = 8-12 h,
M = 13-18 h, L = 30 h+. Games 1-7 keep their original estimates in their plans.

**Decision-required - deliberately NO plans yet** (owner call pending, see
`50-game-ideas.md` review): #18 Onitama (random opening deal of fixed move-cards),
#35 Hangman Duel (solo needs a word list), #38 Word Duel (needs a dictionary),
#41-50 luck tier (dice/deck RNG approval pending; Pig Dice's server-roll already
sets the precedent). Each gets a plan the day the owner decides.

**The 9-line spec** the owner fills for any new game: Name · One-liner · How to win ·
The board + what a move is · Turn-based? · Solo AI expectations · Duel mode · Rules
toggles · Never-has (e.g. "no levels, no pre-filled data").

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
[three-player-50.md](three-player-50.md) (T1–T50: 40 RNG-free + 10 RNG-gated) and
[four-player-50.md](four-player-50.md) (F1–F50: 34 RNG-free + 16 RNG-gated). Tags mark
each row [native] / [variant] / [original] / [RNG]; the RNG rows activate only with the
luck-tier decision. Team rows (F40/F41) need a 2v2 seat layer flagged in MP1 first.
Expansion plans: [three-player-50-plan.md](three-player-50-plan.md) (TP2, waves A–D on
the TP1 engine) and [four-player-50-plan.md](four-player-50-plan.md) (MP2, waves A–D on
the MP1 engine, with the team-seat layer for F40/F41 and the server-held deck view as
flagged prerequisites).

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
