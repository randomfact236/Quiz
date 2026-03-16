/**
 * ============================================================================
 * Reset and Seed Quiz Questions
 * ============================================================================
 * This script:
 * 1. Deletes all existing questions from the database
 * 2. Adds 20 new questions across different subjects
 *
 * Usage: npx ts-node src/database/reset-and-seed-questions.ts
 * ============================================================================
 */

import { DataSource } from 'typeorm';

import { getSeedDatabaseConfig, validateDatabaseEnv } from './database-config';

try {
    validateDatabaseEnv();
} catch (error) {
    console.error('❌ Environment validation failed:', (error as Error).message);
    process.exit(1);
}

const dataSource = new DataSource(getSeedDatabaseConfig());

const NEW_QUESTIONS = [
    // Science Questions (5)
    {
        subjectSlug: 'science',
        chapter: 'Physics Basics',
        question: 'What is the speed of light in a vacuum?',
        correctAnswer: '299,792,458 m/s',
        wrongAnswers: ['150,000,000 m/s', '500,000,000 m/s', '199,792,458 m/s'],
        level: 'medium',
    },
    {
        subjectSlug: 'science',
        chapter: 'Chemistry Fundamentals',
        question: 'What is the chemical symbol for gold?',
        correctAnswer: 'Au',
        wrongAnswers: ['Ag', 'Go', 'Gd'],
        level: 'easy',
    },
    {
        subjectSlug: 'science',
        chapter: 'Biology Essentials',
        question: 'What is the powerhouse of the cell?',
        correctAnswer: 'Mitochondria',
        wrongAnswers: ['Nucleus', 'Ribosome', 'Golgi apparatus'],
        level: 'easy',
    },
    {
        subjectSlug: 'science',
        chapter: 'Physics Basics',
        question: 'What is Newton\'s first law of motion also known as?',
        correctAnswer: 'Law of Inertia',
        wrongAnswers: ['Law of Acceleration', 'Law of Action-Reaction', 'Law of Gravity'],
        level: 'medium',
    },
    {
        subjectSlug: 'science',
        chapter: 'Earth Science',
        question: 'What is the largest ocean on Earth?',
        correctAnswer: 'Pacific Ocean',
        wrongAnswers: ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean'],
        level: 'easy',
    },

    // Math Questions (5)
    {
        subjectSlug: 'math',
        chapter: 'Algebra Basics',
        question: 'Solve for x: 3x - 7 = 20',
        correctAnswer: 'x = 9',
        wrongAnswers: ['x = 7', 'x = 8', 'x = 10'],
        level: 'easy',
    },
    {
        subjectSlug: 'math',
        chapter: 'Geometry',
        question: 'What is the area of a circle with radius 5?',
        correctAnswer: '25π',
        wrongAnswers: ['10π', '5π', '50π'],
        level: 'medium',
    },
    {
        subjectSlug: 'math',
        chapter: 'Arithmetic',
        question: 'What is 125 × 8?',
        correctAnswer: '1000',
        wrongAnswers: ['900', '1100', '1200'],
        level: 'easy',
    },
    {
        subjectSlug: 'math',
        chapter: 'Fractions',
        question: 'What is 5/8 expressed as a decimal?',
        correctAnswer: '0.625',
        wrongAnswers: ['0.58', '0.75', '0.825'],
        level: 'medium',
    },
    {
        subjectSlug: 'math',
        chapter: 'Decimals',
        question: 'Round 3.14159 to 2 decimal places',
        correctAnswer: '3.14',
        wrongAnswers: ['3.15', '3.12', '3.10'],
        level: 'easy',
    },

    // History Questions (5)
    {
        subjectSlug: 'history',
        chapter: 'Ancient Civilizations',
        question: 'In which year did World War II end?',
        correctAnswer: '1945',
        wrongAnswers: ['1944', '1946', '1943'],
        level: 'easy',
    },
    {
        subjectSlug: 'history',
        chapter: 'Ancient Civilizations',
        question: 'Who was the first President of the United States?',
        correctAnswer: 'George Washington',
        wrongAnswers: ['Thomas Jefferson', 'John Adams', 'Benjamin Franklin'],
        level: 'easy',
    },
    {
        subjectSlug: 'history',
        chapter: 'World Wars',
        question: 'What year did World War I begin?',
        correctAnswer: '1914',
        wrongAnswers: ['1915', '1913', '1916'],
        level: 'medium',
    },
    {
        subjectSlug: 'history',
        chapter: 'Renaissance',
        question: 'Who painted the Mona Lisa?',
        correctAnswer: 'Leonardo da Vinci',
        wrongAnswers: ['Michelangelo', 'Raphael', 'Donatello'],
        level: 'easy',
    },
    {
        subjectSlug: 'history',
        chapter: 'Modern History',
        question: 'What was the name of the first man to walk on the Moon?',
        correctAnswer: 'Neil Armstrong',
        wrongAnswers: ['Buzz Aldrin', 'John Glenn', 'Yuri Gagarin'],
        level: 'easy',
    },

    // Geography Questions (5)
    {
        subjectSlug: 'geography',
        chapter: 'World Continents',
        question: 'What is the largest continent in the world?',
        correctAnswer: 'Asia',
        wrongAnswers: ['Africa', 'North America', 'Europe'],
        level: 'easy',
    },
    {
        subjectSlug: 'geography',
        chapter: 'Capitals',
        question: 'What is the capital of France?',
        correctAnswer: 'Paris',
        wrongAnswers: ['London', 'Berlin', 'Madrid'],
        level: 'easy',
    },
    {
        subjectSlug: 'geography',
        chapter: 'Countries',
        question: 'Which country has the largest population?',
        correctAnswer: 'China',
        wrongAnswers: ['India', 'USA', 'Indonesia'],
        level: 'medium',
    },
    {
        subjectSlug: 'geography',
        chapter: 'Oceans & Seas',
        question: 'Which is the smallest ocean?',
        correctAnswer: 'Arctic Ocean',
        wrongAnswers: ['Indian Ocean', 'Atlantic Ocean', 'Pacific Ocean'],
        level: 'easy',
    },
    {
        subjectSlug: 'geography',
        chapter: 'Mountains',
        question: 'What is the highest mountain in the world?',
        correctAnswer: 'Mount Everest',
        wrongAnswers: ['K2', 'Kangchenjunga', 'Lhotse'],
        level: 'easy',
    },
];

