/**
 * Quiz Navigation Module
 * =======================
 * Handles all page switching, screen navigation, and routing
 * between different quiz sections.
 */

// ===================================================
// NAVIGATION FUNCTIONS
// ===================================================

function showHomePage() {
    clearFallingEmojis(true); // Instant removal for button clicks
    stopTimer();
    clearQuizState(); // Clear saved state when going home
    showScreen('home-page');

    // Update URL to root
    if (typeof navigateTo !== 'undefined') {
        navigateTo('/');
    }
}

function toggleSubjects() {
    const grid = document.getElementById('subjectGrid');
    const icon = document.getElementById('toggleIcon');
    const header = icon.closest('.section-header');

    if (grid.classList.contains('expanded')) {
        grid.classList.remove('expanded');
        icon.classList.add('collapsed');
        icon.textContent = '▶';
        if (header) header.style.marginBottom = '0'; // No gap when collapsed
    } else {
        grid.classList.add('expanded');
        icon.classList.remove('collapsed');
        icon.textContent = '▼';
        if (header) header.style.marginBottom = '10px'; // Add gap when expanded
    }
}

function toggleSection(sectionId) {
    const content = document.getElementById(sectionId);
    const arrow = document.getElementById(sectionId + 'Arrow');

    if (content.classList.contains('expanded')) {
        content.classList.remove('expanded');
        arrow.classList.add('collapsed');
        arrow.textContent = '▶';
    } else {
        content.classList.add('expanded');
        arrow.classList.remove('collapsed');
        arrow.textContent = '▼';
    }
}

function selectSubject(subject) {
    // CHECK IF SUBJECT IS LOADED!
    if (!subjectQuestionBank[subject]) {
        alert(`Sorry! ${subjects[subject].name} questions are not loaded yet.\n\n` +
              `Please check:\n` +
              `1. Is ${subject}-questions.js uploaded to WPCode?\n` +
              `2. Is the snippet ACTIVATED?\n` +
              `3. Check browser console (F12) for errors`);
        console.error(`❌ Subject "${subject}" not found in question bank!`);
        console.log('Available subjects:', Object.keys(subjectQuestionBank));
        return; // Don't navigate if subject not loaded
    }

    currentSubject = subject;
    quizMode = 'normal';
    returnPage = 'home';

    // Keep subjects expanded - don't auto-collapse
    // User can manually collapse if needed

    const subjectData = subjects[subject];
    document.getElementById('subjectTitle').innerHTML = `${subjectData.emoji} ${subjectData.name} ${subjectData.emoji}`;
    initializeChapters();
    showScreen('chapter-selection');

    // Update URL: /science
    if (typeof navigateTo !== 'undefined') {
        navigateTo(`/${subject}`);
    }
}

function showTimerChallenges() {
    initializeTimerSubjects();
    showScreen('timer-challenges-page');
}

function showPracticeMode() {
    showScreen('practice-mode-page');
}

function showRiddles() {
    showScreen('riddles-page');
}

function showDadJokes() {
    showScreen('dad-jokes-page');
}

function selectTimerSubject(subject) {
    currentSubject = subject;
    quizMode = 'subject-timer';
    returnPage = 'timer-challenges';
    const subjectData = subjects[subject];
    document.getElementById('timerSubjectTitle').innerHTML = `${subjectData.emoji} ${subjectData.name} - Select Level`;
    showScreen('timer-subject-level-selection');
}

function startSubjectTimer(level) {
    // Combine all 20 chapters for this subject at this level
    clearFallingEmojis(true); // Instant removal for button clicks
    stopTimer();

    // Check if subject is loaded
    if (!subjectQuestionBank[currentSubject]) {
        alert(`Subject "${currentSubject}" is not loaded. Please check if the question file is uploaded.`);
        return;
    }

    currentLevel = level;
    currentQuestionIndex = 0;
    score = 0;
    startTime = Date.now();
    isTimedMode = true;
    canPause = false; // No pause for timer challenges
    isPaused = false;
    quizMode = 'subject-timer';
    returnPage = 'timer-challenges'; // Ensure returnPage is set

    console.log('=== startSubjectTimer DEBUG ===');
    console.log('Set returnPage to:', returnPage);
    console.log('Set quizMode to:', quizMode);
    console.log('================================');

    // Collect all questions from all 20 chapters for this subject and level
    let allQuestions = [];
    for (let ch = 1; ch <= 20; ch++) {
        if (subjectQuestionBank[currentSubject][ch] && subjectQuestionBank[currentSubject][ch][level]) {
            allQuestions = allQuestions.concat(subjectQuestionBank[currentSubject][ch][level]);
        }
    }

    if (allQuestions.length === 0) {
        alert(`No questions found for ${level} level. Please check the question files.`);
        return;
    }

    // Shuffle questions
    shuffledQuestions = allQuestions.sort(() => Math.random() - 0.5).slice(0, 10);

    // Setup timer
    timeRemaining = timeLimits[level];
    startTimer();

    displayQuestion();
    showScreen('quiz-container');
}

