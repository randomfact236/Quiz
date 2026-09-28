# 27 — Ataxx (empty-board family)

> **Status:** PLANNED — batch S. Template: [README.md](README.md) §1.
> Clone, jump, infect. Only two corner stones exist by rule at start — everything else
> spreads from player decisions. Near-empty-board with a snowball finish.

## 1. Nine-line spec

1. **Name:** Ataxx
2. **One-liner:** clone your blob step by step — every enemy stone adjacent to where you land flips to yours
3. **How to win:** own the majority of the grid when no move remains (or capture all enemy stones)
4. **The board:** 7×7 with one stone of each colour in opposite corners (rules constants);
   a move = clone to an adjacent empty cell (new stone) OR jump 2 (stone relocates);
   then all adjacent enemy stones convert
5. **Turns:** alternation; pass automatically only when no legal move exists; both stuck
   → game ends
6. **Solo AI:** easy = random legal moves · medium = prefers conversions + edge play ·
   hard = alpha-beta with territory/mobility eval (strong, not perfect)
7. **Duel:** turn-based live, invite code; server applies clone/jump + conversions and resolves the end
8. **Toggles:** board 5×5 / 7×7 (default) / 9×9
9. **Never:** no levels, no pre-filled anything

## 2. Rules

- Clone keeps the origin stone; jump vacates it.
- Conversion applies to the 8 neighbours of the destination only, after the stone lands.
- Full-board or mutual-stuck end → higher count wins.

## 3. Board model (`core.js`, pure)

- State: `cells: (0|1|2|null)[]`, `turn`.
- `legalMoves(state)` (clone ring + jump ring) · `applyMove(state, from, to)` with
  conversion pass · `counts(state)` · `isOver(state)`. All trivially jest-testable.

## 4. Solo AI

| Tier   | Behaviour                                                           |
| ------ | ------------------------------------------------------------------- |
| Easy   | Random clone/jump                                                   |
| Medium | Maximizes immediate conversions, avoids opening corners             |
| Hard   | Alpha-beta; eval = stone count + frontier mobility + corner control |

## 5. Online duel (backend)

- ttt-pattern clone (`/ataxx`): match row holds `cells`, `turn`, `status`, guest ids,
  `expiresAt`. Server validates source/destination rings, applies conversions,
  resolves the end. 3-second poll sync.

## 6. UI / rounds

Grid with live territory tint, clone/jump ghosting, flip-wave animation on conversions.
Rematch = colour swap. Rounds run 3–6 min.

## 7. Phases + effort

| Phase | Work                            | Effort |
| ----- | ------------------------------- | ------ |
| 1     | core.js + tests                 | ~1.5 h |
| 2     | shell + AI tiers                | ~3 h   |
| 3     | backend module + specs          | ~2.5 h |
| 4     | online mode + registry + polish | ~2.5 h |

## 8. Verification

jest: clone-vs-jump semantics, conversion ring, mutual-stuck end, count integrity;
backend specs: move-range validation, turn enforcement, server-resolved result;
two-phone manual duel.
