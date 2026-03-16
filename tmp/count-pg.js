
const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../apps/backend/.env') });

const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
});

async function run() {
    try {
        await client.connect();
        console.log('Connected to database');
        const res = await client.query('SELECT count(*) FROM riddle_mcqs');
        console.log('COUNT:' + res.rows[0].count);
        await client.end();
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

run();
