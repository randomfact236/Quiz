/**
 * ============================================================================
 * Database Seed
 * ============================================================================
 * Main seed file that orchestrates database seeding using helper functions
 * 
 * SECURITY NOTES:
 * - Only runs in non-production environments
 * - Uses migrations instead of synchronize
 * - Validates environment before execution
 * ============================================================================
 */

import { DataSource } from 'typeorm';
import {
  seedSubjects,
  seedChapters,
  seedQuestions,
  seedJokeCategories,
  seedDadJokes,
  seedRiddleCategories,
  seedRiddles,
  seedAdminUser,
} from './seed-helpers';
import { getSeedDatabaseConfig, validateDatabaseEnv } from './database-config';

// Validate environment before proceeding
try {
  validateDatabaseEnv();
} catch (error) {
  console.error('❌ Environment validation failed:', (error as Error).message);
  process.exit(1);
}

// Create data source with seed-specific configuration
const _AppDataSource = new DataSource(getSeedDatabaseConfig());

/**
 * Main seed function - orchestrates all seeding operations
 * Complexity reduced by delegating to specialized helper functions
 */
async function seed(): Promise<void> {
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  console.log(`🌱 Starting database seed in ${nodeEnv} environment...`);
  console.log('⚠️  This will insert sample data into the database.');
  
  // Double-check we're not in production
  if (nodeEnv === 'production') {
    console.error('❌ Seeding is not allowed in production!');
    process.exit(1);
  }

  try {
    await _AppDataSource.initialize();
    console.log('✅ Database connection established');

    // Seed Subjects
    console.log('📚 Seeding subjects...');
    const insertedSubjects = await seedSubjects(_AppDataSource);

    // Seed Chapters for each subject
    console.log('📖 Seeding chapters...');
    const insertedChapters = await seedChapters(_AppDataSource, insertedSubjects);

    // Seed Sample Questions
    console.log('❓ Seeding questions...');
    await seedQuestions(_AppDataSource, insertedChapters);

    // Seed Joke Categories
    console.log('😄 Seeding joke categories...');
    const insertedJokeCategories = await seedJokeCategories(_AppDataSource);

    // Seed Dad Jokes
    console.log('🎭 Seeding dad jokes...');
    await seedDadJokes(_AppDataSource, insertedJokeCategories);

    // Seed Riddle Categories
    console.log('🧩 Seeding riddle categories...');
    const insertedRiddleCategories = await seedRiddleCategories(_AppDataSource);

    // Seed Riddles
    console.log('🎯 Seeding riddles...');
    await seedRiddles(_AppDataSource, insertedRiddleCategories);

    // Seed Admin User
    console.log('👤 Seeding admin user...');
    await seedAdminUser(_AppDataSource);

    console.log('✅ Seeding completed successfully!');
    await _AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    await _AppDataSource.destroy().catch(() => {});
    process.exit(1);
  }
}

// Run seed
seed();
