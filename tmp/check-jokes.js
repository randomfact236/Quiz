const { Client } = require('pg');

const client = new Client({
    host: 'localhost', port: 5432,
    user: 'aiquiz', password: 'aiquiz_password', database: 'aiquiz',
});

async function run() {
    await client.connect();
    const res = await client.query(`SELECT id, setup, likes, dislikes FROM dad_jokes LIMIT 5;`);
    console.log('Sample jokes:', JSON.stringify(res.rows, null, 2));
    await client.end();
}

run().catch(e => { console.error(e.message); client.end(); process.exit(1); });
