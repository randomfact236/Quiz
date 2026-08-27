import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Remove the unused quiz-format joke hierarchy (subject → chapter → quiz-joke).
 * All three tables are empty; no data is lost.
 *
 * Drop order respects FK constraints:
 *   quiz_jokes → joke_chapters → joke_subjects
 */
export class DropQuizFormatTables1787821304000 implements MigrationInterface {
  name = 'DropQuizFormatTables1787821304000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "quiz_jokes"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."quiz_jokes_level_enum"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "joke_chapters"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "joke_subjects"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "joke_subjects" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "slug" character varying NOT NULL, "name" character varying NOT NULL, "emoji" character varying NOT NULL, "description" character varying, "isActive" boolean NOT NULL DEFAULT true, "order" integer NOT NULL DEFAULT '0', CONSTRAINT "UQ_dc1c2fa96b3aabe0ab641feab1f" UNIQUE ("slug"), CONSTRAINT "PK_1e433bcad727422066743a4be61" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "joke_chapters" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "chapterNumber" integer NOT NULL, "subjectId" uuid NOT NULL, CONSTRAINT "PK_e2439673d297f339a6a370f97e2" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."quiz_jokes_level_enum" AS ENUM('easy', 'medium', 'hard', 'expert', 'extreme')`
    );
    await queryRunner.query(
      `CREATE TABLE "quiz_jokes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "question" text NOT NULL, "options" text NOT NULL, "correctAnswer" character varying NOT NULL, "level" "public"."quiz_jokes_level_enum" NOT NULL, "chapterId" uuid NOT NULL, "explanation" text, "punchline" text, CONSTRAINT "PK_73dd0c1cc17eaf548a2dcb746f3" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_jokes" ADD CONSTRAINT "FK_642fa32c57a07c987c552648189" FOREIGN KEY ("chapterId") REFERENCES "joke_chapters"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "joke_chapters" ADD CONSTRAINT "FK_a0017b448a4252f7839def954d7" FOREIGN KEY ("subjectId") REFERENCES "joke_subjects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }
}
