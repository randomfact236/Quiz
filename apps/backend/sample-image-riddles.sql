-- Insert sample categories
INSERT INTO image_riddle_categories (id, name, emoji, description, "createdAt", "updatedAt") VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Optical Illusions', '👁️', 'Mind-bending visual tricks and illusions', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'Hidden Objects', '🔍', 'Find what is concealed in the images', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'Pattern Recognition', '🔲', 'Spot the patterns and sequences', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'Perspective Puzzles', '📐', 'Change your viewpoint to solve', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insert sample image riddles
INSERT INTO image_riddles (id, title, "imageUrl", answer, hint, difficulty, points, "altText", "isActive", "categoryId", "createdAt", "updatedAt") VALUES
('660e8400-e29b-41d4-a716-446655440001', 'What is hidden in this painting?', 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&h=400&fit=crop', 'A face looking to the left', 'Look at the center and tilt your head', 'medium', 15, 'Abstract colorful painting', true, '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440002', 'Spot the anomaly in this landscape', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop', 'The reflection is upside down', 'Check the water carefully', 'hard', 25, 'Mountain landscape with lake', true, '550e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440003', 'How many animals can you find?', 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600&h=400&fit=crop', 'Five: two birds, a deer, a rabbit, and a fox', 'Look carefully at the trees and bushes', 'easy', 10, 'Forest scene with hidden animals', true, '550e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440004', 'What time does the sundial show?', 'https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?w=600&h=400&fit=crop', 'About 2:30 PM', 'Look at the shadow and the Roman numerals', 'expert', 30, 'Sundial in a garden', true, '550e8400-e29b-41d4-a716-446655440004', NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440005', 'Count the triangles', 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=600&h=400&fit=crop', '16 triangles total', 'Count both small and large triangles', 'medium', 20, 'Geometric triangle pattern', true, '550e8400-e29b-41d4-a716-446655440003', NOW(), NOW())
ON CONFLICT DO NOTHING;
