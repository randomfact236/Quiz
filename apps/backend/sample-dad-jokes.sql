-- Seed dad jokes — matches current DadJoke + JokeCategory entities.
-- Joke text is stored as a single string; the frontend splits on '?' or 'Because'.
-- All rows are seeded PUBLISHED so they appear on the public page immediately.

-- Insert categories
INSERT INTO joke_categories (id, name, emoji) VALUES
('a1000000-0000-0000-0000-000000000001', 'Classic Dad Jokes', '😂'),
('a1000000-0000-0000-0000-000000000002', 'Programming Jokes', '💻'),
('a1000000-0000-0000-0000-000000000003', 'Parenting Jokes', '👶'),
('a1000000-0000-0000-0000-000000000004', 'Office Jokes', '💼')
ON CONFLICT DO NOTHING;

-- Insert jokes — combined setup+punchline in the 'joke' text column
INSERT INTO dad_jokes (id, joke, "categoryId", status, likes, dislikes) VALUES
('b1000000-0000-0000-0000-000000000001', 'Why don''t scientists trust atoms? Because they make up everything!', 'a1000000-0000-0000-0000-000000000001', 'published', 42, 3),
('b1000000-0000-0000-0000-000000000002', 'Why did the scarecrow win an award? He was outstanding in his field!', 'a1000000-0000-0000-0000-000000000001', 'published', 38, 2),
('b1000000-0000-0000-0000-000000000003', 'What do you call a fake noodle? An impasta!', 'a1000000-0000-0000-0000-000000000001', 'published', 55, 1),
('b1000000-0000-0000-0000-000000000004', 'Why do programmers prefer dark mode? Because light attracts bugs!', 'a1000000-0000-0000-0000-000000000002', 'published', 61, 5),
('b1000000-0000-0000-0000-000000000005', 'Why did the bicycle fall over? It was two tired!', 'a1000000-0000-0000-0000-000000000001', 'published', 29, 4),
('b1000000-0000-0000-0000-000000000006', 'How do you organize a space party? You planet!', 'a1000000-0000-0000-0000-000000000001', 'published', 33, 2),
('b1000000-0000-0000-0000-000000000007', 'Why did the math book look sad? Because it had too many problems.', 'a1000000-0000-0000-0000-000000000001', 'published', 27, 1),
('b1000000-0000-0000-0000-000000000008', 'What do you call a belt made out of watches? A waist of time!', 'a1000000-0000-0000-0000-000000000001', 'published', 44, 3),
('b1000000-0000-0000-0000-000000000009', 'Why do Java developers wear glasses? Because they can''t C#!', 'a1000000-0000-0000-0000-000000000002', 'published', 48, 6),
('b1000000-0000-0000-0000-000000000010', 'What''s a computer''s favorite snack? Microchips!', 'a1000000-0000-0000-0000-000000000002', 'published', 35, 2),
('b1000000-0000-0000-0000-000000000011', 'Why did the kid bring a ladder to school? Because they wanted to go to high school!', 'a1000000-0000-0000-0000-000000000003', 'published', 41, 3),
('b1000000-0000-0000-0000-000000000012', 'What did the ocean say to the beach? Nothing, it just waved.', 'a1000000-0000-0000-0000-000000000001', 'published', 37, 1),
('b1000000-0000-0000-0000-000000000013', 'Why did the employee get fired from the calendar factory? He took a day off!', 'a1000000-0000-0000-0000-000000000004', 'published', 30, 2),
('b1000000-0000-0000-0000-000000000014', 'What do you call a fish with no eyes? A fsh!', 'a1000000-0000-0000-0000-000000000001', 'published', 52, 4),
('b1000000-0000-0000-0000-000000000015', 'Why did the golfer bring two pairs of pants? In case he got a hole in one!', 'a1000000-0000-0000-0000-000000000001', 'published', 26, 1)
ON CONFLICT DO NOTHING;
