import { DataSource } from 'typeorm';
import { config } from 'dotenv';
config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: false,
  logging: false,
});

async function main() {
  await dataSource.initialize();
  
  const result = await dataSource.query('SELECT COUNT(*) as count FROM questions');
  console.log('Total questions:', result[0].count);
  
  const byStatus = await dataSource.query(`
    SELECT status, COUNT(*) as count 
    FROM questions 
    GROUP BY status 
    ORDER BY count DESC
  `);
  console.log('\nBy status:');
  byStatus.forEach((row: any) => console.log(`  ${row.status}: ${row.count}`));
  
  const byLevel = await dataSource.query(`
    SELECT level, COUNT(*) as count 
    FROM questions 
    GROUP BY level 
    ORDER BY count DESC
  `);
  console.log('\nBy level:');
  byLevel.forEach((row: any) => console.log(`  ${row.level}: ${row.count}`));
  
  await dataSource.destroy();
}

main().catch(console.error);
