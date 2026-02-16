/**
 * Quiz Display Module
 * ====================
 * Handles UI rendering, question display, and visual updates.
 */

// ===================================================
// DISPLAY AND UI RENDERING FUNCTIONS
// ===================================================

function displayQuestion() {
    answered = false;
    const question = shuffledQuestions[currentQuestionIndex];

    console.log('=== DISPLAY QUESTION DEBUG ===');
    console.log('Current Subject:', currentSubject);
    console.log('Question Topic:', question.topic);
    console.log('Question:', question.question);
    console.log('==============================');

    let html = '';

    // Topic badge on left - at the top with color class
    html += `<div class="topic-badge topic-${question.topic.toLowerCase()}">${question.topic}</div>`;

    // Timer display for Quick Pick mode
    if (isTimedMode) {
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        const timeClass = timeRemaining <= 30 ? 'timer-warning' : '';

        html += `<div class="timer-container ${timeClass}">`;
        html += `<div class="timer-display">⏱️ <span id="timerDisplay">${timeDisplay}</span></div>`;
        if (canPause) {
            html += `<button class="timer-pause-btn" id="pauseBtn" onclick="togglePause()">
                        ${isPaused ? '▶️ Resume' : '⏸️ Pause'}
                     </button>`;
        }
        html += `</div>`;
    }

    // Question container - centered
    html += `<div class="question-container">`;
    html += `<div class="question-emoji">${question.emoji}</div>`;
    html += `<div class="question-text">${question.question}</div>`;
    html += `</div>`;

    // Progress info above progress bar
    html += `<div class="progress-info">${currentQuestionIndex + 1}/10</div>`;

    // Progress bar
    html += `<div class="progress-bar-container">`;
    html += `<div class="progress-bar">`;
    html += `<div class="progress-fill" style="width: ${((currentQuestionIndex + 1) / 10) * 100}%"></div>`;
    html += `</div>`;
    html += `</div>`;

    // Feedback message
    html += `<div class="feedback-message" id="feedbackMessage"></div>`;

    if (currentLevel === 'extreme') {
        // Text input for extreme level
        html += `<input type="text" class="extreme-input" id="extremeInput" placeholder="Type your answer here..." onkeypress="if(event.key==='Enter') submitExtremeAnswer()">`;

        // Button group for Submit and Show Answer
        html += `<div class="extreme-buttons">`;
        html += `<button class="submit-answer-btn" id="submitBtn" onclick="submitExtremeAnswer()">✓ Submit Answer</button>`;
        html += `<button class="show-answer-btn" id="showBtn" onclick="showExtremeAnswer()">👁️ Show Answer</button>`;
        html += `</div>`;

        html += `<div class="extreme-answer" id="extremeAnswer" style="display: none;"><strong>Correct Answer:</strong> ${question.answer}</div>`;
    } else {
        // Multiple choice answers
        html += `<div class="answers-container">`;
        question.options.forEach((option, index) => {
            html += `<div class="answer-option" onclick="selectAnswer(${index})">${option}</div>`;
        });
        html += `</div>`;
    }

    // Button container with Back and Next (outside if/else - used for both question types)
    html += `<div class="button-container">`;
    html += `<button class="quiz-back-button" onclick="goBackFromQuiz()">← Back</button>`;
    html += `<button class="next-button" id="nextBtn" onclick="nextQuestion()" disabled>Next →</button>`;
    html += `</div>`;

    document.getElementById('quizContent').innerHTML = html;

    // Add floating background emojis
    addFloatingEmojis(question.emoji);
}

// VISUAL INDICATOR for loaded/missing subjects
function updateSubjectCardStatus() {
    Object.keys(subjects).forEach(subjectKey => {
        const card = document.querySelector(`.subject-card[onclick*="${subjectKey}"]`);
        if (card) {
            if (!subjectQuestionBank[subjectKey]) {
                // Mark as unavailable
                card.style.opacity = '0.5';
                card.style.cursor = 'not-allowed';
                card.style.filter = 'grayscale(80%)';

                // Add badge
                if (!card.querySelector('.unavailable-badge')) {
                    const badge = document.createElement('div');
                    badge.className = 'unavailable-badge';
                    badge.textContent = '🚫 Not Loaded';
                    badge.style.cssText = 'position:absolute;top:5px;right:5px;background:#ff4444;color:white;padding:2px 6px;border-radius:4px;font-size:10px;';
                    card.style.position = 'relative';
                    card.appendChild(badge);
                }
            } else {
                // Mark as available
                card.style.opacity = '1';
                card.style.cursor = 'pointer';
                card.style.filter = 'none';
            }
        }
    });
}
