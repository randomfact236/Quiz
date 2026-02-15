/**
 * ============================================================================
 * Database Seed
 * ============================================================================
 * Main seed file that orchestrates database seeding using helper functions
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
import { DB_PORT } from '../common/constants/app.constants';

const _AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || String(DB_PORT), 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'ai_quiz',
  synchronize: true,
});

/**
 * Main seed function - orchestrates all seeding operations
 * Complexity reduced by delegating to specialized helper functions
 */
async function seed(): Promise<void> {
  await _AppDataSource.initialize();

  // Seed Subjects
  const insertedSubjects = await seedSubjects(_AppDataSource);

  // Seed Chapters for each subject
  const insertedChapters = await seedChapters(_AppDataSource, insertedSubjects);

  // Seed Sample Questions
  await seedQuestions(_AppDataSource, insertedChapters);

  // Seed Joke Categories
  const insertedJokeCategories = await seedJokeCategories(_AppDataSource);

  // Seed Dad Jokes
  await seedDadJokes(_AppDataSource, insertedJokeCategories);

  // Seed Riddle Categories
  const insertedRiddleCategories = await seedRiddleCategories(_AppDataSource);

  // Seed Riddles
  await seedRiddles(_AppDataSource, insertedRiddleCategories);

  // Seed Admin User
  await seedAdminUser(_AppDataSource);

  await _AppDataSource.destroy();
}

seed().catch((err: unknown) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
