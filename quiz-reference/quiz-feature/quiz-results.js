/**
 * Quiz Results Module
 * ====================
 * Handles quiz completion, results calculation, display,
 * and retake functionality.
 */

// ===================================================
// RESULTS CALCULATION AND DISPLAY
// ===================================================

function showResults() {
    clearFallingEmojis(true); // Instant removal for button clicks
    stopTimer();

    const endTime = Date.now();
    const timeTaken = Math.floor((endTime - startTime) / 1000);
    const minutes = Math.floor(timeTaken / 60);
    const seconds = timeTaken % 60;

    let badge, badgeText, badgeEmoji;

    if (score >= 8) {
        badge = '🏆🥇';
        badgeText = 'Outstanding Performance!';
        badgeEmoji = '🎉🌟⭐✨💫🏆🥇👏';
    } else if (score >= 4) {
        badge = '🥈📚';
        badgeText = 'Good Effort!';
        badgeEmoji = '👍📚💪🎯📖✅😊';
    } else {
        badge = '🥉📝';
        badgeText = 'Keep Learning!';
        badgeEmoji = '📝📚💭🔍📖💡🌱';
    }

    document.getElementById('resultBadge').textContent = badge;
    document.getElementById('badgeText').textContent = badgeText;
    document.getElementById('scoreDisplay').textContent = `${score}/10`;
    document.getElementById('timeTaken').textContent = `${minutes}m ${seconds}s`;
    document.getElementById('finalScore').textContent = `${score}/10 (${score * 10}%)`;
    document.getElementById('levelCompleted').textContent = `${currentLevel.toUpperCase()} - Chapter ${currentChapter}`;

    showScreen('result-container');

    // Celebration emojis
    for (let i = 0; i < 30; i++) {
        setTimeout(() => {
            const emoji = badgeEmoji[Math.floor(Math.random() * badgeEmoji.length)];
            createCelebrationEmoji(emoji);
        }, i * 100);
    }
}

function retakeQuiz() {
    // Retake quiz based on current mode
    if (quizMode === 'normal') {
        startQuiz(currentLevel, isTimedMode);
    } else if (quizMode === 'subject-timer') {
        startSubjectTimer(currentLevel);
    } else if (quizMode === 'mixed-levelwise' || quizMode === 'mixed-complete') {
        const mixType = quizMode === 'mixed-levelwise' ? 'levelwise' : 'complete';
        const timedMode = returnPage === 'timer-challenges';
        startMixedQuiz(currentLevel, mixType, timedMode);
    }
}
