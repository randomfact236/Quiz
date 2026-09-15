-- ============================================================================
-- Image Riddles seed (rewritten 2026-09-15)
-- ============================================================================
-- Rewritten 2026-09-15 for the 10 owner-approved launch categories (seeded
-- canonically by reset-image-riddle-content.js). The curated 25 riddles are
-- remapped: illusion-type sets (former Pattern Recognition, Perspective
-- Puzzles, Color Observation) now sit under Optical Illusions (20), and the
-- former Hidden Objects animals under Animal Camouflage (5).
--
-- IMAGE PROVENANCE: every imageUrl below is a REAL image served by
-- Wikimedia Commons (upload.wikimedia.org). URL, license and author were
-- verified against the Commons API (prop=imageinfo) on 2026-09-15; see
-- plan/16-liked-categories.md section 6 for the provenance rules. Each
-- riddle also carries a "source" link action rendered as a Source button in
-- the riddle modal - that button is the attribution surface required by the
-- CC BY / CC BY-SA licenses. Do not remove it when editing these rows.
--
-- The seed is idempotent: ON CONFLICT DO UPDATE refreshes these sample rows
-- without duplicating, and the original 660e8400-… sample riddles are moved to
-- status='trash' (soft-delete) so re-seeding retires them. Admin-created
-- riddles use different UUIDs and are never touched.
--
-- AFTER RESEEDING: flush the categories cache so the public /categories
-- endpoint stops serving the pre-reseed snapshot:
--   docker exec ai-quiz-redis redis-cli DEL image-riddles:categories
-- (CacheService key, see apps/backend/src/image-riddles/image-riddles.service.ts)
-- ============================================================================

-- ---------- Retire the original 5 sample riddles (old seed) ----------
-- The 2026-09-15 rewrite replaced the 660e8400-… sample set with the curated
-- 81000000-… set above. Soft-delete (trash) the old rows so re-seeding an
-- existing database retires them without destroying data; they disappear from
-- the public site because every public query filters status='published'.
UPDATE image_riddles SET status = 'trash', "isActive" = false
WHERE id::text LIKE '660e8400%' AND status <> 'trash';

-- ---------- Categories: the 10 launch categories (canonical set) ----------
INSERT INTO image_riddle_categories (id, name, emoji, description) VALUES
('7f3c9a1e-4b2d-4e8f-9a6c-1d5e8b2f7a41', 'Hidden Objects', E'\U0001F50D', 'Find items tucked away in busy scenes'),
('8a4d0b2f-5c3e-4f9a-8b7d-2e6f9c3a8b52', 'Optical Illusions', E'\U0001F441\uFE0F', 'Images that trick your eyes and brain'),
('9b5e1c3a-6d4f-4a0b-9c8e-3f7a0d4b9c63', 'Spot the Difference', E'\U0001F504', 'Two images, a handful of sneaky changes'),
('0c6f2d4b-7e5a-4b1c-8d9f-4a8b1e5c0d74', 'Rebus Puzzles', E'\U0001F4AC', 'Picture combinations that spell out words and phrases'),
('1d7a3e5c-8f6b-4c2d-9e0a-5b9c2f6d1e85', 'Emoji Riddles', E'\U0001F604', 'Guess the movie, song, or phrase from emojis'),
('2e8b4f6d-9a7c-4d3e-8f1b-6c0d3a7e2f96', 'Close-up Challenges', E'\U0001F52C', 'Everyday objects seen way too close'),
('3f9c5a7e-0b8d-4e4f-9a2c-7d1e4b8f3a07', 'Animal Camouflage', E'\U0001F43E', 'Spot the creature hiding in plain sight'),
('4a0d6b8f-1c9e-4f5a-8b3d-8e2f5c9a4b18', 'Counting Challenges', E'\U0001F522', 'Count what you see - most people get it wrong'),
('5b1e7c9a-2d0f-4a6b-9c4e-9f3a6d0b5c29', 'Landmarks & Places', E'\U0001F30D', 'Name the city or monument from a photo'),
('6c2f8d0b-3e1a-4b7c-8d5f-0a4b7e1c6d30', 'Logos & Brands', E'\U0001F3F7\uFE0F', 'Recognize the brand from a cropped logo')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, emoji = EXCLUDED.emoji, description = EXCLUDED.description;

