/**
 * Generate ~200 image riddles per category (10 categories) from Wikimedia
 * Commons and emit per-category seed SQL.
 *
 * Source: Wikimedia Commons API (free-license images, license metadata
 * inline, hotlink-friendly 960px thumbs). Commons aggregates PD/CC material
 * from archives worldwide. Openverse was evaluated as a second source but
 * its API sits behind a Cloudflare challenge for anonymous clients, so it is
 * not used. Copyrighted puzzle sites are deliberately NOT scraped — the site
 * cannot republish them. Every row carries a Source link action
 * (attribution surface, see plan/16-liked-categories.md section 6).
 *
 * Output: apps/backend/scripts/dev/bulk-seed-<slug>.sql (idempotent,
 * ON CONFLICT (id) DO UPDATE) + bulk-seed-manifest.json with per-category
 * counts. Run sample-image-riddles.sql first so the categories exist.
 *
 * Deterministic ids (sha1 of image URL) make re-runs upsert, not duplicate.
 * seenUrls is pre-loaded ONLY from the two hand-curated seed files, never
 * from bulk-seed-*.sql (those are fully rewritten on each run).
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname);
const UA = 'AiQuiz-riddle-import/1.0 (local dev import; contact: dev@ai-quiz.local)';
const TARGET = 200; // rows per category
const BUFFER = 420; // candidates to collect per category before filtering
const SEARCH_GAP_MS = 700;
const CATEGORY_GAP_MS = 1200;

const CATS = [
  {
    slug: 'optical-illusions',
    uuid: '8a4d0b2f-5c3e-4f9a-8b7d-2e6f9c3a8b52',
    tag: 'OPTICAL',
    queries: [
      'optical illusion',
      'impossible object',
      'anamorphosis',
      'ambiguous image',
      "trompe-l'œil",
      'moire pattern',
      'grid illusion',
      'apparent movement illusion',
    ],
    title: (s) => `Optical illusion: ${s} - what do you see?`,
    answer: () => 'An optical illusion',
    alts: ['an optical illusion', 'illusion'],
    hint: 'Look at the image from a distance, or squint',
  },
  {
    slug: 'hidden-objects',
    uuid: '7f3c9a1e-4b2d-4e8f-9a6c-1d5e8b2f7a41',
    tag: 'HIDDEN',
    queries: [
      'Wimmelbild',
      'Wimmelbuch',
      'hidden object puzzle',
      'picture puzzle search',
      'Brueghel the Elder painting',
      'Hieronymus Bosch painting',
      'crowded market painting',
      'Netherlandish Proverbs',
    ],
    commonsCats: ['Wimmelbild'],
    title: () => 'A hidden-object scene: what can you find?',
    answer: () => 'Find the hidden objects',
    alts: ['hidden objects', 'find the objects'],
    hint: 'Scan the scene in strips, left to right, top to bottom',
  },
  {
    slug: 'spot-the-difference',
    uuid: '9b5e1c3a-6d4f-4a0b-9c8e-3f7a0d4b9c63',
    tag: 'DIFFS',
    queries: [
      'find the differences puzzle',
      'spot the difference',
      'difference puzzle game',
      'puzzle page differences old book',
      'find differences illustration',
      'spot the difference cartoon',
      'find the difference',
      'picture puzzle two images',
      'puzzle differences magazine',
      'jeu des erreurs',
      'Unterschiede suchen puzzle',
      'puzzle illustrations children book',
      'comparison puzzle engraving',
      'observation game illustration',
    ],
    commonsCats: ['Spot the difference'],
    title: () => 'This is an old find-the-differences puzzle. How many differences are there?',
    answer: () => 'Find all the differences',
    alts: ['the differences', 'all the differences'],
    hint: 'Compare the pictures edge to edge and count carefully',
  },
  {
    slug: 'rebus-puzzles',
    uuid: '0c6f2d4b-7e5a-4b1c-8d9f-4a8b1e5c0d74',
    tag: 'REBUS',
    queries: [
      'rebus',
      'rebus puzzle',
      'rebus engraving',
      'picture puzzle word',
      'hieroglyphic bible',
      'emblem book engraving',
      'charades picture puzzle',
      'rebus card',
      'Rebus Rätsel',
      'jeu de rébus',
      'hieroglyphics for children',
      'enigmatic picture puzzle',
      'charade illustration',
      'rebus drawing',
      'puzzle plate book',
      ' Rätselbild ',
    ],
    commonsCats: ['Rebus', 'Rebuses'],
    title: () => 'Solve this rebus. What does the picture say?',
    answer: () => 'A rebus puzzle',
    alts: ['rebus', 'a rebus puzzle'],
    hint: 'Say the pictured words out loud and listen for the phrase',
  },
  {
    slug: 'emoji-riddles',
    uuid: '1d7a3e5c-8f6b-4c2d-9e0a-5b9c2f6d1e85',
    tag: 'EMOJI',
    queries: [
      'emoji',
      'emoticon icon',
      'smiley face icon set',
      'emoticon smiley',
      'smiley svg',
      'emoticon svg',
      'smiley face clipart',
      'laughing face drawing',
      'winking smiley',
      'heart symbol clipart',
      'grinning face cartoon',
      'smiling face icon',
      'crying face cartoon',
      'heart eyes cartoon',
      'thumbs up clipart',
      'peace hand icon',
      'star icon cartoon',
      'fire cartoon icon',
      'ghost cartoon drawing',
      'alien cartoon face',
      'robot face cartoon',
      'unicorn head cartoon',
      'skull icon drawing',
      'clapping hands illustration',
    ],
    commonsCats: ['Emoji', 'Emoticons'],
    // Codepoint-style names ("1f600", "Twemoji...") make meaningless answers.
    subjectReject: /twemoji|noto emoji|[0-9a-f]{4,6}/i,
    title: () => 'Which emoji or smiley is shown here?',
    answer: (s) => s || 'A smiley face',
    alts: ['smiley', 'emoji'],
    hint: 'Focus on the mouth and the eyes',
  },
  {
    slug: 'close-up-challenges',
    uuid: '2e8b4f6d-9a7c-4d3e-8f1b-6c0d3a7e2f96',
    tag: 'CLOSEUP',
    queries: [
      'macro photography water drop',
      'macro insect eye',
      'extreme close up texture',
      'macro photography everyday object',
      'macro photo flower center',
      'macro photography surface detail',
    ],
    title: () => 'Extreme close-up: what is this?',
    answer: (s) => s || 'An everyday object in macro',
    alts: ['macro photo', 'close up'],
    hint: 'Look at the texture and the colors - everyday things look alien up close',
  },
  {
    slug: 'animal-camouflage',
    uuid: '3f9c5a7e-0b8d-4e4f-9a2c-7d1e4b8f3a07',
    tag: 'CAMO',
    queries: [
      'camouflaged animal',
      'animal camouflage',
      'cryptic animal coloration',
      'camouflage insect bark',
      'hidden animal grass photo',
      'camouflage moth',
      'leaf insect',
      'stick insect',
      'owl camouflage tree',
      'flatfish sand',
      'chameleon branch',
      'seahorse camouflage',
      'nightjar bird ground',
      'ptarmigan camouflage',
      'gecko lichen bark',
    ],
    title: () => 'A camouflaged animal is hiding in this photo. Find it.',
    answer: () => 'A hidden animal',
    alts: ['hidden animal', 'camouflaged animal', 'animal'],
    hint: 'Look for edges that break the background pattern',
  },
  {
    slug: 'counting-challenges',
    uuid: '4a0d6b8f-1c9e-4f5a-8b3d-8e2f5c9a4b18',
    tag: 'COUNT',
    queries: [
      'flock of birds',
      'school of fish',
      'crowd of people',
      'pile of dice',
      'group of snails',
      'many mushrooms forest floor',
      'herd of sheep',
      'pile of stones',
    ],
    title: () => 'How many objects can you count in this image?',
    answer: () => 'Count them one by one',
    alts: ['count them', 'many'],
    hint: 'Count in groups rather than one by one',
  },
  {
    slug: 'landmarks-places',
    uuid: '5b1e7c9a-2d0f-4a6b-9c4e-9f3a6d0b5c29',
    tag: 'LANDMARK',
    queries: [
      'Eiffel Tower',
      'Taj Mahal',
      'Golden Gate Bridge',
      'Colosseum Rome',
      'Great Wall of China',
      'Statue of Liberty',
      'Big Ben London',
      'Brandenburg Gate',
      'Christ the Redeemer Rio',
      'Machu Picchu',
      'Sydney Opera House',
      'Giza pyramids',
      'Acropolis Athens',
      'Neuschwanstein Castle',
      'Sagrada Familia',
    ],
    landmarks: true, // answer = the matched landmark display name
    title: () => 'Which famous landmark is shown in this photo?',
    answer: (s) => s || 'A famous landmark',
    alts: ['a famous landmark', 'landmark'],
    hint: 'The architecture gives away the country',
  },
  {
    slug: 'logos-brands',
    uuid: '6c2f8d0b-3e1a-4b7c-8d5f-0a4b7e1c6d30',
    tag: 'LOGO',
    queries: [
      'text logo company',
      'wordmark logo',
      'brand logo svg',
      'logo sign company',
      'PD-textlogo',
      'wordmark',
      'logo typeface company',
      'logotype',
      'bank logo',
      'airline logo',
      'car brand logo',
      'beer label logo',
      'radio station logo',
      'software company logo',
      'supermarket logo',
      'football club logo',
      'hotel logo',
      'university logo',
      'museum logo',
      'insurance company logo',
      'watch brand logo',
      'coffee logo',
      'chocolate logo',
      'train company logo',
      'tv channel logo',
    ],
    commonsCats: ['Text logos', 'Logotypes'],
    title: () => 'Which brand does this logo belong to?',
    answer: (s) => s || 'A brand logo',
    alts: ['a logo', 'brand'],
    hint: 'Focus on the letterforms and the colors',
  },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const seenUrls = new Set(); // global dedupe (also covers the curated seed files)
const seenIds = new Set();

for (const f of ['sample-image-riddles.sql', 'bulk-200-image-riddles.sql']) {
  const p = path.join(OUT_DIR, f);
  if (!fs.existsSync(p)) continue;
  for (const m of fs.readFileSync(p, 'utf8').matchAll(/'(https:[^']+)'/g)) seenUrls.add(m[1]);
}

function cleanSubject(fileTitle) {
  let s = fileTitle
    .replace(/^File:/i, '')
    .replace(/\.[a-z0-9]{2,5}$/i, '')
    .replace(/[_\-.]+/g, ' ')
    .replace(/\s*\(\d+\)\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (s.length > 48) s = s.slice(0, 45).trim() + '...';
  return s;
}

function esc(s) {
  return s.replace(/'/g, "''");
}

function licenseOk(extmeta = {}) {
  const blob = JSON.stringify([
    extmeta.LicenseShortName,
    extmeta.UsageTerms,
    extmeta.License,
  ]).toLowerCase();
  if (/fair use|non-free|nc |nd /.test(blob)) return false;
  return /cc0|public domain|pdm|cc by(-sa)?([ \d.]|$)/.test(blob);
}

async function fetchJson(url) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (res.status === 429 || res.status === 503) {
        await sleep(2000 * attempt);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (attempt === 4) throw e;
      await sleep(1500 * attempt);
    }
  }
}

function toCandidate(title, ii) {
  return {
    title,
    url: ii.thumburl && ii.width > 960 ? ii.thumburl : ii.url,
    pageUrl: ii.descriptionurl,
    width: ii.width,
    height: ii.height,
    mime: ii.mime,
    extmeta: ii.extmetadata || {},
  };
}

async function searchCommons(query) {
  const u = new URL('https://commons.wikimedia.org/w/api.php');
  u.searchParams.set('action', 'query');
  u.searchParams.set('format', 'json');
  u.searchParams.set('formatversion', '2');
  u.searchParams.set('generator', 'search');
  u.searchParams.set('gsrsearch', `${query} filetype:bitmap|drawing`);
  u.searchParams.set('gsrnamespace', '6');
  u.searchParams.set('gsrlimit', '50');
  u.searchParams.set('prop', 'imageinfo');
  u.searchParams.set('iiprop', 'url|size|mime|extmetadata');
  u.searchParams.set('iiurlwidth', '960');
  u.searchParams.set('maxlag', '5');
  const j = await fetchJson(u);
  return (j.query?.pages || [])
    .filter((p) => p.imageinfo?.[0])
    .map((p) => toCandidate(p.title, p.imageinfo[0]));
}

async function categoryMembers(catTitle) {
  const u = new URL('https://commons.wikimedia.org/w/api.php');
  u.searchParams.set('action', 'query');
  u.searchParams.set('format', 'json');
  u.searchParams.set('formatversion', '2');
  u.searchParams.set('generator', 'categorymembers');
  u.searchParams.set('gcmtitle', catTitle);
  u.searchParams.set('gcmtype', 'file');
  u.searchParams.set('gcmlimit', '500');
  u.searchParams.set('prop', 'imageinfo');
  u.searchParams.set('iiprop', 'url|size|mime|extmetadata');
  u.searchParams.set('iiurlwidth', '960');
  u.searchParams.set('maxlag', '5');
  const j = await fetchJson(u);
  return (j.query?.pages || [])
    .filter((p) => p.imageinfo?.[0])
    .map((p) => toCandidate(p.title, p.imageinfo[0]));
}

function landmarkDisplay(cat, cand) {
  if (!cat.landmarks) return null;
  const t = cand.title.toLowerCase();
  const hit = cat.queries.find((q) => t.includes(q.toLowerCase()));
  return hit
    ? hit
        .replace(/\bRome\b|\bRio\b|\bLondon\b|\bAthens\b|\bChina\b|\bGiza\b|\bthe Elder\b.*/gi, '')
        .trim()
    : null;
}

