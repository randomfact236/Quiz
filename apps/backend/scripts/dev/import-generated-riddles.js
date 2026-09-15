/**
 * Import all generated bulk-seed-*.sql files into the DB in one transaction,
 * flush the image-riddles caches, and print per-category counts.
 * Idempotent: rows upsert on id. Categories must already exist.
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const envPath = path.join(__dirname, '..', '..', '..', '..', 'apps', 'backend', '.env');
for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
}

(async () => {
  const files = fs
    .readdirSync(__dirname)
    .filter((f) => /^bulk-seed-.*\.sql$/.test(f))
    .sort();
  if (files.length === 0) throw new Error('no bulk-seed-*.sql files found');

  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });
  await client.connect();

  try {
    await client.query('BEGIN');
    for (const f of files) {
      const sql = fs.readFileSync(path.join(__dirname, f), 'utf8');
      await client.query(sql);
      console.log(`imported ${f}`);
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('ROLLED BACK:', e.message);
    process.exitCode = 1;
    await client.end();
    return;
  }

  const counts = await client.query(`
    SELECT c.name, c.emoji, count(r.id)::int AS riddles
    FROM image_riddle_categories c
    LEFT JOIN image_riddles r ON r."categoryId" = c.id
    GROUP BY c.name, c.emoji
    ORDER BY c.name`);
  const total = await client.query('SELECT count(*)::int AS n FROM image_riddles');
  console.log(`\nTOTAL riddles: ${total.rows[0].n}`);
  for (const r of counts.rows) console.log(`  ${r.emoji} ${r.name}: ${r.riddles}`);
  await client.end();
})().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
