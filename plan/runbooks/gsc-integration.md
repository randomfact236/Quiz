# Runbook — Google Search Console Integration (plan/15 P3)

> **Status 2026-09-23:** the integration is FULLY BUILT. `apps/backend/src/settings/gsc.service.ts`
> queries the Search Console API (top queries, top pages, totals; 6h cache) and serves
> `GET /admin/settings/gsc/overview?range=28d`. The admin panel renders it at
> **Admin → SEO → Search Console tab** (`GscPanel.tsx`). What remains is the one-time
> Google-side setup + one environment variable on the VPS.

## Owner steps (one time, ~10 minutes)

### 1. Google Cloud — enable the API + create a service account

1. Go to <https://console.cloud.google.com> → select or create a project (e.g. `pigzap`).
2. **APIs & Services → Library** → search **Google Search Console API** → **Enable**.
3. **APIs & Services → Credentials → Create credentials → Service account**.
   - Name: `pigzap-gsc` (any) → **Create and continue** → skip roles → **Done**.
4. Open the new service account → **Keys** tab → **Add key → Create new key → JSON**.
   A `.json` file downloads — keep it open for step 3.

### 2. Give the service account access to Search Console

1. Go to <https://search.google.com/search-console> → select the **pigzap.com** Domain property.
2. **Settings → Users and permissions → Add user**.
3. Email: the service account's `client_email` (ends in `…iam.gserviceaccount.com` — it is
   shown in the JSON key as `client_email`).
4. Role: **Full** (Owner is not required for reading data) → Add.

### 3. Give the backend the key

1. Copy the ENTIRE JSON key file content onto ONE line (or base64-encode it).
2. Dokploy → **quiz-api** service → Environment → add:

   ```
   GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"…", … }
   ```

   (one line; raw JSON or base64 both accepted — base64 avoids quoting issues)

3. Redeploy/restart **quiz-api**.

Optional: `GSC_PROPERTY_URL` overrides the property — the default
`sc-domain:pigzap.com` already matches the verified Domain property.

### 4. Verify

1. Admin → **SEO → Search Console** tab → the panel flips from "not connected" to
   **Connected** (shows the property + service-account email).
2. Totals / Top queries / Top pages render for the selected range.
3. If empty at first: Search Console data lags **~2 days** by nature, plus the panel
   caches 6h per range. Check back the next day.

## GSC hygiene checklist (while you are in Search Console)

- [ ] **Sitemaps** → confirm `https://pigzap.com/sitemap.xml` shows **Success**
      (it was "Pending/Couldn't fetch" on 2026-09-19 — normal lag; resubmit if still failing).
- [ ] After the SEO deploy lands (per-content landing pages
      `/quiz-mcq/<subject>`, `/riddle-mcq/<category>`): **resubmit the sitemap** so
      Google discovers the new URLs, and use **URL Inspection → Request indexing**
      on the key pages (home, /quiz-mcq, /riddle-mcq, /image-riddles, /games, /jokes).
- [ ] **Performance** tab: sanity-check after 2–3 days — clicks/impressions should
      match the admin panel.

## Security notes

- The service account key is a secret: store it in the owner's password manager,
  paste it only into the Dokploy env. Never commit it.
- Scope is read-only (`webmasters.readonly`); revoke anytime by removing the user in
  Search Console or disabling the service account in Google Cloud.
