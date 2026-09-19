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
    // isActive is deliberately NOT sent: CreateSubjectDto whitelists only these
    // five fields (live ValidationPipe is forbidNonWhitelisted → 400 on extras)
    // and the live column defaults to true, which matches our all-active local.
    fields: ['name', 'slug', 'emoji', 'category', 'description'],
    localTable: 'subjects',
  },
  chapters: {
    listPath: '/quiz-mcq/chapters', listKey: (d) => d.data ?? d,
    create: { path: '/quiz-mcq/chapters', bulk: false }, update: { path: (id) => `/quiz-mcq/chapters/${id}`, verb: 'PATCH' },
    keyOf: (r) => `${r.subject_id ?? r.subjectId}#${r.chapter_number ?? r.chapterNumber}`,
    // live's POST /chapters accepts {name, subjectId} and AUTO-numbers chapters
    // (MAX(chapterNumber)+1) — local rows are read in number order (orderBy)
    // so auto-numbering reproduces the local numbering exactly.
    fields: ['name', 'subject_id:subjectId'],
    localTable: 'chapters',
    orderBy: '"subjectId", "chapterNumber"',
  },
  questions: {
    listPath: '/quiz-mcq/questions', listKey: (d) => d.data ?? d.items ?? d,
    create: { path: '/quiz-mcq/questions', bulk: false }, update: { path: (id) => `/quiz-mcq/questions/${id}`, verb: 'PATCH' },
    keyOf: (r) => `${r.chapter_id ?? r.chapterId}#${hash(r.question_text ?? r.question)}`,
    fields: ['question_text:question', 'correct_answer:correctAnswer', 'correct_letter:correctLetter',
      'options', 'explanation', 'level', 'chapter_id:chapterId', 'status', 'order'],
    localTable: 'questions',
    orderBy: '"chapterId", "order"',
  },
  'riddle-categories': {
    listPath: '/riddle-mcq/categories/all', listKey: (d) => d.data ?? d,
    create: { path: '/riddle-mcq/categories', bulk: false }, update: { path: (id) => `/riddle-mcq/categories/${id}`, verb: 'PATCH' },
    keyOf: (r) => r.slug,
    // description is NOT sent: CreateRiddleCategoryDto whitelists only these
    // fields (forbidNonWhitelisted → 400 on extras)
    fields: ['name', 'slug', 'emoji'],
    localTable: 'riddle_categories',
  },
  'riddle-subjects': {
    listPath: '/riddle-mcq/subjects/all', listKey: (d) => d.data ?? d,
    create: { path: '/riddle-mcq/subjects', bulk: false }, update: { path: (id) => `/riddle-mcq/subjects/${id}`, verb: 'PATCH' },
    keyOf: (r) => r.slug,
    // description is NOT sent: not in CreateRiddleSubjectDto's whitelist
    fields: ['name', 'slug', 'emoji', 'category_id:categoryId'],
    localTable: 'riddle_subjects',
  },
  'riddle-mcqs': {
    listPath: '/riddle-mcq/all', listKey: (d) => d.data ?? d,
    // live's bulk endpoint takes a BARE array of BulkCreateRiddleDto and
    // strictly FK-validates subjectId — chunks, subject remap and the
    // {count, errors} answer are handled in the apply loop
    create: { path: '/riddle-mcq/riddles/bulk', bulk: 'BARE_ARRAY' }, update: { path: (id) => `/riddle-mcq/riddles/${id}`, verb: 'PATCH' },
    keyOf: (r) => hash(r.question),
    fields: ['question', 'options', 'correct_letter:correctLetter', 'level', 'subject_id:subjectId',
      'hint', 'explanation', 'answer', 'status', 'importOrder'],
    // UpdateRiddleMcqDto has no importOrder (forbidNonWhitelisted)
    updateFields: ['question', 'options', 'correct_letter:correctLetter', 'level', 'subject_id:subjectId',
      'hint', 'explanation', 'answer', 'status'],
    localTable: 'riddle_mcqs',
    orderBy: '"subjectId", "importOrder"',
  },
  'joke-categories': {
    listPath: '/jokes/classic/categories', listKey: (d) => d.data ?? d,
    create: { path: '/jokes/classic/categories', bulk: false }, update: null,
    keyOf: (r) => r.slug ?? r.name?.toLowerCase(),
    // description is NOT sent: CreateJokeCategoryDto whitelists name+emoji only
    fields: ['name', 'emoji'],
    localTable: 'joke_categories',
  },
  'dad-jokes': {
    listPath: '/jokes/classic/all', listKey: (d) => d.data ?? d,
    // live bulk takes a BARE array (max 100) and FORCES status=DRAFT on create —
    // status is therefore not sent; created rows are published afterwards via
    // POST /jokes/classic/bulk-action (UpdateDadJokeDto has no status either)
    create: { path: '/jokes/classic/bulk', bulk: 'BARE_ARRAY' },
    update: { path: (id) => `/jokes/classic/${id}`, verb: 'PUT' },
    publishAfterCreate: { path: '/jokes/classic/bulk-action' },
    keyOf: (r) => hash(r.joke),
    fields: ['joke', 'category_id:categoryId'],
    localTable: 'dad_jokes',
  },
  'image-riddle-categories': {
    listPath: '/admin/image-riddles/categories/all', listKey: (d) => d.data ?? d,
    create: { path: '/admin/image-riddles/categories', bulk: false }, update: { path: (id) => `/admin/image-riddles/categories/${id}`, verb: 'PUT' },
    // slug is NOT sent: CreateImageRiddleCategoryDto whitelists name/emoji/description
    keyOf: (r) => r.slug ?? r.name?.toLowerCase(),
    fields: ['name', 'emoji', 'description'],
    localTable: 'image_riddle_categories',
  },
  'image-riddles': {
    listPath: '/admin/image-riddles', listKey: (d) => d.data?.items ?? d.data ?? d,
    // live bulk takes a BARE array of CreateImageRiddleDto and the entity
    // FORCES status=DRAFT on create (isActive defaults true) — created rows
    // are published afterwards via POST /image-riddles/bulk-action
    create: { path: '/admin/image-riddles/bulk', bulk: 'BARE_ARRAY' },
    update: { path: (id) => `/admin/image-riddles/${id}`, verb: 'PUT' },
    publishAfterCreate: { path: '/image-riddles/bulk-action' },
    // titles are NOT unique (template prompts reused across images) — the
    // natural key is title+imageUrl; hashing title alone collapses distinct
    // riddles and silently PATCHes one live row N times
    keyOf: (r) => hash(`${r.title ?? ''}|${r.imageUrl ?? r.image_url ?? ''}`),
    fields: ['title', 'image_url:imageUrl', 'answer', 'alternative_answers:alternativeAnswers', 'hint',
      'difficulty', 'alt_text:altText', 'timer_seconds:timerSeconds', 'show_timer:showTimer',
      'category_id:categoryId'],
    // UpdateImageRiddleDto additionally whitelists isActive (but not status)
    updateFields: ['title', 'image_url:imageUrl', 'answer', 'alternative_answers:alternativeAnswers', 'hint',
      'difficulty', 'alt_text:altText', 'timer_seconds:timerSeconds', 'show_timer:showTimer',
      'category_id:categoryId', 'is_active:isActive'],
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

function readLocalTable(table, orderBy) {
  const sql = `select coalesce(json_agg(t),'[]'::json) from (select * from ${table}` +
    (orderBy ? ` order by ${orderBy}` : '') + `) t`;
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

// ---------- quiz parent-chain context ----------
// Chapters/questions natural keys must be system-independent: parent UUIDs
// differ between local and live, so keys are built from subject SLUG (subjects)
// and slug#chapterNumber (chapters). remap() translates a child payload's
// parent id (payload.subjectId/chapterId) from local UUID to live UUID.
const quizCache = {};
async function liveListOf(type) {
  if (!quizCache[type + ':live']) quizCache[type + ':live'] = await fetchAllLive(TYPES[type]);
  return quizCache[type + ':live'];
}
function localRowsOf(type) {
  if (!quizCache[type + ':local']) {
    quizCache[type + ':local'] = readLocalTable(TYPES[type].localTable, TYPES[type].orderBy);
  }
  return quizCache[type + ':local'];
}
async function buildQuizCtx(type) {
  const localSubjects = localRowsOf('subjects');
  const subSlugLocal = new Map(localSubjects.map((s) => [s.id, s.slug]));
  const liveSubjects = await liveListOf('subjects');
  const subSlugLive = new Map(liveSubjects.map((s) => [s.id, s.slug]));
  const liveSubjectIdBySlug = new Map(liveSubjects.map((s) => [s.slug, s.id]));
  const liveSubKey = (subjectId) => subSlugLive.get(subjectId) ?? `?${subjectId}`;

  if (type === 'chapters') {
    return {
      keyLocal: (row) => `${subSlugLocal.get(row.subjectId) ?? `?${row.subjectId}`}#${row.chapterNumber ?? row.chapter_number}`,
      keyLive: (item) => `${liveSubKey(item.subjectId)}#${item.chapterNumber}`,
      remap: (payload, row) => {
        const slug = subSlugLocal.get(row.subjectId);
        const liveId = slug && liveSubjectIdBySlug.get(slug);
        if (!liveId) throw new Error(`parent subject not on live (slug=${slug ?? row.subjectId})`);
        payload.subjectId = liveId;
      },
    };
  }
  // questions — chapter natural key = subjectSlug#chapterNumber
  const localChapters = localRowsOf('chapters');
  const chapterKeyLocal = new Map(
    localChapters.map((c) => [
      c.id,
      `${subSlugLocal.get(c.subjectId) ?? `?${c.subjectId}`}#${c.chapterNumber ?? c.chapter_number}`,
    ])
  );
  const liveChapters = await liveListOf('chapters');
  const chapterKeyLive = new Map(
    liveChapters.map((c) => [c.id, `${liveSubKey(c.subjectId)}#${c.chapterNumber}`])
  );
  const liveChapterIdByKey = new Map(
    liveChapters.map((c) => [`${liveSubKey(c.subjectId)}#${c.chapterNumber}`, c.id])
  );
  return {
    keyLocal: (row) =>
      `${chapterKeyLocal.get(row.chapterId) ?? `?${row.chapterId}`}#${hash(row.question ?? row.question_text)}`,
    keyLive: (item) =>
      `${chapterKeyLive.get(item.chapterId) ?? `?${item.chapterId}`}#${hash(item.question ?? item.question_text)}`,
    remap: (payload, row) => {
      const ck = chapterKeyLocal.get(row.chapterId);
      const liveId = ck && liveChapterIdByKey.get(ck);
      if (!liveId) throw new Error(`parent chapter not on live (key=${ck ?? row.chapterId})`);
      payload.chapterId = liveId;
    },
  };
}

// ---------- child parent-chain context ----------
// Riddle/joke/image children have the same per-database UUID problem as quiz
// children — parents are resolved by SLUG (riddle family) or lowercased NAME
// (joke/image families, which have no slugs on either side). Built fresh in
// the apply loop so children reference parents created moments ago.
const categoryKeyOf = (item) => String(item.slug ?? item.name ?? '').toLowerCase();

async function buildRiddleCtx(type) {
  if (type === 'riddle-subjects') {
    const localCats = readLocalTable(TYPES['riddle-categories'].localTable);
    const catKeyLocal = new Map(localCats.map((c) => [c.id, categoryKeyOf(c)]));
    const liveCatIdByKey = new Map(
      (await fetchAllLive(TYPES['riddle-categories'])).map((c) => [categoryKeyOf(c), c.id])
    );
    return {
      remap: (payload) => {
        if (!payload.categoryId) return;
        const key = catKeyLocal.get(payload.categoryId);
        const liveId = key && liveCatIdByKey.get(key);
        if (!liveId) throw new Error(`parent category not on live (key=${key ?? payload.categoryId})`);
        payload.categoryId = liveId;
      },
    };
  }
  if (type === 'dad-jokes' || type === 'image-riddles') {
    const catType = type === 'dad-jokes' ? 'joke-categories' : 'image-riddle-categories';
    const localCats = readLocalTable(TYPES[catType].localTable);
    const catKeyLocal = new Map(localCats.map((c) => [c.id, categoryKeyOf(c)]));
    const liveCatIdByKey = new Map(
      (await fetchAllLive(TYPES[catType])).map((c) => [categoryKeyOf(c), c.id])
    );
    return {
      remap: (payload) => {
        if (!payload.categoryId) return;
        const key = catKeyLocal.get(payload.categoryId);
        const liveId = key && liveCatIdByKey.get(key);
        if (!liveId) throw new Error(`parent category not on live (key=${key ?? payload.categoryId})`);
        payload.categoryId = liveId;
      },
    };
  }
  // riddle-mcqs
  const localSubs = readLocalTable(TYPES['riddle-subjects'].localTable);
  const subSlugLocal = new Map(localSubs.map((s) => [s.id, s.slug]));
  const liveSubIdBySlug = new Map(
    (await fetchAllLive(TYPES['riddle-subjects'])).map((s) => [s.slug, s.id])
  );
  return {
    remap: (payload) => {
      const slug = subSlugLocal.get(payload.subjectId);
      const liveId = slug && liveSubIdBySlug.get(slug);
      if (!liveId) throw new Error(`parent subject not on live (slug=${slug ?? payload.subjectId})`);
      payload.subjectId = liveId;
    },
  };
}

// ---------- main ----------
const state = loadState();
const plan = {};
const ctxByType = {};
const summary = { created: 0, updated: 0, conflicts: 0, skipped: 0, errors: 0 };

for (const type of ORDER) {
  if (ONLY_TYPES && !ONLY_TYPES.includes(type)) continue;
  const T = TYPES[type];
  process.stdout.write(`\n==> ${type}: reading local... `);
  const localRows0 = readLocalTable(T.localTable, T.orderBy);
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

  // quiz child types key on parent NATURAL keys (slug / slug#number) — parent
  // UUIDs differ between local and live
  let ctx = null;
  if (type === 'chapters' || type === 'questions') {
    ctx = await buildQuizCtx(type);
    ctxByType[type] = ctx;
  }
  const keyOfRow = (row) => (ctx ? ctx.keyLocal(row) : T.keyOf(row));
  const keyOfLive = (item) => (ctx ? ctx.keyLive(item) : T.keyOf(item));

  const liveByKey = new Map();
  for (const item of liveItems) {
    const k = keyOfLive(item);
    if (k !== undefined && k !== null) liveByKey.set(String(k), item);
  }

  const entries = [];
  for (const row of localRows) {
    const key = String(keyOfRow(row));
    const payload = pickFields(row, T.fields);
    const localChecksum = hash(stable(payload));
    const live = liveByKey.get(key);
    const st = state[type]?.[key];
    if (!live) {
      entries.push({ type, key, action: 'create', payload, row, localChecksum });
    } else if (st && st.liveChecksum !== hash(stable(pickFields(live, T.fields)))) {
      // live changed since our last push → live edit wins unless forced
      entries.push({ type, key, action: 'conflict', liveId: live.id,
        note: 'edited on live since last push' });
    } else if (!st || st.localChecksum !== localChecksum) {
      entries.push({ type, key, action: 'update', liveId: live.id, payload, row, localChecksum });
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

  // child types remap parent ids against FRESH live data — the parents were
  // just created moments ago, so the plan-time live caches are stale
  let actx = ctxByType[type] ?? null;
  if (actx) {
    delete quizCache['subjects:live'];
    delete quizCache['chapters:live'];
    actx = await buildQuizCtx(type);
  } else if (['riddle-subjects', 'riddle-mcqs', 'dad-jokes', 'image-riddles'].includes(type)) {
    actx = await buildRiddleCtx(type);
  }
  const remap = (e) => {
    if (!actx) return null;
    try {
      actx.remap(e.payload, e.row);
      return null;
    } catch (err) {
      return err.message;
    }
  };

  // creates — bulk endpoints take chunked arrays (bare, or wrapped when the
  // DTO names the collection); single-item endpoints take ONE payload per
  // POST (the live DTOs reject arrays with 400 — this lane was only ever
  // exercised against the permissive local API before 2026-09-18)
  if (T.create.bulk) {
    for (let i = 0; i < creates.length; i += 50) {
      const chunk = [];
      for (const e of creates.slice(i, i + 50)) {
        const remapErr = remap(e);
        if (remapErr) {
          failures += 1;
          console.log(`   ${type}: CREATE skipped [${e.key}]: ${remapErr}`);
          continue;
        }
        chunk.push(e.payload);
      }
      if (chunk.length === 0) continue;
      try {
        const body = T.create.bulk === 'BARE_ARRAY' ? chunk : { [T.create.bulk]: chunk };
        const res = await api('POST', T.create.path, body);
        // bulk endpoints answer with 2xx even when individual rows were
        // skipped — dad-jokes {count}, image-riddles {created} — surface the
        // shortfall either way
        const made = typeof res?.count === 'number' ? res.count : typeof res?.created === 'number' ? res.created : null;
        if (made !== null && made < chunk.length) {
          failures += chunk.length - made;
          for (const msg of (res.errors ?? []).slice(0, 3)) {
            console.log(`   ${type}: row skipped: ${String(msg).slice(0, 180)}`);
          }
        }
        console.log(`   ${type}: created ${Math.min(i + 50, creates.length)}/${creates.length}`);
      } catch (err) {
        failures += chunk.length;
        console.log(`   ${type}: CREATE batch failed: ${err.message.slice(0, 200)}`);
      }
      await sleep(700);
    }
  } else {
    let ok = 0;
    for (const e of creates) {
      const remapErr = remap(e);
      if (remapErr) {
        failures += 1;
        console.log(`   ${type}: CREATE skipped [${e.key}]: ${remapErr}`);
        continue;
      }
      try {
        await api('POST', T.create.path, e.payload);
        ok += 1;
      } catch (err) {
        failures += 1;
        console.log(`   ${type}: CREATE failed [${e.key}]: ${err.message.slice(0, 200)}`);
      }
      if (ok % 50 === 0) console.log(`   ${type}: created ${ok}/${creates.length}`);
      await sleep(200); // paced: stay under the live API throttle (429 → waits 62s)
    }
    console.log(`   ${type}: created ${ok}/${creates.length}`);
  }

  // updates — one validated call each, paced; payload rebuilt per-call so
  // update-only field whitelists (T.updateFields) are honored and remap
  // mutates the payload actually sent
  for (const e of updates) {
    const payload = pickFields(e.row, T.updateFields ?? T.fields);
    let remapErr = null;
    if (actx) {
      try {
        actx.remap(payload, e.row);
      } catch (err) {
        remapErr = err.message;
      }
    }
    if (remapErr) {
      failures += 1;
      console.log(`   ${type}: UPDATE skipped [${e.key}]: ${remapErr}`);
      continue;
    }
    try {
      await api(T.update.verb, T.update.path(e.liveId), payload);
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
  const publishIds = [];
  if (creates.length + updates.length > 0) {
    const written = new Map(creates.concat(updates).map((e) => [e.key, e]));
    try {
      const fresh = await fetchAllLive(T);
      const sctx = ctxByType[type] ?? null;
      for (const item of fresh) {
        const key = String(sctx ? sctx.keyLive(item) : T.keyOf(item));
        const entry = written.get(key);
        if (!entry) continue;
        if (entry.action === 'create') publishIds.push(item.id);
        state[type] ??= {};
        state[type][key] = {
          liveId: item.id,
          // pre-remap checksum: computed from the LOCAL-shape payload so future
          // runs comparing freshly-read local rows stay stable across runs
          localChecksum: entry.localChecksum ?? hash(stable(entry.payload)),
          liveChecksum: hash(stable(pickFields(item, T.fields))),
        };
      }
    } catch (err) {
      console.log(`   ${type}: WARNING could not refresh live state: ${err.message.slice(0, 150)}`);
    }
  }

  // draft-forcing endpoints (dad-jokes, image-riddles): rows created THIS run
  // start as DRAFT and are invisible to the public site — publish exactly the
  // ids we just created via the family's bulk-action endpoint
  if (T.publishAfterCreate && publishIds.length > 0) {
    let published = 0;
    for (let i = 0; i < publishIds.length; i += 50) {
      const ids = publishIds.slice(i, i + 50);
      try {
        await api('POST', T.publishAfterCreate.path, { action: 'publish', ids });
        published += ids.length;
      } catch (err) {
        failures += ids.length;
        console.log(`   ${type}: PUBLISH failed for ${ids.length} rows: ${err.message.slice(0, 150)}`);
      }
      await sleep(700);
    }
    console.log(`   ${type}: published ${published}/${publishIds.length}`);
  }
}

saveState(state);
console.log(
  `\nDone. Failures: ${failures}. Conflicts (live edits) were preserved. ` +
    `State saved to scripts/.content-push-state.json.`
);
if (failures > 0) process.exit(2);
