import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Constrain users.role to 'user' | 'admin' (plan/01-user-accounts.md P1 #3).
 *
 * The column stays varchar (avoiding a native enum type) and gains a CHECK
 * constraint instead — cheaper to evolve later. Any out-of-enum value is
 * normalized to 'user' first. Idempotent via a DO block.
 */
export class ConstrainUserRole1788600000000 implements MigrationInterface {
  name = 'ConstrainUserRole1788600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "users" SET "role" = 'user' WHERE "role" NOT IN ('user', 'admin')`
    );
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check'
        ) THEN
          ALTER TABLE "users" ADD CONSTRAINT "users_role_check" CHECK ("role" IN ('user', 'admin'));
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_role_check"`);
  }
}
