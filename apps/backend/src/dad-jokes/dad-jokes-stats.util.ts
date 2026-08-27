import { Repository } from 'typeorm';

import { DadJoke } from './entities/dad-joke.entity';
import { JokeCategory } from './entities/joke-category.entity';

/**
 * Statistics result for dad jokes
 */
export interface DadJokesStats {
  totalJokes: number;
  totalCategories: number;
}

/**
 * Compute dad jokes statistics
 * @param jokeRepo - Dad joke repository
 * @param categoryRepo - Category repository
 * @returns Statistics for dad jokes
 * @throws Error if database query fails
 */
export async function computeDadJokeStats(
  jokeRepo: Repository<DadJoke>,
  categoryRepo: Repository<JokeCategory>
): Promise<DadJokesStats> {
  try {
    const [totalJokes, totalCategories] = await Promise.all([
      jokeRepo.count(),
      categoryRepo.count(),
    ]);

    return {
      totalJokes,
      totalCategories,
    };
  } catch (error) {
    throw new Error(`Failed to compute dad joke statistics: ${(error as Error).message}`);
  }
}
