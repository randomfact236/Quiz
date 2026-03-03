/**
 * Emergency Database Fix Script
 * Run: node fix-database.js
 */

const { Client } = require('pg');
require('dotenv').config();

const sql = `
-- Create riddle_subjects table
CREATE TABLE IF NOT EXISTS riddle_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    description TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create riddle_chapters table
CREATE TABLE IF NOT EXISTS riddle_chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    "chapterNumber" INTEGER NOT NULL,
    "subjectId" UUID NOT NULL REFERENCES riddle_subjects(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create quiz_riddles table
CREATE TABLE IF NOT EXISTS quiz_riddles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    options TEXT[] NOT NULL,
    "correctAnswer" VARCHAR(255) NOT NULL,
    level VARCHAR(10) NOT NULL CHECK (level IN ('easy', 'medium', 'hard', 'expert', 'extreme')),
    "chapterId" UUID NOT NULL REFERENCES riddle_chapters(id) ON DELETE CASCADE,
    explanation TEXT,
    hint TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create riddle_categories table
CREATE TABLE IF NOT EXISTS riddle_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    emoji VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create riddles table
CREATE TABLE IF NOT EXISTS riddles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    difficulty VARCHAR(10) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    "categoryId" UUID REFERENCES riddle_categories(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('published', 'draft', 'trash')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_quiz_riddles_chapter ON quiz_riddles("chapterId");
CREATE INDEX IF NOT EXISTS idx_quiz_riddles_level ON quiz_riddles(level);
CREATE INDEX IF NOT EXISTS idx_riddle_chapters_subject ON riddle_chapters("subjectId");
CREATE INDEX IF NOT EXISTS idx_riddle_subjects_slug ON riddle_subjects(slug);

-- Insert sample subjects
INSERT INTO riddle_subjects (slug, name, emoji, description, "order", "isActive") VALUES 
    ('brain-teasers', 'Brain Teasers', '🧩', 'Mind-bending riddles and puzzles', 1, true),
    ('logic-puzzles', 'Logic Puzzles', '🎯', 'Test your logical reasoning', 2, true),
    ('word-riddles', 'Word Riddles', '💬', 'Wordplay and language riddles', 3, true)
ON CONFLICT DO NOTHING;
`;

const seedSql = `
-- Insert chapters
DO $$
DECLARE
    bt_id UUID;
    lp_id UUID;
    wr_id UUID;
BEGIN
    SELECT id INTO bt_id FROM riddle_subjects WHERE slug = 'brain-teasers';
    SELECT id INTO lp_id FROM riddle_subjects WHERE slug = 'logic-puzzles';
    SELECT id INTO wr_id FROM riddle_subjects WHERE slug = 'word-riddles';
    
    IF bt_id IS NOT NULL THEN
        INSERT INTO riddle_chapters (name, "chapterNumber", "subjectId") VALUES 
            ('Trick Questions', 1, bt_id),
            ('Visual Puzzles', 2, bt_id),
            ('Lateral Thinking', 3, bt_id)
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF lp_id IS NOT NULL THEN
        INSERT INTO riddle_chapters (name, "chapterNumber", "subjectId") VALUES 
            ('Deduction', 1, lp_id),
            ('Pattern Recognition', 2, lp_id)
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF wr_id IS NOT NULL THEN
        INSERT INTO riddle_chapters (name, "chapterNumber", "subjectId") VALUES 
            ('Anagrams', 1, wr_id),
            ('Homophones', 2, wr_id)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Insert sample riddles
DO $$
DECLARE
    ch_id UUID;
BEGIN
    SELECT id INTO ch_id FROM riddle_chapters WHERE name = 'Trick Questions' LIMIT 1;
    
    IF ch_id IS NOT NULL THEN
        INSERT INTO quiz_riddles (question, options, "correctAnswer", level, "chapterId", explanation, hint) VALUES 
            ('What has keys but no locks?', ARRAY['A piano', 'A keyboard', 'A map', 'A car'], 'A piano', 'easy', ch_id, 'A piano has musical keys', 'Think about music'),
            ('What gets wetter the more it dries?', ARRAY['A towel', 'A sponge', 'Water', 'Rain'], 'A towel', 'easy', ch_id, 'A towel absorbs water', 'Used after showering'),
            ('The more you take, the more you leave behind. What am I?', ARRAY['Footsteps', 'Memories', 'Time', 'Money'], 'Footsteps', 'medium', ch_id, 'You leave footsteps when walking', 'You make them when walking')
        ON CONFLICT DO NOTHING;
    END IF;
    
    SELECT id INTO ch_id FROM riddle_chapters WHERE name = 'Deduction' LIMIT 1;
    
    IF ch_id IS NOT NULL THEN
        INSERT INTO quiz_riddles (question, options, "correctAnswer", level, "chapterId", explanation, hint) VALUES 
            ('A farmer has 17 sheep and all but 9 die. How many are left?', ARRAY['9', '8', '17', '0'], '9', 'easy', ch_id, 'Read carefully: all BUT 9 died', 'Read the question again'),
            ('If all Bloops are Razzies and all Razzies are Lazzies, are all Bloops definitely Lazzies?', ARRAY['Yes', 'No', 'Maybe', 'Not enough info'], 'Yes', 'medium', ch_id, 'Transitive property applies', 'Think about transitive logic')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
`;

async function fix() {
  console.log('🔧 Connecting to database...');
  
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  try {
    await client.connect();
    console.log('✅ Connected');
    
    console.log('📦 Creating tables...');
    await client.query(sql);
    console.log('✅ Tables created');
    
    console.log('🌱 Seeding data...');
    await client.query(seedSql);
    console.log('✅ Data seeded');
    
    // Verify
    const subjects = await client.query('SELECT COUNT(*) as count FROM riddle_subjects');
    const chapters = await client.query('SELECT COUNT(*) as count FROM riddle_chapters');
    const riddles = await client.query('SELECT COUNT(*) as count FROM quiz_riddles');
    
    console.log('');
    console.log('📊 Database Status:');
    console.log(`  - Subjects: ${subjects.rows[0].count}`);
    console.log(`  - Chapters: ${chapters.rows[0].count}`);
    console.log(`  - Riddles: ${riddles.rows[0].count}`);
    console.log('');
    console.log('🎉 Database fixed! Refresh your frontend.');
    
    await client.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    await client.end();
    process.exit(1);
  }
}

fix();