-- ---------- Riddles ----------
INSERT INTO image_riddles (id, title, "imageUrl", answer, "alternativeAnswers", hint, difficulty, "timerSeconds", "showTimer", "altText", "categoryId", "isActive", status, "useDefaultActions", "actionOptions", views, attempts, solves) VALUES

-- ===== Optical Illusions (5) =====
('81000000-e29b-41d4-a716-446655440101', 'Are the horizontal lines in this wall crooked?',
 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Caf%C3%A9_wall.svg/1280px-Caf%C3%A9_wall.svg.png',
 'No, they are perfectly parallel',
 '["they are parallel","parallel","no","they are straight"]'::jsonb,
 'The mortar lines are alternately staggered - check with a ruler or the edge of your screen', 'easy', 60, true,
 'Cafe wall illusion: staggered brick rows with gray mortar lines',
 '8a4d0b2f-5c3e-4f9a-8b7d-2e6f9c3a8b52', true, 'published', true,
 '[{"id":"source","isEnabled":true,"isVisible":true,"label":"Source","type":"link","style":"ghost","size":"sm","ariaLabel":"View original image source","position":"below_question","order":90,"href":"https://commons.wikimedia.org/wiki/File:Caf%C3%A9_wall.svg","openInNewTab":true}]'::jsonb,
 0, 0, 0),

('81000000-e29b-41d4-a716-446655440102', 'Which of the two fins is longer?',
 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/M%C3%BCller-Lyer_illusion.svg/1280px-M%C3%BCller-Lyer_illusion.svg.png',
 'They are the same length',
 '["same","equal","neither","same length"]'::jsonb,
 'The arrowheads fool you - cover the fins with your fingers and compare the shafts', 'easy', 60, true,
 'Muller-Lyer illusion: two equal lines with inward and outward arrowheads',
 '8a4d0b2f-5c3e-4f9a-8b7d-2e6f9c3a8b52', true, 'published', true,
 '[{"id":"source","isEnabled":true,"isVisible":true,"label":"Source","type":"link","style":"ghost","size":"sm","ariaLabel":"View original image source","position":"below_question","order":90,"href":"https://commons.wikimedia.org/wiki/File:M%C3%BCller-Lyer_illusion.svg","openInNewTab":true}]'::jsonb,
 0, 0, 0),

('81000000-e29b-41d4-a716-446655440103', 'Do you see gray dots at the intersections?',
 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Hermann_grid_illusion.svg/1280px-Hermann_grid_illusion.svg.png',
 'No, they are white intersections',
 '["no","white","there are no dots","no dots"]'::jsonb,
 'Look straight at one intersection - the dots only appear in your peripheral vision', 'easy', 60, true,
 'Hermann grid illusion: black squares with ghostly gray dots at the intersections',
 '8a4d0b2f-5c3e-4f9a-8b7d-2e6f9c3a8b52', true, 'published', true,
 '[{"id":"source","isEnabled":true,"isVisible":true,"label":"Source","type":"link","style":"ghost","size":"sm","ariaLabel":"View original image source","position":"below_question","order":90,"href":"https://commons.wikimedia.org/wiki/File:Hermann_grid_illusion.svg","openInNewTab":true}]'::jsonb,
 0, 0, 0),

('81000000-e29b-41d4-a716-446655440104', 'What do you see in the center of this figure?',
 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Face_or_vase_7741.svg/1280px-Face_or_vase_7741.svg.png',
 'Both a vase and two faces',
 '["a vase","two faces","faces","vase","a cup","cup"]'::jsonb,
 'Let your eyes relax and the figure flips between a cup and a pair of faces', 'medium', 90, true,
 'Rubin vase figure-ground illusion in purple and gray',
 '8a4d0b2f-5c3e-4f9a-8b7d-2e6f9c3a8b52', true, 'published', true,
 '[{"id":"source","isEnabled":true,"isVisible":true,"label":"Source","type":"link","style":"ghost","size":"sm","ariaLabel":"View original image source","position":"below_question","order":90,"href":"https://commons.wikimedia.org/wiki/File:Face_or_vase_7741.svg","openInNewTab":true}]'::jsonb,
 0, 0, 0),

