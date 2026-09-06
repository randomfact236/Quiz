import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Duplicate-question detection end-to-end:
 * - content_hash = sha256 of the normalized question text. The SQL
 *   normalization MUST mirror apps/backend
 *   src/common/content/content-hash.util.ts: collapse runs of ASCII
 *   whitespace [ \t\n\r\f\v] to a single space, trim the resulting
 *   leading/trailing space, then lowercase. Postgres regex has no \v escape,
 *   so the class is written '[\t\n\r\f\x0b ]' (\x0b = U+000B).
 * - UNIQUE (chapterId, content_hash) / (subjectId, content_hash) make the
 *   database the final guard; services pre-check and translate the 23505
 *   violation into a friendly 409. The guard below refuses to build the
 *   unique indexes while duplicate rows remain — run
 *   scripts/dedupe-riddle-mcqs.sql first (quiz questions were verified
 *   duplicate-free before this migration).
 */
export class AddContentHashDedup1789700000000 implements MigrationInterface {
  name = 'AddContentHashDedup1789700000000';

  /** Mirrors normalizeQuestionText() in content-hash.util.ts — keep in sync. */
  private readonly normSql = `lower(trim(regexp_replace("question", '[\\t\\n\\r\\f\\x0b ]+', ' ', 'g'), ' '))`;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "content_hash" varchar(64)`
    );
    await queryRunner.query(
      `ALTER TABLE "riddle_mcqs" ADD COLUMN IF NOT EXISTS "content_hash" varchar(64)`
    );

    await queryRunner.query(
      `UPDATE "questions" SET "content_hash" = encode(sha256(convert_to(${this.normSql}, 'UTF8')), 'hex') WHERE "content_hash" IS NULL`
    );
    await queryRunner.query(
      `UPDATE "riddle_mcqs" SET "content_hash" = encode(sha256(convert_to(${this.normSql}, 'UTF8')), 'hex') WHERE "content_hash" IS NULL`
    );

    await queryRunner.query(`ALTER TABLE "questions" ALTER COLUMN "content_hash" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "riddle_mcqs" ALTER COLUMN "content_hash" SET NOT NULL`);

    await queryRunner.query(`DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM "questions" GROUP BY "chapterId", "content_hash" HAVING count(*) > 1
      ) THEN
        RAISE EXCEPTION 'questions still contains duplicate (chapterId, normalized question) rows — dedupe before migrating';
      END IF;
      IF EXISTS (
        SELECT 1 FROM "riddle_mcqs" GROUP BY "subjectId", "content_hash" HAVING count(*) > 1
      ) THEN
        RAISE EXCEPTION 'riddle_mcqs still contains duplicate (subjectId, normalized question) rows — run scripts/dedupe-riddle-mcqs.sql first';
      END IF;
    END $$;`);

    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "uq_questions_chapter_hash" ON "questions" ("chapterId", "content_hash")`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "uq_riddle_mcqs_subject_hash" ON "riddle_mcqs" ("subjectId", "content_hash")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_riddle_mcqs_subject_hash"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_questions_chapter_hash"`);
    await queryRunner.query(`ALTER TABLE "riddle_mcqs" DROP COLUMN IF EXISTS "content_hash"`);
    await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN IF EXISTS "content_hash"`);
  }
}
