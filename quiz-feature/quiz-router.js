/**
 * Quiz Router Module
 * ===================
 * Handles URL routing for clean, SEO-friendly URLs
 *
 * URL Structure:
 * /                                    → Home page
 * /science                             → Subject chapters
 * /science/chapter-1                   → Chapter levels
 * /science/chapter-1/easy              → Quiz
 * /science/chapter-1/easy/question-5   → Specific question (future)
 */

// ===================================================
// URL ROUTING FUNCTIONS
// ===================================================

/**
 * Navigate to a URL and update browser history
 */
function navigateTo(path, data = {}) {
    const fullPath = path.startsWith('/') ? path : '/' + path;

    // Update browser URL without page reload
    history.pushState(data, '', fullPath);

    // Load content for this URL
    loadFromURL(fullPath, data);
}

/**
 * Load content based on current URL
 */
function loadFromURL(path = window.location.pathname, data = {}) {
    // Remove trailing slash
    path = path.replace(/\/$/, '') || '/';

    // Split path into segments
    const segments = path.split('/').filter(s => s);

    // Route based on URL structure
    if (segments.length === 0) {
        // / → Home page
        showHomePage();
    }
    else if (segments.length === 1) {
        // /science → Subject chapters page
        const subject = segments[0];
        if (isValidSubject(subject)) {
            selectSubjectFromRoute(subject);
        } else {
            // Invalid subject, redirect to home
            navigateTo('/');
        }
    }
    else if (segments.length === 2) {
        // /science/chapter-1 → Chapter level selection
        const subject = segments[0];
        const chapterStr = segments[1]; // "chapter-1"
        const chapterNum = parseInt(chapterStr.replace('chapter-', ''));

        if (isValidSubject(subject) && !isNaN(chapterNum)) {
            selectChapterFromRoute(subject, chapterNum);
        } else {
            navigateTo('/');
        }
    }
    else if (segments.length === 3) {
        // /science/chapter-1/easy → Start quiz
        const subject = segments[0];
        const chapterStr = segments[1];
        const level = segments[2];
        const chapterNum = parseInt(chapterStr.replace('chapter-', ''));

        if (isValidSubject(subject) && !isNaN(chapterNum) && isValidLevel(level)) {
            startQuizFromRoute(subject, chapterNum, level, data.timed || false);
        } else {
            navigateTo('/');
        }
    }
    else if (segments.length === 4) {
        // /science/chapter-1/easy/question-5 → Load specific question (future feature)
        // For now, just start the quiz normally
        const subject = segments[0];
        const chapterStr = segments[1];
        const level = segments[2];
        const chapterNum = parseInt(chapterStr.replace('chapter-', ''));

        if (isValidSubject(subject) && !isNaN(chapterNum) && isValidLevel(level)) {
            startQuizFromRoute(subject, chapterNum, level, data.timed || false);
        } else {
            navigateTo('/');
        }
    }
    else {
        // Unknown route, go home
        navigateTo('/');
    }
}

/**
 * Check if subject name is valid
 */
function isValidSubject(subject) {
    return subjects.hasOwnProperty(subject);
}

/**
 * Check if level is valid
 */
function isValidLevel(level) {
    return ['easy', 'medium', 'hard', 'expert', 'extreme'].includes(level);
}

/**
 * Select subject from URL route
 */
function selectSubjectFromRoute(subject) {
    // CHECK IF SUBJECT IS LOADED!
    if (!subjectQuestionBank[subject]) {
        alert(`Sorry! ${subjects[subject].name} questions are not loaded yet.\\n\\n` +
              `Please check:\\n` +
              `1. Is ${subject}-questions.js uploaded to WPCode?\\n` +
              `2. Is the snippet ACTIVATED?\\n` +
              `3. Check browser console (F12) for errors`);
        console.error(`❌ Subject \"${subject}\" not found in question bank!`);
        console.log('Available subjects:', Object.keys(subjectQuestionBank));
        navigateTo('/'); // Redirect to home
        return;
    }

    currentSubject = subject;
    quizMode = 'normal';
    returnPage = 'home';

    const subjectData = subjects[subject];
    document.getElementById('subjectTitle').innerHTML = `${subjectData.emoji} ${subjectData.name} ${subjectData.emoji}`;
    initializeChapters();
    showScreen('chapter-selection');
}

