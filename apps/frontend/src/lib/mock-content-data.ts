/**
 * ============================================================================
 * MOCK DATA FOR CONTENT MANAGEMENT SECTIONS
 * ============================================================================
 * @module lib/mock-content-data
 * @description Realistic mock content items for all four content types.
 *              Replace with real API data when backend is available.
 */

import type { ContentItem } from '@/components/ui/ContentManagementSection';

// =============================================================================
// Helper
// =============================================================================

function daysAgo(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString();
}

// =============================================================================
// Quiz Mock Data
// =============================================================================

export const MOCK_QUIZ_ITEMS: ContentItem[] = [
    { id: 'quiz-1', title: 'General Knowledge: World Capitals', status: 'published', createdAt: daysAgo(30), updatedAt: daysAgo(2), category: 'Geography' },
    { id: 'quiz-2', title: 'Science: Human Body Systems', status: 'published', createdAt: daysAgo(25), updatedAt: daysAgo(1), category: 'Science' },
    { id: 'quiz-3', title: 'History: Ancient Civilizations', status: 'published', createdAt: daysAgo(20), updatedAt: daysAgo(3), category: 'History' },
    { id: 'quiz-4', title: 'Mathematics: Algebra Basics', status: 'draft', createdAt: daysAgo(10), updatedAt: daysAgo(1), category: 'Mathematics' },
    { id: 'quiz-5', title: 'Literature: Shakespeare Plays', status: 'draft', createdAt: daysAgo(8), updatedAt: daysAgo(0), category: 'Literature' },
    { id: 'quiz-6', title: 'Technology: Programming Languages', status: 'published', createdAt: daysAgo(15), updatedAt: daysAgo(5), category: 'Technology' },
    { id: 'quiz-7', title: 'Sports: Olympic History', status: 'trash', createdAt: daysAgo(40), updatedAt: daysAgo(7), category: 'Sports' },
    { id: 'quiz-8', title: 'Music: Classical Composers', status: 'published', createdAt: daysAgo(12), updatedAt: daysAgo(4), category: 'Music' },
    { id: 'quiz-9', title: 'Geography: Oceans & Seas', status: 'draft', createdAt: daysAgo(5), updatedAt: daysAgo(0), category: 'Geography' },
    { id: 'quiz-10', title: 'Science: Space Exploration', status: 'published', createdAt: daysAgo(18), updatedAt: daysAgo(6), category: 'Science' },
];

// =============================================================================
// Dad Jokes Mock Data
// =============================================================================

export const MOCK_JOKE_ITEMS: ContentItem[] = [
    { id: 'joke-1', title: 'Why don\'t scientists trust atoms?', status: 'published', createdAt: daysAgo(20), updatedAt: daysAgo(1), category: 'Science Jokes' },
    { id: 'joke-2', title: 'I told my wife she was drawing her eyebrows too high', status: 'published', createdAt: daysAgo(18), updatedAt: daysAgo(2), category: 'Marriage Jokes' },
    { id: 'joke-3', title: 'What do you call a fake noodle?', status: 'published', createdAt: daysAgo(15), updatedAt: daysAgo(3), category: 'Food Jokes' },
    { id: 'joke-4', title: 'Why did the scarecrow win an award?', status: 'draft', createdAt: daysAgo(5), updatedAt: daysAgo(0), category: 'Classic Dad Jokes' },
    { id: 'joke-5', title: 'I\'m reading a book about anti-gravity', status: 'published', createdAt: daysAgo(12), updatedAt: daysAgo(4), category: 'Science Jokes' },
    { id: 'joke-6', title: 'Why don\'t eggs tell jokes?', status: 'draft', createdAt: daysAgo(3), updatedAt: daysAgo(0), category: 'Food Jokes' },
    { id: 'joke-7', title: 'What do you call a bear with no teeth?', status: 'published', createdAt: daysAgo(10), updatedAt: daysAgo(5), category: 'Animal Jokes' },
    { id: 'joke-8', title: 'I used to hate facial hair, but then it grew on me', status: 'trash', createdAt: daysAgo(30), updatedAt: daysAgo(8), category: 'Pun Jokes' },
];

