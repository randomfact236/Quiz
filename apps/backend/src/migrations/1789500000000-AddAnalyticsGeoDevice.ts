import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Geo + device enrichment columns for analytics_events.
 *
 * Populated server-side at ingest (geoip-lite on the request IP,
 * ua-parser-js on the User-Agent). Raw IPs are never persisted —
 * `ipAnon` stores a /24 (IPv4) or /48 (IPv6) truncation for
 * privacy-safe visitor dedupe in geo breakdowns.
 */
export class AddAnalyticsGeoDevice1789500000000 implements MigrationInterface {
  name = 'AddAnalyticsGeoDevice1789500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "analytics_events"
        ADD COLUMN IF NOT EXISTS "country" varchar(64),
        ADD COLUMN IF NOT EXISTS "region" varchar(128),
        ADD COLUMN IF NOT EXISTS "city" varchar(128),
        ADD COLUMN IF NOT EXISTS "deviceType" varchar(16),
        ADD COLUMN IF NOT EXISTS "browser" varchar(64),
        ADD COLUMN IF NOT EXISTS "os" varchar(64),
        ADD COLUMN IF NOT EXISTS "referrerDomain" varchar(128),
        ADD COLUMN IF NOT EXISTS "ipAnon" varchar(64)
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_analytics_events_country" ON "analytics_events" ("country")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_analytics_events_country"`);
    await queryRunner.query(`
      ALTER TABLE "analytics_events"
        DROP COLUMN IF EXISTS "ipAnon",
        DROP COLUMN IF EXISTS "referrerDomain",
        DROP COLUMN IF EXISTS "os",
        DROP COLUMN IF EXISTS "browser",
        DROP COLUMN IF EXISTS "deviceType",
        DROP COLUMN IF EXISTS "city",
        DROP COLUMN IF EXISTS "region",
        DROP COLUMN IF EXISTS "country"
    `);
  }
}
