-- Seed the 7 NEW joke categories needed by scripts/joke-csv/*.csv
-- (Classic Dad Jokes, Programming Jokes, Parenting Jokes already exist —
--  do NOT run this file if your database already has any of the names below;
--  the CSV import matches categories by exact name.)
-- Emoji is shown in the /jokes sidebar. Matches sample-dad-jokes.sql ID pattern.
INSERT INTO joke_categories (id, name, emoji) VALUES
('a1000000-0000-0000-0000-000000000005', 'Food Jokes', '🍕'),
('a1000000-0000-0000-0000-000000000006', 'Animal Jokes', '🐶'),
('a1000000-0000-0000-0000-000000000007', 'Science & Space Jokes', '🚀'),
('a1000000-0000-0000-0000-000000000008', 'Sports Jokes', '⚽'),
('a1000000-0000-0000-0000-000000000009', 'Math & School Jokes', '📚'),
('a1000000-0000-0000-0000-00000000000a', 'Wordplay & Puns', '🃏'),
('a1000000-0000-0000-0000-00000000000b', 'One-Liners', '😜')
ON CONFLICT DO NOTHING;