('81000000-e29b-41d4-a716-446655440105', 'Is this a duck or a rabbit?',
 'https://upload.wikimedia.org/wikipedia/commons/4/45/Duck-Rabbit_illusion.jpg',
 'Both - it flips between duck and rabbit',
 '["both","duck","rabbit","either"]'::jsonb,
 'The two prongs are ears to one eye and a beak to the other - keep looking and it flips', 'easy', 60, true,
 'Classic duck-rabbit ambiguous figure from an 1892 magazine',
 '8a4d0b2f-5c3e-4f9a-8b7d-2e6f9c3a8b52', true, 'published', true,
 '[{"id":"source","isEnabled":true,"isVisible":true,"label":"Source","type":"link","style":"ghost","size":"sm","ariaLabel":"View original image source","position":"below_question","order":90,"href":"https://commons.wikimedia.org/wiki/File:Duck-Rabbit_illusion.jpg","openInNewTab":true}]'::jsonb,
 0, 0, 0),

-- ===== Animal Camouflage (5) =====
('81000000-e29b-41d4-a716-446655440201', 'Something is pretending to be a leaf in this photo. What is it?',
 'https://upload.wikimedia.org/wikipedia/commons/1/12/LeafInsect.jpg',
 'A leaf insect',
 '["insect","leaf bug","walking leaf","bug"]'::jsonb,
 'One leaf has legs - check the vein pattern for a body outline', 'easy', 90, true,
 'A leaf insect camouflaged among leaves',
 '3f9c5a7e-0b8d-4e4f-9a2c-7d1e4b8f3a07', true, 'published', true,
 '[{"id":"source","isEnabled":true,"isVisible":true,"label":"Source","type":"link","style":"ghost","size":"sm","ariaLabel":"View original image source","position":"below_question","order":90,"href":"https://commons.wikimedia.org/wiki/File:LeafInsect.jpg","openInNewTab":true}]'::jsonb,
 0, 0, 0),

('81000000-e29b-41d4-a716-446655440202', 'An insect is hiding on this branch. What is it?',
 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Walking_Stick_%2857423%29.jpg/1280px-Walking_Stick_%2857423%29.jpg',
 'A stick insect',
 '["insect","walking stick","phasmid","stick bug"]'::jsonb,
 'Not every twig has a joint - follow the branch until part of it grows legs', 'medium', 90, true,
 'A stick insect camouflaged on a branch',
 '3f9c5a7e-0b8d-4e4f-9a2c-7d1e4b8f3a07', true, 'published', true,
 '[{"id":"source","isEnabled":true,"isVisible":true,"label":"Source","type":"link","style":"ghost","size":"sm","ariaLabel":"View original image source","position":"below_question","order":90,"href":"https://commons.wikimedia.org/wiki/File:Walking_Stick_(57423).jpg","openInNewTab":true}]'::jsonb,
 0, 0, 0),

('81000000-e29b-41d4-a716-446655440203', 'A predator is pressed flat against this tree trunk. What animal is it?',
 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Mossy_leaf-tailed_gecko_%28Uroplatus_sikorae%29_Montagne_d%E2%80%99Ambre.jpg/1280px-Mossy_leaf-tailed_gecko_%28Uroplatus_sikorae%29_Montagne_d%E2%80%99Ambre.jpg',
 'A gecko',
 '["lizard","leaf-tailed gecko","reptile"]'::jsonb,
 'Search for the pale eyes - the rest of the body looks like bark and lichen', 'hard', 120, true,
 'A mossy leaf-tailed gecko camouflaged on a tree trunk',
 '3f9c5a7e-0b8d-4e4f-9a2c-7d1e4b8f3a07', true, 'published', true,
 '[{"id":"source","isEnabled":true,"isVisible":true,"label":"Source","type":"link","style":"ghost","size":"sm","ariaLabel":"View original image source","position":"below_question","order":90,"href":"https://commons.wikimedia.org/wiki/File:Mossy_leaf-tailed_gecko_(Uroplatus_sikorae)_Montagne_d%27Ambre.jpg","openInNewTab":true}]'::jsonb,
 0, 0, 0),

