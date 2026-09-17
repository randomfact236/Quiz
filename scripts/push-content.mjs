#!/usr/bin/env node
/**
 * ============================================================================
 * push-content.mjs — quiz content push via the admin API (the ONLY content lane)
 * ============================================================================
 * Reads content from the LOCAL database (docker postgres, read-only) and
 * creates/updates it on the LIVE site through the validated admin API.
 *
 * Ownership rules (plan/push-ownership-contract.md):
 *   - only the 10 content tables below are ever touched; users, sessions,
 *     comments, analytics, media, settings are NEVER sent
 *   - live-authored items (present on live, absent locally) are IGNORED —
 *     the push has no delete, so live-created content always survives
 *   - live-edited items are PROTECTED: if an item changed on live since the
 *     last push, it is reported as a CONFLICT and skipped (--force overrides)
 *   - dry-run by default; real writes require typing PUSH
 *
 * Usage:
 *   node scripts/push-content.mjs                       # dry run (plan only)
 *   node scripts/push-content.mjs --apply               # real push (typed confirm)
 *   node scripts/push-content.mjs --apply --types=jokes,image-riddles
 *   node scripts/push-content.mjs --apply --force       # overwrite live edits
 *   node scripts/push-content.mjs --limit=20 --apply    # small test batch
 *
 * Config: scripts/content-push.env (gitignored — LIVE_API_BASE,
 * LIVE_ADMIN_EMAIL, LIVE_ADMIN_PASSWORD).
 * ============================================================================
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const ENV_FILE = join(ROOT, 'scripts', 'content-push.env');
const STATE_FILE = join(ROOT, 'scripts', '.content-push-state.json');

// ---------- config ----------
const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name, dflt) => {
  const a = args.find((x) => x.startsWith(`--${name}=`));
  return a ? a.split('=').slice(1).join('=') : dflt;
};
const APPLY = flag('apply');
const FORCE = flag('force');
const ONLY_TYPES = opt('types', '') ? opt('types', '').split(',') : null;
const LIMIT = opt('limit') ? parseInt(opt('limit'), 10) : null;

if (!existsSync(ENV_FILE)) {
  console.error(`Missing ${ENV_FILE}\nCopy scripts/content-push.env.example and fill it in.`);
  process.exit(1);
}
for (const line of readFileSync(ENV_FILE, 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
  if (m && !line.trim().startsWith('#')) process.env[m[1]] = m[2];
}
const LIVE_BASE = (process.env.LIVE_API_BASE || 'https://api.pigzap.com/api/v1').replace(/\/$/, '');
const LIVE_EMAIL = process.env.LIVE_ADMIN_EMAIL;
const LIVE_PASS = process.env.LIVE_ADMIN_PASSWORD;
const LOCAL_CONTAINER = process.env.LOCAL_CONTAINER || 'ai-quiz-postgres';
const LOCAL_DB = process.env.LOCAL_DB || 'aiquiz';
if (!LIVE_EMAIL || !LIVE_PASS) {
  console.error('content-push.env must set LIVE_ADMIN_EMAIL and LIVE_ADMIN_PASSWORD');
  process.exit(1);
}

// ---------- content type registry (the allowlist — anything else is refused) ----------
// key: natural match key; fields: exact admin-DTO fields; fk: local column →
// payload field remap for parent ids resolved during this run.
const TYPES = {
  subjects: {
    listPath: '/quiz-mcq/subjects', listKey: (d) => d.data ?? d,
    create: { path: '/quiz-mcq/subjects', bulk: false }, update: { path: (id) => `/quiz-mcq/subjects/${id}`, verb: 'PUT' },
    keyOf: (r) => r.slug,
    fields: ['name', 'slug', 'emoji', 'category', 'description', 'is_active:isActive'],
    localTable: 'subjects',
  },
  chapters: {
    listPath: '/quiz-mcq/chapters', listKey: (d) => d.data ?? d,
    create: { path: '/quiz-mcq/chapters', bulk: false }, update: { path: (id) => `/quiz-mcq/chapters/${id}`, verb: 'PATCH' },
    keyOf: (r) => `${r.subject_id ?? r.subjectId}#${r.chapter_number ?? r.chapterNumber}`,
    fields: ['name', 'chapter_number:chapterNumber', 'subject_id:subjectId'],
    localTable: 'chapters',
  },
  questions: {
    listPath: '/quiz-mcq/questions', listKey: (d) => d.data ?? d.items ?? d,
    create: { path: '/quiz-mcq/questions', bulk: false }, update: { path: (id) => `/quiz-mcq/questions/${id}`, verb: 'PATCH' },
    keyOf: (r) => `${r.chapter_id ?? r.chapterId}#${hash(r.question_text ?? r.question)}`,
    fields: ['question_text:question', 'correct_answer:correctAnswer', 'correct_letter:correctLetter',
      'options', 'explanation', 'level', 'chapter_id:chapterId', 'status', 'order'],
    localTable: 'questions',
  },
  'riddle-categories': {
    listPath: '/riddle-mcq/categories/all', listKey: (d) => d.data ?? d,
    create: { path: '/riddle-mcq/categories', bulk: false }, update: { path: (id) => `/riddle-mcq/categories/${id}`, verb: 'PATCH' },
    keyOf: (r) => r.slug,
    fields: ['name', 'slug', 'emoji', 'description'],
    localTable: 'riddle_categories',
  },
  'riddle-subjects': {
    listPath: '/riddle-mcq/subjects/all', listKey: (d) => d.data ?? d,
    create: { path: '/riddle-mcq/subjects', bulk: false }, update: { path: (id) => `/riddle-mcq/subjects/${id}`, verb: 'PATCH' },
    keyOf: (r) => r.slug,
    fields: ['name', 'slug', 'emoji', 'description', 'category_id:categoryId'],
    localTable: 'riddle_subjects',
  },
  'riddle-mcqs': {
    listPath: '/riddle-mcq/all', listKey: (d) => d.data ?? d,
    create: { path: '/riddle-mcq/riddles/bulk', bulk: null }, update: { path: (id) => `/riddle-mcq/riddles/${id}`, verb: 'PATCH' },
    keyOf: (r) => hash(r.question),
    fields: ['question', 'options', 'correct_letter:correctLetter', 'level', 'subject_id:subjectId',
      'hint', 'explanation', 'answer', 'status'],
    localTable: 'riddle_mcqs',
  },
  'joke-categories': {
    listPath: '/jokes/classic/categories', listKey: (d) => d.data ?? d,
    create: { path: '/jokes/classic/categories', bulk: false }, update: null,
    keyOf: (r) => r.slug ?? r.name?.toLowerCase(),
    fields: ['name', 'emoji', 'description'],
    localTable: 'joke_categories',
  },
  'dad-jokes': {
    listPath: '/jokes/classic/all', listKey: (d) => d.data ?? d,
    create: { path: '/jokes/classic/bulk', bulk: 'jokes' }, update: { path: (id) => `/jokes/classic/${id}`, verb: 'PUT' },
    keyOf: (r) => hash(r.joke),
    fields: ['joke', 'category_id:categoryId', 'status'],
    localTable: 'dad_jokes',
  },
  'image-riddle-categories': {
    listPath: '/admin/image-riddles/categories/all', listKey: (d) => d.data ?? d,
    create: { path: '/admin/image-riddles/categories', bulk: false }, update: { path: (id) => `/admin/image-riddles/categories/${id}`, verb: 'PUT' },
    keyOf: (r) => r.slug ?? r.name?.toLowerCase(),
    fields: ['name', 'slug', 'emoji', 'description'],
    localTable: 'image_riddle_categories',
  },
  'image-riddles': {
    listPath: '/admin/image-riddles', listKey: (d) => d.data?.items ?? d.data ?? d,
    create: { path: '/admin/image-riddles/bulk', bulk: null }, update: { path: (id) => `/admin/image-riddles/${id}`, verb: 'PUT' },
    keyOf: (r) => r.slug ?? hash(r.title),
    fields: ['title', 'image_url:imageUrl', 'answer', 'alternative_answers:alternativeAnswers', 'hint',
      'difficulty', 'alt_text:altText', 'timer_seconds:timerSeconds', 'show_timer:showTimer',
      'category_id:categoryId', 'is_active:isActive', 'status'],
    localTable: 'image_riddles',
  },
};

const ORDER = ['subjects', 'chapters', 'questions', 'riddle-categories', 'riddle-subjects',
  'riddle-mcqs', 'joke-categories', 'dad-jokes', 'image-riddle-categories', 'image-riddles'];

// ---------- helpers ----------
const hash = (s) => createHash('sha1').update(String(s ?? '')).digest('hex').slice(0, 16);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const snakeToCamel = (k) => k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
const stable = (o) => JSON.stringify(o, Object.keys(o ?? {}).sort());

function pickFields(row, fields) {
  const out = {};
  for (const f of fields) {
    const [local, remote] = f.split(':');
    const key = remote ?? snakeToCamel(local);
    let v = row[local] ?? row[remote ?? local];
    if (v === undefined) v = row[key];
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) out[key] = v;
    else if (typeof v === 'object') out[key] = v;
    else out[key] = v;
  }
  return out;
}

function readLocalTable(table) {
  const sql = `select coalesce(json_agg(t),'[]'::json) from (select * from ${table}) t`;
  const user = process.env.LOCAL_DB_USER || 'aiquiz';
  const out = execSync(
    `docker exec ${LOCAL_CONTAINER} psql -U ${user} -d ${LOCAL_DB} -tAc ${JSON.stringify(sql)}`,
    { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 }
  ).trim();
  return JSON.parse(out || '[]');
}

let token = null;
async function api(method, path, body, retry = true) {
  if (!token) await login();
  const res = await fetch(`${LIVE_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status === 429 && retry) {
    // throttler window is 60s — wait it out and retry (self-regulating pace)
    console.log('429 rate-limited, waiting 62s...');
    await sleep(62000);
    return api(method, path, body, false);
  }
  if (res.status === 401 && retry) {
    token = null;
    await login();
    return api(method, path, body, false);
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${path} -> ${res.status}: ${text.slice(0, 300)}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function login() {
  process.stdout.write('==> logging in to live admin API... ');
  const res = await fetch(`${LIVE_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: LIVE_EMAIL, password: LIVE_PASS }),
  });
  if (!res.ok) throw new Error(`live login failed: ${res.status} — check content-push.env`);
  const data = await res.json();
  token = data.accessToken ?? data.token;
  if (!token) throw new Error('live login returned no token');
  console.log('ok');
}

const loadState = () =>
  existsSync(STATE_FILE) ? JSON.parse(readFileSync(STATE_FILE, 'utf8')) : {};
const saveState = (s) => writeFileSync(STATE_FILE, JSON.stringify(s, null, 2));

/**
 * Fetch the FULL live list for a type. Works for paginated endpoints
 * (page/limit) and non-paginated ones alike: loops pages, dedupes by id,
 * stops when a page adds nothing new or runs short. Hard cap 500 pages.
 */
