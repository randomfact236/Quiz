import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Logged-in comment attribution (plan/07-comments.md P1 #1).
 *
 * Adds a nullable `userId` alongside the existing guest identity, plus a
 * public flag path (POST /comments/:id/flag) which needs no schema change —
 * the `flagged` column already exists but had no setter. Idempotent.
 */
export class AddCommentUserId1789300000000 implements MigrationInterface {
  name = 'AddCommentUserId1789300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "userId" uuid`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_comments_userId" ON "comments" ("userId")`
    );
    // Public flag path target — the plan assumed this column existed; it didn't.
    await queryRunner.query(
      `ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "flagged" boolean NOT NULL DEFAULT false`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_comments_userId"`);
    await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN IF EXISTS "userId"`);
    await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN IF EXISTS "flagged"`);
  }
}
