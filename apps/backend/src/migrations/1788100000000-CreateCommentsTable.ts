import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Create the polymorphic `comments` table (comments-system plan §2.1).
 *
 * One table backs image-riddle guess feeds (guess + chip kinds, server-set
 * isCorrect) and dad-joke 💬 replies (comment kind). Status reuses the
 * shared draft/published/trash lifecycle; TRASH is the admin soft-hide.
 *
 * Idempotency/safety: every statement is guarded so re-running against a
 * dev DB that already has the table (e.g. via synchronize) is a no-op.
 */
export class CreateCommentsTable1788100000000 implements MigrationInterface {
  name = 'CreateCommentsTable1788100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DO $$ BEGIN CREATE TYPE "comments_content_type_enum" AS ENUM('image-riddle', 'joke'); EXCEPTION WHEN duplicate_object THEN null; END $$;`
    );
    await queryRunner.query(
      `DO $$ BEGIN CREATE TYPE "comments_kind_enum" AS ENUM('guess', 'chip', 'comment'); EXCEPTION WHEN duplicate_object THEN null; END $$;`
    );
    await queryRunner.query(
      `DO $$ BEGIN CREATE TYPE "comments_status_enum" AS ENUM('draft', 'published', 'trash'); EXCEPTION WHEN duplicate_object THEN null; END $$;`
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "comments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "contentType" "comments_content_type_enum" NOT NULL,
        "contentId" uuid NOT NULL,
        "guestId" character varying(64) NOT NULL,
        "kind" "comments_kind_enum" NOT NULL,
        "text" text,
        "chip" character varying(32),
        "isCorrect" boolean NOT NULL DEFAULT false,
        "status" "comments_status_enum" NOT NULL DEFAULT 'published',
        "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_comments_id" PRIMARY KEY ("id")
      )`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_comments_feed" ON "comments" ("contentType", "contentId", "status", "createdAt" DESC)`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_comments_guest" ON "comments" ("guestId")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "comments"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "comments_content_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "comments_kind_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "comments_status_enum"`);
  }
}
