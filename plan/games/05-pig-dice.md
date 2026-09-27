# 05 — Pig Dice, push-your-luck (empty-board family)

> **Status:** PLANNED — the luck entry. Template: [README.md](README.md) §1.
> The only roadmap game where luck decides — beginners can beat experts, which keeps
> casual duels alive. The die is random, but every DECISION is pure player input.

## 1. Nine-line spec

1. **Name:** Pig Dice
2. **One-liner:** roll to build a turn score — bank it, or push your luck and risk it all
3. **How to win:** first to bank 100+ points
4. **The board:** no board — one die, two banks, a turn pot; a move = **Roll** or **Hold**
5. **Turns:** roll as many times as you dare; roll a 1 → the turn pot is lost and the
   turn passes; Hold → bank the pot and pass
6. **Solo AI:** easy = holds at random 10–30 · medium = holds at 20–24 · hard = score-
   aware optimum (holds near 21 + adjustments for the score gap)
7. **Duel:** turn-based live, invite code — **the server rolls the die** (cheat-proof:
   neither client can influence the roll)
8. **Toggles:** target score 50 (quick) / 100 (standard)
9. **Never:** no levels, no pre-filled anything

## 2. Rules

- Roll 2–6 → the pip value joins the turn pot; choose again.
- Roll 1 → turn pot empties, turn passes (banked points are safe).
- Hold → pot banks; reaching the target immediately wins (exact landing not required).

## 3. Board model (`core.js`, pure)

- `applyRoll(state, pips)` · `applyHold(state)` · `isWin(state)` — a 4-field state
  (banks, pot, turn, target). Trivially testable; the interesting part is the AI policy.

## 4. Solo AI

| Tier            | Behaviour                                                                    |
| --------------- | ---------------------------------------------------------------------------- |
| Easy            | Holds at a random threshold 10–30 per turn (sometimes mistakes)              |
| Medium          | Holds at 20–24 with mild score awareness                                     |
| Hard            | The known Pig optimum: hold at ≈21, hold earlier when close to winning, push |
| when far behind |

## 5. Online duel (backend)

- ttt-pattern clone; moves are only `roll` / `hold` — **the server generates every roll**
  (`crypto` RNG) so the outcome is provably fair; poll sync shows the opponent's rolls
  and pot live. Winner resolved server-side at 100.

## 6. UI / rounds

Big die animation, turn-pot counter, two bank scores, Roll/Hold buttons; turn-change
banner ("rolled a 1 — pot lost!"). Rematch = new match. Rounds run 3–6 minutes.

## 7. Phases + effort

| Phase | Work                                     | Effort |
| ----- | ---------------------------------------- | ------ |
| 1     | core.js + tests                          | ~1 h   |
| 2     | shell + AI tiers                         | ~2 h   |
| 3     | backend module (server-side RNG) + specs | ~3 h   |
| 4     | online mode + registry + polish          | ~2 h   |

## 8. Verification

jest: pot-loss on 1, banking, win detection, AI threshold sanity; backend specs:
turn enforcement, RNG bounds, server-resolved winner; two-phone manual duel.
