# 42 — Ludo (general/family board game)

> **Status:** PLANNED — unblocked 2026-09-29 by the owner's luck-tier decision
> (server-rolled dice, Pig Dice precedent). Batch **L**: a fixed 4-seat race
> with its own engine, not a party-engine adapter. Template: [README.md](README.md) §1.

## 1. Nine-line spec

1. **Name:** Ludo
2. **One-liner:** race all four of your pawns home around the board before the
   others do
3. **How to win:** first player to move all four pawns into their home column
4. **The board:** the standard 15×15 cross — 52 playable squares in four coloured
   arms plus a 3×3 home column each; a move = roll then either advance a pawn
   one square or bring one out of the yard on a 6
5. **Turns:** strict clockwise; rolling a 6 grants an extra turn, and three
   consecutive 6s forfeits the turn
6. **Solo AI:** easy = greedy nearest-home, no blocking · medium = blocking +
   capture preference · hard = evaluate finish order, keep a pawn out of reach
7. **Duel:** 2–4 seats on the server-authoritative backend — the server rolls
   every die (crypto `randomInt`, per the 2026-09-29 luck-tier decision), so no
   player can influence a race they are losing
8. **Toggles:** none in v1
9. **Never:** no levels, no currency, no loot boxes — the board is the content

## 2. Rules

- Four colours (🔴 🔵 🟡 🟢), four pawns each, all in the yard at the start.
- A 6 brings a pawn out of the yard, or advances one square; a non-6 advances
  one square and ends the turn. Three 6s in a row = turn forfeited.
- Landing on an opponent's single pawn **captures** it back to that player's
  yard. Landing on your own pawn is illegal.
- A pawn that reaches the square before its home column is **safe** — nothing can
  capture it there (this is what makes the game winnable).
- A pawn entering its home column only moves forward along it; a 6 in the home
  column lets the player move a pawn already home.
- **Exact roll to finish** (the classic house rule): a 3 does not move a pawn
  3 from home.
- The six safe squares (the coloured start squares) are impassable to others.

## 3. Board model (`core.js`, pure)

- `board: Uint8Array(52)` over the 52 playable squares, indexed by a stable
  per-colour `TRACK` walk so a pawn is `{ colour, index, atHome, inYard }`.
  The cross geometry (which square belongs to which track, where the home
  columns begin) lives in one exported table, not scattered arithmetic — the
  same discipline `core.js` uses for checkers' 32-square map.
- The **dice roll is NOT in core.js.** The model takes the roll as an input, so
  it stays pure and jest-testable; the _source_ of the roll is the caller's
  problem — `crypto.randomInt` on the server, never `Math.random` in a duel.
  This is the same split as Pig Dice.
- Pure functions: `legalMoves(board, seat, roll)` (a die is legal only if it
  produces at least one move — no 6 out of a full yard, no 3 with a pawn 2 from
  home), `applyMove` (with capture + safe-square + crown-to-home), `outcome`.
  A seat that cannot move on a non-6 turn simply passes.

## 4. Solo AI

| Tier   | Behaviour                                                                                                                                            |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Easy   | random legal move; ignores captures entirely                                                                                                         |
| Medium | takes a capture when offered, else advances the pawn nearest home                                                                                    |
| Hard   | scores every legal move (finish progress, capture value, threat of being captured next turn, staying off contested start squares) and picks the best |

Hard is a 1-ply scorer, not a search: the branching is high (4 pawns × 6 rolls ×
captures) and a race is decided by tempo, not by depth.

## 5. Online duel (backend)

- Its own module (not the party engine): the race state is a fixed 4-seat
  board with a single shared die, and the turn order is structural.
- The server owns the die and the whole turn: `POST /ludo/:code/roll` returns
  the roll AND the resulting state, so a client cannot roll again, skip a
  capture, or invent a move. A rolled 6 that produces no legal move simply
  ends the turn server-side.
- Seats may be left empty and fill with bots at the same easy/medium/hard tier
  the lobby picks, matching the party rule.

## 6. UI / rounds

Roll button → the die animates → legal moves highlight on the board (a pawn on
a safe square and a capture read differently) → tap a pawn, tap a square.
Captured pawns fly back to the yard. End overlay names the finishing order, not
just the winner — a 2nd and 3rd place is worth showing. Rematch rerolls from
the same seats.

## 7. Phases + effort

| Phase | Work                                                                    | Effort |
| ----- | ----------------------------------------------------------------------- | ------ |
| 1     | `core.js` cross geometry, tracks, capture/safe/exact-roll rules + tests | ~6 h   |
| 2     | shell + the roll animation + AI tiers                                   | ~4 h   |
| 3     | backend module (server owns the die and the turn) + specs               | ~4 h   |
| 4     | online mode + registry + polish                                         | ~2 h   |

## 8. Verification

jest: the cross geometry (every square's track, home-column entry, safe squares),
capture and the yard return, the three-6s rule, the exact-roll house rule, and
that a die with no legal move passes the turn. Backend specs: the server
rejects a second roll in one turn, rejects a move the roll does not license,
and never lets a client choose its own die. Live: a two-seat duel played to a
finish, plus a browser play-through of a solo game.
