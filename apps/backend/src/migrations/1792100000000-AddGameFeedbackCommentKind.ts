import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * BUG-053 (agreed design, owner 2026-09-19): in-game feedback on the static
 * games' pause/game-over screens. Games post into the shared comments service
 * with a dedicated 'game' content type (contentId = game slug) and a
 * 'feedback' kind, so entries land in the existing admin moderation panel.
 * ADD VALUE cannot run in the transaction that created the type — both enums
 * predate this migration, so this is safe on Postgres 12+.
 */
export class AddGameFeedbackCommentKind1792100000000 implements MigrationInterface {
  name = 'AddGameFeedbackCommentKind1792100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "comments_content_type_enum" ADD VALUE IF NOT EXISTS 'game'`
    );
    await queryRunner.query(`ALTER TYPE "comments_kind_enum" ADD VALUE IF NOT EXISTS 'feedback'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Postgres cannot remove enum values without rewriting the column; leave
    // the (harmless, unused) values in place on revert.
    void queryRunner;
  }
}
