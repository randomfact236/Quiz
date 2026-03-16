
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

config({ path: path.join(__dirname, '../apps/backend/.env') });

const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [],
    synchronize: false,
});

async function countRiddles() {
    try {
        await dataSource.initialize();
        console.log('📦 Database connected');

        const result = await dataSource.query(
            'SELECT COUNT(*) as count FROM riddle_mcqs'
        );

        console.log(`TOTAL_RIDDLE_MCQS: ${result[0].count}`);
        await dataSource.destroy();
    } catch (error) {
        console.error('❌ Connection failed:', error);
        if (dataSource.isInitialized) await dataSource.destroy();
    }
}

countRiddles();
