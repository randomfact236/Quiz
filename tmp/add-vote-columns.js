/**
 * One-shot script: adds likes & dislikes columns to the dad_jokes table.
 * Usage: node tmp/add-vote-columns.js
 */
const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'aiquiz',
    password: 'aiquiz_password',
    database: 'aiquiz',
});

async function run() {
    await client.connect();
    console.log('Connected to PostgreSQL.');

    // Check current columns
    const check = await client.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'dad_jokes' AND column_name IN ('likes', 'dislikes');
  `);
    const existing = check.rows.map(r => r.column_name);
    console.log('Existing columns:', existing);

    if (!existing.includes('likes')) {
        await client.query(`ALTER TABLE dad_jokes ADD COLUMN likes INTEGER NOT NULL DEFAULT 0;`);
        console.log('✅ Added column: likes');
    } else {
        console.log('ℹ️  Column "likes" already exists, skipping.');
    }

    if (!existing.includes('dislikes')) {
        await client.query(`ALTER TABLE dad_jokes ADD COLUMN dislikes INTEGER NOT NULL DEFAULT 0;`);
        console.log('✅ Added column: dislikes');
    } else {
        console.log('ℹ️  Column "dislikes" already exists, skipping.');
    }

    // Verify
    const verify = await client.query(`
    SELECT column_name, data_type FROM information_schema.columns
    WHERE table_name = 'dad_jokes' AND column_name IN ('likes', 'dislikes');
  `);
    console.log('\nVerification:', verify.rows);

    await client.end();
    console.log('\nDone! Restart your backend server.');
}

run().catch(err => {
    console.error('Error:', err.message);
    client.end();
    process.exit(1);
});
