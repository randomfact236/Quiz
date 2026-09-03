import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Newsletter email collection (plan/14-newsletter.md P1 #1).
 *
 * Emails are stored lowercased (normalization also applied at write time).
 * Unique constraint makes subscribe idempotent. `unsubscribed` keeps the
 * address (so re-subscribes are trivial) while excluding it from exports.
 */
export class CreateNewsletterSubscribers1789400000000 implements MigrationInterface {
  name = 'CreateNewsletterSubscribers1789400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "newsletter_subscribers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" varchar(255) NOT NULL,
        "source" varchar(16) NOT NULL DEFAULT 'footer',
        "unsubscribed" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_newsletter_email" UNIQUE ("email"),
        CONSTRAINT "PK_newsletter_subscribers" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "newsletter_subscribers"`);
  }
}
