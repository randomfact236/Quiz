# Three-Player Games — the native 3P set (empty-board family)

> **Owner decision 2026-09-28:** a dedicated set of games designed for exactly THREE
> players — separate numbering (T1–T10), not ports of the two-player queue. Family
> rules hold: nothing pre-filled, every mark/stone/wall placed by a player decision,
> quick rounds, instant rematch. **All ten designs are RNG-free by design** (no dice,
> no decks) — nothing here waits on the luck-tier decision.
> Implementation: [three-player-plan.md](three-player-plan.md) (TP1).

## 1. The seat rule (3 seats)

1. Every table has 3 seats. Humans join by invite code/link; **every empty seat
   defaults to a Bot**; the host may flip an empty seat to Closed (2-human tables stay legal).
2. One lobby-wide bot tier (easy/medium/hard — the same tiers as solo); each bot runs
   it independently, acting server-side with a 1–2 s pace delay.
3. Turn order is fixed clockwise; the server validates every move (3-second poll pattern).
4. An abandoned human seat converts to a Bot — tables always finish; every table ends
   with placement recorded (1st / 2nd / 3rd, ties noted).
5. Solo practice = you + two bots (same engine, same tiers, no separate code path).

## 2. Roster (build order)

| §   | Game        | Batch | The hook                                                                       | Placement rule                 |
| --- | ----------- | ----- | ------------------------------------------------------------------------------ | ------------------------------ |
| T1  | Tri-OXO     | XS    | three marks on 4×4 — first four-in-a-row wins                                  | line-maker 1st; others tie 2nd |
| T2  | Tri-Nim     | XS    | take sticks — the LAST stick loses; the player before the taker wins           | 1st previous mover · 3rd taker |
| T3  | Row Prison  | S     | your row is the next player's prison — forced-move politics in a ring of three | 1st winner · rest by moves     |
| T4  | Trinity Hex | S     | connect your two opposite sides of the hexagon before anyone connects theirs   | 1st connector                  |
| T5  | Triwall     | M     | three pawns race from three edges; walls slow, they never trap                 | 1st finisher                   |
| T6  | TriFlip     | M     | three-colour flipping on 10×10 — biggest army when the board locks             | 1st majority · rest by count   |
| T7  | Tri-Sow     | M     | three-rank sowing; store landings chain extra turns around the triangle        | 1st most seeds · rest by count |
| T8  | Tri-Sim     | S     | three colours, six dots — close a triangle of YOUR colour and you're out       | elimination order (last = 1st) |
| T9  | Corners     | S     | clone and convert from your corner — three-way infection race                  | 1st majority · rest by count   |
| T10 | TriGo       | L     | three-colour territory Go on 9×9 — the deep boss, built on the Go core         | 1st largest area               |

## 3. Per-game sketches

**T1 Tri-OXO (XS)** — 4×4 grid, three symbols. Place one mark per turn; first to own a
full row/column/diagonal of four wins. Every line has three defenders — the classic
three-way knife-fight. A full board with no line is a shared 2nd; rematch is instant.

**T2 Tri-Nim (XS)** — rows of 3-4-5 sticks; take 1–3 from one row per turn. The taker of
the LAST stick is 3rd; whoever moved immediately before them is 1st; the third player
is 2nd. Alliances form and shatter by themselves. Hard AI: exact search over the small
state space (three-player minimax).

**T3 Row Prison (S)** — 5×5, three marks. The ROW you play in becomes the next player's
forced row; if that row is full they play anywhere. First four-in-a-row wins. Passing
traps around the ring — and with three players, someone always has to take the fall.

**T4 Trinity Hex (S)** — hexagonal board (radius 5); each player owns one pair of
opposite sides; stones never move; first to connect their two sides wins. Full board
without a connection (rare): the player with the shortest remaining gap is 1st.

**T5 Triwall (M)** — 7×7; pawns start mid-edge on three sides, each racing to the
opposite edge. Step 1 cell or spend one of your 6 walls per turn. The server keeps a
path open for ALL THREE pawns — walls are for slowing rivals, never for trapping.

**T6 TriFlip (M)** — 10×10, three colours, a 3-stone triangle around the centre (rules
constant, nothing else pre-filled). Flank a line of either enemy colour to flip it;
when the board fills (or two players pass consecutively), the biggest army wins.

**T7 Tri-Sow (M)** — three ranks of 6 pits, one store per player, 3 seeds per pit (rules
constants). Sow counter-clockwise through all ranks; last seed in your store = extra
turn; last seed in an empty pit facing an enemy seed = capture both. When your own
rank is empty at your turn start you sit out; last player with seeds sweeps their rank.
Most stored seeds is 1st. (Traditional multi-rank sowing, cleaned for short rounds.)

**T8 Tri-Sim (S)** — six dots, 15 possible lines, three colours. Colour one free line per
turn; the moment YOUR colour closes a triangle you are eliminated (3rd). The remaining
two play on; the next elimination fixes 2nd vs 1st. A full board with no triangle
(rare) is a shared result among survivors.

**T9 Corners (S)** — 7×7; one stone per player in three corners. Clone to an adjacent
cell (origin stays) or jump two (origin empties); every enemy stone adjacent to your
landing converts to your colour. Majority when no one can move. Conversions hit BOTH
rivals — you feed on whoever you touch.

**T10 TriGo (L)** — 9×9, three colours, no stones at start. Place/capture by the normal
stone rules; two consecutive passes end the game; area scoring decides 1st–3rd
(positional superko: no position may repeat). Builds on the Go 9×9 capture/legality
core — the cost here is three-way scoring and UI, not the rules engine.

## 4. Build order + effort

- **Engine first:** the shared 3-seat table engine (seats, turn ticker, bot executor,
  placement) — one build; all ten games ride it (see TP1, §2–3).
- **Wave 1 (XS/S):** T1, T2, T8, T9, T3, T4 — engine ~6 h + six games ≈ 6–11 h each.
- **Wave 2 (M):** T5, T6, T7 — ≈ 12–16 h each.
- **Wave 3 (L):** T10, after the Go 9×9 core exists.

## 5. Excluded by design

- No dice, decks, or shuffles — this list is decision-free; the luck tier stays a
  separate owner decision.
- No forced 4-player tables — these games are three-player first; nothing needs a 4th seat.
- No served content — no word lists, no banks, nothing pre-filled anywhere.
