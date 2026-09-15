/**
 * Emoji-riddles top-up: fills the emoji-riddles category to TARGET using
 * Twemoji SVGs (jdecked/twemoji, graphics CC-BY 4.0) hotlinked via jsDelivr.
 *
 * Two riddle types:
 *  - "Which emoji is shown here?"  (answer = the emoji's Unicode name)
 *  - "Which country's flag is this?" (answer = the country name)
 *
 * Attribution: each row's Source link points at the SVG file page in the
 * twemoji repository (CC-BY 4.0 attribution surface).
 *
 * Usage: node generate-emoji-topup.js [needed]
 *   needed = how many rows to generate (default 140). Writes
 *   bulk-seed-emoji-riddles-topup.sql (imported by import-generated-riddles.js).
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const TARGET = Number(process.argv[2] || 140);
const OUT = path.join(__dirname, 'bulk-seed-emoji-riddles-topup.sql');
const CAT_UUID = '1d7a3e5c-8f6b-4c2d-9e0a-5b9c2f6d1e85';
const BASE = 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg';

/** [codepoint(s), Unicode/CLDR name] — curated common emoji. */
const EMOJI = [
  ['1f600', 'Grinning face'],
  ['1f602', 'Face with tears of joy'],
  ['1f60d', 'Smiling face with heart-eyes'],
  ['1f618', 'Face blowing a kiss'],
  ['1f609', 'Winking face'],
  ['1f61b', 'Face with tongue'],
  ['1f60e', 'Smiling face with sunglasses'],
  ['1f913', 'Nerd face'],
  ['1f622', 'Crying face'],
  ['1f62d', 'Loudly crying face'],
  ['1f621', 'Pouting face'],
  ['1f631', 'Face screaming in fear'],
  ['1f914', 'Thinking face'],
  ['1f634', 'Sleeping face'],
  ['1f923', 'Rolling on the floor laughing'],
  ['1f97a', 'Pleading face'],
  ['1f92a', 'Zany face'],
  ['1f922', 'Nauseated face'],
  ['1f60e', 'Cool face with sunglasses'],
  ['1f92b', 'Shushing face'],
  ['1f44d', 'Thumbs up'],
  ['1f44e', 'Thumbs down'],
  ['1f44c', 'OK hand'],
  ['1f44f', 'Clapping hands'],
  ['1f64c', 'Raising hands'],
  ['1f64f', 'Folded hands'],
  ['1f4aa', 'Flexed biceps'],
  ['1f680', 'Rocket'],
  ['1f984', 'Unicorn'],
  ['1f436', 'Dog face'],
  ['1f431', 'Cat face'],
  ['1f435', 'Monkey face'],
  ['1f434', 'Horse face'],
  ['1f437', 'Pig face'],
  ['1f438', 'Frog'],
  ['1f43c', 'Panda'],
  ['1f428', 'Koala'],
  ['1f981', 'Lion'],
  ['1f355', 'Pizza'],
  ['1f354', 'Hamburger'],
  ['1f35f', 'French fries'],
  ['1f363', 'Sushi'],
  ['1f368', 'Ice cream'],
  ['1f382', 'Birthday cake'],
  ['2615', 'Hot beverage'],
  ['1f37a', 'Beer mug'],
  ['26bd', 'Soccer ball'],
  ['1f3c0', 'Basketball'],
  ['1f3c6', 'Trophy'],
  ['1f3b8', 'Guitar'],
  ['1f3b6', 'Musical notes'],
  ['1f4f7', 'Camera'],
  ['1f4a1', 'Light bulb'],
  ['1f4da', 'Books'],
  ['1f4b0', 'Money bag'],
  ['1f48e', 'Gem stone'],
  ['23f0', 'Alarm clock'],
  ['1f381', 'Wrapped gift'],
  ['1f388', 'Balloon'],
  ['1f389', 'Party popper'],
  ['1f47b', 'Ghost'],
  ['1f47d', 'Extraterrestrial alien'],
  ['1f916', 'Robot'],
  ['1f383', 'Jack-o-lantern'],
  ['1f385', 'Santa Claus'],
  ['1f31e', 'Sun with face'],
  ['1f319', 'Crescent moon'],
  ['1f308', 'Rainbow'],
  ['2744-fe0f', 'Snowflake'],
  ['26a1', 'High voltage'],
];