/**
 * Select chapter from URL route
 */
function selectChapterFromRoute(subject, chapter) {
    // First ensure subject is properly loaded
    if (!subjectQuestionBank[subject]) {
        navigateTo('/'); // Redirect to home if subject not loaded
        return;
    }

    currentSubject = subject;
    currentChapter = chapter;
    quizMode = 'normal';
    returnPage = 'home';

    // Set subject title for consistency
    const subjectData = subjects[subject];
    document.getElementById('subjectTitle').innerHTML = `${subjectData.emoji} ${subjectData.name} ${subjectData.emoji}`;

    // Set level selection title
    document.getElementById('levelTitle').textContent = `Chapter ${chapter} - Select Difficulty Level`;

    showScreen('level-selection');
    saveQuizState(); // Save state after chapter selection
}

/**
 * Start quiz from URL route
 */
function startQuizFromRoute(subject, chapter, level, timed) {
    // Validate subject is loaded
    if (!subjectQuestionBank[subject]) {
        navigateTo('/'); // Redirect to home if subject not loaded
        return;
    }

    // Validate chapter and level exist AND have questions
    if (!subjectQuestionBank[subject][chapter] ||
        !subjectQuestionBank[subject][chapter][level] ||
        subjectQuestionBank[subject][chapter][level].length === 0) {
        alert(`Sorry! Questions for ${subjects[subject].name} - Chapter ${chapter} - ${level.toUpperCase()} level are not available yet.`);
        navigateTo(`/${subject}`); // Redirect to subject page
        return;
    }

    // Set global state variables before starting quiz
    currentSubject = subject;
    currentChapter = chapter;
    quizMode = 'normal';
    returnPage = 'home';

    // Start the quiz (this function handles the rest)
    startQuiz(level, timed);
}

/**
 * Update URL when navigating without history
 * (for back button functionality)
 */
function updateURL(path) {
    const fullPath = path.startsWith('/') ? path : '/' + path;
    history.replaceState({}, '', fullPath);
}

// ===================================================
// BROWSER BACK/FORWARD HANDLING
// ===================================================

/**
 * Handle browser back/forward buttons
 */
window.addEventListener('popstate', function(event) {
    // Load content for the current URL
    loadFromURL(window.location.pathname, event.state || {});
});

/**
 * Initialize router on page load
 */
window.addEventListener('DOMContentLoaded', function() {
    // Get current URL path
    const path = window.location.pathname;

    // Check if URL matches WordPress SEO page pattern (e.g., /science-quiz, /math-quiz)
    const seoPageMatch = path.match(/^\/([\w-]+)-quiz\/?$/);
    if (seoPageMatch) {
        const subjectSlug = seoPageMatch[1]; // Extract "science" from "/science-quiz"
        console.log('🎯 SEO page detected, auto-starting subject:', subjectSlug);

        // Wait for quiz to initialize, then auto-start subject
        setTimeout(function() {
            selectSubject(subjectSlug);
        }, 100);
        return;
    }

    // Check if WordPress set auto-start subject (for SEO pages) - LEGACY SUPPORT
    if (window.autoStartSubject) {
        console.log('🎯 Auto-starting subject:', window.autoStartSubject);
        setTimeout(function() {
            selectSubject(window.autoStartSubject);
        }, 100);
        return;
    }

    // Check if there's a URL to load (not just /)
    if (path && path !== '/') {
        // Load content from URL
        loadFromURL(path);
    }
    // If just /, the page loads normally (home page is already active)
});
