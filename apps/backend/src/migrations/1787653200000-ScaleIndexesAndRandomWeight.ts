import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Capacity-plan Track A (plan/capacity-plan.md):
 * - A1: pg_trgm GIN indexes for ILIKE admin search over 50k+ rows,
 *       plus (status, updatedAt DESC) composites for deep-page pagination.
 * - A2: indexed random_weight column for O(1) index-seek random selection.
 */
export class ScaleIndexesAndRandomWeight1787653200000 implements MigrationInterface {
  name = 'ScaleIndexesAndRandomWeight1787653200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);

    // A1 — search
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_questions_question_trgm" ON "questions" USING gin ("question" gin_trgm_ops)`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_riddle_mcqs_question_trgm" ON "riddle_mcqs" USING gin ("question" gin_trgm_ops)`
    );

    // A1 — sort/pagination
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_questions_status_updatedAt" ON "questions" ("status", "updatedAt" DESC)`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_riddle_mcqs_status_updatedAt" ON "riddle_mcqs" ("status", "updatedAt" DESC)`
    );

    // A2 — random_weight (float8, indexed B-tree, seeded for existing rows)
    await queryRunner.query(
      `ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "random_weight" double precision NOT NULL DEFAULT random()`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_questions_random_weight" ON "questions" ("random_weight")`
    );

    await queryRunner.query(
      `ALTER TABLE "riddle_mcqs" ADD COLUMN IF NOT EXISTS "random_weight" double precision NOT NULL DEFAULT random()`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_riddle_mcqs_random_weight" ON "riddle_mcqs" ("random_weight")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_riddle_mcqs_random_weight"`);
    await queryRunner.query(`ALTER TABLE "riddle_mcqs" DROP COLUMN IF EXISTS "random_weight"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_questions_random_weight"`);
    await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN IF EXISTS "random_weight"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_riddle_mcqs_status_updatedAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_questions_status_updatedAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_riddle_mcqs_question_trgm"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_questions_question_trgm"`);
  }
}
