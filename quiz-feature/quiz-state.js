/**
 * Quiz State Module
 * ==================
 * Contains all state variables, constants, and data definitions
 * for the quiz application.
 */

// ===================================================
// QUIZ STATE VARIABLES
// ===================================================

// Quiz state
let currentSubject = 'science';
let currentChapter = 1;
let currentLevel = 'easy';
let currentQuestionIndex = 0;
let score = 0;
let startTime = 0;
let answered = false;
let shuffledQuestions = [];
let fallingEmojis = [];
let quizMode = 'normal'; // 'normal', 'subject-timer', 'mixed-levelwise', 'mixed-complete'
let returnPage = 'home'; // Track where to return after quiz

// Timer state for Quick Pick mode
let isTimedMode = false;
let timeRemaining = 0;
let timerInterval = null;

// History navigation flag (prevent recursive pushState)
let isNavigatingHistory = false;
let isPaused = false;
let canPause = true; // Timer challenges cannot pause

// Time limits for Quick Pick (in seconds)
const timeLimits = {
    easy: 60,      // 1 minute
    medium: 90,    // 1.5 minutes
    hard: 120,     // 2 minutes
    expert: 150,   // 2.5 minutes
    extreme: 180,  // 3 minutes
    complete: 120  // 2 minutes for complete mix
};

// ===================================================
// SUBJECTS AND CONFIGURATION
// ===================================================

// Subjects definition
const subjects = {
    science: { name: 'Science', emoji: '🔬' },
    math: { name: 'Math', emoji: '🔢' },
    history: { name: 'History', emoji: '📜' },
    geography: { name: 'Geography', emoji: '🌍' },
    english: { name: 'English', emoji: '📖' },
    health: { name: 'Health & Fitness', emoji: '💪' },
    environment: { name: 'Environment', emoji: '🌱' },
    business: { name: 'Business', emoji: '💼' },
    technology: { name: 'Technology', emoji: '💻' },
    parenting: { name: 'Parenting', emoji: '👶' },
    animals: { name: 'Animals & Wildlife', emoji: '🐾' },
    movies: { name: 'Movies & TV', emoji: '🎬' },
    sports: { name: 'Sports', emoji: '🏆' },
    'food-drinks': { name: 'Food & Drinks', emoji: '🍔' },
    'art-literature': { name: 'Art & Culture', emoji: '🎨' }
};

// Chapter colors
const chapterColors = [
    '#FFB6C1', '#87CEEB', '#98FB98', '#DDA0DD', '#F0E68C',
    '#FFD700', '#FF69B4', '#87CEFA', '#90EE90', '#BA55D3',
    '#FFA07A', '#20B2AA', '#FF6347', '#4682B4', '#32CD32',
    '#FF1493', '#00CED1', '#FF4500', '#6A5ACD', '#FFB347'
];

// ===================================================
// QUESTION BANK LOADING
// ===================================================

// RESILIENT SUBJECT LOADING - Won't break if one file has error!
const subjectQuestionBank = {};

// Try to load each subject individually
// If one fails, others still work!
try { if (typeof scienceQuestions !== 'undefined') subjectQuestionBank.science = scienceQuestions; } catch(e) { console.warn('Science questions not loaded:', e); }
try { if (typeof mathQuestions !== 'undefined') subjectQuestionBank.math = mathQuestions; } catch(e) { console.warn('Math questions not loaded:', e); }
try { if (typeof historyQuestions !== 'undefined') subjectQuestionBank.history = historyQuestions; } catch(e) { console.warn('History questions not loaded:', e); }
try { if (typeof geographyQuestions !== 'undefined') subjectQuestionBank.geography = geographyQuestions; } catch(e) { console.warn('Geography questions not loaded:', e); }
try { if (typeof englishQuestions !== 'undefined') subjectQuestionBank.english = englishQuestions; } catch(e) { console.warn('English questions not loaded:', e); }
try { if (typeof healthQuestions !== 'undefined') subjectQuestionBank.health = healthQuestions; } catch(e) { console.warn('Health questions not loaded:', e); }
try { if (typeof environmentQuestions !== 'undefined') subjectQuestionBank.environment = environmentQuestions; } catch(e) { console.warn('Environment questions not loaded:', e); }
try { if (typeof businessQuestions !== 'undefined') subjectQuestionBank.business = businessQuestions; } catch(e) { console.warn('Business questions not loaded:', e); }
try { if (typeof technologyQuestions !== 'undefined') subjectQuestionBank.technology = technologyQuestions; } catch(e) { console.warn('Technology questions not loaded:', e); }
try { if (typeof parentingQuestions !== 'undefined') subjectQuestionBank.parenting = parentingQuestions; } catch(e) { console.warn('Parenting questions not loaded:', e); }
try { if (typeof animalsQuestions !== 'undefined') subjectQuestionBank.animals = animalsQuestions; } catch(e) { console.warn('Animals questions not loaded:', e); }
try { if (typeof moviesTVQuestions !== 'undefined') subjectQuestionBank.movies = moviesTVQuestions; } catch(e) { console.warn('Movies questions not loaded:', e); }
try { if (typeof sportsQuestions !== 'undefined') subjectQuestionBank.sports = sportsQuestions; } catch(e) { console.warn('Sports questions not loaded:', e); }
try { if (typeof foodDrinksQuestions !== 'undefined') subjectQuestionBank['food-drinks'] = foodDrinksQuestions; } catch(e) { console.warn('Food & Drinks questions not loaded:', e); }
try { if (typeof artCultureQuestions !== 'undefined') subjectQuestionBank['art-literature'] = artCultureQuestions; } catch(e) { console.warn('Art & Culture questions not loaded:', e); }

// Log loaded subjects
console.log('✅ Loaded subjects:', Object.keys(subjectQuestionBank).length + '/15');
if (Object.keys(subjectQuestionBank).length < 15) {
    console.warn('⚠️ Some subjects failed to load. Check browser console for details.');
}
