/**
 * Quiz Storage Module
 * ====================
 * Handles state persistence using sessionStorage to maintain
 * quiz state across page refreshes.
 */

// ===================================================
// STATE PERSISTENCE - Stay on Same Page on Refresh
// ===================================================

// Save quiz state to sessionStorage
function saveQuizState() {
    const state = {
        screen: getCurrentScreen(),
        subject: currentSubject,
        chapter: currentChapter,
        level: currentLevel,
        questionIndex: currentQuestionIndex,
        score: score,
        startTime: startTime,
        isTimedMode: isTimedMode,
        timeRemaining: timeRemaining,
        quizMode: quizMode,
        returnPage: returnPage,
        shuffledQuestions: shuffledQuestions,
        answered: answered,
        scrollPosition: window.scrollY // Save scroll position
    };

    try {
        sessionStorage.setItem('quizState', JSON.stringify(state));
        console.log('✅ Quiz state saved');
    } catch (e) {
        console.warn('⚠️ Could not save state:', e);
    }
}

// Get current active screen
function getCurrentScreen() {
    const screens = [
        'home-page', 'chapter-selection', 'level-selection',
        'quiz-container', 'result-container', 'timer-challenges-page',
        'timer-subject-level-selection', 'practice-mode-page',
        'riddles-page', 'dad-jokes-page'
    ];

    for (let screen of screens) {
        const element = document.querySelector(`.${screen}`);
        if (element && element.classList.contains('active')) {
            return screen;
        }
    }
    return 'home-page'; // Default
}

// Restore quiz state from sessionStorage
function restoreQuizState() {
    try {
        const savedState = sessionStorage.getItem('quizState');
        if (!savedState) {
            console.log('ℹ️ No saved state, showing home page');
            return false;
        }

        const state = JSON.parse(savedState);
        console.log('🔄 Restoring saved state:', state.screen);

        // Restore variables
        currentSubject = state.subject || 'science';
        currentChapter = state.chapter || 1;
        currentLevel = state.level || 'easy';
        currentQuestionIndex = state.questionIndex || 0;
        score = state.score || 0;
        startTime = state.startTime || Date.now();
        isTimedMode = state.isTimedMode || false;
        timeRemaining = state.timeRemaining || 0;
        quizMode = state.quizMode || 'normal';
        returnPage = state.returnPage || 'home';
        shuffledQuestions = state.shuffledQuestions || [];
        answered = state.answered || false;

        // Restore the correct screen
        switch(state.screen) {
            case 'quiz-container':
                if (shuffledQuestions.length > 0) {
                    // Resume quiz
                    if (isTimedMode && timeRemaining > 0) {
                        startTimer(); // Resume timer
                    }
                    displayQuestion();
                    showScreen('quiz-container', false); // Don't scroll on restore
                } else {
                    showHomePage();
                }
                break;

            case 'chapter-selection':
                const subjectData = subjects[currentSubject];
                if (subjectData) {
                    document.getElementById('subjectTitle').innerHTML = `${subjectData.emoji} ${subjectData.name} ${subjectData.emoji}`;
                }
                initializeChapters();
                showScreen('chapter-selection', false); // Don't scroll on restore
                break;

            case 'level-selection':
                document.getElementById('levelTitle').textContent = `Chapter ${currentChapter} - Select Difficulty Level`;
                showScreen('level-selection', false); // Don't scroll on restore
                break;

            case 'timer-challenges-page':
                initializeTimerSubjects();
                showScreen('timer-challenges-page', false); // Don't scroll on restore
                break;

            case 'timer-subject-level-selection':
                const timerSubjectData = subjects[currentSubject];
                if (timerSubjectData) {
                    document.getElementById('timerSubjectTitle').innerHTML = `${timerSubjectData.emoji} ${timerSubjectData.name} - Select Level`;
                }
                showScreen('timer-subject-level-selection', false); // Don't scroll on restore
                break;

            case 'practice-mode-page':
                showScreen('practice-mode-page', false); // Don't scroll on restore
                break;

            case 'result-container':
                showScreen('result-container', false); // Don't scroll on restore
                break;

            default:
                showHomePage();
        }

        // Restore scroll position after a short delay
        if (state.scrollPosition) {
            setTimeout(() => {
                window.scrollTo(0, state.scrollPosition);
            }, 100);
        }

        return true;
    } catch (e) {
        console.warn('⚠️ Could not restore state:', e);
        return false;
    }
}

// Clear quiz state (when user explicitly goes home)
function clearQuizState() {
    try {
        sessionStorage.removeItem('quizState');
        console.log('🗑️ Quiz state cleared');
    } catch (e) {
        console.warn('⚠️ Could not clear state:', e);
    }
}
