import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * BUG-048: public share counters. One aggregated row per
 * (contentType, contentId, platform); every share-target click increments
 * `shares`. Totals are public via GET /share-counts/counts.
 */
export class CreateShareCounts1793000000000 implements MigrationInterface {
  name = 'CreateShareCounts1793000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "share_counts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "contentType" varchar(32) NOT NULL,
        "contentId" varchar(64) NOT NULL,
        "platform" varchar(16) NOT NULL DEFAULT 'other',
        "shares" int NOT NULL DEFAULT 1,
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_share_counts" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "uq_share_counts_target" ON "share_counts" ("contentType", "contentId", "platform")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "ix_share_counts_target" ON "share_counts" ("contentType", "contentId")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "share_counts"`);
  }
}