function makeRow(cat, cand, idx) {
  let subject = cleanSubject(cand.title);
  if (cat.subjectReject && cat.subjectReject.test(subject)) subject = '';
  const display = landmarkDisplay(cat, cand) || subject;
  const diff = ['easy', 'medium', 'hard'][idx % 3];
  const timer = [60, 90, 120][idx % 3];
  const h = crypto.createHash('sha1').update(cand.url).digest('hex');
  const id = `83${h.slice(0, 6)}-${h.slice(6, 10)}-41d4-a716-${h.slice(10, 22)}`;
  const actionOptions = [
    {
      id: 'source',
      isEnabled: true,
      isVisible: true,
      label: 'Source',
      type: 'link',
      style: 'ghost',
      size: 'sm',
      openInNewTab: true,
      href: cand.pageUrl,
      position: 'below_question',
      order: 90,
      ariaLabel: 'View original image source',
    },
  ];
  const alts = cat.alts && cat.alts.length ? cat.alts : [];
  return (
    `('${id}', '${esc(cat.title(subject))}', '${esc(cand.url)}', '${esc(cat.answer(display))}', ` +
    `${alts.length ? `'${esc(JSON.stringify(alts))}'::jsonb` : 'null'}, '${esc(cat.hint)}', ` +
    `'${diff}', ${timer}, true, '${esc(`${cat.tag} image: ${cand.title.replace(/^File:/, '')}`.slice(0, 250))}', ` +
    `'${cat.uuid}', true, 'published', true, ` +
    `'${esc(JSON.stringify(actionOptions))}'::jsonb, 0, 0, 0)`
  );
}

