/**
 * NewsletterService unit tests (plan/14-newsletter.md P2 #3): idempotent
 * duplicate handling, honeypot, unsubscribe, and CSV export contents.
 */

import { NewsletterService } from './newsletter.service';

describe('NewsletterService', () => {
  const setup = () => {
    const rows: Array<Record<string, unknown>> = [];
    const subscriberRepo = {
      findOne: jest.fn(
        async ({ where }: { where: { email: string } }) =>
          rows.find((r) => r.email === where.email) ?? null
      ),
      insert: jest.fn(async (data: Record<string, unknown>) => {
        rows.push({
          unsubscribed: false,
          createdAt: new Date('2026-08-30T00:00:00Z'),
          ...data,
        });
      }),
      save: jest.fn(async (data: Record<string, unknown>) => {
        Object.assign(rows.find((r) => r.email === data.email) ?? {}, data);
        return data;
      }),
      update: jest.fn(async (where: { email: string }, patch: Record<string, unknown>) => {
        const row = rows.find((r) => r.email === where.email);
        if (row) Object.assign(row, patch);
      }),
      find: jest.fn(async () => rows.filter((r) => !r.unsubscribed)),
      createQueryBuilder: jest.fn(),
    } as never as any;
    const service = new NewsletterService(subscriberRepo);
    return { service, rows, subscriberRepo };
  };

  it('normalizes emails to lowercase + trimmed on write (P3)', async () => {
    const { service, rows } = setup();
    await service.subscribe('  Reader@Example.COM ', 'footer');
    expect(rows[0].email).toBe('reader@example.com');
  });

  it('duplicate subscribe is an idempotent success, not a second row', async () => {
    const { service, rows } = setup();
    await service.subscribe('reader@example.com', 'footer');
    await service.subscribe('reader@example.com', 'footer');
    expect(rows).toHaveLength(1);
  });

  it('honeypot submissions report success but store nothing', async () => {
    const { service, rows } = setup();
    await expect(
      service.subscribe('bot@spam.example', 'footer', 'http://spam.example')
    ).resolves.toEqual({ subscribed: true });
    expect(rows).toHaveLength(0);
  });

  it('unsubscribe flags the row; export excludes it', async () => {
    const { service, rows } = setup();
    await service.subscribe('keep@example.com', 'footer');
    await service.subscribe('bye@example.com', 'footer');
    await service.unsubscribe('bye@example.com');
    expect(rows.find((r) => r.email === 'bye@example.com')?.unsubscribed).toBe(true);

    const csv = await service.exportCsv();
    expect(csv).toContain('keep@example.com');
    expect(csv).not.toContain('bye@example.com');
    expect(csv.split('\n')[0]).toBe('email,source,subscribedAt');
  });

  it('re-subscribing after unsubscribe re-activates the address', async () => {
    const { service, rows } = setup();
    await service.subscribe('back@example.com', 'footer');
    await service.unsubscribe('back@example.com');
    await service.subscribe('back@example.com', 'footer');
    expect(rows).toHaveLength(1);
    expect(rows[0].unsubscribed).toBe(false);
  });

  it('unsubscribe of an unknown email still succeeds (idempotent)', async () => {
    const { service } = setup();
    await expect(service.unsubscribe('nobody@example.com')).resolves.toEqual({
      unsubscribed: true,
    });
  });
});
