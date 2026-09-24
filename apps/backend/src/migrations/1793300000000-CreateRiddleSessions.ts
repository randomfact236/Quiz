import { MigrationInterface, QueryRunner } from 'typeorm';

/** NOW-07: riddle session persistence (quiz_sessions mirror). */
export class CreateRiddleSessions1793300000000 implements MigrationInterface {
  name = 'CreateRiddleSessions1793300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "riddle_sessions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid,
        "guestId" varchar(64),
        "subjectSlug" varchar(255),
        "subjectName" varchar(255),
        "difficulty" varchar(16),
        "mode" varchar(16),
        "totalRiddles" int NOT NULL,
        "correctCount" int NOT NULL,
        "score" int NOT NULL,
        "maxScore" int NOT NULL,
        "timeTaken" int,
        "startedAt" timestamptz NOT NULL DEFAULT now(),
        "completedAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_riddle_sessions" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "ix_riddle_sessions_user_completed" ON "riddle_sessions" ("userId", "completedAt")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "ix_riddle_sessions_guest_completed" ON "riddle_sessions" ("guestId", "completedAt")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "riddle_sessions"`);
  }
}
