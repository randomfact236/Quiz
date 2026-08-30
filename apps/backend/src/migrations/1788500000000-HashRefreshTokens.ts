import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Refresh-token hardening (plan/01-user-accounts.md P1).
 *
 * `users.refreshToken` switches from storing the raw opaque token to storing
 * its SHA-256 hash, and gains a `refreshTokenExpiresAt` column (7-day expiry,
 * enforced in AuthService.refresh).
 *
 * Existing rows hold plaintext tokens that cannot be reversed into hashes, so
 * they are cleared — everyone is logged out once and simply logs back in.
 * Idempotent: guarded with IF EXISTS / WHERE so dev DBs stay safe on re-run.
 */
export class HashRefreshTokens1788500000000 implements MigrationInterface {
  name = 'HashRefreshTokens1788500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "refreshTokenExpiresAt" TIMESTAMPTZ`
    );
    // Plaintext tokens are worthless as hashes — revoke them all.
    await queryRunner.query(
      `UPDATE "users" SET "refreshToken" = NULL WHERE "refreshToken" IS NOT NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "refreshTokenExpiresAt"`);
  }
}
