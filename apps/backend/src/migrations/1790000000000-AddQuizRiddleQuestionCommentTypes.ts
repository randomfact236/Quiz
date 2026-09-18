import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * BUG-036 (per-question comments, results/review screen scope): allow the
 * shared comments feed to serve quiz and riddle questions. The content types
 * live in a Postgres enum — extend it before the backend enum ships, or any
 * insert with the new values fails the NOT NULL enum column.
 *
 * ADD VALUE cannot run in the same transaction that created the type, but
 * TypeORM wraps each migration in its own transaction and this type was
 * created by migration 1788100000000 — safe on Postgres 12+.
 */
export class AddQuizRiddleQuestionCommentTypes1790000000000 implements MigrationInterface {
  name = 'AddQuizRiddleQuestionCommentTypes1790000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "comments_content_type_enum" ADD VALUE IF NOT EXISTS 'quiz-question'`
    );
    await queryRunner.query(
      `ALTER TYPE "comments_content_type_enum" ADD VALUE IF NOT EXISTS 'riddle-question'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Postgres cannot remove enum values without rewriting the column; leave
    // the (harmless, unused) values in place on revert.
    void queryRunner;
  }
}
