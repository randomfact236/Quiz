# 15 — Quarto (empty-board family)

> **Status:** PLANNED — batch M. Template: [README.md](README.md) §1.
> The most generous empty-board game there is: pieces are SHARED, you never even own
> your own men — your opponent hands you the piece you must place. No pre-filled
> anything; the 16 pieces are rules constants (4 binary attributes).

## 1. Nine-line spec

1. **Name:** Quarto
2. **One-liner:** place the piece your opponent gives you — line up four sharing any one attribute
3. **How to win:** create a row/col/diagonal of 4 pieces sharing height, colour, shape OR hole
4. **The board:** 4×4; 16 unique pieces (each = tall/short × dark/light × round/square ×
   solid/hollow); a move = place the piece you were handed on any empty cell
5. **Turns:** place the given piece → hand any remaining piece to the opponent; calling
   "quarto" declares the win
6. **Solo AI:** easy = random placement/handover · medium = avoids handing winning
   pieces, spots 3/4 lines · hard = alpha-beta over piece-hand state (strong club play)
7. **Duel:** turn-based live, invite code; server validates handover/place pairs and resolves quarto
8. **Toggles:** none in v1 (the 16-piece set is the game)
9. **Never:** no levels, no pre-filled anything

## 2. Rules

- A player never chooses which piece to place — only where.
- Forgetting to call quarto: the opponent may win on their next placement (live-let-live
  handled server-side: server declares instantly, no calls to forget).

## 3. Board model (`core.js`, pure)

- State: `cells: (piece|null)[16]`, `inHand: piece|null`, `remaining: piece[]`, `turn`.
- `quartoOn(cells)` (attribute-mask AND over all 10 lines) · `applyPlace` ·
  `applyHand(piece)` (never a placed piece). Attribute masks make checks 4-bit ANDs —
  fully jest-table-tested.

## 4. Solo AI

| Tier   | Behaviour                                                                           |
| ------ | ----------------------------------------------------------------------------------- |
| Easy   | Random cell, random handover (gifts wins)                                           |
| Medium | Blocks 3-attribute lines, never hands a completing piece                            |
| Hard   | Alpha-beta with attribute-line scoring; near-perfect on 4×4 (search space is small) |

## 5. Online duel (backend)

- ttt-pattern clone (`/quarto`): match row holds `cells`, `inHand`, `remaining`, `turn`,
  `status`, guest ids, `expiresAt`. Server validates the two-step turn and resolves
  quarto instantly. 3-second poll sync.

## 6. UI / rounds

Piece tray + 4×4 grid; attribute legend always visible; winning line pulses with the
shared attribute highlighted. Rematch = new match. Rounds run 5–10 min.

## 7. Phases + effort

| Phase | Work                              | Effort |
| ----- | --------------------------------- | ------ |
| 1     | core.js (attribute masks) + tests | ~2 h   |
| 2     | shell + AI tiers                  | ~4.5 h |
| 3     | backend module + specs            | ~2.5 h |
| 4     | online mode + registry + polish   | ~2.5 h |

## 8. Verification

jest: attribute-mask quarto detection on all 10 lines, handover legality (no placed
piece re-handed), draw on empty board with no quarto; backend specs: two-step turn
enforcement, server-resolved win; two-phone manual duel.
