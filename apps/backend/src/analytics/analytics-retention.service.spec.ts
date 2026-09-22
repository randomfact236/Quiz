import { AnalyticsRetentionService } from './analytics-retention.service';

/**
 * C1 retention purge (plan/13 §4b C1). DataSource is faked so the batching
 * loop and cache invalidation run for real; constructed directly like
 * analytics.service.spec.ts.
 */
describe('AnalyticsRetentionService purge', () => {
  let query: jest.Mock;
  let delPattern: jest.Mock;
  let service: AnalyticsRetentionService;

  beforeEach(() => {
    query = jest.fn().mockResolvedValue([]);
    delPattern = jest.fn().mockResolvedValue(undefined);
    service = new AnalyticsRetentionService({ query } as any, { delPattern } as any);
  });

  it('loops until a short batch, summing exact RETURNING counts', async () => {
    // A "full" batch is PURGE_BATCH_SIZE (5000) rows; anything shorter ends
    // the run. Simulate one full batch + one short tail batch.
    const full = Array.from({ length: 5000 }, (_, i) => ({ id: String(i) }));
    query.mockResolvedValueOnce(full).mockResolvedValueOnce([{ id: 'y' }, { id: 'z' }]);

    const total = await service.purgeExpiredEvents();

    expect(total).toBe(5002);
    expect(query).toHaveBeenCalledTimes(2);
    expect(query).toHaveBeenLastCalledWith(expect.stringContaining('RETURNING id'), [13, 5000]);
  });

  it('stops after the first batch when it is already short', async () => {
    query.mockResolvedValueOnce([{ id: 'only' }]);
    const total = await service.purgeExpiredEvents();
    expect(total).toBe(1);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('invalidates analytics caches only when rows were removed', async () => {
    query.mockResolvedValueOnce([]);
    await service.purgeExpiredEvents();
    expect(delPattern).not.toHaveBeenCalled();

    query.mockResolvedValueOnce([{ id: 'a' }, { id: 'b' }]);
    await service.purgeExpiredEvents();
    expect(delPattern).toHaveBeenCalledWith('analytics:*');
  });

  it('never throws on a SQL failure and reports rows deleted so far', async () => {
    query.mockRejectedValueOnce(new Error('connection reset'));
    await expect(service.purgeExpiredEvents()).resolves.toBe(0);

    query
      .mockResolvedValueOnce([{ id: 'a' }])
      .mockRejectedValueOnce(new Error('statement timeout'));
    await expect(service.purgeExpiredEvents()).resolves.toBe(1);
  });

  it('ignores a non-array driver result instead of crashing', async () => {
    query.mockResolvedValueOnce(undefined);
    await expect(service.purgeExpiredEvents()).resolves.toBe(0);
  });

  it('re-entrancy guard: a run while another is in flight is a no-op', async () => {
    let releaseFirst: (value: unknown) => void = () => undefined;
    query.mockImplementationOnce(() => new Promise((resolve) => (releaseFirst = resolve)));
    const first = service.purgeExpiredEvents();
    const second = await service.purgeExpiredEvents();
    expect(second).toBe(0);
    releaseFirst([{ id: 'a' }]);
    await expect(first).resolves.toBe(1);
  });
});