async function main() {
  const manifest = {};
  for (const cat of CATS) {
    const candidates = [];
    for (const q of cat.queries) {
      if (candidates.length >= BUFFER) break;
      try {
        candidates.push(...(await searchCommons(q)));
      } catch (e) {
        console.log(`  commons query failed: ${q} (${e.message})`);
      }
      await sleep(SEARCH_GAP_MS);
    }
    for (const cc of cat.commonsCats || []) {
      if (candidates.length >= BUFFER) break;
      try {
        candidates.push(...(await categoryMembers(`Category:${cc}`)));
      } catch (e) {
        console.log(`  commons category failed: ${cc} (${e.message})`);
      }
      await sleep(CATEGORY_GAP_MS);
    }

    // Filter: usable bitmap, big enough, free license, globally unseen,
    // meaningful subject (for categories that answer with the subject).
    let rows = candidates.filter((c) => {
      if (!/image\/(jpeg|png|svg\+xml)/.test(c.mime)) return false;
      if ((c.width || 0) < 400 || (c.height || 0) < 300) return false;
      if (!c.url || seenUrls.has(c.url)) return false;
      if (!licenseOk(c.extmeta)) return false;
      if (cat.subjectReject && cat.subjectReject.test(c.title)) return false;
      return true;
    });
    const seenCat = new Set();
    rows = rows.filter((c) => (seenCat.has(c.url) ? false : (seenCat.add(c.url), true)));
    rows = rows.slice(0, TARGET);
    rows.forEach((c) => seenUrls.add(c.url));

    const sqlRows = rows.map((c, i) => makeRow(cat, c, i));
    const sql =
      `-- ============================================================================\n` +
      `-- Image riddles: ${cat.slug} (${rows.length} rows, generated ${new Date().toISOString()})\n` +
      `-- Source: Wikimedia Commons (openly licensed only; the Source link action\n` +
      `-- on every row is the attribution surface - do not remove).\n` +
      `-- Idempotent: ON CONFLICT (id) DO UPDATE. Requires categories from\n` +
      `-- sample-image-riddles.sql / reset-image-riddle-content.js.\n` +
      `-- AFTER IMPORT: docker exec ai-quiz-redis redis-cli DEL image-riddles:categories\n` +
      `-- ============================================================================\n\n` +
      `INSERT INTO image_riddles (id, title, "imageUrl", answer, "alternativeAnswers", hint, difficulty, "timerSeconds", "showTimer", "altText", "categoryId", "isActive", status, "useDefaultActions", "actionOptions", views, attempts, solves) VALUES\n` +
      sqlRows.join(',\n') +
      `\nON CONFLICT (id) DO UPDATE SET\n` +
      `  title = EXCLUDED.title, "imageUrl" = EXCLUDED."imageUrl", answer = EXCLUDED.answer,\n` +
      `  "alternativeAnswers" = EXCLUDED."alternativeAnswers", hint = EXCLUDED.hint,\n` +
      `  difficulty = EXCLUDED.difficulty, "timerSeconds" = EXCLUDED."timerSeconds",\n` +
      `  "altText" = EXCLUDED."altText", "categoryId" = EXCLUDED."categoryId",\n` +
      `  status = EXCLUDED.status, "actionOptions" = EXCLUDED."actionOptions";\n`;
    fs.writeFileSync(path.join(OUT_DIR, `bulk-seed-${cat.slug}.sql`), sql);

    manifest[cat.slug] = { kept: rows.length, shortfall: TARGET - rows.length };
    console.log(`${cat.slug}: kept ${rows.length}/${TARGET}`);
  }

  fs.writeFileSync(
    path.join(OUT_DIR, 'bulk-seed-manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  console.log('DONE. Manifest written.');
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
