import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Email verification (plan/01-user-accounts.md P1 #4).
 *
 * Adds the verified flag plus a hashed one-time token/expiry pair to `users`.
 * Existing users keep emailVerified = false — they can request a verification
 * email via POST /auth/resend-verification. Idempotent.
 */
export class AddEmailVerification1788700000000 implements MigrationInterface {
  name = 'AddEmailVerification1788700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerified" boolean NOT NULL DEFAULT false`
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerificationToken" varchar`
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerificationExpires" timestamp`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "emailVerificationExpires"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "emailVerificationToken"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "emailVerified"`);
  }
}
