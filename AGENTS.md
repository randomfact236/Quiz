# Repository Rules for AI Assistants

## 2D Games — ISOLATED FEATURE (do not touch unless the owner explicitly says "2d games" / "games")

The 2D games are deliberately kept separate from the website product (owner decision,
`plan/games/README.md` "Site coupling"). **Any prompt/request that does not explicitly mention
the 2D games must not touch them in any way.** Concretely, unless the owner names them:

- **Do not read, modify, refactor, plan, analyze, delete, or reference** anything under:
  - `apps/frontend/public/games/` — the static games (git-ignored)
  - `apps/frontend/src/app/games/` — the local games hub pages (git-ignored)
  - `apps/frontend/src/__tests__/games-*` — the games tests (git-ignored)
  - `plan/games/` and `2d games plan.md` — the games build plans
- **Do not re-add** games entries to product surfaces: the footer, nav config, sitemap,
  the Play Hub (`app/play/page.tsx`), or the analytics module lists
  (`ANALYTICS_MODULES` in `apps/backend/src/analytics/dto/analytics.dto.ts`,
  `AnalyticsModuleName` / `MODULE_LABELS` in `apps/frontend/src/lib/analytics.ts`).
  These couplings were removed on purpose so work on other features never has to
  touch games code.
- Work on any other feature must never require opening or changing the paths above.
  If a task seems blocked on them, stop and ask the owner instead.

**Shipping the games later** is an explicit owner action: remove the three games lines in
`.gitignore`, commit, and re-add the site references (footer/sitemap/Play Hub/analytics) in a
single explicitly-scoped change.

See `assistant-rules.md` for port configuration and development commands.
