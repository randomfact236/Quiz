# 34 — Mastermind (empty-board family)

> **Status:** PLANNED — batch S. Template: [README.md](README.md) §1.
> The hidden-code duel with TWO faces: duel = your FRIEND invents the code (pure
> player-created data); solo = the game generates a random code at runtime. No code
> list ever exists anywhere — the empty-board rule holds in both modes.

## 1. Nine-line spec

1. **Name:** Mastermind
2. **One-liner:** crack your friend's hidden colour code in as few guesses as possible
3. **How to win:** exact match of the 4-peg code within the guess limit
4. **The board:** hidden 4-peg code (6 colours, repeats allowed) + the guess rows; a
   move = submit a 4-colour guess, scored with black (right colour+place) and white
   (right colour, wrong place) pegs
5. **Turns:** codemaker sets the code (duel) or the game rolls one (solo); then the
   codebreaker guesses repeatedly with instant scoring; limit = 10 rows
6. **Solo AI:** easy/medium/hard apply to the codebreaker role (see §4); the game's
   auto-codemaker is uniform-random — never a stored list
7. **Duel:** turn-asymmetric live duel, invite code: creator sets the code (typed on
   their phone, never sent to the opponent's client), then live guessing with poll sync;
   server scores every guess
8. **Toggles:** pegs 4 (default) / 5 · colours 6 (default) / 8 · guess limit 8/10/12
9. **Never:** no levels, no pre-filled codes, no colour lists stored anywhere — codes
   are player-set or runtime-generated only

## 2. Rules

- Scoring: black pegs = exact position matches; white = colour present elsewhere;
  each code peg contributes to at most one peg (standard excess handling).
- Guess rows are permanent history — no take-backs.

## 3. Board model (`core.js`, pure)

- State: `code: peg[] (hidden in duel/solo contexts)`, `rows: {guess, black, white}[]`,
  `limit`.
- `scoreGuess(code, guess)` → {black, white} (pure, the whole game) · `isWin(rows)` ·
  `rowLeft(state)`. `scoreGuess` is jest-table-tested exhaustively over edge cases
  (repeat counts, over-counted colours).

## 4. Solo AI (codebreaker assistance tiers)

| Tier   | Behaviour                                                                       |
| ------ | ------------------------------------------------------------------------------- |
| Easy   | N/A to the engine; easy = the player gets unlimited rows (12) and a hint button |
| Medium | Standard 10 rows, no hints                                                      |
| Hard   | 8 rows against the random codemaker — pure deduction pressure                   |

(The machine never needs to _break_ codes in v1 — the human always breaks.)

## 5. Online duel (backend)

- ttt-pattern clone (`/mastermind`) with a two-phase shape like Battleship's:
  `setting` → `guessing` → `finished`.
- The codemaker's client POSTs the chosen code; the server stores it and **never
  returns it** to the breaker's client (only black/white counts cross the API).
  Guesses are server-scored; win/lose + row usage resolved server-side.
  3-second poll sync; ~30-min TTL.

## 6. UI / rounds

Colour-peg tray, guess rows with black/white peg feedback, code-set screen with
"hide while typing" mask. End overlay reveals the code. Rematch = role swap.
Rounds run 5–10 min.

## 7. Phases + effort

| Phase | Work                                           | Effort |
| ----- | ---------------------------------------------- | ------ |
| 1     | core.js (scoring) + tests                      | ~1.5 h |
| 2     | shell (tray, rows, code-set)                   | ~3.5 h |
| 3     | backend module (two-phase + redaction) + specs | ~3 h   |
| 4     | online mode + registry + polish                | ~2.5 h |

## 8. Verification

jest: scoreGuess exhaustive table (incl. duplicates), row-limit end; backend specs:
code redaction on the breaker's views (the #1 property), guess scoring parity,
phase enforcement; two-phone manual duel (code visibly absent from breaker's network
traffic).