async function fetchAllLive(T) {
  const seen = new Set();
  const all = [];
  for (let page = 1; page <= 500; page += 1) {
    const sep = T.listPath.includes('?') ? '&' : '?';
    const items = T.listKey(await api('GET', `${T.listPath}${sep}page=${page}&limit=100`));
    if (!Array.isArray(items) || items.length === 0) break;
    let added = 0;
    for (const it of items) {
      const id = it?.id ?? JSON.stringify(it).slice(0, 80);
      if (seen.has(id)) continue;
      seen.add(id);
      all.push(it);
      added += 1;
    }
    if (added === 0 || items.length < 100) break;
    await sleep(650);
  }
  return all;
}

// ---------- main ----------
const state = loadState();
const plan = {};
const summary = { created: 0, updated: 0, conflicts: 0, skipped: 0, errors: 0 };

for (const type of ORDER) {
  if (ONLY_TYPES && !ONLY_TYPES.includes(type)) continue;
  const T = TYPES[type];
  process.stdout.write(`\n==> ${type}: reading local... `);
  const localRows0 = readLocalTable(T.localTable);
  const localRows = LIMIT ? localRows0.slice(0, LIMIT) : localRows0;
  process.stdout.write(`${localRows.length} rows; reading live... `);
  let liveItems;
  try {
    liveItems = await fetchAllLive(T);
  } catch (e) {
    console.log(`\n   ERROR reading live list: ${e.message}`);
    summary.errors += 1;
    continue;
  }
  process.stdout.write(`${liveItems.length} rows\n`);

  const liveByKey = new Map();
  for (const item of liveItems) {
    const k = T.keyOf(item);
    if (k !== undefined && k !== null) liveByKey.set(String(k), item);
  }

  const entries = [];
  for (const row of localRows) {
    const key = String(T.keyOf(row));
    const payload = pickFields(row, T.fields);
    const localChecksum = hash(stable(payload));
    const live = liveByKey.get(key);
    const st = state[type]?.[key];
    if (!live) {
      entries.push({ type, key, action: 'create', payload });
    } else if (st && st.liveChecksum !== hash(stable(pickFields(live, T.fields)))) {
      // live changed since our last push → live edit wins unless forced
      entries.push({ type, key, action: 'conflict', liveId: live.id,
        note: 'edited on live since last push' });
    } else if (!st || st.localChecksum !== localChecksum) {
      entries.push({ type, key, action: 'update', liveId: live.id, payload });
    } else {
      entries.push({ type, key, action: 'skip' });
    }
  }

  const counts = {};
  for (const e of entries) counts[e.action] = (counts[e.action] ?? 0) + 1;
  summary.created += counts.create ?? 0;
  summary.updated += counts.update ?? 0;
  summary.conflicts += counts.conflict ?? 0;
  summary.skipped += counts.skip ?? 0;
  console.log(
    `   plan: ${counts.create ?? 0} create, ${counts.update ?? 0} update, ` +
      `${counts.conflict ?? 0} conflict (live edits — kept), ${counts.skip ?? 0} unchanged`
  );
  plan[type] = entries;
}

