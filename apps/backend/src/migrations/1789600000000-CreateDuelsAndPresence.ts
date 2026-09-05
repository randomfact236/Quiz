import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Online duel tables + guest presence columns (mobile-app plan/17-online-duel.md,
 * backend gap #7).
 *
 * - duel_matches: race-mode matches with a frozen question set per match.
 * - duel_participants: per-player state; unique (match, guest); lastPolledAt
 *   is the leave heartbeat (30 s silence while running voids the match).
 * - guest_users: displayName (nickname shown to opponents / players list) and
 *   showInList (opt-out listing toggle, default on).
 */
export class CreateDuelsAndPresence1789600000000 implements MigrationInterface {
  name = 'CreateDuelsAndPresence1789600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "duel_matches" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" varchar(6) NOT NULL,
        "level" varchar(16) NOT NULL,
        "questionIds" jsonb NOT NULL,
        "status" varchar(16) NOT NULL DEFAULT 'waiting',
        "expiresAt" timestamptz NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_duel_matches_code" UNIQUE ("code"),
        CONSTRAINT "PK_duel_matches" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IX_duel_matches_status" ON "duel_matches" ("status")
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "duel_participants" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "matchId" uuid NOT NULL,
        "guestId" varchar(64) NOT NULL,
        "playerName" varchar(32) NOT NULL,
        "slot" smallint NOT NULL,
        "startedAt" timestamptz,
        "finishedAt" timestamptz,
        "completedCount" integer NOT NULL DEFAULT 0,
        "correctCount" integer NOT NULL DEFAULT 0,
        "score" integer NOT NULL DEFAULT 0,
        "durationMs" integer,
        "lastPolledAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_duel_participant" UNIQUE ("matchId", "guestId"),
        CONSTRAINT "PK_duel_participants" PRIMARY KEY ("id"),
        CONSTRAINT "FK_duel_participants_match" FOREIGN KEY ("matchId")
          REFERENCES "duel_matches"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IX_duel_participants_guestId" ON "duel_participants" ("guestId")
    `);
    await queryRunner.query(`
      ALTER TABLE "guest_users"
        ADD COLUMN IF NOT EXISTS "displayName" varchar(32),
        ADD COLUMN IF NOT EXISTS "showInList" boolean NOT NULL DEFAULT true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "duel_participants"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "duel_matches"`);
    await queryRunner.query(`
      ALTER TABLE "guest_users"
        DROP COLUMN IF EXISTS "displayName",
        DROP COLUMN IF EXISTS "showInList"
    `);
  }
}
