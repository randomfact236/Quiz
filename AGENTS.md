# Repository Rules for AI Assistants

## 2D Games — INTEGRATED WITH THE WEBSITE (owner decision 2026-09-15)

The eight 2D games (`apps/frontend/public/games/<slug>/`, hub at
`apps/frontend/src/app/games/`) are part of the product as of the owner's 2026-09-15
shipping decision. The former isolation rule (2026-09-09) is lifted: the hub is
linked from the header/footer nav, the Play Hub, and the sitemap route registry,
and `games` is a valid analytics module on both ends. Per-game plans in `plan/games/`
remain the spec of record for each game's behavior.

Games code follows the same production rules as every other feature (no dead,
stale, or duplicated code). The static game folders are deliberately dependency-free
and local-first: no backend calls, no auth, and no coupling beyond each game's
documented `?debug`/`?locale`/`?seed`/`?theme` seams — keep it that way unless the
owner asks otherwise.

See `assistant-rules.md` for port configuration and development commands.
