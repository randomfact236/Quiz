import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Explanations end-to-end (plan/02-mcq-quiz.md P1 #4).
 *
 * The review UI already renders `question.explanation`; this adds the missing
 * backend column so admins can author it. Idempotent.
 */
export class AddQuestionExplanation1788900000000 implements MigrationInterface {
  name = 'AddQuestionExplanation1788900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "explanation" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN IF EXISTS "explanation"`);
  }
}
