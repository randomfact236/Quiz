import { AnalyticsService } from './analytics.service';
import { AnalyticsEvent } from './entities/analytics-event.entity';

/**
 * TASK-02: ingest idempotency. Repos are faked; the service is constructed
 * directly (question-likes.service.spec.ts convention). The fake event repo
 * keeps what save() stored so dropAlreadyStored()'s find(In(...)) behaves
 * like Postgres.
 */
describe('AnalyticsService ingest idempotency', () => {
  let eventRepo: any;
  let guestUsersService: any;
  let service: AnalyticsService;

  /** Rows the fake DB currently holds (populated by save()). */
  let stored: any[];

  const dto = (clientEventId?: string, extra: Record<string, unknown> = {}) => ({
    eventName: 'test_idem_check',
    module: 'site',
    guestId: 'guest_task02_probe',
    clientTs: new Date().toISOString(),
    ...(clientEventId ? { clientEventId } : {}),
    ...extra,
  });

  beforeEach(() => {
    stored = [];
    eventRepo = {
      find: jest.fn().mockImplementation(async (opts: any) => {
        const op = opts?.where?.clientEventId;
        const ids: string[] | undefined = Array.isArray(op?.value) ? op.value : undefined;
        if (!ids) return stored;
        return stored.filter((row) => ids.includes(row.clientEventId));
      }),
      save: jest.fn().mockImplementation(async (rows: any) => {
        for (const row of Array.isArray(rows) ? rows : [rows]) stored.push(row);
        return rows;
      }),
    };
    guestUsersService = { recordSessionCompletion: jest.fn().mockResolvedValue(undefined) };
    service = new AnalyticsService(eventRepo, guestUsersService, {
      getOrSet: jest.fn(),
      delPattern: jest.fn(),
    } as any);
  });

  it('stores a batch once: replaying it yields accepted=0, skipped=N, rejected=0', async () => {
    const batch = [
      dto('11111111-1111-4111-8111-111111111111'),
      dto('22222222-2222-4222-8222-222222222222'),
    ];

    const first = await service.ingest(batch as any, null);
    expect(first).toEqual({ accepted: 2, rejected: 0, skipped: 0 });
    expect(eventRepo.save).toHaveBeenCalledTimes(1);
    expect(stored).toHaveLength(2);

    const second = await service.ingest(batch as any, null);
    expect(second).toEqual({ accepted: 0, rejected: 0, skipped: 2 });
    // No second write attempt: the retry was filtered before the save.
    expect(eventRepo.save).toHaveBeenCalledTimes(1);
    expect(stored).toHaveLength(2);
  });

  it('skips repeats of the same clientEventId inside one batch', async () => {
    const id = '33333333-3333-4333-8333-333333333333';
    const result = await service.ingest([dto(id), dto(id), dto(id)] as any, null);
    expect(result).toEqual({ accepted: 1, rejected: 0, skipped: 2 });
    expect(stored).toHaveLength(1);
  });

  it('events without clientEventId ingest every time (backwards compatible)', async () => {
    const first = await service.ingest([dto()] as any, null);
    const second = await service.ingest([dto()] as any, null);
    expect(first.accepted).toBe(1);
    expect(second.accepted).toBe(1);
    expect(eventRepo.find).not.toHaveBeenCalled();
    expect(stored).toHaveLength(2);
  });

  it('skips only the already-stored id and accepts the new one', async () => {
    await service.ingest([dto('44444444-4444-4444-8444-444444444444')] as any, null);
    const result = await service.ingest(
      [
        dto('44444444-4444-4444-8444-444444444444'),
        dto('55555555-5555-4555-8555-555555555555'),
      ] as any,
      null
    );
    expect(result).toEqual({ accepted: 1, rejected: 0, skipped: 1 });
    expect(stored.map((row) => row.clientEventId)).toEqual([
      '44444444-4444-4444-8444-444444444444',
      '55555555-5555-4555-8555-555555555555',
    ]);
  });

  it('does not re-run guest side effects for a replayed session_completed', async () => {
    const batch = [
      dto('66666666-6666-4666-8666-666666666666', {
        properties: { score: 7 },
        eventName: 'session_completed',
      }),
    ];
    await service.ingest(batch as any, null);
    expect(guestUsersService.recordSessionCompletion).toHaveBeenCalledTimes(1);

    const replay = await service.ingest(batch as any, null);
    expect(replay.accepted).toBe(0);
    expect(guestUsersService.recordSessionCompletion).toHaveBeenCalledTimes(1);
  });

  it('handles the unique-violation race row-by-row, counting losers as skipped', async () => {
    const uniqueErr = Object.assign(new Error('duplicate key value violates unique constraint'), {
      code: '23505',
    });
    // Array save loses the race entirely; per-row fallback: first row was
    // stored by the concurrent request (23505 → skipped), second row lands.
    eventRepo.save
      .mockRejectedValueOnce(uniqueErr)
      .mockRejectedValueOnce(uniqueErr)
      .mockImplementation(async (rows: any) => {
        for (const row of Array.isArray(rows) ? rows : [rows]) stored.push(row);
        return rows;
      });

    const result = await service.ingest(
      [
        dto('77777777-7777-4777-8777-777777777777'),
        dto('88888888-8888-4888-8888-888888888888'),
      ] as any,
      null
    );
    expect(result).toEqual({ accepted: 1, rejected: 0, skipped: 1 });
    expect(stored).toHaveLength(1);
  });

  it('counts a non-unique save failure as full-batch rejection (unchanged behavior)', async () => {
    eventRepo.save.mockRejectedValueOnce(new Error('connection reset'));
    const result = await service.ingest([dto('99999999-9999-4999-8999-999999999999')] as any, null);
    expect(result).toEqual({ accepted: 0, rejected: 1, skipped: 0 });
  });

  it('persists the entity with clientEventId set (entity column wired)', async () => {
    await service.ingest([dto('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')] as any, null);
    expect(stored[0]).toBeInstanceOf(AnalyticsEvent);
    expect(stored[0].clientEventId).toBe('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
  });
});