/** [ISO 3166-1 alpha-2, country name] — flag emoji riddles. */
const FLAGS = [
  ['US', 'United States'],
  ['GB', 'United Kingdom'],
  ['FR', 'France'],
  ['DE', 'Germany'],
  ['IT', 'Italy'],
  ['ES', 'Spain'],
  ['PT', 'Portugal'],
  ['NL', 'Netherlands'],
  ['BE', 'Belgium'],
  ['CH', 'Switzerland'],
  ['AT', 'Austria'],
  ['PL', 'Poland'],
  ['SE', 'Sweden'],
  ['NO', 'Norway'],
  ['DK', 'Denmark'],
  ['FI', 'Finland'],
  ['IS', 'Iceland'],
  ['IE', 'Ireland'],
  ['GR', 'Greece'],
  ['TR', 'Turkey'],
  ['RU', 'Russia'],
  ['UA', 'Ukraine'],
  ['JP', 'Japan'],
  ['KR', 'South Korea'],
  ['CN', 'China'],
  ['IN', 'India'],
  ['TH', 'Thailand'],
  ['VN', 'Vietnam'],
  ['PH', 'Philippines'],
  ['ID', 'Indonesia'],
  ['MY', 'Malaysia'],
  ['SG', 'Singapore'],
  ['AU', 'Australia'],
  ['NZ', 'New Zealand'],
  ['CA', 'Canada'],
  ['MX', 'Mexico'],
  ['BR', 'Brazil'],
  ['AR', 'Argentina'],
  ['CL', 'Chile'],
  ['CO', 'Colombia'],
  ['PE', 'Peru'],
  ['ZA', 'South Africa'],
  ['EG', 'Egypt'],
  ['MA', 'Morocco'],
  ['NG', 'Nigeria'],
  ['KE', 'Kenya'],
  ['GH', 'Ghana'],
  ['SA', 'Saudi Arabia'],
  ['AE', 'United Arab Emirates'],
  ['IL', 'Israel'],
  ['IR', 'Iran'],
  ['IQ', 'Iraq'],
  ['PK', 'Pakistan'],
  ['BD', 'Bangladesh'],
  ['LK', 'Sri Lanka'],
  ['NP', 'Nepal'],
  ['KZ', 'Kazakhstan'],
  ['MN', 'Mongolia'],
  ['CU', 'Cuba'],
  ['JM', 'Jamaica'],
  ['HT', 'Haiti'],
  ['DO', 'Dominican Republic'],
  ['PA', 'Panama'],
  ['CR', 'Costa Rica'],
  ['HN', 'Honduras'],
  ['GT', 'Guatemala'],
  ['SV', 'El Salvador'],
  ['NI', 'Nicaragua'],
  ['UY', 'Uruguay'],
  ['PY', 'Paraguay'],
  ['BO', 'Bolivia'],
  ['EC', 'Ecuador'],
  ['VE', 'Venezuela'],
  ['GY', 'Guyana'],
  ['ET', 'Ethiopia'],
  ['TZ', 'Tanzania'],
  ['UG', 'Uganda'],
  ['ZM', 'Zambia'],
  ['ZW', 'Zimbabwe'],
  ['MZ', 'Mozambique'],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const esc = (s) => s.replace(/'/g, "''");

function flagCodepoints(alpha2) {
  return alpha2
    .toUpperCase()
    .split('')
    .map((ch) => (0x1f1e6 + ch.charCodeAt(0) - 65).toString(16))
    .join('-');
}

function makeRow(url, title, answer, alts, hint, diffIdx, codepoint) {
  const diff = ['easy', 'medium', 'hard'][diffIdx % 3];
  const timer = [60, 90, 120][diffIdx % 3];
  const h = crypto.createHash('sha1').update(url).digest('hex');
  const id = `84${h.slice(0, 6)}-${h.slice(6, 10)}-41d4-a716-${h.slice(10, 22)}`;
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
      href: `https://github.com/jdecked/twemoji/blob/main/assets/svg/${codepoint}.svg`,
      position: 'below_question',
      order: 90,
      ariaLabel: 'View original image source (Twemoji, CC-BY 4.0)',
    },
  ];
  return (
    `('${id}', '${esc(title)}', '${esc(url)}', '${esc(answer)}', ` +
    `'${esc(JSON.stringify(alts))}'::jsonb, '${esc(hint)}', ` +
    `'${diff}', ${timer}, true, '${esc(`EMOJI image: twemoji ${codepoint}`)}', ` +
    `'${CAT_UUID}', true, 'published', true, ` +
    `'${esc(JSON.stringify(actionOptions))}'::jsonb, 0, 0, 0)`
  );
}

