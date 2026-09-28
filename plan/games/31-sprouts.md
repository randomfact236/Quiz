# 31 — Sprouts (empty-board family)

> **Status:** PLANNED — batch S. Template: [README.md](README.md) §1.
> Conway's pencil game: two rules, zero content, endlessly surprising. Fully
> empty-board — spots and connections exist only because players draw them.

## 1. Nine-line spec

1. **Name:** Sprouts
2. **One-liner:** connect spots and add a new one — kill every spot's free life before your opponent does
3. **How to win:** make the opponent unable to move (a spot with <3 connections... read on)
4. **The board:** n starting spots (default 3) on empty paper; a move = draw a curve
   joining two spots (a spot to itself allowed) that crosses nothing, then add one new
   spot ON the curve
5. **Turns:** alternation; each spot has 3 lives — connecting to a spot consumes one of
   its lives; a spot with 0 lives can no longer be an endpoint; no move available = you lose
6. **Solo AI:** easy = random legal curve · medium = kills 1-life spots, avoids opening
   space · hard = heuristic search with life-count + region eval — **strong, honestly
   NOT a solver** (loopy state space)
7. **Duel:** turn-based live, invite code; server validates crossings/lives and resolves the stuck loss
8. **Toggles:** starting spots 2 (blitz) / 3 (default) / 5 (long)
9. **Never:** no levels, no pre-filled anything

## 2. Rules

- Curves may not cross other curves, pass through spots, or cross themselves.
- The new spot splits the curve into two connections (it inherits both lives usage).
- A spot starts with 3 lives; a self-loop consumes 2 lives of the same spot.

## 3. Board model (`core.js`, pure)

- State: `spots: {lives}[]`, `curves: segments[]` (for crossing tests), `turn`.
- `legalCurves(state)` (lives + crossing rules) · `applyMove(state, curve)` (decrement
  lives, insert spot) · `hasMove(state)`. Crossing tests are the deep part —
  jest-tested on canonical paper positions.

## 4. Solo AI

| Tier   | Behaviour                                                                   |
| ------ | --------------------------------------------------------------------------- |
| Easy   | Random legal connection                                                     |
| Medium | Prefers low-life targets, avoids enclosing regions with free spots          |
| Hard   | Depth-limited search on lives vector + region parity heuristics. Explicitly |
|        | strong-not-perfect (loopy game).                                            |

## 5. Online duel (backend)

- ttt-pattern clone (`/sprouts`): match row holds spots/curves (jsonb), `turn`,
  `status`, guest ids, `expiresAt`. Server validates lives + crossing rules and
  resolves the stuck loss. 3-second poll sync.

## 6. UI / rounds

Free-draw canvas: tap two spots, server/client suggests non-crossing curve routing;
lives shown as small dots around each spot. Rematch = new spots. Rounds run 3–8 min.

## 7. Phases + effort

| Phase | Work                               | Effort |
| ----- | ---------------------------------- | ------ |
| 1     | core.js (lives, crossings) + tests | ~3.5 h |
| 2     | shell + AI tiers                   | ~3.5 h |
| 3     | backend module + specs             | ~2.5 h |
| 4     | online mode + registry + polish    | ~2.5 h |

## 8. Verification

jest: life accounting (incl. self-loop −2), crossing rejection, stuck detection on
classic small positions; backend specs: move validation parity, turn enforcement,
server-resolved loss; two-phone manual duel.
