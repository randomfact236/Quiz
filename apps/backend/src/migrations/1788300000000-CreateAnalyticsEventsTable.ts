import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Create the `analytics_events` wide event table (analytics plan Phase 1).
 *
 * Every client `track()` call and server-side hook lands here: shared
 * envelope (eventName, module, userId, guestId, sessionId, page) plus a
 * free-form jsonb `properties` payload. Indexed for the dashboard's
 * group-bys (eventName, module, actor, time).
 *
 * Idempotent: guarded against an existing table (dev DBs running
 * synchronize may already have it).
 */
export class CreateAnalyticsEventsTable1788300000000 implements MigrationInterface {
  name = 'CreateAnalyticsEventsTable1788300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "analytics_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "eventName" character varying(64) NOT NULL,
        "module" character varying(32),
        "userId" uuid,
        "guestId" character varying(64),
        "sessionId" character varying(64),
        "page" character varying(255),
        "properties" jsonb,
        "clientTs" TIMESTAMPTZ,
        "serverTs" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_analytics_events_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_analytics_events_event_name" ON "analytics_events" ("eventName")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_analytics_events_module" ON "analytics_events" ("module")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_analytics_events_user_id" ON "analytics_events" ("userId")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_analytics_events_guest_id" ON "analytics_events" ("guestId")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_analytics_events_server_ts" ON "analytics_events" ("serverTs")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "analytics_events"`);
  }
}
