import { CacheService } from '../cache/cache.service';

/**
 * Capacity-plan Track B: family-scoped cache invalidation.
 *
 * Replaces the per-module delPattern('<module>:*') sledgehammer: only the
 * cache families actually affected by a mutation are cleared, so unrelated
 * cached reads survive admin writes (no DB stampedes on single-entity edits).
 *
 * Family = key prefix WITHOUT the trailing ':*' / ':' separator,
 * e.g. 'quiz:questions' clears 'quiz:questions:*'.
 */
export async function invalidateCacheFamilies(
  cacheService: CacheService,
  families: string[]
): Promise<void> {
  await Promise.all(families.map((family) => cacheService.delPattern(`${family}:*`)));
}
