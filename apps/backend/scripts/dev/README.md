# One-off dev scripts

These are NOT part of the app build or test pipeline. Each was written for a
specific past incident/setup and is kept for reference only.

- `fix-database.js` — ad-hoc data repair run against a dev database
- `sample-dad-jokes.sql` / `sample-image-riddles.sql` — manual sample inserts
- `setup-riddles-database.ps1` — one-time Windows setup helper

Review the file before running anything here against a database you care
about. For canonical schema work use TypeORM migrations
(`npm run migration:generate` / `migration:run` in `apps/backend`), and for
seeding use `apps/backend/src/database/seed.ts` (note:
`reset-and-seed-questions.ts` there is destructive).
