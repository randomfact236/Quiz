import { Repository } from 'typeorm';
import { DadJoke } from './entities/dad-joke.entity';
import { JokeCategory } from './entities/joke-category.entity';
import { JokeSubject } from './entities/joke-subject.entity';
import { JokeChapter } from './entities/joke-chapter.entity';
import { QuizJoke } from './entities/quiz-joke.entity';

/**
 * Statistics result for dad jokes
 */
export interface DadJokesStats {
  totalClassicJokes: number;
  totalCategories: number;
  totalQuizJokes: number;
  totalSubjects: number;
  totalChapters: number;
}

/**
 * Compute dad jokes statistics
 * @param jokeRepo - Dad joke repository
 * @param categoryRepo - Category repository
 * @param quizJokeRepo - Quiz joke repository
 * @param subjectRepo - Subject repository
 * @param chapterRepo - Chapter repository
 * @returns Statistics for dad jokes
 * @throws Error if database query fails
 */
export async function computeDadJokeStats(
  jokeRepo: Repository<DadJoke>,
  categoryRepo: Repository<JokeCategory>,
  quizJokeRepo: Repository<QuizJoke>,
  subjectRepo: Repository<JokeSubject>,
  chapterRepo: Repository<JokeChapter>,
): Promise<DadJokesStats> {
  try {
    const [totalClassicJokes, totalCategories, totalQuizJokes, totalSubjects, totalChapters] = await Promise.all([
      jokeRepo.count(),
      categoryRepo.count(),
      quizJokeRepo.count(),
      subjectRepo.count(),
      chapterRepo.count(),
    ]);

    return {
      totalClassicJokes,
      totalCategories,
      totalQuizJokes,
      totalSubjects,
      totalChapters,
    };
  } catch (error) {
    throw new Error(`Failed to compute dad joke statistics: ${(error as Error).message}`);
  }
}
