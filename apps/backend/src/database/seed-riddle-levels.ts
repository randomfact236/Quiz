/**
 * ============================================================================
 * Riddle MCQ Seed - One riddle per difficulty level
 * ============================================================================
 * Run with: npx ts-node src/database/seed-riddle-levels.ts
 * ============================================================================
 */

import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: false,
});

async function seedRiddleLevels() {
  try {
    await dataSource.initialize();
    console.log('📦 Database connected');

    // Get first subject
    const subjects = await dataSource.query(`
      SELECT id, slug, name FROM riddle_subjects 
      WHERE "isActive" = true 
      LIMIT 1
    `);

    if (subjects.length === 0) {
      console.log('❌ No riddle subjects found. Run seed-riddles.ts first.');
      await dataSource.destroy();
      return;
    }

    const subjectId = subjects[0].id;
    console.log(`📚 Using subject: ${subjects[0].name}`);

    // Get or create a chapter
    const chapters = await dataSource.query(`
      SELECT id FROM riddle_chapters 
      WHERE "subjectId" = $1 
      LIMIT 1
    `, [subjectId]);

    let chapterId: string;
    if (chapters.length === 0) {
      const newChapter = await dataSource.query(`
        INSERT INTO riddle_chapters (name, "chapterNumber", "subjectId")
        VALUES ('General', 1, $1)
        RETURNING id
      `, [subjectId]);
      chapterId = newChapter[0].id;
    } else {
      chapterId = chapters[0].id;
    }

    // Riddle templates - one for each level
    const riddles = [
      {
        level: 'easy',
        question: 'What has keys but no locks?',
        options: ['A piano', 'A keyboard', 'A map', 'A car'],
        correctLetter: 'A',
        correctAnswer: 'A piano',
        hint: 'Think about music',
        explanation: 'A piano has musical keys that you press to play notes.'
      },
      {
        level: 'medium',
        question: 'The more you take, the more you leave behind. What am I?',
        options: ['Footsteps', 'Time', 'Money', 'Memories'],
        correctLetter: 'A',
        correctAnswer: 'Footsteps',
        hint: 'You make these when you walk',
        explanation: 'Every step you take leaves footprints behind.'
      },
      {
        level: 'hard',
        question: 'I speak without a mouth and hear without ears. I have no body, but I come alive with the wind. What am I?',
        options: ['An echo', 'A ghost', 'A shadow', 'A dream'],
        correctLetter: 'A',
        correctAnswer: 'An echo',
        hint: 'Think about sound',
        explanation: 'An echo is sound reflecting, appearing to speak without a mouth and hear without ears.'
      },
      {
        level: 'expert',
        question: 'A man builds a house with all four sides facing south. A bear walks past the house. What color is the bear?',
        options: ['White', 'Brown', 'Black', 'Yellow'],
        correctLetter: 'A',
        correctAnswer: 'White',
        hint: 'Think about the poles',
        explanation: 'Only at the North Pole can all four sides face south. Polar bears are white.'
      }
    ];

    console.log('🌱 Seeding riddles for each level...\n');

    for (const riddle of riddles) {
      // Check if riddle already exists
      const existing = await dataSource.query(`
        SELECT id FROM riddle_mcqs 
        WHERE question = $1 AND level = $2
      `, [riddle.question, riddle.level]);

      if (existing.length > 0) {
        console.log(`⏭️  Skipping ${riddle.level}: "${riddle.question}" (already exists)`);
        continue;
      }

      await dataSource.query(`
        INSERT INTO riddle_mcqs 
        (question, options, "correctLetter", "correctAnswer", level, hint, explanation, "subjectId", "chapterId")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        riddle.question,
        riddle.options,
        riddle.correctLetter,
        riddle.correctAnswer,
        riddle.level,
        riddle.hint,
        riddle.explanation,
        subjectId,
        chapterId
      ]);

      console.log(`✅ Created ${riddle.level} riddle: "${riddle.question}"`);
    }

    console.log('\n✨ Done! Riddles seeded successfully.');
    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error seeding riddles:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

seedRiddleLevels();
