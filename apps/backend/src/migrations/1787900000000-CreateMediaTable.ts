import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Create the `media` table for the media library feature.
 *
 * The MediaModule was previously only usable when DB_SYNCHRONIZE=true
 * (development auto-sync). With synchronize now permanently disabled on
 * staging/production (migrations-only schema), this table would be missing
 * entirely on those deployments. This migration makes the schema explicit.
 *
 * Idempotency/safety: uses `IF NOT EXISTS` so re-running against a dev DB
 * that already has the table from synchronize is a no-op rather than an error.
 */
export class CreateMediaTable1787900000000 implements MigrationInterface {
  name = 'CreateMediaTable1787900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // CREATE TYPE has no IF NOT EXISTS in this PostgreSQL version; guard with a
    // DO block so re-running against a DB that already has the type (e.g. via
    // synchronize) is a no-op rather than an error.
    await queryRunner.query(
      `DO $$ BEGIN CREATE TYPE "public"."media_conversion_status_enum" AS ENUM('pending', 'processing', 'completed', 'failed', 'skipped'); EXCEPTION WHEN duplicate_object THEN null; END $$;`
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "media" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "filename" character varying(500) NOT NULL, "url" character varying(500) NOT NULL, "alt" text, "mimeType" character varying(100) NOT NULL, "fileSize" integer NOT NULL, "width" integer, "height" integer, "isConverted" boolean NOT NULL DEFAULT false, "conversionStatus" "public"."media_conversion_status_enum" NOT NULL DEFAULT 'pending', "variants" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_media_id" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_media_mimeType" ON "media" ("mimeType") `
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_media_isConverted" ON "media" ("isConverted") `
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_media_createdAt" ON "media" ("createdAt") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_media_createdAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_media_isConverted"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_media_mimeType"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "media"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."media_conversion_status_enum"`);
  }
}
