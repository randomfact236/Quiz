/**
 * ============================================================================
 * Riddle Seed Data
 * ============================================================================
 * Seeds initial riddle subjects, chapters, and quiz riddles
 * Run with: npx ts-node src/database/seed-riddles.ts
 * ============================================================================
 */

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
  entities: [],
  synchronize: false,
});

async function seedRiddles() {
  try {
    await dataSource.initialize();
    console.log('📦 Database connected');

    // Check if we already have subjects
    const existingSubjects = await dataSource.query(
      'SELECT COUNT(*) as count FROM riddle_subjects'
    );
    
    if (parseInt(existingSubjects[0].count) > 0) {
      console.log('✅ Riddle subjects already exist, skipping seed');
      await dataSource.destroy();
      return;
    }

    console.log('🌱 Seeding riddle data...');

    // Insert riddle subjects
    const subjects = await dataSource.query(`
      INSERT INTO riddle_subjects (slug, name, emoji, description, "order", "isActive") 
      VALUES 
        ('brain-teasers', 'Brain Teasers', '🧩', 'Mind-bending riddles and puzzles', 1, true),
        ('logic-puzzles', 'Logic Puzzles', '🎯', 'Test your logical reasoning', 2, true),
        ('word-riddles', 'Word Riddles', '💬', 'Wordplay and language riddles', 3, true),
        ('math-riddles', 'Math Riddles', '🔢', 'Mathematical puzzles and problems', 4, true),
        ('mystery-riddles', 'Mystery Riddles', '🔍', 'Solve the mystery riddles', 5, true)
      RETURNING id, slug, name
    `);

    console.log(`✅ Inserted ${subjects.length} subjects`);

    // Create chapters for each subject
    const chapterData: Record<string, string[]> = {
      'brain-teasers': ['Trick Questions', 'Visual Puzzles', 'Lateral Thinking', 'Brain Warm-ups'],
      'logic-puzzles': ['Deduction', 'Pattern Recognition', 'Sequencing', 'Logical Fallacies'],
      'word-riddles': ['Anagrams', 'Homophones', 'Rhyming Riddles', 'Word Associations'],
      'math-riddles': ['Number Patterns', 'Geometry', 'Probability', 'Algebraic Thinking'],
      'mystery-riddles': ['Who Done It', 'Missing Items', 'Strange Events', 'Hidden Clues']
    };

    let totalChapters = 0;
    let totalRiddles = 0;

    for (const subject of subjects) {
      const chapters = chapterData[subject.slug] || [];
      
      for (let i = 0; i < chapters.length; i++) {
        const chapterResult = await dataSource.query(`
          INSERT INTO riddle_chapters (name, "chapterNumber", "subjectId")
          VALUES ($1, $2, $3)
          RETURNING id
        `, [chapters[i], i + 1, subject.id]);

        const chapterId = chapterResult[0].id;
        totalChapters++;

        // Insert sample riddles for each chapter
        const sampleRiddles = generateSampleRiddles(subject.slug, chapters[i]);
        
        for (const riddle of sampleRiddles) {
          await dataSource.query(`
            INSERT INTO quiz_riddles (question, options, "correctAnswer", level, "chapterId", explanation, hint)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [
            riddle.question,
            riddle.options,
            riddle.correctAnswer,
            riddle.level,
            chapterId,
            riddle.explanation,
            riddle.hint
          ]);
          totalRiddles++;
        }
      }
    }

    console.log(`✅ Inserted ${totalChapters} chapters`);
    console.log(`✅ Inserted ${totalRiddles} quiz riddles`);
    console.log('🎉 Riddle seed completed successfully!');

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Seed failed:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

function generateSampleRiddles(subjectSlug: string, chapterName: string) {
  const riddles = [];
  
  // Generate 3-5 riddles per chapter with varying difficulty
  const levels = ['easy', 'medium', 'hard', 'expert'];
  
  const templates: Record<string, Array<{q: string, options: string[], answer: string, hint: string}>> = {
    'brain-teasers': [
      { q: 'What has keys but no locks?', options: ['A piano', 'A keyboard', 'A map', 'A car'], answer: 'A piano', hint: 'Think about music' },
      { q: 'What has a head and a tail but no body?', options: ['A coin', 'A snake', 'A rope', 'A bookmark'], answer: 'A coin', hint: 'Used for purchases' },
      { q: 'The more you take, the more you leave behind. What am I?', options: ['Footsteps', 'Memories', 'Time', 'Money'], answer: 'Footsteps', hint: 'You make them when walking' },
      { q: 'What gets wetter the more it dries?', options: ['A towel', 'A sponge', 'Water', 'Rain'], answer: 'A towel', hint: 'Used after showering' },
    ],
    'logic-puzzles': [
      { q: 'If all Bloops are Razzies and all Razzies are Lazzies, are all Bloops definitely Lazzies?', options: ['Yes', 'No', 'Maybe', 'Not enough info'], answer: 'Yes', hint: 'Transitive property' },
      { q: 'A farmer has 17 sheep and all but 9 die. How many are left?', options: ['9', '8', '17', '0'], answer: '9', hint: 'Read carefully: all BUT 9' },
      { q: 'What is the next number in the sequence: 2, 4, 8, 16, ?', options: ['32', '24', '20', '36'], answer: '32', hint: 'Powers of 2' },
    ],
    'word-riddles': [
      { q: 'I speak without a mouth and hear without ears. What am I?', options: ['An echo', 'A ghost', 'A phone', 'Radio'], answer: 'An echo', hint: 'Sound reflection' },
      { q: 'What 5-letter word becomes shorter when you add two letters to it?', options: ['Short', 'Small', 'Brief', 'Little'], answer: 'Short', hint: 'The word itself' },
      { q: 'What word is spelled incorrectly in every dictionary?', options: ['Incorrectly', 'Misspelled', 'Wrong', 'Error'], answer: 'Incorrectly', hint: 'Read the question again' },
    ],
    'math-riddles': [
      { q: 'What has to be broken before you can use it?', options: ['An egg', 'A code', 'A seal', 'A promise'], answer: 'An egg', hint: 'Breakfast item' },
      { q: 'Using only addition, add eight 8s to get 1000.', options: ['888 + 88 + 8 + 8 + 8', '8+8+8+8+8+8+8+8', '8888', 'Not possible'], answer: '888 + 88 + 8 + 8 + 8', hint: 'Three digits' },
      { q: 'How many sides does a circle have?', options: ['Two', 'None', 'One', 'Infinite'], answer: 'Two', hint: 'Inside and outside' },
    ],
    'mystery-riddles': [
      { q: 'A man was found dead in a room with a puddle of water. How did he die?', options: ['Stabbed with an icicle', 'Drowned', 'Poisoned', 'Fell'], answer: 'Stabbed with an icicle', hint: 'The puddle is a clue' },
      { q: 'A woman calls the police saying her husband was murdered. Police know she did it. How?', options: ['She knew he was murdered before being told', 'She had blood on her', 'She was crying', 'She called too fast'], answer: 'She knew he was murdered before being told', hint: 'How did she know it was murder?' },
    ],
  };

  const subjectTemplates = templates[subjectSlug] || templates['brain-teasers'];
  
  for (let i = 0; i < subjectTemplates.length; i++) {
    const template = subjectTemplates[i];
    riddles.push({
      question: template.q,
      options: template.options,
      correctAnswer: template.answer,
      level: levels[i % levels.length],
      explanation: `The answer is ${template.answer}.`,
      hint: template.hint
    });
  }

  return riddles;
}

seedRiddles();