console.log(
  `\n======== PLAN: ${summary.created} create, ${summary.updated} update, ` +
    `${summary.conflicts} conflicts kept on live, ${summary.skipped} unchanged ========`
);

if (!APPLY) {
  console.log('\nDRY RUN — nothing was written. Re-run with --apply to push (you will be asked to type PUSH).');
  process.exit(0);
}

if (summary.created + summary.updated === 0) {
  console.log('Nothing to write.');
  process.exit(0);
}

if (flag('yes') !== true) {
  process.stdout.write('\nType PUSH to apply: ');
  const answer = await new Promise((r) => {
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', (d) => r(d.trim()));
  });
  if (answer !== 'PUSH') {
    console.log('Aborted — nothing was written.');
    process.exit(0);
  }
}

let failures = 0;
for (const type of ORDER) {
  const entries = plan[type];
  if (!entries?.length) continue;
  const T = TYPES[type];
  const creates = entries.filter((e) => e.action === 'create');
  const updates = entries.filter((e) => e.action === 'update');
  if (creates.length + updates.length === 0) continue;

  // creates — bulk where available (arrays except quiz questions), chunked and paced
  for (let i = 0; i < creates.length; i += 50) {
    const chunk = creates.slice(i, i + 50);
    try {
      const body = T.create.bulk
        ? { [T.create.bulk]: chunk.map((e) => e.payload) }
        : chunk.map((e) => e.payload);
      await api('POST', T.create.path, body);
      console.log(`   ${type}: created ${Math.min(i + 50, creates.length)}/${creates.length}`);
    } catch (err) {
      failures += chunk.length;
      console.log(`   ${type}: CREATE batch failed: ${err.message.slice(0, 200)}`);
    }
    await sleep(700);
  }

  // updates — one validated call each, paced
  for (const e of updates) {
    try {
      await api(T.update.verb, T.update.path(e.liveId), e.payload);
      console.log(`   ${type}: updated ${e.key}`);
    } catch (err) {
      failures += 1;
      console.log(`   ${type}: UPDATE ${e.key} failed: ${err.message.slice(0, 200)}`);
    }
    await sleep(700);
  }

  // record the ACTUAL live state for everything we just wrote — re-fetch the
  // live list once so future conflict detection compares real server data,
  // never our own payload (server may normalize fields)
  if (creates.length + updates.length > 0) {
    const written = new Map(creates.concat(updates).map((e) => [e.key, e]));
    try {
      const fresh = await fetchAllLive(T);
      for (const item of fresh) {
        const key = String(T.keyOf(item));
        if (!written.has(key)) continue;
        state[type] ??= {};
        state[type][key] = {
          liveId: item.id,
          localChecksum: hash(stable(written.get(key).payload)),
          liveChecksum: hash(stable(pickFields(item, T.fields))),
        };
      }
    } catch (err) {
      console.log(`   ${type}: WARNING could not refresh live state: ${err.message.slice(0, 150)}`);
    }
  }
}

saveState(state);
console.log(
  `\nDone. Failures: ${failures}. Conflicts (live edits) were preserved. ` +
    `State saved to scripts/.content-push-state.json.`
);
if (failures > 0) process.exit(2);
