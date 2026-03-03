-- ============================================================================
-- EMERGENCY DATABASE FIX - Create All Riddle Tables
-- ============================================================================
-- Run this SQL in your PostgreSQL database to fix the "relation does not exist" error
-- ============================================================================

-- 1. Create riddle_subjects table (quiz format subjects)
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

-- 2. Create riddle_chapters table (quiz format chapters)
CREATE TABLE IF NOT EXISTS riddle_chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    "chapterNumber" INTEGER NOT NULL,
    "subjectId" UUID NOT NULL REFERENCES riddle_subjects(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create quiz_riddles table (quiz format with multiple choice)
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

-- 4. Create riddle_categories table (classic format categories)
CREATE TABLE IF NOT EXISTS riddle_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    emoji VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create riddles table (classic format)
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

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_riddles_category ON riddles("categoryId");
CREATE INDEX IF NOT EXISTS idx_riddles_difficulty ON riddles(difficulty);
CREATE INDEX IF NOT EXISTS idx_riddles_status ON riddles(status);
CREATE INDEX IF NOT EXISTS idx_quiz_riddles_chapter ON quiz_riddles("chapterId");
CREATE INDEX IF NOT EXISTS idx_quiz_riddles_level ON quiz_riddles(level);
CREATE INDEX IF NOT EXISTS idx_riddle_chapters_subject ON riddle_chapters("subjectId");
CREATE INDEX IF NOT EXISTS idx_riddle_subjects_slug ON riddle_subjects(slug);
CREATE INDEX IF NOT EXISTS idx_riddle_subjects_active ON riddle_subjects("isActive");

-- ============================================================================
-- SEED SAMPLE DATA
-- ============================================================================

-- Insert sample riddle subjects
INSERT INTO riddle_subjects (slug, name, emoji, description, "order", "isActive") 
SELECT 'brain-teasers', 'Brain Teasers', '🧩', 'Mind-bending riddles and puzzles', 1, true
WHERE NOT EXISTS (SELECT 1 FROM riddle_subjects WHERE slug = 'brain-teasers');

INSERT INTO riddle_subjects (slug, name, emoji, description, "order", "isActive") 
SELECT 'logic-puzzles', 'Logic Puzzles', '🎯', 'Test your logical reasoning', 2, true
WHERE NOT EXISTS (SELECT 1 FROM riddle_subjects WHERE slug = 'logic-puzzles');

INSERT INTO riddle_subjects (slug, name, emoji, description, "order", "isActive") 
SELECT 'word-riddles', 'Word Riddles', '💬', 'Wordplay and language riddles', 3, true
WHERE NOT EXISTS (SELECT 1 FROM riddle_subjects WHERE slug = 'word-riddles');

INSERT INTO riddle_subjects (slug, name, emoji, description, "order", "isActive") 
SELECT 'math-riddles', 'Math Riddles', '🔢', 'Mathematical puzzles', 4, true
WHERE NOT EXISTS (SELECT 1 FROM riddle_subjects WHERE slug = 'math-riddles');

-- Insert chapters for Brain Teasers
DO $$
DECLARE
    bt_id UUID;
BEGIN
    SELECT id INTO bt_id FROM riddle_subjects WHERE slug = 'brain-teasers';
    
    IF bt_id IS NOT NULL THEN
        INSERT INTO riddle_chapters (name, "chapterNumber", "subjectId")
        SELECT 'Trick Questions', 1, bt_id
        WHERE NOT EXISTS (SELECT 1 FROM riddle_chapters WHERE name = 'Trick Questions' AND "subjectId" = bt_id);
        
        INSERT INTO riddle_chapters (name, "chapterNumber", "subjectId")
        SELECT 'Visual Puzzles', 2, bt_id
        WHERE NOT EXISTS (SELECT 1 FROM riddle_chapters WHERE name = 'Visual Puzzles' AND "subjectId" = bt_id);
        
        INSERT INTO riddle_chapters (name, "chapterNumber", "subjectId")
        SELECT 'Lateral Thinking', 3, bt_id
        WHERE NOT EXISTS (SELECT 1 FROM riddle_chapters WHERE name = 'Lateral Thinking' AND "subjectId" = bt_id);
    END IF;
END $$;

-- Insert chapters for Logic Puzzles
DO $$
DECLARE
    lp_id UUID;
BEGIN
    SELECT id INTO lp_id FROM riddle_subjects WHERE slug = 'logic-puzzles';
    
    IF lp_id IS NOT NULL THEN
        INSERT INTO riddle_chapters (name, "chapterNumber", "subjectId")
        SELECT 'Deduction', 1, lp_id
        WHERE NOT EXISTS (SELECT 1 FROM riddle_chapters WHERE name = 'Deduction' AND "subjectId" = lp_id);
        
        INSERT INTO riddle_chapters (name, "chapterNumber", "subjectId")
        SELECT 'Pattern Recognition', 2, lp_id
        WHERE NOT EXISTS (SELECT 1 FROM riddle_chapters WHERE name = 'Pattern Recognition' AND "subjectId" = lp_id);
    END IF;
END $$;

-- Insert sample riddles for Trick Questions
DO $$
DECLARE
    ch_id UUID;
BEGIN
    SELECT rc.id INTO ch_id 
    FROM riddle_chapters rc 
    JOIN riddle_subjects rs ON rc."subjectId" = rs.id 
    WHERE rc.name = 'Trick Questions' AND rs.slug = 'brain-teasers';
    
    IF ch_id IS NOT NULL THEN
        -- Riddle 1
        INSERT INTO quiz_riddles (question, options, "correctAnswer", level, "chapterId", explanation, hint)
        SELECT 'What has keys but no locks?', ARRAY['A piano', 'A keyboard', 'A map', 'A car'], 'A piano', 'easy', ch_id, 'A piano has musical keys but no locks', 'Think about music'
        WHERE NOT EXISTS (SELECT 1 FROM quiz_riddles WHERE question = 'What has keys but no locks?' AND "chapterId" = ch_id);
        
        -- Riddle 2
        INSERT INTO quiz_riddles (question, options, "correctAnswer", level, "chapterId", explanation, hint)
        SELECT 'What gets wetter the more it dries?', ARRAY['A towel', 'A sponge', 'Water', 'Rain'], 'A towel', 'easy', ch_id, 'A towel absorbs water as it dries things', 'Used after showering'
        WHERE NOT EXISTS (SELECT 1 FROM quiz_riddles WHERE question = 'What gets wetter the more it dries?' AND "chapterId" = ch_id);
        
        -- Riddle 3
        INSERT INTO quiz_riddles (question, options, "correctAnswer", level, "chapterId", explanation, hint)
        SELECT 'The more you take, the more you leave behind. What am I?', ARRAY['Footsteps', 'Memories', 'Time', 'Money'], 'Footsteps', 'medium', ch_id, 'As you walk, you leave footsteps behind', 'You make them when walking'
        WHERE NOT EXISTS (SELECT 1 FROM quiz_riddles WHERE question = 'The more you take, the more you leave behind. What am I?' AND "chapterId" = ch_id);
        
        -- Riddle 4
        INSERT INTO quiz_riddles (question, options, "correctAnswer", level, "chapterId", explanation, hint)
        SELECT 'What has a head and a tail but no body?', ARRAY['A coin', 'A snake', 'A rope', 'A bookmark'], 'A coin', 'easy', ch_id, 'A coin has a head side and a tail side', 'Used for purchases'
        WHERE NOT EXISTS (SELECT 1 FROM quiz_riddles WHERE question = 'What has a head and a tail but no body?' AND "chapterId" = ch_id);
    END IF;
END $$;

-- Insert sample riddles for Deduction
DO $$
DECLARE
    ch_id UUID;
BEGIN
    SELECT rc.id INTO ch_id 
    FROM riddle_chapters rc 
    JOIN riddle_subjects rs ON rc."subjectId" = rs.id 
    WHERE rc.name = 'Deduction' AND rs.slug = 'logic-puzzles';
    
    IF ch_id IS NOT NULL THEN
        -- Riddle 1
        INSERT INTO quiz_riddles (question, options, "correctAnswer", level, "chapterId", explanation, hint)
        SELECT 'A farmer has 17 sheep and all but 9 die. How many are left?', ARRAY['9', '8', '17', '0'], '9', 'easy', ch_id, 'Read carefully: all BUT 9 died', 'Read the question again'
        WHERE NOT EXISTS (SELECT 1 FROM quiz_riddles WHERE question = 'A farmer has 17 sheep and all but 9 die. How many are left?' AND "chapterId" = ch_id);
        
        -- Riddle 2
        INSERT INTO quiz_riddles (question, options, "correctAnswer", level, "chapterId", explanation, hint)
        SELECT 'If all Bloops are Razzies and all Razzies are Lazzies, are all Bloops Lazzies?', ARRAY['Yes', 'No', 'Maybe', 'Not enough info'], 'Yes', 'medium', ch_id, 'Transitive property: Bloops → Razzies → Lazzies', 'Think about transitive logic'
        WHERE NOT EXISTS (SELECT 1 FROM quiz_riddles WHERE question = 'If all Bloops are Razzies and all Razzies are Lazzies, are all Bloops Lazzies?' AND "chapterId" = ch_id);
    END IF;
END $$;

-- Insert riddle categories
INSERT INTO riddle_categories (name, emoji)
SELECT 'Logic', '🧠'
WHERE NOT EXISTS (SELECT 1 FROM riddle_categories WHERE name = 'Logic');

INSERT INTO riddle_categories (name, emoji)
SELECT 'Word Play', '📝'
WHERE NOT EXISTS (SELECT 1 FROM riddle_categories WHERE name = 'Word Play');

-- ============================================================================
-- VERIFY RESULTS
-- ============================================================================
SELECT 'riddle_subjects' as table_name, COUNT(*) as row_count FROM riddle_subjects
UNION ALL
SELECT 'riddle_chapters', COUNT(*) FROM riddle_chapters
UNION ALL
SELECT 'quiz_riddles', COUNT(*) FROM quiz_riddles
UNION ALL
SELECT 'riddle_categories', COUNT(*) FROM riddle_categories
UNION ALL
SELECT 'riddles', COUNT(*) FROM riddles;
