import { MigrationInterface, QueryRunner } from "typeorm";

export class AddQuizIndexes1774282972961 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Questions table indexes
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_questions_chapterId_level_status" ON "questions" ("chapterId", "level", "status")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_questions_level" ON "questions" ("level")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_questions_chapterId" ON "questions" ("chapterId")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_questions_status" ON "questions" ("status")`);

        // Chapters table index
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_chapters_subjectId" ON "chapters" ("subjectId")`);

        // Subjects table indexes
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_subjects_slug" ON "subjects" ("slug")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_subjects_order" ON "subjects" ("order")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Questions table indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_questions_chapterId_level_status"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_questions_level"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_questions_chapterId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_questions_status"`);

        // Chapters table index
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_chapters_subjectId"`);

        // Subjects table indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_subjects_slug"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_subjects_order"`);
    }

}
