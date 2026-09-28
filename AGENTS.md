# Repository Rules for AI Assistants

## 2D Games — EMPTY-BOARD FAMILY (owner decision 2026-09-28)

The games family pivoted to **empty-board games**: nothing pre-filled, every element on
the board placed by a player's own decision (the tic-tac-toe model). Every game follows
the standard template in `plan/games/README.md` — solo vs computer (easy/medium/hard AI),
same-device hot-seat where it costs nothing, and live online duels on the
server-authoritative poll backend (the `/tictactoe` pattern: invite codes, 3-second sync,
server decides the winner). No levels, no campaigns; a round is 1–5 minutes.

The seven former pre-filled/pattern games were **archived 2026-09-28** to
`_archive/games/` (kept in the repo, NOT served, never deleted) along with their per-game
plans (`_archive/games/plans/`). Do not reference, relink, or resurrect them without an
explicit owner instruction. `tic-tac-toe` is the live prototype; Connect Four and Gomoku
are the next builds off the same template.

Games code follows the same production rules as every other feature (no dead,
stale, or duplicated code). The static game folders are deliberately dependency-free
and local-first: no auth, and no coupling beyond each game's documented
`?debug`/`?locale`/`?seed`/`?theme`/`?v`/`?ttt`/`?challenge` seams — keep it that way
unless the owner asks otherwise. (Network: each game may call only `/api/v1/share-counts`
and, via `/shared/pig-feedback.js`, `/comments`; plus, per plan/18 phases 4–5 and the
owner-approved CSP, `/api/v1/game-challenges` via `/shared/game-challenge.js` and
`/api/v1/tictactoe` for live duels. All are rate-limited. No other outbound calls.)

See `assistant-rules.md` for port configuration and development commands.

**Hub rules (owner asks 2026-09-28, BINDING for any AI writing game code):**

1. PLAY-PREVIEW: every hub card shows a static mid-game SVG snapshot via
   `apps/frontend/src/components/games/GamePlayPreview.tsx`, game name directly
   BELOW the preview, then the blurb. A registry entry is incomplete without its
   preview case in that component.
2. TABS BY PLAYER COUNT: the hub opens with VISIBLE tabs `2 Players / 3 Players /
4 Players (`GamesBrowser.tsx`) — numbers outside, NO dropdown, one tap selects.
Every registry entry MUST declare `players: number[]`(e.g.`[2]`or`[3, 4]`); the
   game appears in every matching tab and carries a count badge on its card.
3. BUILD ORDER: famous/common games first (`plan/games/README.md` §3); already-
   built games keep their hub order untouched. Details: plan/games/README.md §5.
