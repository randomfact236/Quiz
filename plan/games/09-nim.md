# 09 — Nim (empty-board family)

> **Status:** PLANNED — batch XS. Template: [README.md](README.md) §1.
> The cheapest build in the family and the only one where the hard tier is provably
> perfect: the XOR solution is a 20-line function. Sticks are placed one by one — pure
> empty-board (the row counts are a rules constant, like Mancala's seeds).

## 1. Nine-line spec

1. **Name:** Nim
2. **One-liner:** take 1–3 sticks from one row — whoever takes the LAST stick wins (or loses, in misère)
3. **How to win:** normal play: take the last stick · misère toggle: force the opponent to take it
4. **The board:** rows of sticks (classic 3-4-5); a move = tap sticks to remove from one row
5. **Turns:** strict alternation; at least one stick must go per turn
6. **Solo AI:** easy = random legal take · medium = takes greedily, no XOR ·
   hard = **perfect solver** (nim-sum XOR; misère variant handled by the known rule)
7. **Duel:** turn-based live, invite code; server validates "one row, ≥1 stick" and resolves the end
8. **Toggles:** start rows 3-4-5 (default) / 1-3-5-7 · misère ON/OFF
9. **Never:** no levels, no pre-filled anything

## 2. Rules

- Only one row per turn; only removals, never additions.
- Game ends when the last stick is taken (winner by the active mode).

## 3. Board model (`core.js`, pure)

- State: `rows: number[]`, `turn`, `misere`.
- `applyTake(state, row, count)` → validates count ≤ row length; `isOver(state)`;
  `nimSum(rows)`. The whole game is 3 pure functions — fully table-tested.

## 4. Solo AI

| Tier   | Behaviour                                                             |
| ------ | --------------------------------------------------------------------- |
| Easy   | Random row, random count (loses to anyone who knows the trick)        |
| Medium | Greedy takes, occasional strategic mistakes                           |
| Hard   | Perfect: plays nim-sum zero (normal) / the misère correction when due |

## 5. Online duel (backend)

- ttt-pattern clone (`/nim`): match row holds `rows`, `turn`, `misere`, `status`,
  guest ids, `expiresAt`. Server validates row bounds and resolves the winner at the
  last stick. 3-second poll sync.

## 6. UI / rounds

Rows of sticks with tap-to-select, big "Take" button, nim-sum-free friendly UI (no math
shown). Instant rematch with a role flip. Rounds run 1–3 min.

## 7. Phases + effort

| Phase | Work                            | Effort |
| ----- | ------------------------------- | ------ |
| 1     | core.js + XOR solver + tests    | ~1 h   |
| 2     | shell + AI tiers                | ~1.5 h |
| 3     | backend module + specs          | ~1.5 h |
| 4     | online mode + registry + polish | ~1 h   |

## 8. Verification

jest: illegal takes, last-stick resolution in both modes, hard-AI perfection sweep
(enumerate all small positions); backend specs: row validation, turn enforcement;
two-phone manual duel.
