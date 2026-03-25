import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRiddleMcqIndexes1700000000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE INDEX idx_riddle_mcqs_chapterId_level_status 
            ON riddle_mcqs (chapterId, level, status)
        `);
        
        await queryRunner.query(`
            CREATE INDEX idx_riddle_mcqs_chapterId 
            ON riddle_mcqs (chapterId)
        `);
        
        await queryRunner.query(`
            CREATE INDEX idx_riddle_mcqs_level 
            ON riddle_mcqs (level)
        `);
        
        await queryRunner.query(`
            CREATE INDEX idx_riddle_mcqs_status 
            ON riddle_mcqs (status)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_riddle_chapters_subjectId 
            ON riddle_chapters (subjectId)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_riddle_subjects_slug 
            ON riddle_subjects (slug)
        `);
        
        await queryRunner.query(`
            CREATE INDEX idx_riddle_subjects_order 
            ON riddle_subjects (order)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_riddle_chapter_slug_history_chapterId 
            ON riddle_chapter_slug_history (chapterId)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX idx_riddle_mcqs_chapterId_level_status`);
        await queryRunner.query(`DROP INDEX idx_riddle_mcqs_status`);
        await queryRunner.query(`DROP INDEX idx_riddle_mcqs_level`);
        await queryRunner.query(`DROP INDEX idx_riddle_mcqs_chapterId`);
        await queryRunner.query(`DROP INDEX idx_riddle_chapters_subjectId`);
        await queryRunner.query(`DROP INDEX idx_riddle_subjects_order`);
        await queryRunner.query(`DROP INDEX idx_riddle_subjects_slug`);
        await queryRunner.query(`DROP INDEX idx_riddle_chapter_slug_history_chapterId`);
    }

}