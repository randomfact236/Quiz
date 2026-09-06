-- ============================================================================
-- dedupe-riddle-mcqs.sql
--
-- One-time cleanup: riddle_mcqs contains 23 duplicate pairs (every row in the
-- table is one half of a pair). Policy: keep the EARLIEST-created row per
-- (subjectId, normalized question text); delete the newer copy.
--
-- Normalization spec (must mirror apps/backend content-hash.util.ts):
--   collapse runs of ASCII whitespace [ \t\n\r\f\v] to a single space,
--   trim the resulting leading/trailing space, then lowercase.
--   Note: '[\t\n\r\f\x0b ]' — Postgres regex has no \v escape; \x0b = U+000B.
--
-- Context: 20 fully-identical "Brain Teasers" pairs created 2026-09-05 by an
-- intra-batch-unchecked import, plus 3 "Classic Riddles" pairs where the
-- owner elected to keep the earliest copy (identical text, differing
-- options/answer variants). Audit query + decision: 2026-09-06.
-- ============================================================================

BEGIN;

-- Show exactly what will be removed (the newer copy of each group).
WITH norm AS (
  SELECT id, "subjectId",
         lower(trim(regexp_replace(question, '[\t\n\r\f\x0b ]+', ' ', 'g'), ' ')) AS nq
  FROM riddle_mcqs
), ranked AS (
  SELECT norm.id,
         row_number() OVER (PARTITION BY norm."subjectId", norm.nq ORDER BY m."createdAt" ASC, norm.id ASC) AS rn
  FROM norm
  JOIN riddle_mcqs m ON m.id = norm.id
)
SELECT r.id AS deleted_row_id, s.name AS subject, left(m.question, 70) AS question, m."createdAt"
FROM ranked r
JOIN riddle_mcqs m ON m.id = r.id
JOIN riddle_subjects s ON s.id = m."subjectId"
WHERE r.rn > 1
ORDER BY m."createdAt";

-- Delete the newer copy of each duplicate group.
WITH norm AS (
  SELECT id, "subjectId",
         lower(trim(regexp_replace(question, '[\t\n\r\f\x0b ]+', ' ', 'g'), ' ')) AS nq
  FROM riddle_mcqs
), ranked AS (
  SELECT norm.id,
         row_number() OVER (PARTITION BY norm."subjectId", norm.nq ORDER BY m."createdAt" ASC, norm.id ASC) AS rn
  FROM norm
  JOIN riddle_mcqs m ON m.id = norm.id
)
DELETE FROM riddle_mcqs
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

COMMIT;

-- Post-verify: must return 0 rows.
SELECT "subjectId",
       lower(trim(regexp_replace(question, '[\t\n\r\f\x0b ]+', ' ', 'g'), ' ')) AS nq,
       count(*)
FROM riddle_mcqs
GROUP BY 1, 2
HAVING count(*) > 1;
