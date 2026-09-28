# 29 — SOS (empty-board family)

> **Status:** PLANNED — batch XS. Template: [README.md](README.md) §1.
> The paper-and-pencil classic: every letter is player-placed, and the sneaky part is
> you may complete an SOS for EITHER player — so filling a cell is rarely free.

## 1. Nine-line spec

1. **Name:** SOS
2. **One-liner:** place S or O letters to form SOS sequences — each one you complete scores a point AND a free extra move
3. **How to win:** higher score when the grid is full
4. **The board:** n×n empty grid; a move = write one letter (S or O) in any empty cell
5. **Turns:** placing a letter that completes one or more SOS sequences = +1 per SOS
   (yours or theirs — both count for you) and you move again; otherwise turn passes
6. **Solo AI:** easy = random letter/cell · medium = completes own SOS, avoids setting
   up yours · hard = alpha-beta with SOS-opportunity counting (strong, not perfect)
7. **Duel:** turn-based live, invite code; server validates placement, detects SOS, grants extra turns
8. **Toggles:** grid 5×5 (default) / 3×3 (blitz) / 7×7 · general (any 8-direction SOS)
   vs simple (rows/cols/diags only) — default general
9. **Never:** no levels, no pre-filled anything

## 2. Rules

- SOS reads as three consecutive cells in a straight line (8 directions in general mode).
- One placement may complete multiple SOS at once (all score).
- Completing an SOS never ends your turn — chain until a non-scoring placement.

## 3. Board model (`core.js`, pure)

- State: `cells: ('S'|'O'|null)[]`, `scores: [n,n]`, `turn`.
- `sosAt(state, idx)` (scan lines through the placed cell) · `applyPlace` (returns extra-
  turn flag) · `isFull(state)`. Line scanning is jest-table-tested per direction.

## 4. Solo AI

| Tier   | Behaviour                                                                        |
| ------ | -------------------------------------------------------------------------------- |
| Easy   | Random letter in a random cell                                                   |
| Medium | Takes available SOS, blocks obvious enemy setups (two-letter pre-SOS)            |
| Hard   | Alpha-beta; eval = score + open SOS opportunities. Heuristic beyond small grids. |

## 5. Online duel (backend)

- ttt-pattern clone (`/sos`): match row holds `cells`, `scores`, `turn`, `status`, guest
  ids, `expiresAt`. Server detects SOS per placement and enforces extra-turn chains.
  3-second poll sync.

## 6. UI / rounds

Grid with chalk-style letters, SOS flash + score pips, extra-turn banner ("SOS! go
again"). Rematch = first move swap. Rounds run 3–6 min.

## 7. Phases + effort

| Phase | Work                            | Effort |
| ----- | ------------------------------- | ------ |
| 1     | core.js (SOS scan) + tests      | ~1.5 h |
| 2     | shell + AI tiers                | ~2 h   |
| 3     | backend module + specs          | ~1.5 h |
| 4     | online mode + registry + polish | ~1.5 h |

## 8. Verification

jest: SOS detection per direction, multi-SOS single placement, extra-turn chaining,
both-colours-count rule; backend specs: placement validation, extra-turn enforcement,
server-counted score; two-phone manual duel.

## 9. Party variants (3P/4P) — see [multiplayer-party.md](multiplayer-party.md) §P3

3P/4P on 7×7 (5×5 with 3): same general-mode rules, score race, extra-turn chains
per player. With more players the "complete THEIR SOS" trap gets sharper — you
score from any line you close. Bots fill empty lobby seats (owner decision
2026-09-28). Effort: +4–5 h (N-player seats, per-player scores, bot ticker).
