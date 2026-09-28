# 36 — Bulls & Cows (empty-board family)

> **Status:** PLANNED — batch XS. Template: [README.md](README.md) §1.
> Mastermind stripped to digits. Duel = friend invents the number; solo = the game
> rolls random digits at runtime. No digit lists exist anywhere — both modes satisfy
> the empty-board rule.

## 1. Nine-line spec

1. **Name:** Bulls & Cows
2. **One-liner:** crack your friend's secret 4-digit number — bulls are right digit+place, cows are right digit wrong place
3. **How to win:** 4 bulls (exact match) within the guess limit
4. **The board:** hidden 4-digit code, digits 0–9, NO repeats; a move = submit a
   4-digit guess (valid digits, no repeats), scored instantly
5. **Turns:** one player sets (duel) / the game rolls (solo); the breaker guesses until
   4 bulls or the limit (default 10)
6. **Solo AI:** tiers shape the challenge: easy = 12 rows, medium = 10, hard = 7 and
   no duplicate-digit hints; the auto-codemaker is uniform random generation
7. **Duel:** turn-asymmetric live duel, invite code: creator types the secret on their
   phone (never sent to the opponent), live guessing with poll sync, server scores
8. **Toggles:** digits 4 (default) / 5 · repeats allowed OFF (default) / ON · limit 7/10/12
9. **Never:** no levels, no pre-filled numbers, no stored codes — player-set or runtime-random only

## 2. Rules

- Secret and guesses use distinct digits (default mode); invalid guesses rejected client-
  and server-side.
- Bulls outrank cows: a digit counted as a bull never also counts as a cow.

## 3. Board model (`core.js`, pure)

- State: `code: string (hidden)`, `rows: {guess, bulls, cows}[]`, `limit`.
- `scoreGuess(code, guess)` → {bulls, cows} (pure) · `isValid(guess)` · `isWin(rows)`.
  Small enough for exhaustive jest tables.

## 4. Solo AI (challenge shaping)

| Tier   | Behaviour                                              |
| ------ | ------------------------------------------------------ |
| Easy   | 12 rows + "how many digits are even"-style nudge hints |
| Medium | 10 rows, no hints                                      |
| Hard   | 7 rows, 5 digits (harder search space)                 |

## 5. Online duel (backend)

- ttt-pattern clone (`/bullsandcows`), Mastermind's two-phase shape: `setting` →
  `guessing` → `finished`. Secret stored server-side, **never returned** to the
  breaker's client (only bulls/cows counts cross the API). Server scores every guess
  and resolves the end. 3-second poll sync; ~30-min TTL.

## 6. UI / rounds

Digit keypad, guess history with bull/cow counters, secret-entry mask screen.
End overlay reveals the number. Rematch = role swap. Rounds run 3–7 min.

## 7. Phases + effort

| Phase | Work                                           | Effort |
| ----- | ---------------------------------------------- | ------ |
| 1     | core.js (scoring) + tests                      | ~1 h   |
| 2     | shell (keypad, history, secret screen)         | ~2 h   |
| 3     | backend module (two-phase + redaction) + specs | ~2 h   |
| 4     | online mode + registry + polish                | ~1.5 h |

## 8. Verification

jest: scoreGuess table (bull/cow overlap, no-repeat validation); backend specs: secret
redaction on breaker views, scoring parity, phase enforcement; two-phone manual duel.
