/**
 * Reset image riddle content (dev tool).
 *
 * In one transaction:
 *  1. Deletes ALL rows from image_riddles.
 *  2. Deletes ALL rows from image_riddle_categories.
 *  3. Seeds the 10 launch categories (owner-approved 2026-09-15).
 *
 * The feature code is untouched — this only resets content.
 */
const path = require('path');
const fs = require('fs');
const { Client } = require('pg');

const envPath = path.join(__dirname, '..', '..', '..', '..', 'apps', 'backend', '.env');
for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
}

/** 10 owner-approved launch categories (2026-09-15). */
const CATEGORIES = [
  [
    '7f3c9a1e-4b2d-4e8f-9a6c-1d5e8b2f7a41',
    'Hidden Objects',
    '🔍',
    'Find items tucked away in busy scenes',
  ],
  [
    '8a4d0b2f-5c3e-4f9a-8b7d-2e6f9c3a8b52',
    'Optical Illusions',
    '👁️',
    'Images that trick your eyes and brain',
  ],
  [
    '9b5e1c3a-6d4f-4a0b-9c8e-3f7a0d4b9c63',
    'Spot the Difference',
    '🔄',
    'Two images, a handful of sneaky changes',
  ],
  [
    '0c6f2d4b-7e5a-4b1c-8d9f-4a8b1e5c0d74',
    'Rebus Puzzles',
    '💬',
    'Picture combinations that spell out words and phrases',
  ],
  [
    '1d7a3e5c-8f6b-4c2d-9e0a-5b9c2f6d1e85',
    'Emoji Riddles',
    '😄',
    'Guess the movie, song, or phrase from emojis',
  ],
  [
    '2e8b4f6d-9a7c-4d3e-8f1b-6c0d3a7e2f96',
    'Close-up Challenges',
    '🔬',
    'Everyday objects seen way too close',
  ],
  [
    '3f9c5a7e-0b8d-4e4f-9a2c-7d1e4b8f3a07',
    'Animal Camouflage',
    '🐾',
    'Spot the creature hiding in plain sight',
  ],
  [
    '4a0d6b8f-1c9e-4f5a-8b3d-8e2f5c9a4b18',
    'Counting Challenges',
    '🔢',
    'Count what you see — most people get it wrong',
  ],
  [
    '5b1e7c9a-2d0f-4a6b-9c4e-9f3a6d0b5c29',
    'Landmarks & Places',
    '🌍',
    'Name the city or monument from a photo',
  ],
  [
    '6c2f8d0b-3e1a-4b7c-8d5f-0a4b7e1c6d30',
    'Logos & Brands',
    '🏷️',
    'Recognize the brand from a cropped logo',
  ],
];

(async () => {
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

    const beforeRiddles = await client.query('SELECT count(*)::int AS n FROM image_riddles');
    const beforeCats = await client.query('SELECT count(*)::int AS n FROM image_riddle_categories');

    await client.query('DELETE FROM image_riddles');
    await client.query('DELETE FROM image_riddle_categories');

    for (const [id, name, emoji, description] of CATEGORIES) {
      await client.query(
        'INSERT INTO image_riddle_categories (id, name, emoji, description) VALUES ($1, $2, $3, $4)',
        [id, name, emoji, description]
      );
    }

    const afterRiddles = await client.query('SELECT count(*)::int AS n FROM image_riddles');
    const afterCats = await client.query('SELECT count(*)::int AS n FROM image_riddle_categories');

    await client.query('COMMIT');

    console.log(`riddles: ${beforeRiddles.rows[0].n} -> ${afterRiddles.rows[0].n}`);
    console.log(`categories: ${beforeCats.rows[0].n} -> ${afterCats.rows[0].n}`);
    for (const [, name, emoji] of CATEGORIES) console.log(`  ${emoji} ${name}`);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('ROLLED BACK:', e.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
