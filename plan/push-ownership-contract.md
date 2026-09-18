# Content Push — Ownership Contract & Guardrails

One-page rulebook for moving content from local authoring into a live site.
Applies to both the quiz site and the affiliate site.

---

## 1. The two lanes (non-overlapping roles)

| Lane         | Job                                                                          | Trigger            | Frequency          |
| ------------ | ---------------------------------------------------------------------------- | ------------------ | ------------------ |
| **API push** | Small edits, single items, day-to-day sync. Diff-based, validated, audited.  | Routine, scripted  | Often              |
| **DB push**  | One-time bulk load, initial migration, disaster recovery. State replacement. | Manual + confirmed | Rare / break-glass |

**Rule:** every routine write goes through the API. The DB lane is a _tool you keep ready_, not a routine "bulk button". Never schedule the DB push.

---

## 2. Ownership contract (the core rule)

Every table belongs to exactly one category. Push may only ever _write_ Push-owned tables, and only the columns it owns.

| Category       | Typical tables                                                                                                   | Push may…                          |
| -------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| **Push-owned** | posts, products, categories, tags                                                                                | INSERT / UPDATE owned columns only |
| **Live-owned** | settings, redirects, generated slugs, counters, view/click stats                                                 | Never                              |
| **User-owned** | users, sessions, orders, affiliate clicks, quiz attempts/results, comments, reviews, form/newsletter submissions | **Never — no access at all**       |

If a table isn't explicitly Push-owned, **push must refuse to touch it.**

---

## 3. Enforce at the DB level (hard wall)

Make the boundary physical so even a buggy script cannot reach forbidden data.

**a) Separate by schema or naming**

- Preferred: `content` schema (push-owned) vs `core`/`app` schema (never pushed).
- Alternative: strict prefix, e.g. `cms_*` = pushable.

**b) Least-privilege push user — its grants _are_ the allowlist**

```sql
-- dedicated push user: content only, add/update only
GRANT SELECT, INSERT, UPDATE ON content.* TO 'content_pusher'@'<your-ip>';
-- NO DELETE, NO DDL, NO access to users / orders / app tables
```

Effects: no `DROP`, no `TRUNCATE`, no user data. A stray statement fails instead of destroying.

---

## 4. Enforce in the push script (soft wall)

- **Explicit table + column allowlist.** Anything not listed → refuse.
- **Column ownership:** write only owned columns. Never overwrite `id`, `created_at`, `author_id`, slugs, counters, or anything the app updates at runtime.
- **Upsert on a natural key** (slug / SKU), never on auto-increment IDs:
  ```sql
  INSERT INTO content.posts (slug, title, body, updated_at)
  VALUES (...)
  ON CONFLICT (slug) DO UPDATE
    SET title = EXCLUDED.title,
        body  = EXCLUDED.body,
        updated_at = EXCLUDED.updated_at;   -- owned columns only
  ```
- **No DELETE by default.** Deletions are explicit, separate, and confirmed.
- **Dry-run by default.** Real writes require a typed confirmation (e.g. type `PUSH`).
- **Match, don't blind-insert** — avoids duplicates and ID churn.
- **Log every run:** what changed, when, by which identity.

---

## 5. Pre-flight checklist (run before ANY DB push)

1. [ ] Target is a **fresh/empty site, a DR restore, or a deliberate reset** — _not_ a live site with user data you care about.
2. [ ] **Snapshot taken and verified** (fresh, restorable).
3. [ ] Confirm the script touches **only Push-owned tables** (check the allowlist / run dry-run).
4. [ ] Backups are stored **off-box / immutable** so this run can't erase them.
5. [ ] Push user is the **least-privilege** account, not `root`.
6. [ ] Maintenance window / write-freeze in effect.
7. [ ] After run: **verify row counts** and spot-check a few items.

If any box is unchecked → **do not run.**

---

## 6. When the DB lane is allowed vs forbidden

**Allowed**

- Initial load into a fresh/empty site.
- Disaster recovery from a known-good snapshot.
- Deliberate full reset (you accept live-authored content is replaced).

**Forbidden**

- Bulk upload onto a live site people are editing.
- Any scheduled / automatic run.
- Any recurring bulk sync that must merge with live data → extend the **API** (batch endpoint) instead.

Full DB restore inherently rolls **user data** back to the snapshot's point in time. Acceptable only in true disaster; never as content sync.

---

## 7. Credential prerequisites (do these first)

- [ ] Rotate the **prod admin password** (store in a gitignored env file / keychain only).
- [ ] Rotate **DB / redis passwords** (pending from the audit).
- [ ] SSH hardened: keys only, no password auth, source-IP allowlist / bastion, non-default port.
- [ ] Secrets never committed; check history and shell history for leaks.
- [ ] Audit logging + alerts on abnormal write volume or off-hours writes.

---

## 8. Bottom line

- **API lane = the only routine write path** (auth + validation + audit + rate limits; small blast radius; revocable).
- **DB lane = break-glass, manual, content-tables-only, snapshot-first.**
- **One credential should never be the whole-system ultimatum** — least privilege + isolated backups keep a stolen secret from meaning "everything".
- Worst case for the API lane: one rejected item. Worst case for an unguarded DB lane: the entire database, user data included.
