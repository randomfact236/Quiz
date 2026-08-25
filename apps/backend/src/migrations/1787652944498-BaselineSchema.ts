import { MigrationInterface, QueryRunner } from 'typeorm';

export class BaselineSchema1787652944498 implements MigrationInterface {
  name = 'BaselineSchema1787652944498';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password" character varying NOT NULL, "name" character varying NOT NULL, "avatar" character varying, "role" character varying NOT NULL DEFAULT 'user', "refreshToken" character varying, "googleId" character varying, "passwordResetToken" character varying, "passwordResetExpires" TIMESTAMP, "country" character varying, "sex" character varying, "ageGroup" character varying, "lastActive" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "system_settings" ("key" character varying NOT NULL, "value" jsonb NOT NULL DEFAULT '{}', "description" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b1b5bc664526d375c94ce9ad43d" PRIMARY KEY ("key"))`
    );
    await queryRunner.query(
      `CREATE TABLE "riddle_categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "slug" character varying NOT NULL, "name" character varying NOT NULL, "emoji" character varying NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e9eabd9fedfac9627721652100b" UNIQUE ("slug"), CONSTRAINT "PK_3a2699919edeb767730201a46a1" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e9eabd9fedfac9627721652100" ON "riddle_categories" ("slug") `
    );
    await queryRunner.query(
      `CREATE TYPE "public"."riddle_mcqs_level_enum" AS ENUM('easy', 'medium', 'hard', 'expert')`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."riddle_mcqs_status_enum" AS ENUM('published', 'draft', 'trash')`
    );
    await queryRunner.query(
      `CREATE TABLE "riddle_mcqs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "question" text NOT NULL, "options" text, "correctLetter" character varying(1), "explanation" text, "hint" text, "answer" text, "level" "public"."riddle_mcqs_level_enum" NOT NULL DEFAULT 'easy', "subjectId" uuid NOT NULL, "status" "public"."riddle_mcqs_status_enum" NOT NULL DEFAULT 'draft', "importOrder" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7f2a27a2fd9858ede4fe3bae0e5" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ffbb928365db55da730d711f4c" ON "riddle_mcqs" ("level") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a7aa344bb6abe1fa60367e187f" ON "riddle_mcqs" ("subjectId") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e3f0e58f23aae9c0ad33088fca" ON "riddle_mcqs" ("status") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cd4be24e9778c7cf02b5d13cc5" ON "riddle_mcqs" ("importOrder") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d2f9eefb96bbe58d425d5c5283" ON "riddle_mcqs" ("subjectId", "level", "status") `
    );
    await queryRunner.query(
      `CREATE TABLE "riddle_subjects" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "slug" character varying NOT NULL, "name" character varying NOT NULL, "emoji" character varying NOT NULL, "categoryId" uuid, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_97e80d014fe0142717638abe683" UNIQUE ("slug"), CONSTRAINT "PK_46bbed6369289f9b0fe6090fea1" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_97e80d014fe0142717638abe68" ON "riddle_subjects" ("slug") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7ceb0e2f505975e60dae8b8081" ON "riddle_subjects" ("categoryId") `
    );
    await queryRunner.query(
      `CREATE TABLE "subjects" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "slug" character varying NOT NULL, "name" character varying NOT NULL, "emoji" character varying NOT NULL, "category" character varying, "isActive" boolean NOT NULL DEFAULT true, "order" integer NOT NULL DEFAULT '0', CONSTRAINT "UQ_cdfc4aab59be2274562eb8e9d20" UNIQUE ("slug"), CONSTRAINT "PK_1a023685ac2b051b4e557b0b280" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cdfc4aab59be2274562eb8e9d2" ON "subjects" ("slug") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_150ced254af7657cd36883790b" ON "subjects" ("order") `
    );
    await queryRunner.query(
      `CREATE TABLE "chapters" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "chapterNumber" integer NOT NULL, "subjectId" uuid NOT NULL, CONSTRAINT "UQ_144b4989ceeadc361c1483f5f98" UNIQUE ("name", "subjectId"), CONSTRAINT "PK_a2bbdbb4bdc786fe0cb0fcfc4a0" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6b2e411410ee8b968b1ebff412" ON "chapters" ("subjectId") `
    );
    await queryRunner.query(
      `CREATE TYPE "public"."questions_level_enum" AS ENUM('easy', 'medium', 'hard', 'expert', 'extreme')`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."questions_status_enum" AS ENUM('published', 'draft', 'trash')`
    );
    await queryRunner.query(
      `CREATE TABLE "questions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "question" text NOT NULL, "options" jsonb DEFAULT '[]', "correctAnswer" character varying NOT NULL, "correctLetter" character varying(1), "level" "public"."questions_level_enum" NOT NULL, "chapterId" uuid NOT NULL, "status" "public"."questions_status_enum" NOT NULL DEFAULT 'draft', "order" integer NOT NULL DEFAULT '0', "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_08a6d4b0f49ff300bf3a0ca60ac" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f4df649d7eecee751526afee9f" ON "questions" ("level") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cfe58fac0630926da6ec28417a" ON "questions" ("chapterId") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_216bcd7e827c3cb52749545d89" ON "questions" ("status") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4b4a733230b2dd212f2ed1f020" ON "questions" ("chapterId", "level", "status") `
    );
    await queryRunner.query(
      `CREATE TABLE "image_riddle_categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "emoji" character varying(10) NOT NULL DEFAULT '🖼️', "description" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d03ce723fccaf028901064ad6a3" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."image_riddles_difficulty_enum" AS ENUM('easy', 'medium', 'hard', 'expert')`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."image_riddles_status_enum" AS ENUM('published', 'draft', 'trash')`
    );
    await queryRunner.query(
      `CREATE TABLE "image_riddles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(255) NOT NULL, "imageUrl" text NOT NULL, "answer" text NOT NULL, "hint" text, "difficulty" "public"."image_riddles_difficulty_enum" NOT NULL DEFAULT 'medium', "altText" character varying(255), "timerSeconds" integer, "showTimer" boolean NOT NULL DEFAULT true, "categoryId" uuid, "isActive" boolean NOT NULL DEFAULT true, "status" "public"."image_riddles_status_enum" NOT NULL DEFAULT 'draft', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "actionOptions" jsonb, "useDefaultActions" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_d0019dd06d64f50a3058e3a0b5a" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."quiz_jokes_level_enum" AS ENUM('easy', 'medium', 'hard', 'expert', 'extreme')`
    );
    await queryRunner.query(
      `CREATE TABLE "quiz_jokes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "question" text NOT NULL, "options" text NOT NULL, "correctAnswer" character varying NOT NULL, "level" "public"."quiz_jokes_level_enum" NOT NULL, "chapterId" uuid NOT NULL, "explanation" text, "punchline" text, CONSTRAINT "PK_73dd0c1cc17eaf548a2dcb746f3" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "joke_chapters" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "chapterNumber" integer NOT NULL, "subjectId" uuid NOT NULL, CONSTRAINT "PK_e2439673d297f339a6a370f97e2" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "joke_subjects" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "slug" character varying NOT NULL, "name" character varying NOT NULL, "emoji" character varying NOT NULL, "description" character varying, "isActive" boolean NOT NULL DEFAULT true, "order" integer NOT NULL DEFAULT '0', CONSTRAINT "UQ_dc1c2fa96b3aabe0ab641feab1f" UNIQUE ("slug"), CONSTRAINT "PK_1e433bcad727422066743a4be61" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "guest_users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "guestId" character varying NOT NULL, "country" character varying, "sex" character varying, "ageGroup" character varying, "quizAttempts" integer DEFAULT '0', "totalScore" integer DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "lastActive" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_353e3e719349014a8ff259e4869" UNIQUE ("guestId"), CONSTRAINT "PK_b7750dc6b75c63a4355732a18d2" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "joke_categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "emoji" character varying, CONSTRAINT "PK_8aa755f086f25835da71f735041" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."dad_jokes_status_enum" AS ENUM('published', 'draft', 'trash')`
    );
    await queryRunner.query(
      `CREATE TABLE "dad_jokes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "joke" text NOT NULL, "categoryId" uuid, "status" "public"."dad_jokes_status_enum" NOT NULL DEFAULT 'draft', "likes" integer NOT NULL DEFAULT '0', "dislikes" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_33784376001978f5dadf00dcc97" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "riddle_mcqs" ADD CONSTRAINT "FK_a7aa344bb6abe1fa60367e187f9" FOREIGN KEY ("subjectId") REFERENCES "riddle_subjects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "riddle_subjects" ADD CONSTRAINT "FK_7ceb0e2f505975e60dae8b8081c" FOREIGN KEY ("categoryId") REFERENCES "riddle_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "chapters" ADD CONSTRAINT "FK_6b2e411410ee8b968b1ebff4121" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "questions" ADD CONSTRAINT "FK_cfe58fac0630926da6ec28417a6" FOREIGN KEY ("chapterId") REFERENCES "chapters"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "image_riddles" ADD CONSTRAINT "FK_0eb4b9e3c06d39b181d1567aac9" FOREIGN KEY ("categoryId") REFERENCES "image_riddle_categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_jokes" ADD CONSTRAINT "FK_642fa32c57a07c987c552648189" FOREIGN KEY ("chapterId") REFERENCES "joke_chapters"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "joke_chapters" ADD CONSTRAINT "FK_a0017b448a4252f7839def954d7" FOREIGN KEY ("subjectId") REFERENCES "joke_subjects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "dad_jokes" ADD CONSTRAINT "FK_de64cafe1cd7cd0e6e6896216d4" FOREIGN KEY ("categoryId") REFERENCES "joke_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "dad_jokes" DROP CONSTRAINT "FK_de64cafe1cd7cd0e6e6896216d4"`
    );
    await queryRunner.query(
      `ALTER TABLE "joke_chapters" DROP CONSTRAINT "FK_a0017b448a4252f7839def954d7"`
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_jokes" DROP CONSTRAINT "FK_642fa32c57a07c987c552648189"`
    );
    await queryRunner.query(
      `ALTER TABLE "image_riddles" DROP CONSTRAINT "FK_0eb4b9e3c06d39b181d1567aac9"`
    );
    await queryRunner.query(
      `ALTER TABLE "questions" DROP CONSTRAINT "FK_cfe58fac0630926da6ec28417a6"`
    );
    await queryRunner.query(
      `ALTER TABLE "chapters" DROP CONSTRAINT "FK_6b2e411410ee8b968b1ebff4121"`
    );
    await queryRunner.query(
      `ALTER TABLE "riddle_subjects" DROP CONSTRAINT "FK_7ceb0e2f505975e60dae8b8081c"`
    );
    await queryRunner.query(
      `ALTER TABLE "riddle_mcqs" DROP CONSTRAINT "FK_a7aa344bb6abe1fa60367e187f9"`
    );
    await queryRunner.query(`DROP TABLE "dad_jokes"`);
    await queryRunner.query(`DROP TYPE "public"."dad_jokes_status_enum"`);
    await queryRunner.query(`DROP TABLE "joke_categories"`);
    await queryRunner.query(`DROP TABLE "guest_users"`);
    await queryRunner.query(`DROP TABLE "joke_subjects"`);
    await queryRunner.query(`DROP TABLE "joke_chapters"`);
    await queryRunner.query(`DROP TABLE "quiz_jokes"`);
    await queryRunner.query(`DROP TYPE "public"."quiz_jokes_level_enum"`);
    await queryRunner.query(`DROP TABLE "image_riddles"`);
    await queryRunner.query(`DROP TYPE "public"."image_riddles_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."image_riddles_difficulty_enum"`);
    await queryRunner.query(`DROP TABLE "image_riddle_categories"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4b4a733230b2dd212f2ed1f020"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_216bcd7e827c3cb52749545d89"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_cfe58fac0630926da6ec28417a"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f4df649d7eecee751526afee9f"`);
    await queryRunner.query(`DROP TABLE "questions"`);
    await queryRunner.query(`DROP TYPE "public"."questions_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."questions_level_enum"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6b2e411410ee8b968b1ebff412"`);
    await queryRunner.query(`DROP TABLE "chapters"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_150ced254af7657cd36883790b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_cdfc4aab59be2274562eb8e9d2"`);
    await queryRunner.query(`DROP TABLE "subjects"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_7ceb0e2f505975e60dae8b8081"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_97e80d014fe0142717638abe68"`);
    await queryRunner.query(`DROP TABLE "riddle_subjects"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d2f9eefb96bbe58d425d5c5283"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_cd4be24e9778c7cf02b5d13cc5"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e3f0e58f23aae9c0ad33088fca"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a7aa344bb6abe1fa60367e187f"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ffbb928365db55da730d711f4c"`);
    await queryRunner.query(`DROP TABLE "riddle_mcqs"`);
    await queryRunner.query(`DROP TYPE "public"."riddle_mcqs_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."riddle_mcqs_level_enum"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e9eabd9fedfac9627721652100"`);
    await queryRunner.query(`DROP TABLE "riddle_categories"`);
    await queryRunner.query(`DROP TABLE "system_settings"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
