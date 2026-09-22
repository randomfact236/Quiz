-- ============================================================================
-- BE-09 / TASK-03: apply the pop-culture + food-cooking CSV repairs to the
-- live `questions` rows so the serving DB matches the repaired CSVs.
-- ============================================================================
-- Why direct SQL instead of the CSV import path:
--   apps/backend/src/database/import-quiz-csv.ts -> QuizMcqService
--   .createQuestionsBulkFromImport -> content.service.ts importItems() dedups
--   on (chapterId, sha256(normalized question text)) and is INSERT-ONLY:
--   a re-import reports the repaired rows as duplicates and skips them, and
--   the reworded Jelena / Gouda questions would be INSERTED as new rows while
--   the defective rows stay behind. Raw UPDATEs are the only way to repair the
--   existing rows in place (and no rows may be deleted).
--
-- Scope: exactly 10 rows - the 9 pop-culture rows (8 distractor options with
-- CJK mojibake / " none skip" fragments + the Jelena question text) and the
-- food-cooking row 378 Gouda answer-in-question leak. correct_answer text is
-- never touched: in all 9 rows the defective option is a DISTRACTOR, never the
-- correct option.
--
-- Idempotent: every UPDATE's WHERE pins the defective state, so a second run
-- reports UPDATE 0 for every statement.
--
-- Run (repo root):
--   docker exec -i ai-quiz-postgres psql -U aiquiz -d aiquiz \
--     -v ON_ERROR_STOP=1 -f - < scripts/repair-be09-db.sql
-- ============================================================================
\set ON_ERROR_STOP on

BEGIN;

\echo '=== BEFORE: defective rows (expect 9) ==='
SELECT id, "correctLetter" AS cl,
       question,
       options->>0 AS a, options->>1 AS b, options->>2 AS c, options->>3 AS d
FROM questions
WHERE question LIKE '%none skip%' OR options::text LIKE '%none skip%'
   OR question ~ '[\u4e00-\u9fff]' OR options::text ~ '[\u4e00-\u9fff]'
ORDER BY question;

\echo '=== BEFORE: Gouda row ==='
SELECT id, question, "correctAnswer", content_hash
FROM questions WHERE question = 'Gouda cheese is named after which Dutch city?';

\echo ''
\echo '=== REPAIRS: 8 distractor options (jsonb element replaced in place) ==='

\echo '-- row 26 (pop-culture) option D'
UPDATE questions
   SET options = jsonb_set(options, '{3}', to_jsonb('Annes royal foundation'::text)),
       "updatedAt" = now()
 WHERE question = 'What is the Centre for Early Childhood?'
   AND options->>3 = 'Annes保存 none skip';

\echo '-- row 151 (pop-culture) option D'
UPDATE questions
   SET options = jsonb_set(options, '{3}', to_jsonb('Shirish Sanskar analyst'::text)),
       "updatedAt" = now()
 WHERE question = 'Who is the Amazon CEO?'
   AND options->>3 = 'Shirish sanskar none skip';

\echo '-- row 341 (pop-culture) option B'
UPDATE questions
   SET options = jsonb_set(options, '{1}', to_jsonb('Mackenzie Davis guest star'::text)),
       "updatedAt" = now()
 WHERE question = 'Who played Mance Rayder?'
   AND options->>1 = 'Mackenzie Davis none skip';

\echo '-- row 389 (pop-culture) option A'
UPDATE questions
   SET options = jsonb_set(options, '{0}', to_jsonb('Idris Elba Heimdall'::text)),
       "updatedAt" = now()
 WHERE question = 'Who played Darcy Lewis in Thor and WandaVision?'
   AND options->>0 = 'Idra none skip';

\echo '-- row 575 (pop-culture) option C'
UPDATE questions
   SET options = jsonb_set(options, '{2}', to_jsonb('Odessa Young cameo'::text)),
       "updatedAt" = now()
 WHERE question = 'Who played Gong Gong in Everything Everywhere?'
   AND options->>2 = 'Odessa Young none skip';

\echo '-- row 644 (pop-culture) option C'
UPDATE questions
   SET options = jsonb_set(options, '{2}', to_jsonb('Michael Massee curse rumor'::text)),
       "updatedAt" = now()
 WHERE question = 'Who played Norman Osborn 2002?'
   AND options->>2 = 'Michael Massee相关的 none skip';

\echo '-- row 744 (pop-culture) option B'
UPDATE questions
   SET options = jsonb_set(options, '{1}', to_jsonb('Marc Onetto operations lead'::text)),
       "updatedAt" = now()
 WHERE question = 'Who is the Amazon founder?'
   AND options->>1 = 'Marc Onetto operations none skip';

\echo '-- row 821 (pop-culture) option D'
UPDATE questions
   SET options = jsonb_set(options, '{3}', to_jsonb('Zachary Levi cameo'::text)),
       "updatedAt" = now()
 WHERE question = 'Who played J. Jonah Jameson?'
   AND options->>3 = 'Zen范畴 none skip';

\echo ''
\echo '=== REPAIRS: 2 question retexts (content_hash recomputed) ==='

\echo '-- row 719 (pop-culture): question text'
UPDATE questions
   SET question = 'Who is known as Jelena?',
       content_hash = 'd4688230216c1e60cba855e14eb635d6f3b2d0766d53161c832891529cb2fe55',
       "updatedAt" = now()
 WHERE question = 'Who is known as Jelena曾经的 pair?';

\echo '-- row 378 (food-cooking): Gouda answer-in-question leak'
UPDATE questions
   SET question = 'Which Dutch city gave its name to the cheese named after it?',
       content_hash = 'ec9c8cc870ff1793b5962d8343cad1429bc0ea6646551318373c969b3fcd7442',
       "updatedAt" = now()
 WHERE question = 'Gouda cheese is named after which Dutch city?';

\echo ''
\echo '=== AFTER: repaired rows ==='
SELECT id, "correctLetter" AS cl,
       question,
       options->>0 AS a, options->>1 AS b, options->>2 AS c, options->>3 AS d
FROM questions
WHERE question IN (
  'What is the Centre for Early Childhood?', 'Who is the Amazon CEO?',
  'Who played Mance Rayder?', 'Who played Darcy Lewis in Thor and WandaVision?',
  'Who played Gong Gong in Everything Everywhere?', 'Who played Norman Osborn 2002?',
  'Who is known as Jelena?', 'Who is the Amazon founder?',
  'Who played J. Jonah Jameson?',
  'Which Dutch city gave its name to the cheese named after it?')
ORDER BY question;

\echo ''
\echo '=== VERIFY: mojibake / none-skip rows remaining (must be 0) ==='
SELECT COUNT(*) AS mojibake_rows FROM questions
WHERE options::text LIKE '%none skip%' OR options::text ~ '[\u4e00-\u9fff]'
   OR question LIKE '%none skip%' OR question ~ '[\u4e00-\u9fff]';

\echo '=== VERIFY: Jelena rows without CJK (must be 1) ==='
SELECT COUNT(*) AS jelena_clean FROM questions
WHERE question ILIKE '%Jelena%' AND question !~ '[\u4e00-\u9fff]';

\echo '=== VERIFY: total Jelena rows (must be 1) ==='
SELECT COUNT(*) AS jelena_total FROM questions WHERE question ILIKE '%Jelena%';

COMMIT;
