/**
 * Quiz Timer Module
 * ==================
 * Handles all timer-related functionality including countdown,
 * pause/resume, and time-up handling for timed quiz modes.
 */

// ===================================================
// TIMER FUNCTIONS FOR QUICK PICK MODE
// ===================================================

function startTimer() {
    stopTimer(); // Clear any existing timer

    timerInterval = setInterval(() => {
        if (!isPaused) {
            timeRemaining--;

            // Update timer display
            updateTimerDisplay();

            // Check if time is up
            if (timeRemaining <= 0) {
                handleTimeUp();
            }
        }
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function updateTimerDisplay() {
    const timerElement = document.getElementById('timerDisplay');
    if (timerElement) {
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        // Add warning class when time is low
        const timerContainer = document.querySelector('.timer-container');
        if (timerContainer) {
            if (timeRemaining <= 30) {
                timerContainer.classList.add('timer-warning');
            } else {
                timerContainer.classList.remove('timer-warning');
            }
        }
    }
}

function togglePause() {
    isPaused = !isPaused;

    // Update pause button text
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) {
        pauseBtn.textContent = isPaused ? '▶️ Resume' : '⏸️ Pause';
    }

    // Disable/enable answer selection when paused
    const answerOptions = document.querySelectorAll('.answer-option');
    const extremeInput = document.getElementById('extremeInput');
    const nextBtn = document.getElementById('nextBtn');

    if (isPaused) {
        // Disable interactions when paused
        answerOptions.forEach(option => option.style.pointerEvents = 'none');
        if (extremeInput) extremeInput.disabled = true;
        if (nextBtn) nextBtn.disabled = true;
    } else {
        // Re-enable interactions when resumed
        answerOptions.forEach(option => option.style.pointerEvents = 'auto');
        if (extremeInput) extremeInput.disabled = false;
        if (nextBtn && answered) nextBtn.disabled = false;
    }
}

function handleTimeUp() {
    stopTimer();

    // Show time up message
    const feedbackMessage = document.getElementById('feedbackMessage');
    if (feedbackMessage) {
        feedbackMessage.textContent = '⏰ TIME UP!';
        feedbackMessage.className = 'feedback-message feedback-incorrect';
    }

    // Disable all interactions
    const answerOptions = document.querySelectorAll('.answer-option');
    answerOptions.forEach(option => option.style.pointerEvents = 'none');

    const extremeInput = document.getElementById('extremeInput');
    if (extremeInput) extremeInput.disabled = true;

    // Auto-show results after 2 seconds
    setTimeout(() => {
        showResults();
    }, 2000);
}
