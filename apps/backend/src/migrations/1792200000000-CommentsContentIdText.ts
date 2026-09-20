import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * BUG-053: game feedback stores the game slug in contentId, while the
 * question/joke surfaces keep storing UUIDs — widen the column from uuid to
 * text. Existing UUID values convert losslessly.
 */
export class CommentsContentIdText1792200000000 implements MigrationInterface {
  name = 'CommentsContentIdText1792200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "comments" ALTER COLUMN "contentId" TYPE text USING "contentId"::text`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Only UUID-shaped values exist unless game feedback rows were written;
    // drop those before narrowing on revert.
    await queryRunner.query(`DELETE FROM "comments" WHERE "contentType" = 'game'`);
    await queryRunner.query(
      `ALTER TABLE "comments" ALTER COLUMN "contentId" TYPE uuid USING "contentId"::uuid`
    );
  }
}
