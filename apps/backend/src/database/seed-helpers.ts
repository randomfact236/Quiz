/**
 * ============================================================================
 * Database Seed Helpers
 * ============================================================================
 * Extracted helper functions for database seeding to reduce complexity
 * ============================================================================
 */

import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

/**
 * Interface for subject seed data
 */
export interface SubjectSeed {
  slug: string;
  name: string;
  emoji: string;
  category: string;
  order: number;
}

/**
 * Interface for inserted subject (includes generated id)
 */
export interface InsertedSubject extends SubjectSeed {
  id: string;
}

/**
 * Interface for chapter seed data
 */
export interface ChapterSeed {
  id: string;
  subjectId: string;
  name: string;
}

/**
 * Interface for joke category seed data
 */
export interface JokeCategorySeed {
  name: string;
  emoji: string;
}

/**
 * Interface for inserted joke category
 */
export interface InsertedJokeCategory extends JokeCategorySeed {
  id: string;
}

/**
 * Interface for riddle category seed data
 */
export interface RiddleCategorySeed {
  name: string;
  emoji: string;
}

/**
 * Interface for inserted riddle category
 */
export interface InsertedRiddleCategory extends RiddleCategorySeed {
  id: string;
}

/**
 * Type for query result with id
 */
export interface QueryResultWithId {
  id: string;
}

/**
 * Seed subjects into the database
 * @param dataSource - TypeORM data source
 * @returns Array of inserted subjects with their IDs
 */