('81000000-e29b-41d4-a716-446655440204', 'A well-camouflaged bird stands among this tall grass. Which bird is it?',
 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/American_bittern_%28Botaurus_lentiginosus%29_hiding_in_tall_grass.jpg/1280px-American_bittern_%28Botaurus_lentiginosus%29_hiding_in_tall_grass.jpg',
 'An American bittern',
 '["bittern","heron","a bittern","bird"]'::jsonb,
 'It points its bill skyward so it looks like a reed - find the eye and the striped neck', 'hard', 120, true,
 'An American bittern hiding in tall grass, pointing its bill upward',
 '3f9c5a7e-0b8d-4e4f-9a2c-7d1e4b8f3a07', true, 'published', true,
 '[{"id":"source","isEnabled":true,"isVisible":true,"label":"Source","type":"link","style":"ghost","size":"sm","ariaLabel":"View original image source","position":"below_question","order":90,"href":"https://commons.wikimedia.org/wiki/File:American_bittern_(Botaurus_lentiginosus)_hiding_in_tall_grass.jpg","openInNewTab":true}]'::jsonb,
 0, 0, 0),

('81000000-e29b-41d4-a716-446655440205', 'A leaf-shaped insect is resting on this leaf. What is it?',
 'https://upload.wikimedia.org/wikipedia/commons/9/97/Fork-tailed_bush_katydid_%2842143s%29.jpg',
 'A katydid',
 '["a katydid","katydid","bush cricket","insect","grasshopper"]'::jsonb,
 'Bush crickets have long antennae - follow the thin line back from its head', 'medium', 90, true,
 'A fork-tailed bush katydid resting on a leaf',
 '3f9c5a7e-0b8d-4e4f-9a2c-7d1e4b8f3a07', true, 'published', true,
 '[{"id":"source","isEnabled":true,"isVisible":true,"label":"Source","type":"link","style":"ghost","size":"sm","ariaLabel":"View original image source","position":"below_question","order":90,"href":"https://commons.wikimedia.org/wiki/File:Fork-tailed_bush_katydid_(42143s).jpg","openInNewTab":true}]'::jsonb,
 0, 0, 0),

-- ===== Optical Illusions - geometry (5) =====
('81000000-e29b-41d4-a716-446655440301', 'Is this a real spiral?',
 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Fraser_spiral_illusion.svg/1280px-Fraser_spiral_illusion.svg.png',
 'No, they are concentric circles',
 '["circles","concentric circles","no","not a spiral"]'::jsonb,
 'Trace one strand with your fingertip - you will come back to where you started', 'medium', 90, true,
 'Fraser spiral illusion: twisted cord segments that read as a spiral',
 '8a4d0b2f-5c3e-4f9a-8b7d-2e6f9c3a8b52', true, 'published', true,
 '[{"id":"source","isEnabled":true,"isVisible":true,"label":"Source","type":"link","style":"ghost","size":"sm","ariaLabel":"View original image source","position":"below_question","order":90,"href":"https://commons.wikimedia.org/wiki/File:Fraser_spiral_illusion.svg","openInNewTab":true}]'::jsonb,
 0, 0, 0),

('81000000-e29b-41d4-a716-446655440302', 'Are the long lines in this figure parallel?',
 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Zollner_illusion.svg/1280px-Zollner_illusion.svg.png',
 'Yes, they are parallel',
 '["yes","parallel","they are parallel"]'::jsonb,
 'The alternating cross-hatches tip your perception - cover the small strokes and recheck', 'medium', 90, true,
 'Zollner illusion: parallel long lines with alternating cross-hatches that appear to converge',
 '8a4d0b2f-5c3e-4f9a-8b7d-2e6f9c3a8b52', true, 'published', true,
 '[{"id":"source","isEnabled":true,"isVisible":true,"label":"Source","type":"link","style":"ghost","size":"sm","ariaLabel":"View original image source","position":"below_question","order":90,"href":"https://commons.wikimedia.org/wiki/File:Zollner_illusion.svg","openInNewTab":true}]'::jsonb,
 0, 0, 0),

('81000000-e29b-41d4-a716-446655440303', 'What shape do the pac-man corners create?',
 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Kanizsa_triangle.svg/1280px-Kanizsa_triangle.svg.png',
 'A triangle',
 '["kanizsa triangle","triangle","an illusory triangle"]'::jsonb,
 'Your brain draws the edges itself - there is no outline, only three pac-men and an angle', 'easy', 60, true,
 'Kanizsa triangle: three pac-man disks with an illusory bright triangle',
 '8a4d0b2f-5c3e-4f9a-8b7d-2e6f9c3a8b52', true, 'published', true,
 '[{"id":"source","isEnabled":true,"isVisible":true,"label":"Source","type":"link","style":"ghost","size":"sm","ariaLabel":"View original image source","position":"below_question","order":90,"href":"https://commons.wikimedia.org/wiki/File:Kanizsa_triangle.svg","openInNewTab":true}]'::jsonb,
 0, 0, 0),

