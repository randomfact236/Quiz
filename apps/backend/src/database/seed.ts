/**
 * Safe default seed entry point (`npm run seed`).
 * ============================================================================
 * Refuses to run in production, then delegates to the non-destructive
 * seed-test-data script (inserts starter subjects/chapters/questions).
 *
 * Other seed scripts (run directly with ts-node):
 *   - seed-math-questions.ts       insert Math questions
 *   - seed-test-questions.ts       insert test questions
 *   - reset-and-seed-questions.ts  DESTRUCTIVE: wipes all questions first
 * ============================================================================
 */

if (process.env.NODE_ENV === 'production') {
  console.error('❌ Refusing to run seed in production (NODE_ENV=production).');
  process.exit(1);
}

require('./seed-test-data');
