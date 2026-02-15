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
 * Compute riddles statistics
 * @param riddleRepo - Riddle repository
 * @param categoryRepo - Category repository
 * @param quizRiddleRepo - Quiz riddle repository
 * @param subjectRepo - Subject repository
 * @param chapterRepo - Chapter repository
 * @returns Statistics for riddles
 */
export async function computeRiddleStats(
  riddleRepo: Repository<Riddle>,
  categoryRepo: Repository<RiddleCategory>,
  quizRiddleRepo: Repository<QuizRiddle>,
  subjectRepo: Repository<RiddleSubject>,
  chapterRepo: Repository<RiddleChapter>,
): Promise<RiddlesStats> {
  const [totalClassicRiddles, totalCategories, totalQuizRiddles, totalSubjects, totalChapters] = await Promise.all([
    riddleRepo.count(),
    categoryRepo.count(),
    quizRiddleRepo.count(),
    subjectRepo.count(),
    chapterRepo.count(),
  ]);

  const riddlesByDifficulty: Record<string, number> = {
    easy: await riddleRepo.count({ where: { difficulty: 'easy' } }),
    medium: await riddleRepo.count({ where: { difficulty: 'medium' } }),
    hard: await riddleRepo.count({ where: { difficulty: 'hard' } }),
  };

  return {
    totalClassicRiddles,
    totalCategories,
    totalQuizRiddles,
    totalSubjects,
    totalChapters,
    riddlesByDifficulty,
  };
}
