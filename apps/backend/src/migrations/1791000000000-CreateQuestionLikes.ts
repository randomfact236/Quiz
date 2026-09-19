import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * BUG-037: question like capture (internal like-bucket classification).
 * One row per (contentType, questionId, guestId); logged-in likes also carry
 * the account id. Buckets (1 / 2 / 3+) are derived by COUNT at read time.
 */
export class CreateQuestionLikes1791000000000 implements MigrationInterface {
  name = 'CreateQuestionLikes1791000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DO $$ BEGIN CREATE TYPE "question_likes_content_type_enum" AS ENUM('quiz', 'riddle'); EXCEPTION WHEN duplicate_object THEN null; END $$;`
    );
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "question_likes" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "contentType" "question_likes_content_type_enum" NOT NULL,
        "questionId" uuid NOT NULL,
        "guestId" varchar(64) NOT NULL,
        "userId" uuid,
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_question_likes" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "uq_question_likes_dedupe" ON "question_likes" ("contentType", "questionId", "guestId")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "ix_question_likes_target" ON "question_likes" ("contentType", "questionId")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "question_likes"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "question_likes_content_type_enum"`);
  }
}
