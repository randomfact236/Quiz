import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'ai_quiz',
  synchronize: true,
});

async function seed() {
  await AppDataSource.initialize();
  console.log('📦 Seeding database...');

  // Seed Subjects
  const subjects = [
    { slug: 'science', name: 'Science', emoji: '🔬', category: 'academic', order: 1 },
    { slug: 'math', name: 'Math', emoji: '🔢', category: 'academic', order: 2 },
    { slug: 'history', name: 'History', emoji: '📜', category: 'academic', order: 3 },
    { slug: 'geography', name: 'Geography', emoji: '🌍', category: 'academic', order: 4 },
    { slug: 'english', name: 'English', emoji: '📖', category: 'academic', order: 5 },
    { slug: 'environment', name: 'Environment', emoji: '🌱', category: 'academic', order: 6 },
    { slug: 'technology', name: 'Technology', emoji: '💻', category: 'professional', order: 7 },
    { slug: 'business', name: 'Business', emoji: '💼', category: 'professional', order: 8 },
    { slug: 'health', name: 'Health', emoji: '💪', category: 'professional', order: 9 },
    { slug: 'parenting', name: 'Parenting', emoji: '👶', category: 'professional', order: 10 },
  ];

  const insertedSubjects: any[] = [];
  for (const subject of subjects) {
    const result = await AppDataSource.query(
      `INSERT INTO subjects (slug, name, emoji, category, "order", "isActive") VALUES ($1, $2, $3, $4, $5, true) RETURNING id`,
      [subject.slug, subject.name, subject.emoji, subject.category, subject.order]
    );
    insertedSubjects.push({ ...subject, id: result[0].id });
  }
  console.log(`✅ Inserted ${subjects.length} subjects`);

  // Seed Chapters for each subject
  const chapterNames: Record<string, string[]> = {
    science: ['Physics Basics', 'Chemistry Fundamentals', 'Biology Essentials', 'Earth Science', 'Astronomy'],
    math: ['Arithmetic', 'Algebra Basics', 'Geometry', 'Fractions', 'Decimals'],
    history: ['Ancient Civilizations', 'Medieval Period', 'Renaissance', 'World Wars', 'Modern History'],
    geography: ['World Continents', 'Countries', 'Capitals', 'Oceans & Seas', 'Mountains'],
    english: ['Grammar Basics', 'Vocabulary', 'Reading Comprehension', 'Writing Skills', 'Literature'],
    environment: ['Ecosystems', 'Climate Change', 'Renewable Energy', 'Conservation', 'Pollution'],
    technology: ['Computer Basics', 'Internet', 'Programming', 'Software', 'Hardware'],
    business: ['Entrepreneurship', 'Marketing', 'Finance', 'Management', 'Economics'],
    health: ['Nutrition', 'Exercise', 'Mental Health', 'First Aid', 'Diseases'],
    parenting: ['Baby Care', 'Toddler Development', 'Child Psychology', 'Education', 'Discipline'],
  };

  const insertedChapters: any[] = [];
  for (const subject of insertedSubjects) {
    const chapters = chapterNames[subject.slug] || [];
    for (let i = 0; i < chapters.length; i++) {
      const result = await AppDataSource.query(
        `INSERT INTO chapters (name, "chapterNumber", "subjectId") VALUES ($1, $2, $3) RETURNING id`,
        [chapters[i], i + 1, subject.id]
      );
      insertedChapters.push({ id: result[0].id, subjectId: subject.id, name: chapters[i] });
    }
  }
  console.log(`✅ Inserted ${insertedChapters.length} chapters`);

  // Seed Sample Questions
  const sampleQuestions = [
    { chapterIndex: 0, question: 'What is the chemical symbol for water?', options: ['H2O', 'CO2', 'NaCl', 'O2'], correctAnswer: 'H2O', level: 'easy' },
    { chapterIndex: 0, question: 'What planet is known as the Red Planet?', options: ['Mars', 'Venus', 'Jupiter', 'Saturn'], correctAnswer: 'Mars', level: 'easy' },
    { chapterIndex: 0, question: 'What is the speed of light?', options: ['300,000 km/s', '150,000 km/s', '500,000 km/s', '100,000 km/s'], correctAnswer: '300,000 km/s', level: 'medium' },
  ];

  for (const q of sampleQuestions) {
    const chapter = insertedChapters[q.chapterIndex];
    if (chapter) {
      await AppDataSource.query(
        `INSERT INTO questions (question, options, "correctAnswer", level, "chapterId") VALUES ($1, $2, $3, $4, $5)`,
        [q.question, q.options, q.correctAnswer, q.level, chapter.id]
      );
    }
  }
  console.log(`✅ Inserted ${sampleQuestions.length} questions`);

  // Seed Joke Categories
  const jokeCategories = [
    { name: 'Puns', emoji: '🎭' },
    { name: 'One-liners', emoji: '💬' },
    { name: 'Wordplay', emoji: '📝' },
  ];

  const insertedJokeCategories: any[] = [];
  for (const cat of jokeCategories) {
    const result = await AppDataSource.query(
      `INSERT INTO joke_categories (name, emoji) VALUES ($1, $2) RETURNING id`,
      [cat.name, cat.emoji]
    );
    insertedJokeCategories.push({ ...cat, id: result[0].id });
  }
  console.log(`✅ Inserted ${jokeCategories.length} joke categories`);

  // Seed Dad Jokes
  const dadJokes = [
    { joke: "Why don't scientists trust atoms? Because they make up everything!", categoryId: insertedJokeCategories[0].id },
    { joke: "I'm reading a book about anti-gravity. It's impossible to put down!", categoryId: insertedJokeCategories[0].id },
    { joke: "Why did the scarecrow win an award? He was outstanding in his field!", categoryId: insertedJokeCategories[1].id },
    { joke: "I used to hate facial hair, but then it grew on me.", categoryId: insertedJokeCategories[1].id },
    { joke: "What do you call a fake noodle? An impasta!", categoryId: insertedJokeCategories[2].id },
  ];

  for (const joke of dadJokes) {
    await AppDataSource.query(
      `INSERT INTO dad_jokes (joke, "categoryId") VALUES ($1, $2)`,
      [joke.joke, joke.categoryId]
    );
  }
  console.log(`✅ Inserted ${dadJokes.length} dad jokes`);

  // Seed Riddle Categories
  const riddleCategories = [
    { name: 'Logic', emoji: '🧠' },
    { name: 'Word Play', emoji: '📝' },
    { name: 'Math', emoji: '🔢' },
  ];

  const insertedRiddleCategories: any[] = [];
  for (const cat of riddleCategories) {
    const result = await AppDataSource.query(
      `INSERT INTO riddle_categories (name, emoji) VALUES ($1, $2) RETURNING id`,
      [cat.name, cat.emoji]
    );
    insertedRiddleCategories.push({ ...cat, id: result[0].id });
  }
  console.log(`✅ Inserted ${riddleCategories.length} riddle categories`);

  // Seed Riddles
  const riddles = [
    { question: 'What has keys but no locks?', answer: 'A piano', difficulty: 'easy', categoryId: insertedRiddleCategories[1].id },
    { question: 'What has a head and a tail but no body?', answer: 'A coin', difficulty: 'easy', categoryId: insertedRiddleCategories[1].id },
    { question: 'The more you take, the more you leave behind. What am I?', answer: 'Footsteps', difficulty: 'medium', categoryId: insertedRiddleCategories[0].id },
    { question: 'What can travel around the world while staying in a corner?', answer: 'A stamp', difficulty: 'medium', categoryId: insertedRiddleCategories[0].id },
    { question: 'If you have me, you want to share me. If you share me, you no longer have me. What am I?', answer: 'A secret', difficulty: 'hard', categoryId: insertedRiddleCategories[0].id },
  ];

  for (const riddle of riddles) {
    await AppDataSource.query(
      `INSERT INTO riddles (question, answer, difficulty, "categoryId") VALUES ($1, $2, $3, $4)`,
      [riddle.question, riddle.answer, riddle.difficulty, riddle.categoryId]
    );
  }
  console.log(`✅ Inserted ${riddles.length} riddles`);

  // Seed Admin User
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await AppDataSource.query(
    `INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
    ['admin@aiquiz.com', hashedPassword, 'Admin', 'admin']
  );
  console.log('✅ Inserted admin user (email: admin@aiquiz.com, password: admin123)');

  await AppDataSource.destroy();
  console.log('🎉 Database seeding completed!');
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});