('81000000-e29b-41d4-a716-446655440304', 'Which center circle is bigger?',
 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Ebbinghaus_Illusion.svg/1280px-Ebbinghaus_Illusion.svg.png',
 'They are identical in size',
 '["same","equal","neither","same size"]'::jsonb,
 'Surrounded by big rings one looks small, by small rings one looks big - measure to be sure', 'medium', 90, true,
 'Ebbinghaus illusion: two equal central circles with different surrounding rings',
 '8a4d0b2f-5c3e-4f9a-8b7d-2e6f9c3a8b52', true, 'published', true,
 '[{"id":"source","isEnabled":true,"isVisible":true,"label":"Source","type":"link","style":"ghost","size":"sm","ariaLabel":"View original image source","position":"below_question","order":90,"href":"https://commons.wikimedia.org/wiki/File:Ebbinghaus_Illusion.svg","openInNewTab":true}]'::jsonb,
 0, 0, 0),

('81000000-e29b-41d4-a716-446655440305', 'Do the vertical lines of this figure bend?',
 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Hering_illusion.svg/1280px-Hering_illusion.svg.png',
 'No, they are straight and parallel',
 '["no","straight","they are straight","they are parallel"]'::jsonb,
 'The radial spokes warp the judgment - lay a ruler along one of the verticals', 'medium', 90, true,
 'Hering illusion: straight vertical lines bowed by a radial background',
 '8a4d0b2f-5c3e-4f9a-8b7d-2e6f9c3a8b52', true, 'published', true,
 '[{"id":"source","isEnabled":true,"isVisible":true,"label":"Source","type":"link","style":"ghost","size":"sm","ariaLabel":"View original image source","position":"below_question","order":90,"href":"https://commons.wikimedia.org/wiki/File:Hering_illusion.svg","openInNewTab":true}]'::jsonb,
 0, 0, 0),

-- ===== Optical Illusions - impossible objects (5) =====
('81000000-e29b-41d4-a716-446655440401', 'Can you climb these stairs?',
 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Impossible_staircase.svg/1280px-Impossible_staircase.svg.png',
 'No, they loop forever',
 '["impossible object","they loop forever","no","penrose stairs"]'::jsonb,
 'Follow any flight of steps all the way around - you end up back at the start, always climbing', 'medium', 90, true,
 'Penrose impossible staircase drawn in isometric projection',
 '8a4d0b2f-5c3e-4f9a-8b7d-2e6f9c3a8b52', true, 'published', true,
 '[{"id":"source","isEnabled":true,"isVisible":true,"label":"Source","type":"link","style":"ghost","size":"sm","ariaLabel":"View original image source","position":"below_question","order":90,"href":"https://commons.wikimedia.org/wiki/File:Impossible_staircase.svg","openInNewTab":true}]'::jsonb,
 0, 0, 0),

('81000000-e29b-41d4-a716-446655440402', 'Is the lower-left corner of this cube pointing toward you or away?',
 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Necker_cube.svg/1280px-Necker_cube.svg.png',
 'It flips between both views',
 '["both","neither","it flips","ambiguous"]'::jsonb,
 'Stare at the corner and it jumps - the wireframe has no depth cue to settle the question', 'easy', 60, true,
 'Necker cube wireframe with ambiguous depth',
 '8a4d0b2f-5c3e-4f9a-8b7d-2e6f9c3a8b52', true, 'published', true,
 '[{"id":"source","isEnabled":true,"isVisible":true,"label":"Source","type":"link","style":"ghost","size":"sm","ariaLabel":"View original image source","position":"below_question","order":90,"href":"https://commons.wikimedia.org/wiki/File:Necker_cube.svg","openInNewTab":true}]'::jsonb,
 0, 0, 0),

