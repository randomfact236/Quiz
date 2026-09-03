import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Engagement counters (plan/04-image-riddles.md P1 #1).
 *
 * views/attempts/solves are incremented by the public POST
 * /image-riddles/:id/engage endpoint; they power popularity sorting and the
 * admin dashboard. Existing rows default to 0. Idempotent.
 */
export class AddImageRiddleCounters1789000000000 implements MigrationInterface {
  name = 'AddImageRiddleCounters1789000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "image_riddles" ADD COLUMN IF NOT EXISTS "views" integer NOT NULL DEFAULT 0`
    );
    await queryRunner.query(
      `ALTER TABLE "image_riddles" ADD COLUMN IF NOT EXISTS "attempts" integer NOT NULL DEFAULT 0`
    );
    await queryRunner.query(
      `ALTER TABLE "image_riddles" ADD COLUMN IF NOT EXISTS "solves" integer NOT NULL DEFAULT 0`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "image_riddles" DROP COLUMN IF EXISTS "solves"`);
    await queryRunner.query(`ALTER TABLE "image_riddles" DROP COLUMN IF EXISTS "attempts"`);
    await queryRunner.query(`ALTER TABLE "image_riddles" DROP COLUMN IF EXISTS "views"`);
  }
}