async function resetAndSeedQuestions() {
    console.log('🔄 Connecting to database...\n');
    await dataSource.initialize();

    try {
        // Step 1: Delete all existing questions
        console.log('🗑️  Deleting all existing questions...');
        await dataSource.query('DELETE FROM questions');
        console.log('✅ All questions deleted\n');

        // Step 2: Get subject IDs
        console.log('📚 Fetching subject IDs...');
        const subjectRows = await dataSource.query(`
            SELECT id, slug FROM subjects
        `);
        
        const subjectMap = new Map(subjectRows.map((row: any) => [row.slug, row.id]));
        
        if (subjectMap.size === 0) {
            throw new Error('No subjects found in database. Please run the main seed first.');
        }
        console.log(`✅ Found ${subjectMap.size} subjects\n`);

        // Step 3: Get or create chapters for each subject
        console.log('📖 Setting up chapters...');
        const chapterMap = new Map<string, string>();

        for (const q of NEW_QUESTIONS) {
            const chapterKey = `${q.subjectSlug}:${q.chapter}`;
            
            if (!chapterMap.has(chapterKey)) {
                const subjectId = subjectMap.get(q.subjectSlug);
                if (!subjectId) {
                    console.warn(`⚠️  Subject not found: ${q.subjectSlug}, skipping questions`);
                    continue;
                }

                // Check if chapter exists
                const chapters = await dataSource.query(
                    `SELECT id FROM chapters WHERE name = $1 AND "subjectId" = $2`,
                    [q.chapter, subjectId]
                );

                let chapterId: string;
                if (chapters.length > 0) {
                    chapterId = chapters[0].id;
                } else {
                    // Create new chapter
                    const result = await dataSource.query(
                        `INSERT INTO chapters (name, "chapterNumber", "subjectId") VALUES ($1, $2, $3) RETURNING id`,
                        [q.chapter, 1, subjectId]
                    );
                    chapterId = result[0].id;
                }
                
                chapterMap.set(chapterKey, chapterId);
            }
        }
        console.log(`✅ Set up ${chapterMap.size} chapters\n`);

        // Step 4: Insert new questions
        console.log('📝 Inserting 20 new questions...\n');
        
        for (let i = 0; i < NEW_QUESTIONS.length; i++) {
            const q = NEW_QUESTIONS[i];
            const chapterKey = `${q.subjectSlug}:${q.chapter}`;
            const chapterId = chapterMap.get(chapterKey);

            if (!chapterId) {
                console.warn(`⚠️  Chapter not found for: ${q.question}`);
                continue;
            }

            await dataSource.query(
                `INSERT INTO questions (question, "correctAnswer", options, level, "chapterId", explanation, status)
                 VALUES ($1, $2, $3, $4, $5, $6, 'published')`,
                [
                    q.question,
                    q.correctAnswer,
                    JSON.stringify([q.correctAnswer, ...q.wrongAnswers]),
                    q.level,
                    chapterId,
                    `Correct answer: ${q.correctAnswer}`
                ]
            );
            console.log(`   ${i + 1}. [${q.subjectSlug.toUpperCase()}] ${q.question.substring(0, 50)}...`);
        }

        console.log('\n✅ Successfully seeded 20 new questions!');
        
        // Verify count
        const countResult = await dataSource.query('SELECT COUNT(*) as count FROM questions');
        console.log(`📊 Total questions in database: ${countResult[0].count}`);

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        await dataSource.destroy();
    }
}

resetAndSeedQuestions()
    .then(() => {
        console.log('\n🎉 Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Failed:', error.message);
        process.exit(1);
    });
