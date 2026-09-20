import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Comment timestamps are `timestamp without time zone` while every writer
 * stores UTC wall-clock values. Reading them back, the driver builds a Date
 * in the server's LOCAL zone — on any server not running UTC this shifts
 * every comment's displayed age (observed: "5h45m ago" on fresh posts).
 * Convert to timestamptz, declaring the stored values as UTC so the instants
 * are preserved exactly.
 */
export class CommentsTimestampsTz1792000000000 implements MigrationInterface {
  name = 'CommentsTimestampsTz1792000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "comments" ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC'`
    );
    await queryRunner.query(
      `ALTER TABLE "comments" ALTER COLUMN "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'UTC'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "comments" ALTER COLUMN "createdAt" TYPE timestamp USING "createdAt" AT TIME ZONE 'UTC'`
    );
    await queryRunner.query(
      `ALTER TABLE "comments" ALTER COLUMN "updatedAt" TYPE timestamp USING "updatedAt" AT TIME ZONE 'UTC'`
    );
  }
}