// =============================================================================
// Riddles Mock Data
// =============================================================================

export const MOCK_RIDDLE_ITEMS: ContentItem[] = [
    { id: 'riddle-1', title: 'I have cities, but no houses live there', status: 'published', createdAt: daysAgo(22), updatedAt: daysAgo(1), category: 'Classic Riddles' },
    { id: 'riddle-2', title: 'What has keys but no locks?', status: 'published', createdAt: daysAgo(20), updatedAt: daysAgo(2), category: 'Object Riddles' },
    { id: 'riddle-3', title: 'The more you take, the more you leave behind', status: 'published', createdAt: daysAgo(18), updatedAt: daysAgo(3), category: 'Classic Riddles' },
    { id: 'riddle-4', title: 'I speak without a mouth and hear without ears', status: 'draft', createdAt: daysAgo(7), updatedAt: daysAgo(0), category: 'Abstract Riddles' },
    { id: 'riddle-5', title: 'What can travel around the world while staying in a corner?', status: 'published', createdAt: daysAgo(14), updatedAt: daysAgo(4), category: 'Object Riddles' },
    { id: 'riddle-6', title: 'I have a head and a tail but no body', status: 'draft', createdAt: daysAgo(4), updatedAt: daysAgo(1), category: 'Classic Riddles' },
    { id: 'riddle-7', title: 'What gets wetter the more it dries?', status: 'trash', createdAt: daysAgo(35), updatedAt: daysAgo(10), category: 'Classic Riddles' },
    { id: 'riddle-8', title: 'I can be cracked, made, told, and played', status: 'published', createdAt: daysAgo(16), updatedAt: daysAgo(5), category: 'Word Riddles' },
    { id: 'riddle-9', title: 'What has one eye but cannot see?', status: 'draft', createdAt: daysAgo(2), updatedAt: daysAgo(0), category: 'Object Riddles' },
];

// =============================================================================
// Image Riddles Mock Data
// =============================================================================

export const MOCK_IMAGE_RIDDLE_ITEMS: ContentItem[] = [
    { id: 'img-1', title: 'Optical Illusion: Hidden Animal', status: 'published', createdAt: daysAgo(25), updatedAt: daysAgo(1), category: 'Optical Illusions' },
    { id: 'img-2', title: 'Spot the Difference: City Skyline', status: 'published', createdAt: daysAgo(22), updatedAt: daysAgo(2), category: 'Spot the Difference' },
    { id: 'img-3', title: 'What Doesn\'t Belong: Kitchen Items', status: 'published', createdAt: daysAgo(20), updatedAt: daysAgo(3), category: 'Odd One Out' },
    { id: 'img-4', title: 'Shadow Puzzle: Animals', status: 'draft', createdAt: daysAgo(6), updatedAt: daysAgo(0), category: 'Shadow Puzzles' },
    { id: 'img-5', title: 'Rebus Puzzle: Famous Movies', status: 'published', createdAt: daysAgo(15), updatedAt: daysAgo(4), category: 'Rebus Puzzles' },
    { id: 'img-6', title: 'Spot the Difference: Nature Scene', status: 'draft', createdAt: daysAgo(3), updatedAt: daysAgo(0), category: 'Spot the Difference' },
    { id: 'img-7', title: 'Hidden Object: Beach Scene', status: 'trash', createdAt: daysAgo(30), updatedAt: daysAgo(9), category: 'Hidden Objects' },
    { id: 'img-8', title: 'Optical Illusion: Moving Patterns', status: 'published', createdAt: daysAgo(17), updatedAt: daysAgo(5), category: 'Optical Illusions' },
    { id: 'img-9', title: 'What Doesn\'t Belong: Fruits', status: 'draft', createdAt: daysAgo(2), updatedAt: daysAgo(0), category: 'Odd One Out' },
    { id: 'img-10', title: 'Rebus Puzzle: Famous Places', status: 'published', createdAt: daysAgo(13), updatedAt: daysAgo(6), category: 'Rebus Puzzles' },
];
