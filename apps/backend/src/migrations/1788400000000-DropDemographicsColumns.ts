import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Remove the demographics feature end to end.
 *
 * The DemographicsPopup (country / sex / ageGroup) and both collection
 * endpoints (POST /auth/demographics, POST /guest-users/demographics) are
 * gone, so these columns can no longer receive data. Drop them from
 * `users` and `guest_users` and purge the popup funnel events.
 *
 * Idempotent: guarded with IF EXISTS so dev DBs running synchronize stay safe.
 */
export class DropDemographicsColumns1788400000000 implements MigrationInterface {
  name = 'DropDemographicsColumns1788400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "country"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "sex"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "ageGroup"`);
    await queryRunner.query(`ALTER TABLE "guest_users" DROP COLUMN IF EXISTS "country"`);
    await queryRunner.query(`ALTER TABLE "guest_users" DROP COLUMN IF EXISTS "sex"`);
    await queryRunner.query(`ALTER TABLE "guest_users" DROP COLUMN IF EXISTS "ageGroup"`);
    await queryRunner.query(
      `DELETE FROM "analytics_events" WHERE "eventName" IN ('demographics_submitted', 'demographics_skipped')`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "country" character varying`
    );
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "sex" character varying`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ageGroup" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "guest_users" ADD COLUMN IF NOT EXISTS "country" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "guest_users" ADD COLUMN IF NOT EXISTS "sex" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "guest_users" ADD COLUMN IF NOT EXISTS "ageGroup" character varying`
    );
  }
}
