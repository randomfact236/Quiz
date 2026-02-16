/**
 * Quiz Logic Module
 * ==================
 * Contains core quiz game logic including answer checking,
 * question navigation, and quiz start/flow control.
 */

// ===================================================
// QUIZ GAME LOGIC
// ===================================================

function startQuiz(level, timedMode = false) {
    clearFallingEmojis(true); // Instant removal for button clicks
    stopTimer(); // Clear any existing timer

    // Validate chapter and level exist AND have questions
    if (!subjectQuestionBank[currentSubject] ||
        !subjectQuestionBank[currentSubject][currentChapter] ||
        !subjectQuestionBank[currentSubject][currentChapter][level] ||
        subjectQuestionBank[currentSubject][currentChapter][level].length === 0) {
        alert(`Sorry! Questions for ${subjects[currentSubject].name} - Chapter ${currentChapter} - ${level.toUpperCase()} level are not available yet. Please try another chapter or level.`);
        return;
    }

    currentLevel = level;
    currentQuestionIndex = 0;
    score = 0;
    startTime = Date.now();
    isTimedMode = timedMode;
    canPause = !timedMode; // Quick Pick (timed mode) cannot pause, normal mode can
    isPaused = false;
    quizMode = 'normal';
    returnPage = 'home';

    // Setup timer for Quick Pick mode
    if (isTimedMode) {
        timeRemaining = timeLimits[level];
        startTimer();
    }

    // Shuffle questions
    const questions = [...subjectQuestionBank[currentSubject][currentChapter][level]];
    shuffledQuestions = questions.sort(() => Math.random() - 0.5);

    showScreen('quiz-container');
    displayQuestion();

    // Update URL: /science/chapter-1/easy
    if (typeof navigateTo !== 'undefined' && currentSubject && currentChapter) {
        navigateTo(`/${currentSubject}/chapter-${currentChapter}/${level}`);
    }
}

function selectAnswer(selectedIndex) {
    if (answered) return;

    answered = true;
    const question = shuffledQuestions[currentQuestionIndex];
    const options = document.querySelectorAll('.answer-option');
    const feedback = document.getElementById('feedbackMessage');
    const nextBtn = document.getElementById('nextBtn');

    options[selectedIndex].classList.add('selected');

    if (selectedIndex === question.correct) {
        options[selectedIndex].classList.add('correct');
        feedback.textContent = ['Excellent! 🌟', 'Perfect! ✨', 'Outstanding! 🎯', 'Brilliant! 💡', 'Superb! 🏆'][Math.floor(Math.random() * 5)];
        feedback.className = 'feedback-message feedback-correct';
        score++;
        // Correct answer bubble foam
        createFallingEmojis('correct');
        // Celebration emoji from left corner
        const celebrationEmojis = ['🎉', '🎊', '⭐', '✨', '🌟'];
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const emoji = celebrationEmojis[Math.floor(Math.random() * celebrationEmojis.length)];
                createCelebrationEmoji(emoji);
            }, i * 200);
        }
    } else {
        options[selectedIndex].classList.add('incorrect');
        options[question.correct].classList.add('correct');
        feedback.textContent = ['Try next 📚', 'Keep learning 📖', 'Review this topic 🔍', 'Study more 💪', 'Not quite ❌'][Math.floor(Math.random() * 5)];
        feedback.className = 'feedback-message feedback-incorrect';
        // Wrong answer bubble foam - colorful emojis
        createFallingEmojis('incorrect');
        // Celebration emoji from left corner (sad face for wrong answer)
        const sadEmojis = ['😢', '😞', '😔', '💭'];
        for (let i = 0; i < 2; i++) {
            setTimeout(() => {
                const emoji = sadEmojis[Math.floor(Math.random() * sadEmojis.length)];
                createCelebrationEmoji(emoji);
            }, i * 300);
        }
    }

    nextBtn.disabled = false;
}

function submitExtremeAnswer() {
    if (answered) return;

    const input = document.getElementById('extremeInput');
    const userAnswer = input.value.trim();

    // Don't submit if empty
    if (!userAnswer) {
        alert('Please type your answer first!');
        return;
    }

    answered = true;
    const question = shuffledQuestions[currentQuestionIndex];
    const feedback = document.getElementById('feedbackMessage');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    const answerDiv = document.getElementById('extremeAnswer');

    // Disable input and submit button
    input.disabled = true;
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.5';

    // Check answer (case-insensitive, trim spaces)
    const correctAnswer = question.answer.toLowerCase().trim();
    const isCorrect = userAnswer.toLowerCase() === correctAnswer;

    if (isCorrect) {
        // Correct answer
        input.style.borderColor = '#2ecc71';
        input.style.background = '#d4edda';
        feedback.textContent = ['Excellent! 🌟', 'Perfect! ✨', 'Outstanding! 🎯', 'Brilliant! 💡', 'Superb! 🏆'][Math.floor(Math.random() * 5)];
        feedback.className = 'feedback-message feedback-correct';
        score++;

        // Correct answer bubble foam
        createFallingEmojis('correct');
        // Celebration emoji from left corner
        const celebrationEmojis = ['🎉', '🎊', '⭐', '✨', '🌟'];
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const emoji = celebrationEmojis[Math.floor(Math.random() * celebrationEmojis.length)];
                createCelebrationEmoji(emoji);
            }, i * 200);
        }
    } else {
        // Wrong answer
        input.style.borderColor = '#e74c3c';
        input.style.background = '#f8d7da';
        feedback.textContent = ['Not quite! 🤔', 'Try again next time! 💪', 'Keep learning! 📚', 'Close! 📝'][Math.floor(Math.random() * 4)];
        feedback.className = 'feedback-message feedback-incorrect';

        // Wrong answer bubble foam - colorful emojis
        createFallingEmojis('incorrect');
        // Celebration emoji from left corner (sad face for wrong answer)
        const sadEmojis = ['😢', '😞', '😔', '💭'];
        for (let i = 0; i < 2; i++) {
            setTimeout(() => {
                const emoji = sadEmojis[Math.floor(Math.random() * sadEmojis.length)];
                createCelebrationEmoji(emoji);
            }, i * 300);
        }

        // Show correct answer
        answerDiv.style.display = 'block';
    }

    // Enable Next button
    nextBtn.disabled = false;
}

function showExtremeAnswer() {
    const answerDiv = document.getElementById('extremeAnswer');
    const nextBtn = document.getElementById('nextBtn');
    const input = document.getElementById('extremeInput');
    const submitBtn = document.getElementById('submitBtn');

    // Show the answer
    answerDiv.style.display = 'block';

    // Disable input and buttons (answer revealed, no more submission)
    if (input) input.disabled = true;
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';
    }

    // Wrong answer bubble foam effect - colorful emojis
    createFallingEmojis('incorrect');

    // Enable Next button
    nextBtn.disabled = false;
}

function nextQuestion() {
    clearFallingEmojis(true); // Instant removal for button clicks
    currentQuestionIndex++;

    if (currentQuestionIndex < 10) {
        displayQuestion();
        saveQuizState(); // Save state after moving to next question
    } else {
        showResults();
    }
}

function previousQuestion() {
    // Go back to previous question
    clearFallingEmojis(true); // Instant removal for button clicks
    currentQuestionIndex--;

    if (currentQuestionIndex >= 0) {
        displayQuestion();
    }
}
