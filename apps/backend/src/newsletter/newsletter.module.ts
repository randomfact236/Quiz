import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AnalyticsModule } from '../analytics/analytics.module';

import { NewsletterSubscriber } from './entities/subscriber.entity';
import { NewsletterController } from './newsletter.controller';
import { NewsletterService } from './newsletter.service';

/**
 * Newsletter module (plan/14-newsletter.md): simple email collection —
 * public subscribe/unsubscribe, admin list + CSV export. Per the owner scope
 * decision, double opt-in and campaigns are deferred.
 */
@Module({
  imports: [TypeOrmModule.forFeature([NewsletterSubscriber]), AnalyticsModule],
  controllers: [NewsletterController],
  providers: [NewsletterService],
  exports: [NewsletterService],
})
export class NewsletterModule {}