('81000000-e29b-41d4-a716-446655440403', 'These portraits are upside down. What is wrong with the right-hand face?',
 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Thatcher_effect.jpg/1280px-Thatcher_effect.jpg',
 'Her eyes and mouth are upside down',
 '["eyes and mouth upside down","the features are inverted","her eyes and mouth are inverted"]'::jsonb,
 'Rotate your phone 180 degrees - the distortion hides until the face is upright', 'hard', 120, true,
 'Thatcher effect: two upside-down portraits, one with inverted eyes and mouth',
 '8a4d0b2f-5c3e-4f9a-8b7d-2e6f9c3a8b52', true, 'published', true,
 '[{"id":"source","isEnabled":true,"isVisible":true,"label":"Source","type":"link","style":"ghost","size":"sm","ariaLabel":"View original image source","position":"below_question","order":90,"href":"https://commons.wikimedia.org/wiki/File:Thatcher_effect.jpg","openInNewTab":true}]'::jsonb,
 0, 0, 0),

('81000000-e29b-41d4-a716-446655440404', 'Do you see a young woman or an old lady?',
 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/My_Wife_and_My_Mother-in-Law.jpg/1280px-My_Wife_and_My_Mother-in-Law.jpg',
 'Both - they share one drawing',
 '["both","young woman","old woman","old lady","wife and mother-in-law"]'::jsonb,
 'The young face turns away while the old lady looks down - the chin and ear swap roles', 'medium', 90, true,
 'My Wife and My Mother-in-Law ambiguous figure by W. E. Hill',
 '8a4d0b2f-5c3e-4f9a-8b7d-2e6f9c3a8b52', true, 'published', true,
 '[{"id":"source","isEnabled":true,"isVisible":true,"label":"Source","type":"link","style":"ghost","size":"sm","ariaLabel":"View original image source","position":"below_question","order":90,"href":"https://commons.wikimedia.org/wiki/File:My_Wife_and_My_Mother-in-Law.jpg","openInNewTab":true}]'::jsonb,
 0, 0, 0),

('81000000-e29b-41d4-a716-446655440405', 'Which way is this staircase going - up or down?',
 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Penrosetreppe_links.svg/1280px-Penrosetreppe_links.svg.png',
 'It depends on your viewpoint',
 '["both","up","down","it depends","depends on your viewpoint"]'::jsonb,
 'Cover the bottom half and the top flights reverse direction', 'medium', 90, true,
 'Penrose staircase variant (Penrosetreppe)',
 '8a4d0b2f-5c3e-4f9a-8b7d-2e6f9c3a8b52', true, 'published', true,
 '[{"id":"source","isEnabled":true,"isVisible":true,"label":"Source","type":"link","style":"ghost","size":"sm","ariaLabel":"View original image source","position":"below_question","order":90,"href":"https://commons.wikimedia.org/wiki/File:Penrosetreppe_links.svg","openInNewTab":true}]'::jsonb,
 0, 0, 0),

-- ===== Optical Illusions - color perception (5) =====
('81000000-e29b-41d4-a716-446655440501', 'Are squares A and B the same color?',
 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Checker_shadow_illusion.svg/1280px-Checker_shadow_illusion.svg.png',
 'Yes, A and B are identical in color',
 '["yes","same color","they are the same","identical"]'::jsonb,
 'B only looks lighter because the cylinder casts a shadow - connect them with your finger to compare', 'medium', 90, true,
 'Checker-shadow illusion: squares A and B are identical gray',
 '8a4d0b2f-5c3e-4f9a-8b7d-2e6f9c3a8b52', true, 'published', true,
 '[{"id":"source","isEnabled":true,"isVisible":true,"label":"Source","type":"link","style":"ghost","size":"sm","ariaLabel":"View original image source","position":"below_question","order":90,"href":"https://commons.wikimedia.org/wiki/File:Checker_shadow_illusion.svg","openInNewTab":true}]'::jsonb,
 0, 0, 0),

('81000000-e29b-41d4-a716-446655440502', 'What number is hidden in this dotted circle?',
 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Ishihara_9.svg/1280px-Ishihara_9.svg.png',
 '74',
 '["the number is 74","seventy four"]'::jsonb,
 'Trace the orange-toned dots - red-green color vision turns them into a path', 'easy', 60, true,
 'Ishihara color-test plate showing the number 74',
 '8a4d0b2f-5c3e-4f9a-8b7d-2e6f9c3a8b52', true, 'published', true,
 '[{"id":"source","isEnabled":true,"isVisible":true,"label":"Source","type":"link","style":"ghost","size":"sm","ariaLabel":"View original image source","position":"below_question","order":90,"href":"https://commons.wikimedia.org/wiki/File:Ishihara_9.svg","openInNewTab":true}]'::jsonb,
 0, 0, 0),

