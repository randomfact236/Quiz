import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRiddleCategories1700000000001 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE riddle_categories (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                slug VARCHAR(255) NOT NULL UNIQUE,
                name VARCHAR(255) NOT NULL,
                emoji VARCHAR(50) NOT NULL,
                "isActive" BOOLEAN DEFAULT true,
                "order" INTEGER DEFAULT 0,
                "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        await queryRunner.query(`
            CREATE INDEX idx_riddle_categories_slug ON riddle_categories (slug)
        `);
        
        await queryRunner.query(`
            CREATE INDEX idx_riddle_categories_order ON riddle_categories ("order")
        `);
        
        await queryRunner.query(`
            ALTER TABLE riddle_subjects 
            ADD COLUMN "categoryId" uuid REFERENCES riddle_categories(id) ON DELETE SET NULL
        `);
        
        await queryRunner.query(`
            CREATE INDEX idx_riddle_subjects_categoryId ON riddle_subjects ("categoryId")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE riddle_subjects DROP COLUMN IF EXISTS "categoryId"`);
        await queryRunner.query(`DROP INDEX idx_riddle_subjects_categoryId`);
        await queryRunner.query(`DROP TABLE riddle_categories`);
    }

}