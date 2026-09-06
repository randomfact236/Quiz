-- Seed image riddles — matches current ImageRiddle entity:
-- (title, imageUrl, answer, hint, difficulty, "timerSeconds", "showTimer", "altText",
--  "categoryId", "isActive", status, action_options jsonb defaults omitted)
-- All rows are seeded PUBLISHED so they are playable immediately.

-- Insert sample categories
INSERT INTO image_riddle_categories (id, name, emoji, description) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Optical Illusions', '👁️', 'Mind-bending visual tricks and illusions'),
('550e8400-e29b-41d4-a716-446655440002', 'Hidden Objects', '🔍', 'Find what is concealed in the images'),
('550e8400-e29b-41d4-a716-446655440003', 'Pattern Recognition', '🔲', 'Spot the patterns and sequences'),
('550e8400-e29b-41d4-a716-446655440004', 'Perspective Puzzles', '📐', 'Change your viewpoint to solve')
ON CONFLICT DO NOTHING;

-- Insert sample image riddles
INSERT INTO image_riddles (id, title, "imageUrl", answer, hint, difficulty, "timerSeconds", "showTimer", "altText", "categoryId", "isActive", status, "useDefaultActions") VALUES
('660e8400-e29b-41d4-a716-446655440001', 'What is hidden in this painting?', 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&h=400&fit=crop', 'A face looking to the left', 'Look at the center and tilt your head', 'medium', NULL, true, 'Abstract colorful painting', '550e8400-e29b-41d4-a716-446655440001', true, 'published', true),
('660e8400-e29b-41d4-a716-446655440002', 'Spot the anomaly in this landscape', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop', 'The reflection is upside down', 'Check the water carefully', 'hard', 90, true, 'Mountain landscape with lake', '550e8400-e29b-41d4-a716-446655440002', true, 'published', true),
('660e8400-e29b-41d4-a716-446655440003', 'How many animals can you find?', 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600&h=400&fit=crop', 'Five: two birds, a deer, a rabbit, and a fox', 'Look carefully at the trees and bushes', 'easy', NULL, true, 'Forest scene with hidden animals', '550e8400-e29b-41d4-a716-446655440002', true, 'published', true),
('660e8400-e29b-41d4-a716-446655440004', 'What time does the sundial show?', 'https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?w=600&h=400&fit=crop', 'About 2:30 PM', 'Look at the shadow and the Roman numerals', 'expert', NULL, true, 'Sundial in a garden', '550e8400-e29b-41d4-a716-446655440004', true, 'published', true),
('660e8400-e29b-41d4-a716-446655440005', 'Count the triangles', 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=600&h=400&fit=crop', '16 triangles total', 'Count both small and large triangles', 'medium', NULL, true, 'Geometric triangle pattern', '550e8400-e29b-41d4-a716-446655440003', true, 'published', true)
ON CONFLICT DO NOTHING;
