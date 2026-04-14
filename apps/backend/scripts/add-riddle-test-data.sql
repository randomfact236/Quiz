-- Riddle MCQ Test Data - 8 New Questions
-- Run this SQL to add 8 more questions for pagination testing
-- Make sure to replace 'YOUR_SUBJECT_ID_HERE' with a valid subject ID

-- First, get a valid subject ID (uncomment and run separately):
-- SELECT id, name, "categoryId" FROM riddle_subjects LIMIT 1;

-- Insert 8 new questions (replace 'YOUR_SUBJECT_ID_HERE' with actual subject ID)
INSERT INTO riddle_mcqs (
  id,
  question,
  options,
  "correctLetter",
  explanation,
  hint,
  answer,
  level,
  "subjectId",
  status,
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid(),
  'What has keys but no locks, space but no room, and you can enter but cannot go inside?',
  '["A keyboard", "A piano", "A map", "A door"]'::jsonb,
  'B',
  'A piano has keys you can press to play music, but it does not lock anything. It has space (white and black keys arranged with gaps) but no rooms. You enter the piano to play but cannot go inside it.',
  'Think about musical instruments',
  'A piano',
  'medium',
  rs.id,
  'published',
  NOW(),
  NOW()
FROM riddle_subjects rs
WHERE rs.slug = 'logic' OR rs.name LIKE '%Logic%'
LIMIT 1;

INSERT INTO riddle_mcqs (
  id,
  question,
  options,
  "correctLetter",
  explanation,
  hint,
  answer,
  level,
  "subjectId",
  status,
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid(),
  'I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?',
  '["A ghost", "An echo", "A shadow", "A mirror"]'::jsonb,
  'B',
  'An echo is a sound that repeats after you speak. It speaks (repeats) without a mouth, hears without ears. It has no body. It comes alive with wind in mountains and canyons.',
  'Think about what happens when you yell in a canyon',
  'An echo',
  'easy',
  rs.id,
  'published',
  NOW(),
  NOW()
FROM riddle_subjects rs
WHERE rs.slug = 'logic' OR rs.name LIKE '%Logic%'
LIMIT 1;

INSERT INTO riddle_mcqs (
  id,
  question,
  options,
  "correctLetter",
  explanation,
  hint,
  answer,
  level,
  "subjectId",
  status,
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid(),
  'What can travel around the world while staying in a corner?',
  '["A stamp", "A airplane", "The sun", "The internet"]'::jsonb,
  'A',
  'A stamp stays in the corner of an envelope, but the envelope can travel around the world. The stamp itself doesn\'t move from its corner position.',
  'Think about letters and mail',
  'A stamp',
  'easy',
  rs.id,
  'published',
  NOW(),
  NOW()
FROM riddle_subjects rs
WHERE rs.slug = 'logic' OR rs.name LIKE '%Logic%'
LIMIT 1;

INSERT INTO riddle_mcqs (
  id,
  question,
  options,
  "correctLetter",
  explanation,
  hint,
  answer,
  level,
  "subjectId",
  status,
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid(),
  'A man builds a house with all four sides facing south. A bear walks past. What color is the bear?',
  '["Black", "White", "Brown", "Gray"]'::jsonb,
  'B',
  'If all four sides face south, the house must be at the North Pole. A polar bear is white. This is the only place where you can build a house with all sides facing south.',
  'Think about directions and geography',
  'White (polar bear)',
  'medium',
  rs.id,
  'published',
  NOW(),
  NOW()
FROM riddle_subjects rs
WHERE rs.slug = 'logic' OR rs.name LIKE '%Logic%'
LIMIT 1;

INSERT INTO riddle_mcqs (
  id,
  question,
  options,
  "correctLetter",
  explanation,
  hint,
  answer,
  level,
  "subjectId",
  status,
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid(),
  'What has a head and a tail but no body?',
  '["A snake", "A coin", "A ghost", "A mouse"]'::jsonb,
  'B',
  'A coin has a head side (with the face) and a tail side (the reverse), but no body. This is a classic riddle with a simple answer.',
  'Think about money',
  'A coin',
  'easy',
  rs.id,
  'published',
  NOW(),
  NOW()
FROM riddle_subjects rs
WHERE rs.slug = 'logic' OR rs.name LIKE '%Logic%'
LIMIT 1;

INSERT INTO riddle_mcqs (
  id,
  question,
  options,
  "correctLetter",
  explanation,
  hint,
  answer,
  level,
  "subjectId",
  status,
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid(),
  'I am not alive, but I grow; I do not have lungs, but I need air; I do not have a mouth, but water kills me. What am I?',
  '["A robot", "A fire", "A plant", "A computer"]'::jsonb,
  'B',
  'Fire grows, needs air to burn, and water can extinguish it. Fire is not alive but exhibits growth-like behavior.',
  'Think about the elements',
  'Fire',
  'medium',
  rs.id,
  'published',
  NOW(),
  NOW()
FROM riddle_subjects rs
WHERE rs.slug = 'logic' OR rs.name LIKE '%Logic%'
LIMIT 1;

INSERT INTO riddle_mcqs (
  id,
  question,
  options,
  "correctLetter",
  explanation,
  hint,
  answer,
  level,
  "subjectId",
  status,
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid(),
  'What can you catch but not throw?',
  '["A ball", "A cold", "A fish", "A frisbee"]'::jsonb,
  'B',
  'You can catch a cold (get sick), but you cannot throw a cold at someone. This is a play on words with the phrase "catch a cold".',
  'Think about illnesses',
  'A cold',
  'easy',
  rs.id,
  'published',
  NOW(),
  NOW()
FROM riddle_subjects rs
WHERE rs.slug = 'logic' OR rs.name LIKE '%Logic%'
LIMIT 1;

INSERT INTO riddle_mcqs (
  id,
  question,
  options,
  "correctLetter",
  explanation,
  hint,
  answer,
  level,
  "subjectId",
  status,
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid(),
  'What has many teeth but cannot bite?',
  '["A shark", "A comb", "A zipper", "A saw"]'::jsonb,
  'B',
  'A comb has many teeth (the teeth of a comb) but it cannot bite. A saw has teeth but it can cut/bite, so that does not fit.',
  'Think about grooming tools',
  'A comb',
  'easy',
  rs.id,
  'published',
  NOW(),
  NOW()
FROM riddle_subjects rs
WHERE rs.slug = 'logic' OR rs.name LIKE '%Logic%'
LIMIT 1;
