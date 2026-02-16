/**
 * Quiz Initialization Module
 * ===========================
 * Handles application initialization, page load setup,
 * browser history navigation, and event listeners.
 */

// ===================================================
// INITIALIZATION AND EVENT HANDLERS
// ===================================================

// Initialize on load
window.onload = function() {
    console.log('🚀 Quiz app initializing...');

    // Check if we're on a quiz page (has .main-container element)
    const isQuizPage = document.querySelector('.main-container') !== null;

    if (!isQuizPage) {
        console.log('ℹ️ Not a quiz page, skipping quiz initialization');
        return; // Exit early if not on quiz page
    }

    // If router is active, it will handle initialization via DOMContentLoaded
    if (typeof navigateTo !== 'undefined') {
        console.log('✅ URL Router is active');
        initializeChapters(); // Still initialize chapters
        return; // Router handles the rest
    }

    // Legacy initialization (when router is not available)
    // Try to restore previous state
    const restored = restoreQuizState();

    if (!restored) {
        // Fresh start - no saved state
        history.replaceState({screen: 'home-page'}, '', '#home-page');
        showHomePage();
    }

    // Always initialize chapters for home page
    initializeChapters();
};

// Handle browser back/forward buttons
window.addEventListener('popstate', function(event) {
    // If router is active, let it handle popstate
    if (typeof navigateTo !== 'undefined') return;

    // Only handle popstate on quiz pages
    const isQuizPage = document.querySelector('.main-container') !== null;
    if (!isQuizPage) return;

    // Set flag to prevent recursive pushState
    isNavigatingHistory = true;

    if (event.state && event.state.screen) {
        // Restore state from history
        if (event.state.subject) currentSubject = event.state.subject;
        if (event.state.chapter) currentChapter = event.state.chapter;
        if (event.state.mode) quizMode = event.state.mode;
        if (event.state.returnPage) returnPage = event.state.returnPage;

        // Save scroll position to restore after screen change
        const savedScrollPosition = event.state.scrollPosition || 0;

        // Navigate to the appropriate screen using proper functions
        switch(event.state.screen) {
            case 'home-page':
                clearFallingEmojis(true); // Instant removal for browser back button
                stopTimer();
                showScreen('home-page', false); // Don't scroll - stay at back button position
                // Restore scroll position after a short delay
                setTimeout(() => window.scrollTo(0, savedScrollPosition), 100);
                break;

            case 'chapter-selection':
                clearFallingEmojis(true); // Instant removal for browser back button
                stopTimer();
                const subjectData = subjects[currentSubject];
                if (subjectData) {
                    document.getElementById('subjectTitle').innerHTML = `${subjectData.emoji} ${subjectData.name} ${subjectData.emoji}`;
                }
                initializeChapters();
                showScreen('chapter-selection', false); // Don't scroll - stay at back button position
                setTimeout(() => window.scrollTo(0, savedScrollPosition), 100);
                break;

            case 'level-selection':
                clearFallingEmojis(true); // Instant removal for browser back button
                stopTimer();
                showScreen('level-selection', false); // Don't scroll - stay at back button position
                setTimeout(() => window.scrollTo(0, savedScrollPosition), 100);
                break;

            case 'timer-challenges-page':
                clearFallingEmojis(true); // Instant removal for browser back button
                stopTimer();
                initializeTimerSubjects();
                showScreen('timer-challenges-page', false); // Don't scroll - stay at back button position
                setTimeout(() => window.scrollTo(0, savedScrollPosition), 100);
                break;

            case 'timer-subject-level-selection':
                clearFallingEmojis(true); // Instant removal for browser back button
                stopTimer();
                const timerSubjectData = subjects[currentSubject];
                if (timerSubjectData) {
                    document.getElementById('timerSubjectTitle').innerHTML = `${timerSubjectData.emoji} ${timerSubjectData.name} - Select Level`;
                }
                showScreen('timer-subject-level-selection', false); // Don't scroll - stay at back button position
                setTimeout(() => window.scrollTo(0, savedScrollPosition), 100);
                break;

            case 'practice-mode-page':
                clearFallingEmojis(true); // Instant removal for browser back button
                stopTimer();
                showScreen('practice-mode-page', false); // Don't scroll - stay at back button position
                setTimeout(() => window.scrollTo(0, savedScrollPosition), 100);
                break;

            case 'riddles-page':
                clearFallingEmojis(true); // Instant removal for browser back button
                stopTimer();
                showScreen('riddles-page', false); // Don't scroll - stay at back button position
                setTimeout(() => window.scrollTo(0, savedScrollPosition), 100);
                break;

            case 'dad-jokes-page':
                clearFallingEmojis(true); // Instant removal for browser back button
                stopTimer();
                showScreen('dad-jokes-page', false); // Don't scroll - stay at back button position
                setTimeout(() => window.scrollTo(0, savedScrollPosition), 100);
                break;

            default:
                // For quiz-container, result-container, etc.
                clearFallingEmojis(true); // Instant removal for browser back button
                stopTimer();
                showScreen(event.state.screen, false); // Don't scroll - stay at back button position
                setTimeout(() => window.scrollTo(0, savedScrollPosition), 100);
        }
    } else {
        // If no state, go to home page
        clearFallingEmojis(true); // Instant removal for browser back button
        stopTimer();
        showScreen('home-page', false); // Don't scroll - stay at back button position
    }

    // Reset flag after navigation
    isNavigatingHistory = false;
});

// Call this after page loads
window.addEventListener('DOMContentLoaded', function() {
    // Only run on quiz pages
    const isQuizPage = document.querySelector('.main-container') !== null;
    if (!isQuizPage) return;

    setTimeout(updateSubjectCardStatus, 100);

    // Intercept header AND footer home links to prevent page reload
    const homeLinks = document.querySelectorAll('.quiz-header a[href*="quiz.smartfamilypicks.com"], .quiz-footer a[href*="quiz.smartfamilypicks.com"]');
    homeLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent default link behavior
            showHomePage(); // Use JavaScript navigation
            return false;
        });
    });
});

// ===================================================
// LOADING PROGRESS BAR - DISABLED
// ===================================================
// Loading screen removed per user request
