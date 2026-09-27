# 07 — Rock Paper Scissors, best-of-5 (empty-board family)

> **Status:** PLANNED — the quickfire palate-cleanser. Template: [README.md](README.md) §1.
> The cheapest possible live duel: zero rules to explain, 60 seconds end to end.

## 1. Nine-line spec

1. **Name:** Rock Paper Scissors — Best of 5
2. **One-liner:** pick rock, paper or scissors; beat your friend three times first
3. **How to win:** first to 3 round wins
4. **The board:** three big buttons; a move = one hidden pick per round
5. **Turns:** simultaneous picks — both choose blind, the server reveals together (no
   second-mover cheating); next round opens after the reveal
6. **Solo AI:** easy = flat random · medium = counters your most-used throw · hard =
   Markov-chain pattern detection (punishes predictable humans)
7. **Duel:** live, invite code — picks go to the server, which reveals both at once
8. **Toggles:** none
9. **Never:** no levels, no animations that delay the reveal

## 2. Rules

- Standard beats: rock-scissors, paper-rock, scissors-paper; same throw = tie (round
  replays, score unchanged).
- First to 3 round wins takes the match.

## 3. Board model (`core.js`, pure)

- `beat(pick)` · `resolveRound(a, b) → 'a' | 'b' | 'tie'` · `matchOver(score)` — tiny by
  design; the reveal flow is the product.

## 4. Solo AI (offline practice mode)

| Tier        | Behaviour                                                                    |
| ----------- | ---------------------------------------------------------------------------- |
| Easy        | Flat random                                                                  |
| Medium      | Counts the player's throw frequencies, counters the favourite                |
| Hard        | First-order Markov: predicts the next throw from the player's LAST throw and |
| counters it |

## 5. Online duel (backend)

- ttt-pattern clone with a `pending picks` state: both picks stored server-side; the
  round resolves only when BOTH are in, and the response reveals both picks + the round
  result + the match score. A player cannot see the opponent's pick before committing.

## 6. UI / rounds

Three big hand buttons → "waiting for your friend…" → simultaneous reveal animation →
score pips (best-of-5 dots) → next round auto-opens. Match overlay → rematch.

## 7. Phases + effort

| Phase | Work                                                  | Effort  |
| ----- | ----------------------------------------------------- | ------- |
| 1     | core.js + tests                                       | ~30 min |
| 2     | shell + AI tiers                                      | ~2 h    |
| 3     | backend module (simultaneous-pick resolution) + specs | ~3 h    |
| 4     | online mode + registry + polish                       | ~1.5 h  |

## 8. Verification

jest: resolution table, tie replay, match-over; backend specs: single-pick commitment
(a pick is never revealed before both are in), replay rejection; two-phone manual duel.