async function verify(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      return res.ok;
    } catch {
      await sleep(500 * attempt);
    }
  }
  return false;
}

(async () => {
  // Seen-set: skip any Twemoji file already used by a previous run.
  const seen = new Set();
  if (fs.existsSync(OUT)) {
    for (const m of fs.readFileSync(OUT, 'utf8').matchAll(/'(https:[^']+)'/g)) seen.add(m[1]);
  }

  const pool = [];
  const poolSeen = new Set(); // same codepoint twice in the lists would break ON CONFLICT
  for (const [cp, name] of EMOJI) {
    const url = `${BASE}/${cp}.svg`;
    if (poolSeen.has(url) || seen.has(url)) continue;
    poolSeen.add(url);
    pool.push({
      url,
      cp,
      title: 'Which emoji is shown here?',
      answer: name,
      alts: [name.toLowerCase()],
      hint: 'It is a standard Unicode emoji - the name describes it',
    });
  }
  for (const [a2, name] of FLAGS) {
    const cp = flagCodepoints(a2);
    const url = `${BASE}/${cp}.svg`;
    if (poolSeen.has(url) || seen.has(url)) continue;
    poolSeen.add(url);
    pool.push({
      url,
      cp,
      title: "Which country's flag is this?",
      answer: name,
      alts: [name.toLowerCase()],
      hint: 'Look at the stripes and the emblem in the middle',
    });
  }

  // HEAD-verify the slice we are about to use (jsDelivr is reliable but check).
  const chosen = [];
  for (const item of pool) {
    if (chosen.length >= TARGET) break;
    if (await verify(item.url)) chosen.push(item);
    await sleep(60);
  }
  if (chosen.length < TARGET) {
    console.log(`WARNING: only ${chosen.length}/${TARGET} verified Twemoji items available`);
  }

  const sql =
    `-- ============================================================================\n` +
    `-- Image riddles: emoji-riddles top-up (${chosen.length} rows, generated ${new Date().toISOString()})\n` +
    `-- Source: Twemoji (jdecked/twemoji), graphics CC-BY 4.0, hotlinked via\n` +
    `-- jsDelivr. The Source link action on every row is the attribution\n` +
    `-- surface - do not remove.\n` +
    `-- Idempotent: ON CONFLICT (id) DO UPDATE. Requires categories from\n` +
    `-- sample-image-riddles.sql / reset-image-riddle-content.js.\n` +
    `-- ============================================================================\n\n` +
    `INSERT INTO image_riddles (id, title, "imageUrl", answer, "alternativeAnswers", hint, difficulty, "timerSeconds", "showTimer", "altText", "categoryId", "isActive", status, "useDefaultActions", "actionOptions", views, attempts, solves) VALUES\n` +
    chosen.map((r, i) => makeRow(r.url, r.title, r.answer, r.alts, r.hint, i, r.cp)).join(',\n') +
    `\nON CONFLICT (id) DO UPDATE SET\n` +
    `  title = EXCLUDED.title, "imageUrl" = EXCLUDED."imageUrl", answer = EXCLUDED.answer,\n` +
    `  "alternativeAnswers" = EXCLUDED."alternativeAnswers", hint = EXCLUDED.hint,\n` +
    `  difficulty = EXCLUDED.difficulty, "timerSeconds" = EXCLUDED."timerSeconds",\n` +
    `  "altText" = EXCLUDED."altText", "categoryId" = EXCLUDED."categoryId",\n` +
    `  status = EXCLUDED.status, "actionOptions" = EXCLUDED."actionOptions";\n`;

  fs.writeFileSync(OUT, sql);
  console.log(`emoji top-up written: ${chosen.length} rows (pool had ${pool.length} unseen)`);
})().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
