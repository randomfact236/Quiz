# Content Push Runbook — quiz (API lane)

**One content tool, one source of truth: LOCAL.** Author content in the local admin
(`localhost:3010/admin`), then push it to pigzap.com with this script. Content edited
directly on the live admin is **protected by conflict detection** (see §3), but local is
authoritative for items it owns.

---

## 1. One-time setup

```bash
cp scripts/content-push.env.example scripts/content-push.env
# fill in LIVE_ADMIN_EMAIL / LIVE_ADMIN_PASSWORD — the LIVE admin login (pigzap.com/admin)
```

`LIVE_API_BASE` defaults to `https://api.pigzap.com/api/v1`. Requires: local Docker
postgres running (`docker-compose -f docker-compose.local.yml up -d`), Node 18+.

## 2. Everyday use

```bash
npm run content:push                          # dry run — prints the plan, writes nothing
npm run content:push -- --apply               # real push (asks you to type PUSH)
npm run content:push -- --apply --types=jokes # one content type only
npm run content:push -- --apply --limit=10    # tiny test batch
npm run content:push -- --apply --force       # overwrite live edits (rare, deliberate)
```

Content types: `subjects, chapters, questions, riddle-categories, riddle-subjects,
riddle-mcqs, joke-categories, dad-jokes, image-riddle-categories, image-riddles`.

## 3. How live edits are protected

- **No delete, ever.** Items created on the live admin are invisible to the push —
  they can never be removed by it.
- **Conflict detection.** If an item was edited on live since the last push, the push
  reports `conflict` and **skips** it — your live edit wins. `--force` overwrites when
  you deliberately want the local version.
- **Matched, not blind-inserted.** Items are matched by natural key (slug / text hash),
  so re-pushes update in place instead of duplicating.
- State lives in `scripts/.content-push-state.json` (gitignored). Deleting it makes the
  next run treat everything as "first push" — never delete it while live holds content.

## 4. First push expectations

The live catalog is currently empty (cleaned 2026-09-17), so the first `--apply` creates
everything: ~12,032 questions (single-item creates, ~2.5 h — one-time), 3,022 riddles,
1,013 jokes, 1,906 image riddles via bulk endpoints (minutes). Everything after that is
diff-only and fast. Watch the first run once; it self-regulates on API rate limits (429 →
waits 62 s and retries).

## 5. Safety properties

- Only the 10 content tables are touched. Users, sessions, comments, analytics, media,
  settings are **never** read from local or written to live.
- Dry-run is the default; real writes need a typed `PUSH`.
- Failures are reported per batch and never abort the whole run; exit code 2 = some
  items failed (re-run — it is idempotent).
- Credentials live only in the gitignored `scripts/content-push.env`.
