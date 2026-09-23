import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * NOW-08: Daily Challenge results. One row per identity per day — `date` is
 * the CLIENT-LOCAL calendar day so streaks never break on timezone drift.
 * Two PARTIAL unique indexes enforce the one-attempt-per-day rule: user rows
 * and guest rows live in separate indexes (nullable columns never collide).
 */
export class CreateDailyChallengeResults1793200000000 implements MigrationInterface {
  name = 'CreateDailyChallengeResults1793200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "daily_challenge_results" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "date" date NOT NULL,
        "userId" uuid,
        "guestId" varchar(64),
        "score" int NOT NULL,
        "correctCount" int NOT NULL,
        "total" int NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_daily_challenge_results" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "uq_daily_user_date" ON "daily_challenge_results" ("date", "userId") WHERE "userId" IS NOT NULL`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "uq_daily_guest_date" ON "daily_challenge_results" ("date", "guestId") WHERE "guestId" IS NOT NULL`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "ix_daily_identity_dates" ON "daily_challenge_results" ("userId")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "ix_daily_guest_dates" ON "daily_challenge_results" ("guestId")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "daily_challenge_results"`);
  }
}