('81000000-e29b-41d4-a716-446655440503', 'What number does this color-test plate show?',
 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Ishihara-Test.svg/1280px-Ishihara-Test.svg.png',
 '5',
 '["the number is 5","five"]'::jsonb,
 'The reddish path cuts vertically through the green dots', 'easy', 60, true,
 'Ishihara-style color-test plate with the number 5',
 '8a4d0b2f-5c3e-4f9a-8b7d-2e6f9c3a8b52', true, 'published', true,
 '[{"id":"source","isEnabled":true,"isVisible":true,"label":"Source","type":"link","style":"ghost","size":"sm","ariaLabel":"View original image source","position":"below_question","order":90,"href":"https://commons.wikimedia.org/wiki/File:Ishihara-Test.svg","openInNewTab":true}]'::jsonb,
 0, 0, 0),

('81000000-e29b-41d4-a716-446655440504', 'Are the two inner gray squares the same shade?',
 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Simultaneous_Contrast.svg/1280px-Simultaneous_Contrast.svg.png',
 'Yes, both are the same gray',
 '["yes","same","identical","they are the same"]'::jsonb,
 'On dark it looks lighter, on light it looks darker - cover the backgrounds and compare', 'medium', 90, true,
 'Simultaneous contrast: two identical gray squares on different backgrounds',
 '8a4d0b2f-5c3e-4f9a-8b7d-2e6f9c3a8b52', true, 'published', true,
 '[{"id":"source","isEnabled":true,"isVisible":true,"label":"Source","type":"link","style":"ghost","size":"sm","ariaLabel":"View original image source","position":"below_question","order":90,"href":"https://commons.wikimedia.org/wiki/File:Simultaneous_Contrast.svg","openInNewTab":true}]'::jsonb,
 0, 0, 0),

('81000000-e29b-41d4-a716-446655440505', 'Are the two red bars on these stripes the same color?',
 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Bezold_Effect.svg/1280px-Bezold_Effect.svg.png',
 'Yes, they are identical',
 '["yes","same","identical","they are the same"]'::jsonb,
 'White stripes brighten one red, black stripes darken the other - the Bezold effect at work', 'medium', 90, true,
 'Bezold effect: identical red bars look different on black versus white stripes',
 '8a4d0b2f-5c3e-4f9a-8b7d-2e6f9c3a8b52', true, 'published', true,
 '[{"id":"source","isEnabled":true,"isVisible":true,"label":"Source","type":"link","style":"ghost","size":"sm","ariaLabel":"View original image source","position":"below_question","order":90,"href":"https://commons.wikimedia.org/wiki/File:Bezold_Effect.svg","openInNewTab":true}]'::jsonb,
 0, 0, 0)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  "imageUrl" = EXCLUDED."imageUrl",
  answer = EXCLUDED.answer,
  "alternativeAnswers" = EXCLUDED."alternativeAnswers",
  hint = EXCLUDED.hint,
  difficulty = EXCLUDED.difficulty,
  "timerSeconds" = EXCLUDED."timerSeconds",
  "showTimer" = EXCLUDED."showTimer",
  "altText" = EXCLUDED."altText",
  "categoryId" = EXCLUDED."categoryId",
  "isActive" = EXCLUDED."isActive",
  status = EXCLUDED.status,
  "useDefaultActions" = EXCLUDED."useDefaultActions",
  "actionOptions" = EXCLUDED."actionOptions";

-- ---------- Cleanup: comments pointing at the old sample riddles ----------
-- The original sample ids (660e8400-...) are removed; keep any guest comments
-- (they are children of deleted content) but blank the text so nothing
-- references a riddle that no longer exists.
UPDATE comments SET text = ''
WHERE "contentId" IN (
  '660e8400-e29b-41d4-a716-446655440001',
  '660e8400-e29b-41d4-a716-446655440002',
  '660e8400-e29b-41d4-a716-446655440003',
  '660e8400-e29b-41d4-a716-446655440004',
  '660e8400-e29b-41d4-a716-446655440005'
);
