import { DataSource } from 'typeorm';
import { getSeedDatabaseConfig } from './database-config';

async function seed() {
  const dataSource = new DataSource(getSeedDatabaseConfig());

  try {
    await dataSource.initialize();

    const questionRepo = dataSource.getRepository('Question');
    const chapterRepo = dataSource.getRepository('Chapter');

    // Get chapters
    const arithmetic = await chapterRepo.findOne({ where: { name: 'Arithmetic' } });
    const physics = await chapterRepo.findOne({ where: { name: 'Physics' } });

    if (!arithmetic || !physics) {
      console.error('Chapters not found!');
      return;
    }

    // Create 1 question per level
    const questions = [
      {
        question: 'Is the sky blue?',
        level: 'easy',
        options: ['True', 'False'],
        correctAnswer: 'True',
        correctLetter: 'A',
        chapterId: arithmetic.id,
        status: 'published' as any,
      },
      {
        question: 'What is 2 + 2?',
        level: 'medium',
        options: ['3', '4', '5'],
        correctAnswer: '4',
        correctLetter: 'B',
        chapterId: arithmetic.id,
        status: 'published' as any,
      },
      {
        question: 'What is the capital of France?',
        level: 'hard',
        options: ['London', 'Paris', 'Berlin', 'Madrid'],
        correctAnswer: 'Paris',
        correctLetter: 'B',
        chapterId: arithmetic.id,
        status: 'published' as any,
      },
      {
        question: 'What is the chemical symbol for Gold?',
        level: 'expert',
        options: ['Go', 'Gd', 'Au', 'Ag'],
        correctAnswer: 'Au',
        correctLetter: 'C',
        chapterId: arithmetic.id,
        status: 'published' as any,
      },
      {
        question: 'Explain the theory of relativity in your own words.',
        level: 'extreme',
        options: null,
        correctAnswer:
          "Einstein's theory of relativity states that the laws of physics are the same for all non-accelerating observers, and that the speed of light is the same regardless of the motion of the observer.",
        correctLetter: null,
        chapterId: physics.id,
        status: 'published' as any,
      },
    ];

    for (const q of questions) {
      const saved = await questionRepo.save(q);
      console.log(`Created ${q.level} question: ${saved.id}`);
    }

    console.log('\nAll 5 test questions created!');

    // Verify
    const allQuestions = await questionRepo.find();
    console.log(`\nTotal questions in DB: ${allQuestions.length}`);

    for (const q of allQuestions) {
      console.log(
        `- ${q.level}: options=${JSON.stringify(q.options)}, correctLetter=${q.correctLetter}`
      );
    }
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await dataSource.destroy();
  }
}

seed();
