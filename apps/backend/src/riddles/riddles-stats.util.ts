import { Repository } from 'typeorm';
import { Riddle } from './entities/riddle.entity';
import { RiddleCategory } from './entities/riddle-category.entity';
import { RiddleSubject } from './entities/riddle-subject.entity';
import { RiddleChapter } from './entities/riddle-chapter.entity';
import { QuizRiddle } from './entities/quiz-riddle.entity';

/**
 * Statistics result for riddles
 */
export interface RiddlesStats {
  totalClassicRiddles: number;
  totalCategories: number;
  totalQuizRiddles: number;
  totalSubjects: number;
  totalChapters: number;
  riddlesByDifficulty: Record<string, number>;
}

/**
 * Valid difficulty levels for classic riddles
 */
const CLASSIC_DIFFICULTIES = ['easy', 'medium', 'hard'];

/**
 * Compute riddles statistics
 * @param riddleRepo - Riddle repository
 * @param categoryRepo - Category repository
 * @param quizRiddleRepo - Quiz riddle repository
 * @param subjectRepo - Subject repository
 * @param chapterRepo - Chapter repository
 * @returns Statistics for riddles
 * @throws Error if database query fails
 */
export async function computeRiddleStats(
  riddleRepo: Repository<Riddle>,
  categoryRepo: Repository<RiddleCategory>,
  quizRiddleRepo: Repository<QuizRiddle>,
  subjectRepo: Repository<RiddleSubject>,
  chapterRepo: Repository<RiddleChapter>,
): Promise<RiddlesStats> {
  try {
    // Get basic counts in parallel
    const [totalClassicRiddles, totalCategories, totalQuizRiddles, totalSubjects, totalChapters] = await Promise.all([
      riddleRepo.count(),
      categoryRepo.count(),
      quizRiddleRepo.count(),
      subjectRepo.count(),
      chapterRepo.count(),
    ]);

    // Get counts by difficulty dynamically
    const riddlesByDifficulty: Record<string, number> = {};
    
    // Query for each difficulty level
    for (const difficulty of CLASSIC_DIFFICULTIES) {
      riddlesByDifficulty[difficulty] = await riddleRepo.count({ 
        where: { difficulty } 
      });
    }

    // Also check for any other difficulty values in the database
    const distinctDifficulties = await riddleRepo
      .createQueryBuilder('riddle')
      .select('DISTINCT riddle.difficulty', 'difficulty')
      .getRawMany<{ difficulty: string }>();

    // Add any additional difficulty levels found
    for (const { difficulty } of distinctDifficulties) {
      if (!CLASSIC_DIFFICULTIES.includes(difficulty)) {
        riddlesByDifficulty[difficulty] = await riddleRepo.count({ 
          where: { difficulty } 
        });
      }
    }

    return {
      totalClassicRiddles,
      totalCategories,
      totalQuizRiddles,
      totalSubjects,
      totalChapters,
      riddlesByDifficulty,
    };
  } catch (error) {
    throw new Error(`Failed to compute riddle statistics: ${(error as Error).message}`);
  }
}
