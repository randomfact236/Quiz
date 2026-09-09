import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Security remediation (security-audit-2026-09-09.md A3): guestId doubles as
 * the authorization secret for guest writes, so it must never be disclosed to
 * other players. Guests get a separate non-secret publicId used for duel
 * challenge targeting; /presence/players now returns publicId instead of
 * guestId. gen_random_uuid() is built in on Postgres 13+.
 */
export class AddGuestPublicId1789800000000 implements MigrationInterface {
  name = 'AddGuestPublicId1789800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "guest_users" ADD COLUMN IF NOT EXISTS "publicId" uuid`);
    await queryRunner.query(
      `UPDATE "guest_users" SET "publicId" = gen_random_uuid() WHERE "publicId" IS NULL`
    );
    await queryRunner.query(`ALTER TABLE "guest_users" ALTER COLUMN "publicId" SET NOT NULL`);
    // Future inserts (incl. the raw-SQL INSERT in GuestUsersService) rely on the
    // DB default — synchronize is off in production, so the entity-level default
    // alone would leave the column without one.
    await queryRunner.query(
      `ALTER TABLE "guest_users" ALTER COLUMN "publicId" SET DEFAULT gen_random_uuid()`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_guest_users_public_id" ON "guest_users" ("publicId")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_guest_users_public_id"`);
    await queryRunner.query(`ALTER TABLE "guest_users" DROP COLUMN IF EXISTS "publicId"`);
  }
}
