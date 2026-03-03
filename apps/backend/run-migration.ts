/**
 * ============================================================================
 * Run Database Migration
 * ============================================================================
 * Simple script to run the riddle tables migration
 * Usage: npx ts-node run-migration.ts
 * ============================================================================
 */

import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { CreateRiddleTables1700000000000 } from './src/database/migrations/1700000000000-CreateRiddleTables';

// Load environment variables
config();

async function runMigration() {
  console.log('🗄️  Connecting to database...');
  
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [],
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connected');
    
    console.log('📦 Running migration: CreateRiddleTables...');
    
    const migration = new CreateRiddleTables1700000000000();
    const queryRunner = dataSource.createQueryRunner();
    
    await migration.up(queryRunner);
    
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('📊 Tables created:');
    console.log('  - riddle_categories');
    console.log('  - riddles');
    console.log('  - riddle_subjects');
    console.log('  - riddle_chapters');
    console.log('  - quiz_riddles');
    
    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

runMigration();
