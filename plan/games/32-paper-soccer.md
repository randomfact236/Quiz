# 32 — Paper Soccer (empty-board family)

> **Status:** PLANNED — batch S. Template: [README.md](README.md) §1.
> The pencil-and-paper football duel: bounce the ball off lines and edges into the
> enemy goal. The pitch border and goals are rules constants; every bounce is a
> player-drawn line.

## 1. Nine-line spec

1. **Name:** Paper Soccer
2. **One-liner:** draw 8-direction line segments from the ball — corner it in your rival's goal
3. **How to win:** draw a segment that ends inside the opponent's goal
4. **The board:** rectangular pitch (default 8×10 cells) with 2-cell goals centred on
   each short side; a move = extend a segment from the ball's current node to an
   adjacent node (8 directions) that has no segment yet
5. **Turns:** strict alternation; the ball "travels" along your segment; visiting a node
   that already has lines (or the pitch border) = BOUNCE — you draw again from there
6. **Solo AI:** easy = random legal directions · medium = bounces toward the goal,
   blocks yours · hard = alpha-beta with distance-to-goal + bounce-chain eval
7. **Duel:** turn-based live, invite code; server tracks segments, bounces and resolves the goal
8. **Toggles:** pitch 6×8 / 8×10 (default) / 10×12
9. **Never:** no levels, no pre-filled anything beyond the pitch frame

## 2. Rules

- A segment may never be drawn twice (traced-back moves are illegal).
- Bounce rule: landing on any node that already touches ≥1 segment (including border
  corners) grants another segment immediately — chains until a "clean" node or goal.
- Goal nodes count as visited by the frame; entering the goal ends the game before bouncing.

## 3. Board model (`core.js`, pure)

- State: `segments: Set<edgeKey>`, `ball: node`, `turn`.
- `legalDirections(state)` (untraced + in-bounds) · `applySegment(state, to)` → returns
  bounce flag or goal · `isGoal(node, side)`. Bounce chaining is a pure loop over
  `applySegment` — jest-tested on crafted bounce ladders.

## 4. Solo AI

| Tier   | Behaviour                                                                     |
| ------ | ----------------------------------------------------------------------------- |
| Easy   | Random legal segment                                                          |
| Medium | Steers bounce chains toward the goal; plugs its own goal mouth                |
| Hard   | Alpha-beta over bounce chains; eval = goal distance + available bounce nodes. |
|        | Strong heuristic, not solved.                                                 |

## 5. Online duel (backend)

- ttt-pattern clone (`/papersoccer`): match row holds `segments` (jsonb), `ball`, `turn`,
  `status`, guest ids, `expiresAt`. Server owns bounce resolution (client never
  self-declares a bounce) and resolves goals. 3-second poll sync.

## 6. UI / rounds

Graph-paper pitch with hand-drawn feel, ball node marker, direction fan on tap, bounce
flash + streak arrows. Rematch = side swap. Rounds run 4–8 min.

## 7. Phases + effort

| Phase | Work                                    | Effort |
| ----- | --------------------------------------- | ------ |
| 1     | core.js (segments, bounce loop) + tests | ~3 h   |
| 2     | shell + AI tiers                        | ~3.5 h |
| 3     | backend module + specs                  | ~2.5 h |
| 4     | online mode + registry + polish         | ~2.5 h |

## 8. Verification

jest: double-trace rejection, bounce detection (frame + old segments), goal-before-bounce
ordering; backend specs: segment validation, server-owned bounce resolution, turn
enforcement; two-phone manual duel.
