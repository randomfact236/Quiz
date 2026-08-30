import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Server-side quiz session persistence (plan/02-mcq-quiz.md P1 #1).
 *
 * Creates `quiz_sessions` for completed sessions, so logged-in users keep
 * results/high scores beyond localStorage. Indexes cover the history
 * (user/guest + completedAt) and high-score (score) reads.
 */
export class CreateQuizSessions1788800000000 implements MigrationInterface {
  name = 'CreateQuizSessions1788800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "quiz_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid,
        "guestId" varchar(64),
        "subjectSlug" varchar(255),
        "subjectName" varchar(255),
        "chapterName" varchar(255),
        "level" varchar(16),
        "mode" varchar(16),
        "totalQuestions" integer NOT NULL,
        "correctCount" integer NOT NULL,
        "score" integer NOT NULL,
        "maxScore" integer NOT NULL,
        "durationSeconds" integer,
        "completedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_quiz_sessions" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_quiz_sessions_user_completed" ON "quiz_sessions" ("userId", "completedAt")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_quiz_sessions_guest_completed" ON "quiz_sessions" ("guestId", "completedAt")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_quiz_sessions_score" ON "quiz_sessions" ("score")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "quiz_sessions"`);
  }
}
