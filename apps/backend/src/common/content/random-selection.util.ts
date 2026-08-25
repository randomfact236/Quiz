import { ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm';

/**
 * Capacity-plan Track A2/B: index-seek random selection via the random_weight
 * column, shared by all content modules (previously duplicated in quiz and
 * riddle-mcq services).
 *
 * Picks a random anchor float and returns rows above it ordered by weight;
 * wraps around to the top of the range when the tail holds fewer rows than
 * requested, so callers never receive short result sets.
 */
export interface RandomWeightOptions {
  count: number;
  /** Hard upper bound regardless of requested count (defaults 50). */
  max?: number;
  /** Apply status/level/taxonomy filters on the query builder. */
  filters?: (qb: SelectQueryBuilder<any>) => void;
}

export async function pickRandomByWeight<T extends ObjectLiteral>(
  repo: Repository<T>,
  alias: string,
  opts: RandomWeightOptions
): Promise<T[]> {
  const count = Math.min(Math.max(opts.count, 1), opts.max ?? 50);
  const anchor = Math.random();

  const buildQuery = () => {
    const qb = repo.createQueryBuilder(alias);
    if (opts.filters) {
      opts.filters(qb);
    }
    return qb;
  };

  const rows = await buildQuery()
    .andWhere(`${alias}.random_weight > :anchor`, { anchor })
    .orderBy(`${alias}.random_weight`, 'ASC')
    .take(count)
    .getMany();

  if (rows.length < count) {
    const wrapped = await buildQuery()
      .orderBy(`${alias}.random_weight`, 'ASC')
      .take(count - rows.length)
      .getMany();
    return [...rows, ...wrapped];
  }

  return rows;
}
