# 13 — Nine Men's Morris (empty-board family)

> **Status:** PLANNED — batch M. Template: [README.md](README.md) §1.
> The 2,000-year-old mill duel with three distinct phases. The board starts completely
> empty: every piece enters by a player's hand (the placement phase IS the empty-board model).

## 1. Nine-line spec

1. **Name:** Nine Men's Morris
2. **One-liner:** place your 9 men, then slide them to form mills — three in a row that capture an enemy man
3. **How to win:** reduce the opponent to 2 men or block every move they have
4. **The board:** 24 points on three nested squares (plus midlines); a move = place a man
   (phase 1), slide to an adjacent point (phase 2) or fly anywhere (phase 3, ≤3 men)
5. **Turns:** alternation; forming a mill = capture one enemy man (never one inside a
   mill while any loose man remains)
6. **Solo AI:** easy = random-ish legal moves · medium = seeks mills, blocks yours,
   captures greedily · hard = alpha-beta with mill-mobility evaluation
7. **Duel:** turn-based live, invite code; server validates each phase's move type and captures
8. **Toggles:** flying allowed for 3 men (default) / only 2 men (harder variant)
9. **Never:** no levels, no pre-filled anything

## 2. Rules

- Placement first (9 turns each), then sliding; a captured man never returns.
- Double mill (breaking and re-forming on consecutive turns) is legal.

## 3. Board model (`core.js`, pure)

- State: `points: (0|1|2)[]`, `inHand: [9,9]`, `turn`, `awaitingCapture`.
- `legalMoves(state)` (phase-aware) · `applyPlace/applySlide/applyCapture` ·
  `millsAt(point)` over the 16 mill lines · `isLoss(state)`. Jest-tested phase transitions.

## 4. Solo AI

| Tier   | Behaviour                                                                 |
| ------ | ------------------------------------------------------------------------- |
| Easy   | Legal but uncoordinated: random placement/slides                          |
| Medium | Builds toward mills, blocks enemy mill points, safe captures              |
| Hard   | Alpha-beta with mobility + double-mill threats; endgame slide bookkeeping |

## 5. Online duel (backend)

- ttt-pattern clone (`/ninemensmorris`): match row holds `points`, `inHand`, `turn`,
  `awaitingCapture`, `status`, guest ids, `expiresAt`. Server validates phase-correct
  moves, resolves captures and the loss condition. 3-second poll sync.

## 6. UI / rounds

Three-phase UI (hand counter → slide arrows → capture highlight); mill formation
flash + capture prompt. Rematch = colour swap. Rounds run 5–12 min.

## 7. Phases + effort

| Phase | Work                              | Effort |
| ----- | --------------------------------- | ------ |
| 1     | core.js (3 phases, mills) + tests | ~3.5 h |
| 2     | shell + AI tiers                  | ~4.5 h |
| 3     | backend module + specs            | ~3 h   |
| 4     | online mode + registry + polish   | ~3 h   |

## 8. Verification

jest: mill lines, capture legality (mill-protection rule), phase transitions, block-loss;
backend specs: illegal move rejection per phase, turn enforcement, server-resolved win;
two-phone manual duel.
