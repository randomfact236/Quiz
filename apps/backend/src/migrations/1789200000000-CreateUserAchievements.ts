import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Server-side achievement unlocks (plan/06-achievements.md P1 #3).
 *
 * Mirrors the client-side unlock store so unlocks survive browser resets and
 * are visible server-side. Attribution: userId (logged in) and/or guestId
 * (client-issued) — a guest's unlocks can later be claimed by their account.
 * UNIQUE (attribution, achievementId). Idempotent.
 */
export class CreateUserAchievements1789200000000 implements MigrationInterface {
  name = 'CreateUserAchievements1789200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_achievements" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid,
        "guestId" varchar(64),
        "achievementId" varchar(64) NOT NULL,
        "unlockedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_achievements" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_achievements_voter" UNIQUE ("userId", "guestId", "achievementId")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_user_achievements_user" ON "user_achievements" ("userId")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_user_achievements_guest" ON "user_achievements" ("guestId")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_achievements"`);
  }
}
