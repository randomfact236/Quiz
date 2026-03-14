import { MigrationInterface, QueryRunner } from "typeorm";

export class AddQuestionTypeAndCorrectLetter1773514916703 implements MigrationInterface {
    name = 'AddQuestionTypeAndCorrectLetter1773514916703'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."questions_questiontype_enum" AS ENUM('mcq', 'open_ended')`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "questionType" "public"."questions_questiontype_enum" NOT NULL DEFAULT 'mcq'`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "correctLetter" character varying(1)`);
        await queryRunner.query(`ALTER TABLE "questions" ALTER COLUMN "options" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "questions" ALTER COLUMN "options" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "correctLetter"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "questionType"`);
        await queryRunner.query(`DROP TYPE "public"."questions_questiontype_enum"`);
    }

}