export async function seedSubjects(dataSource: DataSource): Promise<InsertedSubject[]> {
  const subjects: SubjectSeed[] = [
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

  const insertedSubjects: InsertedSubject[] = [];
  for (const subject of subjects) {
    const result = await dataSource.query<QueryResultWithId[]>(
      `INSERT INTO subjects (slug, name, emoji, category, "order", "isActive") VALUES ($1, $2, $3, $4, $5, true) RETURNING id`,
      [subject.slug, subject.name, subject.emoji, subject.category, subject.order]
    );
    insertedSubjects.push({ ...subject, id: result[0].id });
  }
  return insertedSubjects;
}

/**
 * Seed chapters for each subject
 * @param dataSource - TypeORM data source
 * @param insertedSubjects - Array of inserted subjects
 * @returns Array of inserted chapters
 */
export async function seedChapters(
  dataSource: DataSource,
  insertedSubjects: InsertedSubject[]
): Promise<ChapterSeed[]> {
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

  const insertedChapters: ChapterSeed[] = [];
  for (const subject of insertedSubjects) {
    const chapters = chapterNames[subject.slug] || [];
    for (let i = 0; i < chapters.length; i++) {
      const result = await dataSource.query<QueryResultWithId[]>(
        `INSERT INTO chapters (name, "chapterNumber", "subjectId") VALUES ($1, $2, $3) RETURNING id`,
        [chapters[i], i + 1, subject.id]
      );
      insertedChapters.push({ id: result[0].id, subjectId: subject.id, name: chapters[i] });
    }
  }
  return insertedChapters;
}

/**
 * Seed sample questions for chapters
 * @param dataSource - TypeORM data source
 * @param insertedChapters - Array of inserted chapters
 */
export async function seedQuestions(
  dataSource: DataSource,
  insertedChapters: ChapterSeed[]
): Promise<void> {
  const sampleQuestions = [
    { chapterIndex: 0, question: 'What is the chemical symbol for water?', options: ['H2O', 'CO2', 'NaCl', 'O2'], correctAnswer: 'H2O', level: 'easy' },
    { chapterIndex: 0, question: 'What planet is known as the Red Planet?', options: ['Mars', 'Venus', 'Jupiter', 'Saturn'], correctAnswer: 'Mars', level: 'easy' },
    { chapterIndex: 0, question: 'What is the speed of light?', options: ['300,000 km/s', '150,000 km/s', '500,000 km/s', '100,000 km/s'], correctAnswer: '300,000 km/s', level: 'medium' },
  ];

  for (const q of sampleQuestions) {
    const chapter = insertedChapters[q.chapterIndex];
    if (chapter) {
      await dataSource.query(
        `INSERT INTO questions (question, options, "correctAnswer", level, "chapterId") VALUES ($1, $2, $3, $4, $5)`,
        [q.question, q.options, q.correctAnswer, q.level, chapter.id]
      );
    }
  }
}

/**
 * Seed joke categories
 * @param dataSource - TypeORM data source
 * @returns Array of inserted joke categories
 */
export async function seedJokeCategories(
  dataSource: DataSource
): Promise<InsertedJokeCategory[]> {
  const jokeCategories: JokeCategorySeed[] = [
    { name: 'Puns', emoji: '🎭' },
    { name: 'One-liners', emoji: '💬' },
    { name: 'Wordplay', emoji: '📝' },
  ];

  const insertedJokeCategories: InsertedJokeCategory[] = [];
  for (const cat of jokeCategories) {
    const result = await dataSource.query<QueryResultWithId[]>(
      `INSERT INTO joke_categories (name, emoji) VALUES ($1, $2) RETURNING id`,
      [cat.name, cat.emoji]
    );
    insertedJokeCategories.push({ ...cat, id: result[0].id });
  }
  return insertedJokeCategories;
}

/**
 * Seed dad jokes
 * @param dataSource - TypeORM data source
 * @param jokeCategories - Array of inserted joke categories
 */
export async function seedDadJokes(
  dataSource: DataSource,
  jokeCategories: InsertedJokeCategory[]
): Promise<void> {
  if (jokeCategories.length === 0) return;

  const dadJokes = [
    { joke: "Why don't scientists trust atoms? Because they make up everything!", categoryId: jokeCategories[0].id },
    { joke: "I'm reading a book about anti-gravity. It's impossible to put down!", categoryId: jokeCategories[0].id },
    { joke: "Why did the scarecrow win an award? He was outstanding in his field!", categoryId: jokeCategories[1]?.id || jokeCategories[0].id },
    { joke: "I used to hate facial hair, but then it grew on me.", categoryId: jokeCategories[1]?.id || jokeCategories[0].id },
    { joke: "What do you call a fake noodle? An impasta!", categoryId: jokeCategories[2]?.id || jokeCategories[0].id },
  ];

  for (const joke of dadJokes) {
    await dataSource.query(
      `INSERT INTO dad_jokes (joke, "categoryId") VALUES ($1, $2)`,
      [joke.joke, joke.categoryId]
    );
  }
}

/**
 * Seed riddle categories
 * @param dataSource - TypeORM data source
 * @returns Array of inserted riddle categories
 */
export async function seedRiddleCategories(
  dataSource: DataSource
): Promise<InsertedRiddleCategory[]> {
  const riddleCategories: RiddleCategorySeed[] = [
    { name: 'Logic', emoji: '🧠' },
    { name: 'Word Play', emoji: '📝' },
    { name: 'Math', emoji: '🔢' },
  ];

  const insertedRiddleCategories: InsertedRiddleCategory[] = [];
  for (const cat of riddleCategories) {
    const result = await dataSource.query<QueryResultWithId[]>(
      `INSERT INTO riddle_categories (name, emoji) VALUES ($1, $2) RETURNING id`,
      [cat.name, cat.emoji]
    );
    insertedRiddleCategories.push({ ...cat, id: result[0].id });
  }
  return insertedRiddleCategories;
}

/**
 * Seed riddles
 * @param dataSource - TypeORM data source
 * @param riddleCategories - Array of inserted riddle categories
 */
export async function seedRiddles(
  dataSource: DataSource,
  riddleCategories: InsertedRiddleCategory[]
): Promise<void> {
  if (riddleCategories.length === 0) return;

  const riddles = [
    { question: 'What has keys but no locks?', answer: 'A piano', difficulty: 'easy', categoryId: riddleCategories[1]?.id || riddleCategories[0].id },
    { question: 'What has a head and a tail but no body?', answer: 'A coin', difficulty: 'easy', categoryId: riddleCategories[1]?.id || riddleCategories[0].id },
    { question: 'The more you take, the more you leave behind. What am I?', answer: 'Footsteps', difficulty: 'medium', categoryId: riddleCategories[0].id },
    { question: 'What can travel around the world while staying in a corner?', answer: 'A stamp', difficulty: 'medium', categoryId: riddleCategories[0].id },
    { question: 'If you have me, you want to share me. If you share me, you no longer have me. What am I?', answer: 'A secret', difficulty: 'hard', categoryId: riddleCategories[0].id },
  ];

  for (const riddle of riddles) {
    await dataSource.query(
      `INSERT INTO riddles (question, answer, difficulty, "categoryId") VALUES ($1, $2, $3, $4)`,
      [riddle.question, riddle.answer, riddle.difficulty, riddle.categoryId]
    );
  }
}

/**
 * Seed admin user
 * @param dataSource - TypeORM data source
 */
export async function seedAdminUser(dataSource: DataSource): Promise<void> {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await dataSource.query(
    `INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
    ['admin@aiquiz.com', hashedPassword, 'Admin', 'admin']
  );
}
