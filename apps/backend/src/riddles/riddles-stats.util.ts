import { Repository } from 'typeorm';
import { Riddle } from './entities/riddle.entity';
import { RiddleCategory } from './entities/riddle-category.entity';
import { RiddleSubject } from './entities/riddle-subject.entity';
import { RiddleChapter } from './entities/riddle-chapter.entity';
import { QuizRiddle } from './entities/quiz-riddle.entity';
import { ContentStatus } from '../common/enums/content-status.enum';

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
  quizRiddlesByDifficulty: Record<string, number>;
}

/**
 * Compute riddles statistics.
 *
 * H-4 fix: All riddle counts are restricted to ContentStatus.PUBLISHED.
 * Previous version counted ALL statuses including DRAFT and TRASH, leaking
 * internal content volume to public callers.
 *
 * Uses a single GROUP BY query for difficulty counts instead of N sequentially
 * awaited count() calls, reducing database round-trips from N+M to 1.
 *
 * @param riddleRepo    - Riddle repository
 * @param categoryRepo  - Category repository
 * @param quizRiddleRepo - Quiz riddle repository
 * @param subjectRepo   - Subject repository
 * @param chapterRepo   - Chapter repository
 * @returns Aggregated statistics for all riddle types
 * @throws Error if any database query fails
 */
export async function computeRiddleStats(
  riddleRepo: Repository<Riddle>,
  categoryRepo: Repository<RiddleCategory>,
  quizRiddleRepo: Repository<QuizRiddle>,
  subjectRepo: Repository<RiddleSubject>,
  chapterRepo: Repository<RiddleChapter>,
): Promise<RiddlesStats> {
  try {
    // All aggregate counts run in parallel — single DB round per query
    const [
      totalClassicRiddles,
      totalCategories,
      totalQuizRiddles,
      totalSubjects,
      totalChapters,
      difficultyRows,
      quizDifficultyRows,
    ] = await Promise.all([
      // H-4 fix: restrict to PUBLISHED only — DRAFT and TRASH must not be counted
      riddleRepo.count({ where: { status: ContentStatus.PUBLISHED } }),
      categoryRepo.count(),
      quizRiddleRepo.count(),
      subjectRepo.count({ where: { isActive: true } }),
      chapterRepo.count(),
      // Single GROUP BY replaces the previous N + M sequential count() loop.
      // H-4 fix: WHERE clause added to restrict counts to PUBLISHED riddles only.
      riddleRepo
        .createQueryBuilder('riddle')
        .select('riddle.difficulty', 'difficulty')
        .addSelect('COUNT(*)', 'count')
        .where('riddle.status = :status', { status: ContentStatus.PUBLISHED })
        .groupBy('riddle.difficulty')
        .getRawMany<{ difficulty: string; count: string }>(),
      // Quiz Riddle difficulty distribution
      quizRiddleRepo
        .createQueryBuilder('quiz_riddle')
        .select('quiz_riddle.level', 'level')
        .addSelect('COUNT(*)', 'count')
        .groupBy('quiz_riddle.level')
        .getRawMany<{ level: string; count: string }>(),
    ]);

    // Convert raw rows to a typed map, parsing the count string to number
    const riddlesByDifficulty: Record<string, number> = {};
    for (const row of difficultyRows) {
      riddlesByDifficulty[row.difficulty] = parseInt(row.count, 10);
    }

    const quizRiddlesByDifficulty: Record<string, number> = {};
    for (const row of quizDifficultyRows) {
      quizRiddlesByDifficulty[row.level] = parseInt(row.count, 10);
    }

    return {
      totalClassicRiddles,
      totalCategories,
      totalQuizRiddles,
      totalSubjects,
      totalChapters,
      riddlesByDifficulty,
      quizRiddlesByDifficulty,
    };
  } catch (error) {
    throw new Error(`Failed to compute riddle statistics: ${(error as Error).message}`);
  }
}
