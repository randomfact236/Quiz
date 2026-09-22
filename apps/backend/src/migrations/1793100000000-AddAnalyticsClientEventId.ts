import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * TASK-02: analytics ingest double-count prevention.
 *
 * Adds the client-minted idempotency key (`clientEventId`) to
 * analytics_events with a UNIQUE index, so a retried flush (lost response,
 * beacon retry) is stored once. Existing rows keep NULL — Postgres unique
 * indexes admit multiple NULLs, so legacy and id-less events are unaffected.
 */
export class AddAnalyticsClientEventId1793100000000 implements MigrationInterface {
  name = 'AddAnalyticsClientEventId1793100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "analytics_events" ADD COLUMN IF NOT EXISTS "clientEventId" varchar(64)`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "uq_analytics_events_client_event_id" ON "analytics_events" ("clientEventId")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_analytics_events_client_event_id"`);
    await queryRunner.query(`ALTER TABLE "analytics_events" DROP COLUMN IF EXISTS "clientEventId"`);
  }
}
