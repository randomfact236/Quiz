/**
 * Seed Math Questions
 * ============================================================================
 * Standalone seed script that inserts 10 dummy Math questions into the
 * existing Math subject with proper chapters.
 *
 * Usage: npx ts-node src/database/seed-math-questions.ts
 * ============================================================================
 */

import { DataSource } from 'typeorm';

import { getSeedDatabaseConfig, validateDatabaseEnv } from './database-config';

// Validate environment before proceeding
try {
    validateDatabaseEnv();
} catch (error) {
    console.error('❌ Environment validation failed:', (error as Error).message);
    process.exit(1);
}

const dataSource = new DataSource(getSeedDatabaseConfig());

interface QueryRow {
    id: string;
}

// ── 10 Math questions across 5 chapters ──────────────────────────────────────
const MATH_QUESTIONS = [
    // Arithmetic
    {
        chapter: 'Arithmetic',
        question: 'What is 15 × 8?',
        correctAnswer: '120',
        wrongAnswers: ['110', '130', '140'],
        level: 'easy',
    },
    {
        chapter: 'Arithmetic',
        question: 'What is 144 ÷ 12?',
        correctAnswer: '12',
        wrongAnswers: ['10', '11', '13'],
        level: 'easy',
    },
    // Algebra Basics
    {
        chapter: 'Algebra Basics',
        question: 'Solve for x: 2x + 5 = 15',
        correctAnswer: 'x = 5',
        wrongAnswers: ['x = 3', 'x = 4', 'x = 6'],
        level: 'medium',
    },
    {
        chapter: 'Algebra Basics',
        question: 'If y = 3x and x = 4, what is y?',
        correctAnswer: '12',
        wrongAnswers: ['7', '9', '16'],
        level: 'easy',
    },
    // Geometry
    {
        chapter: 'Geometry',
        question: 'What is the sum of interior angles in a triangle?',
        correctAnswer: '180°',
        wrongAnswers: ['90°', '270°', '360°'],
        level: 'easy',
    },
    {
        chapter: 'Geometry',
        question: 'What is the area of a rectangle with length 8 and width 5?',
        correctAnswer: '40',
        wrongAnswers: ['26', '13', '80'],
        level: 'easy',
    },
    // Fractions
    {
        chapter: 'Fractions',
        question: 'Simplify: 3/4 + 1/4',
        correctAnswer: '1',
        wrongAnswers: ['4/8', '3/8', '1/2'],
        level: 'easy',
    },
    {
        chapter: 'Fractions',
        question: 'What is 2/3 of 60?',
        correctAnswer: '40',
        wrongAnswers: ['30', '20', '45'],
        level: 'medium',
    },
    // Decimals
    {
        chapter: 'Decimals',
        question: 'What is the value of π to 2 decimal places?',
        correctAnswer: '3.14',
        wrongAnswers: ['3.12', '3.16', '3.18'],
        level: 'easy',
    },
    {
        chapter: 'Decimals',
        question: 'What is 0.75 expressed as a fraction?',
        correctAnswer: '3/4',
        wrongAnswers: ['1/2', '2/3', '7/10'],
        level: 'medium',
    },
];

async function seedMathQuestions(): Promise<void> {

    await dataSource.initialize();

    // ── 1. Find Math subject ───────────────────────────────────────────────────
    const subjectRows = await dataSource.query<QueryRow[]>(
        `SELECT id FROM subjects WHERE slug = 'math' LIMIT 1`,
    );

    if (subjectRows.length === 0) {
        console.error('❌ Math subject not found. Run the main seed first (npm run seed).');
        await dataSource.destroy();
        process.exit(1);
    }
    const mathSubjectId = subjectRows[0].id;

    // ── 2. Ensure each required chapter exists ─────────────────────────────────
    const requiredChapters = [...new Set(MATH_QUESTIONS.map(q => q.chapter))];
    const chapterIdMap: Record<string, string> = {};

    for (let i = 0; i < requiredChapters.length; i++) {
        const chapterName = requiredChapters[i];

        // Try to find existing chapter
        const existing = await dataSource.query<QueryRow[]>(
            `SELECT id FROM chapters WHERE name = $1 AND "subjectId" = $2 LIMIT 1`,
            [chapterName, mathSubjectId],
        );

        if (existing.length > 0) {
            chapterIdMap[chapterName] = existing[0].id;

        } else {
            // Insert new chapter with next available chapterNumber
            const maxNumRows = await dataSource.query<{ max: string | null }[]>(
                `SELECT MAX("chapterNumber") as max FROM chapters WHERE "subjectId" = $1`,
                [mathSubjectId],
            );
            const nextNum = (parseInt(maxNumRows[0]?.max ?? '0', 10) || 0) + 1;

            const created = await dataSource.query<QueryRow[]>(
                `INSERT INTO chapters (name, "chapterNumber", "subjectId") VALUES ($1, $2, $3) RETURNING id`,
                [chapterName, nextNum, mathSubjectId],
            );
            chapterIdMap[chapterName] = created[0].id;
            console.log(`  ➕ Created chapter: ${chapterName} (#${nextNum})`);
        }
    }

    // ── 3. Insert questions (skip duplicates by question text) ─────────────────
    let inserted = 0;
    let skipped = 0;

    for (const q of MATH_QUESTIONS) {
        const chapterId = chapterIdMap[q.chapter];

        // Check if question already exists
        const existing = await dataSource.query<QueryRow[]>(
            `SELECT id FROM questions WHERE question = $1 AND "chapterId" = $2 LIMIT 1`,
            [q.question, chapterId],
        );

        if (existing.length > 0) {
            console.log(`  ⏩ Skipped (already exists): "${q.question}"`);
            skipped++;
            continue;
        }

        // options column stores wrong answers as JSON array; correctAnswer is separate
        await dataSource.query(
            `INSERT INTO questions (question, options, "correctAnswer", level, "chapterId", status)
       VALUES ($1, $2, $3, $4, $5, 'published')`,
            [q.question, q.wrongAnswers, q.correctAnswer, q.level, chapterId],
        );

        inserted++;
    }


    await dataSource.destroy();
    process.exit(0);
}

seedMathQuestions().catch(err => {
    console.error('❌ Seed failed:', err);
    dataSource.destroy().catch(() => { });
    process.exit(1);
});
