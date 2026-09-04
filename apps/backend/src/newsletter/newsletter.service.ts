import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AnalyticsService } from '../analytics/analytics.service';
import { NewsletterSubscriber, NewsletterSource } from './entities/subscriber.entity';

@Injectable()
export class NewsletterService {
  private readonly logger = new Logger(NewsletterService.name);

  constructor(
    @InjectRepository(NewsletterSubscriber)
    private readonly subscriberRepo: Repository<NewsletterSubscriber>,
    private readonly analyticsService: AnalyticsService
  ) {}

  /**
   * Idempotent subscribe (plan/14-newsletter.md P1 #2): duplicate emails are a
   * silent no-op success; a previously-unsubscribed address re-activates.
   * Emails are lowercased/trimmed on write (P3).
   */
  async subscribe(
    rawEmail: string,
    source: NewsletterSource = 'footer',
    honeypot?: string
  ): Promise<{ subscribed: boolean }> {
    // Honeypot filled → almost certainly a bot. Pretend success, store nothing.
    if (honeypot && honeypot.trim().length > 0) {
      this.logger.warn('Newsletter honeypot triggered — discarding submission');
      return { subscribed: true };
    }

    const email = rawEmail.trim().toLowerCase();
    const existing = await this.subscriberRepo.findOne({ where: { email } });

    if (existing) {
      if (existing.unsubscribed) {
        existing.unsubscribed = false;
        existing.source = source;
        await this.subscriberRepo.save(existing);
        void this.analyticsService.record({
          eventName: 'newsletter_subscribed',
          module: 'site',
          properties: { source, resubscribe: true },
        });
      }
      // Either way: already (or again) subscribed — same response, no leak.
      return { subscribed: true };
    }

    await this.subscriberRepo.insert({ email, source });
    void this.analyticsService.record({
      eventName: 'newsletter_subscribed',
      module: 'site',
      properties: { source },
    });
    return { subscribed: true };
  }

  /** Unsubscribe by email; idempotent (unknown email still succeeds). */
  async unsubscribe(rawEmail: string): Promise<{ unsubscribed: boolean }> {
    const email = rawEmail.trim().toLowerCase();
    await this.subscriberRepo.update({ email }, { unsubscribed: true });
    void this.analyticsService.record({ eventName: 'newsletter_unsubscribed', module: 'site' });
    return { unsubscribed: true };
  }

  /** Admin list with optional source/unsubscribed filters. */
  async list(opts: {
    source?: NewsletterSource;
    unsubscribed?: boolean;
    page: number;
    limit: number;
  }): Promise<{ data: NewsletterSubscriber[]; total: number; page: number; limit: number }> {
    const qb = this.subscriberRepo.createQueryBuilder('subscriber');
    if (opts.source) qb.andWhere('subscriber.source = :source', { source: opts.source });
    if (opts.unsubscribed !== undefined)
      qb.andWhere('subscriber.unsubscribed = :unsubscribed', {
        unsubscribed: opts.unsubscribed,
      });

    const total = await qb.getCount();
    const data = await qb
      .orderBy('subscriber.createdAt', 'DESC')
      .skip((opts.page - 1) * opts.limit)
      .take(opts.limit)
      .getMany();

    return { data, total, page: opts.page, limit: opts.limit };
  }

  /** CSV of active (non-unsubscribed) subscribers — email, source, since. */
  async exportCsv(): Promise<string> {
    const rows = await this.subscriberRepo.find({
      where: { unsubscribed: false },
      order: { createdAt: 'DESC' },
    });
    const lines = ['email,source,subscribedAt'];
    for (const row of rows) {
      lines.push(`${row.email},${row.source},${row.createdAt.toISOString()}`);
    }
    return lines.join('\n');
  }
}