function startMixedQuiz(level, mixType, timedMode) {
    clearFallingEmojis(true); // Instant removal for button clicks
    stopTimer();

    currentLevel = level;
    currentQuestionIndex = 0;
    score = 0;
    startTime = Date.now();
    isTimedMode = timedMode;
    canPause = !timedMode; // Can only pause in practice mode
    isPaused = false;
    quizMode = mixType === 'levelwise' ? 'mixed-levelwise' : 'mixed-complete';
    returnPage = timedMode ? 'timer-challenges' : 'practice-mode';

    let allQuestions = [];

    if (mixType === 'levelwise') {
        // Collect questions from all subjects at the same level
        Object.keys(subjects).forEach(subject => {
            // Check if subject is loaded
            if (!subjectQuestionBank[subject]) return;

            for (let ch = 1; ch <= 20; ch++) {
                if (subjectQuestionBank[subject][ch] && subjectQuestionBank[subject][ch][level]) {
                    allQuestions = allQuestions.concat(subjectQuestionBank[subject][ch][level]);
                }
            }
        });
    } else {
        // Complete mix - all subjects, all chapters, all levels
        Object.keys(subjects).forEach(subject => {
            // Check if subject is loaded
            if (!subjectQuestionBank[subject]) return;

            for (let ch = 1; ch <= 20; ch++) {
                ['easy', 'medium', 'hard', 'expert', 'extreme'].forEach(lvl => {
                    if (subjectQuestionBank[subject][ch] && subjectQuestionBank[subject][ch][lvl]) {
                        allQuestions = allQuestions.concat(subjectQuestionBank[subject][ch][lvl]);
                    }
                });
            }
        });
    }

    if (allQuestions.length === 0) {
        alert(`No questions found. Please check if question files are loaded correctly.`);
        return;
    }

    // Shuffle and select 10 questions
    shuffledQuestions = allQuestions.sort(() => Math.random() - 0.5).slice(0, 10);

    // Setup timer if timed mode
    if (isTimedMode) {
        timeRemaining = mixType === 'complete' ? timeLimits.complete : timeLimits[level];
        startTimer();
    }

    displayQuestion();
    showScreen('quiz-container');
}

function goBackFromResult() {
    console.log('=== goBackFromResult DEBUG ===');
    console.log('returnPage:', returnPage);
    console.log('quizMode:', quizMode);
    console.log('==============================');

    if (returnPage === 'home') {
        if (quizMode === 'normal') {
            showLevelSelection();
        } else {
            showHomePage();
        }
    } else if (returnPage === 'timer-challenges') {
        // Always go back to Timer Challenges page
        console.log('Going back to Timer Challenges page');
        showTimerChallenges();
    } else if (returnPage === 'practice-mode') {
        // Always go back to Practice Mode page
        console.log('Going back to Practice Mode page');
        showPracticeMode();
    } else {
        showHomePage();
    }
}

function goBackFromQuiz() {
    // Handle back button during quiz (not from result)
    console.log('=== goBackFromQuiz DEBUG ===');
    console.log('returnPage:', returnPage);
    console.log('quizMode:', quizMode);
    console.log('currentQuestionIndex:', currentQuestionIndex);
    console.log('============================');

    // If not on first question, go to previous question
    if (currentQuestionIndex > 0) {
        console.log('Going to previous question');
        previousQuestion();
        return;
    }

    // If on first question (index 0), exit quiz
    clearFallingEmojis(true); // Instant removal for button clicks
    stopTimer();

    if (returnPage === 'home') {
        if (quizMode === 'normal') {
            showLevelSelection();
        } else {
            showHomePage();
        }
    } else if (returnPage === 'timer-challenges') {
        // Go back to Timer Challenges page
        console.log('Going back to Timer Challenges from quiz');
        showTimerChallenges();
    } else if (returnPage === 'practice-mode') {
        // Go back to Practice Mode page
        console.log('Going back to Practice Mode from quiz');
        showPracticeMode();
    } else {
        showHomePage();
    }
}

function selectChapter(chapter) {
    currentChapter = chapter;
    document.getElementById('levelTitle').textContent = `Chapter ${chapter} - Select Difficulty Level`;
    showScreen('level-selection');
    saveQuizState(); // Save state after chapter selection

    // Update URL: /science/chapter-1
    if (typeof navigateTo !== 'undefined' && currentSubject) {
        navigateTo(`/${currentSubject}/chapter-${chapter}`);
    }
}

function showChapterSelection() {
    clearFallingEmojis(true); // Instant removal for button clicks
    stopTimer();
    showScreen('chapter-selection');
}

function showLevelSelection() {
    clearFallingEmojis(true); // Instant removal for button clicks
    stopTimer();
    showScreen('level-selection');
}

function showScreen(screenClass, scrollToTop = true) {
    document.querySelectorAll('.home-page, .chapter-selection, .level-selection, .quiz-container, .result-container, .timer-challenges-page, .timer-subject-level-selection, .practice-mode-page, .riddles-page, .dad-jokes-page').forEach(el => {
        el.classList.remove('active');
    });

    const targetScreen = document.querySelector(`.${screenClass}`);
    if (!targetScreen) {
        console.warn(`⚠️ Screen element .${screenClass} not found. Are you on the quiz page?`);
        return; // Exit if element doesn't exist
    }

    targetScreen.classList.add('active');

    // Smart scroll: Only scroll to top on forward navigation, not on back/restore
    if (scrollToTop) {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    // Push to browser history ONLY if:
    // 1. Not restoring from history
    // 2. Router is NOT active (router handles its own history)
    if (!isNavigatingHistory && typeof navigateTo === 'undefined') {
        const state = {
            screen: screenClass,
            subject: currentSubject,
            chapter: currentChapter,
            mode: quizMode,
            returnPage: returnPage,
            scrollPosition: window.scrollY // Save current scroll position
        };
        history.pushState(state, '', `#${screenClass}`);
    }

    // Save state after screen change
    saveQuizState();
}
