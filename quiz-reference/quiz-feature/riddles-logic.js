/**
 * Riddles Logic Module
 * ==================
 * Handles riddle gameplay - same structure as quiz
 * Supports: Chapter selection, Level selection, Timer/No-timer modes
 */

// Riddle state variables
let currentRiddleChapter = 1;
let currentRiddleLevel = 'easy';
let currentRiddleIndex = 0;
let riddleScore = 0;
let riddleStartTime = 0;
let riddleAnswered = false;
let shuffledRiddles = [];
let riddleTimerMode = false;
let riddleTimeRemaining = 0;
let riddleTimerInterval = null;

// Show riddles home page with all chapters
function showRiddlesHome() {
    // Hide all pages first
    document.querySelectorAll('.home-page, .chapter-selection, .level-selection, .quiz-container, .result-container, .timer-challenges-page, .timer-subject-level-selection, .practice-mode-page, .riddles-page, .dad-jokes-page').forEach(el => {
        el.classList.remove('active');
    });
    document.querySelector('.riddles-page').classList.add('active');

    const totalRiddles = getTotalRiddleCount();

    document.querySelector('.riddles-page').innerHTML = `
        <h1 class="title">🎭 Riddles 🎭</h1>

        <!-- Timer Challenge Options -->
        <div class="riddle-quick-options">
            <div class="riddle-option-card" onclick="startRiddleTimerMix()">
                <div class="option-emoji">⏱️</div>
                <div class="option-title">Timer Challenge</div>
                <div class="option-subtitle">All ${totalRiddles} Riddles Mix</div>
            </div>
            <div class="riddle-option-card" onclick="startRiddleNoTimerMix()">
                <div class="option-emoji">♾️</div>
                <div class="option-title">No Timer</div>
                <div class="option-subtitle">All ${totalRiddles} Riddles Mix</div>
            </div>
        </div>

        <!-- Chapter Selection -->
        <h2 class="section-title">📚 Select Chapter</h2>
        <div class="chapter-grid" id="riddleChapterGrid"></div>

        <button class="back-button" onclick="showHomePage()">← Back to Home</button>
    `;

    displayRiddleChapters();
}

// Display all riddle chapters
function displayRiddleChapters() {
    const grid = document.getElementById('riddleChapterGrid');
    if (!grid) return;

    let html = '';
    for (let i = 1; i <= 20; i++) {
        const chapter = riddleChapters[i];
        const count = getRiddleCount(i);
        const color = chapterColors[(i - 1) % chapterColors.length];

        html += `
            <div class="chapter-card" style="background: ${color}" onclick="selectRiddleChapter(${i})">
                <div class="chapter-number">Chapter ${i}</div>
                <div class="chapter-emoji">${chapter.emoji}</div>
                <div class="chapter-name">${chapter.name}</div>
                <div class="chapter-count">${count} riddles</div>
            </div>
        `;
    }
    grid.innerHTML = html;
}

// Select riddle chapter
function selectRiddleChapter(chapterNum) {
    currentRiddleChapter = chapterNum;
    showRiddleLevelSelection();
}

// Show level selection for selected chapter (with collapsible sections)
function showRiddleLevelSelection() {
    // Hide all pages first
    document.querySelectorAll('.home-page, .chapter-selection, .level-selection, .quiz-container, .result-container, .timer-challenges-page, .timer-subject-level-selection, .practice-mode-page, .riddles-page, .dad-jokes-page').forEach(el => {
        el.classList.remove('active');
    });
    document.querySelector('.riddles-page').classList.add('active');

    const chapter = riddleChapters[currentRiddleChapter];
    const chapterData = riddleQuestionBank[currentRiddleChapter];

    if (!chapterData) {
        alert('Chapter not loaded yet!');
        showRiddlesHome();
        return;
    }

    const riddleCount = getRiddleCount(currentRiddleChapter);

    document.querySelector('.riddles-page').innerHTML = `
        <h1 class="title">Riddles - Chapter ${currentRiddleChapter} - Select Difficulty Level</h1>

        <!-- Normal Level Section (Collapsible) -->
        <div class="section-header" onclick="toggleRiddleSection('normalSection')">
            <span class="section-title">📚 Normal Level</span>
            <span class="toggle-icon" id="normalToggle">▼</span>
        </div>
        <div class="section-content expanded" id="normalSection">
            <p class="section-description">Practice at your own pace – No time limit</p>
            <div class="level-grid" id="normalLevelGrid"></div>
        </div>

        <!-- Quick Pick Section (Collapsible) -->
        <div class="section-header" onclick="toggleRiddleSection('timerSection')">
            <span class="section-title">⚡ Quick Pick</span>
            <span class="toggle-icon" id="timerToggle">▼</span>
        </div>
        <div class="section-content expanded" id="timerSection">
            <p class="section-description">Time-bound challenge – Beat the clock!</p>
            <div class="level-grid" id="timerLevelGrid"></div>
        </div>

        <div class="riddle-button-container">
            <button class="riddle-back-button" onclick="showRiddlesHome()">← Back</button>
        </div>
    `;

    // Populate both sections
    displayRiddleLevels(chapterData);
}

// Toggle collapsible sections
function toggleRiddleSection(sectionId) {
    const section = document.getElementById(sectionId);
    const toggleIcon = document.getElementById(sectionId.replace('Section', 'Toggle'));

    if (section && toggleIcon) {
        section.classList.toggle('expanded');
        toggleIcon.classList.toggle('collapsed');
    }
}

// Display available levels for chapter (both normal and timer modes)
function displayRiddleLevels(chapterData) {
    const normalGrid = document.getElementById('normalLevelGrid');
    const timerGrid = document.getElementById('timerLevelGrid');
    if (!normalGrid || !timerGrid) return;

    const levels = [
        { key: 'easy', name: 'EASY', emoji: '🟢', class: 'level-easy', info: 'True or False', time: '1:00 min' },
        { key: 'medium', name: 'MEDIUM', emoji: '🟡', class: 'level-medium', info: '2 Options', time: '1:30 min' },
        { key: 'hard', name: 'HARD', emoji: '🟠', class: 'level-hard', info: '3 Options', time: '2:00 min' },
        { key: 'expert', name: 'EXPERT', emoji: '🔴', class: 'level-expert', info: '4 Options', time: '2:30 min' },
        { key: 'extreme', name: 'EXTREME', emoji: '⚫', class: 'level-extreme', info: 'Text Answer', time: '3:00 min' }
    ];

    let normalHtml = '';
    let timerHtml = '';

    levels.forEach(level => {
        const questions = chapterData[level.key] || [];
        const count = questions.length;

        if (count > 0) {
            // Normal level card (no timer)
            normalHtml += `
                <div class="level-card ${level.class}" onclick="startRiddleLevel('${level.key}', false)">
                    <span class="level-emoji">${level.emoji}</span>
                    <div class="level-name">${level.name}</div>
                    <div class="level-time">${level.info}</div>
                </div>
            `;

            // Timer level card
            timerHtml += `
                <div class="level-card ${level.class}" onclick="startRiddleLevel('${level.key}', true)">
                    <span class="level-emoji">${level.emoji}</span>
                    <div class="level-name">${level.name}</div>
                    <div class="level-time">⏱️ ${level.time}</div>
                </div>
            `;
        }
    });

    normalGrid.innerHTML = normalHtml;
    timerGrid.innerHTML = timerHtml;
}

// Start riddle level with or without timer
function startRiddleLevel(level, withTimer) {
    currentRiddleLevel = level;
    riddleTimerMode = withTimer;

    if (withTimer) {
        const timeLimitsMap = {
            easy: 60,
            medium: 90,
            hard: 120,
            expert: 150,
            extreme: 180
        };
        riddleTimeRemaining = timeLimitsMap[level] || 120;
    }

    startRiddleQuiz();
}

// Legacy functions kept for compatibility (if called from elsewhere)
function startRiddleWithTimer() {
    riddleTimerMode = true;
    riddleTimeRemaining = timeLimits[currentRiddleLevel] || 120;
    startRiddleQuiz();
}

function startRiddleWithoutTimer() {
    riddleTimerMode = false;
    startRiddleQuiz();
}

// Start riddle quiz
function startRiddleQuiz() {
    const questions = riddleQuestionBank[currentRiddleChapter][currentRiddleLevel] || [];

    if (questions.length === 0) {
        alert('No riddles available for this level!');
        return;
    }

    // Shuffle and prepare riddles
    shuffledRiddles = [...questions].sort(() => Math.random() - 0.5);
    currentRiddleIndex = 0;
    riddleScore = 0;
    riddleStartTime = Date.now();
    riddleAnswered = false;

    // Start timer if enabled
    if (riddleTimerMode) {
        startRiddleTimer();
    }

    displayRiddle();
}

// Display current riddle
function displayRiddle() {
    if (currentRiddleIndex >= shuffledRiddles.length) {
        showRiddleResults();
        return;
    }

    // Hide all pages first
    document.querySelectorAll('.home-page, .chapter-selection, .level-selection, .quiz-container, .result-container, .timer-challenges-page, .timer-subject-level-selection, .practice-mode-page, .riddles-page, .dad-jokes-page').forEach(el => {
        el.classList.remove('active');
    });
    document.querySelector('.riddles-page').classList.add('active');

    const riddle = shuffledRiddles[currentRiddleIndex];
    const chapter = riddleChapters[currentRiddleChapter];
    const progress = ((currentRiddleIndex) / shuffledRiddles.length) * 100;

    let timerHTML = '';
    if (riddleTimerMode) {
        timerHTML = `<div class="riddle-timer show" id="riddleTimer">⏱️ ${formatTime(riddleTimeRemaining)}</div>`;
    }

    let optionsHTML = '';
    if (riddle.options) {
        riddle.options.forEach((option, index) => {
            optionsHTML += `
                <div class="riddle-answer-option" onclick="checkRiddleAnswer(${index})">
                    ${option}
                </div>
            `;
        });
    } else if (riddle.answer) {
        // For text answer riddles (Extreme level)
        optionsHTML = `
            <div class="riddle-text-answer">
                <p><strong>Think about it... then reveal the answer</strong></p>
                <button class="riddle-answer-option" onclick="showRiddleAnswer()" style="max-width: 300px; margin: 0 auto;">Show Answer</button>
                <div id="riddleAnswerText" style="display: none; margin-top: 20px; padding: 15px; background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; border-radius: 15px; font-size: 1.2em;">
                    <strong>Answer:</strong> ${riddle.answer}
                </div>
                <button class="riddle-next-button" onclick="nextRiddle()" style="display: none; margin-top: 15px;">Next Riddle →</button>
            </div>
        `;
    }

    document.querySelector('.riddles-page').innerHTML = `
        ${timerHTML}

        <!-- Title -->
        <h1 class="title">${chapter.emoji} ${chapter.name}</h1>

        <!-- Progress -->
        <div class="riddle-progress-info">Riddle ${currentRiddleIndex + 1} of ${shuffledRiddles.length}</div>
        <div class="riddle-progress-bar-container">
            <div class="riddle-progress-bar">
                <div class="riddle-progress-fill" style="width: ${progress}%"></div>
            </div>
        </div>

        <!-- Question -->
        <div class="riddle-question-container">
            <div class="riddle-topic-badge">${riddle.topic} ${riddle.emoji || ''}</div>
            <div class="riddle-question-emoji">${riddle.emoji || '🤔'}</div>
            <div class="riddle-question-text">${riddle.question || riddle.setup || 'Mystery riddle...'}</div>
        </div>

        <!-- Answers -->
        <div class="riddle-answers-container" id="riddleAnswers">
            ${optionsHTML}
        </div>

        <!-- Feedback -->
        <div class="riddle-feedback-message" id="riddleFeedback"></div>

        <!-- Button -->
        <div class="riddle-button-container">
            <button class="riddle-back-button" onclick="quitRiddle()">← Quit</button>
        </div>
    `;

    riddleAnswered = false;
}

// Format time for display (MM:SS)
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Check riddle answer
function checkRiddleAnswer(selectedIndex) {
    if (riddleAnswered) return;
    riddleAnswered = true;

    const riddle = shuffledRiddles[currentRiddleIndex];
    const buttons = document.querySelectorAll('.riddle-answer-option');
    const feedback = document.getElementById('riddleFeedback');

    buttons.forEach((btn, index) => {
        btn.style.pointerEvents = 'none';
        if (index === riddle.correct) {
            btn.classList.add('correct');
        } else if (index === selectedIndex) {
            btn.classList.add('incorrect');
        }
    });

    if (selectedIndex === riddle.correct) {
        riddleScore++;
        if (feedback) {
            feedback.innerHTML = '<span class="riddle-feedback-correct">✓ Correct! Well done!</span>';
        }
        if (typeof triggerConfetti === 'function') {
            triggerConfetti();
        }
    } else {
        if (feedback) {
            feedback.innerHTML = '<span class="riddle-feedback-incorrect">✗ Incorrect! Try again next time.</span>';
        }
    }

    setTimeout(() => {
        currentRiddleIndex++;
        displayRiddle();
    }, 1500);
}

// Show riddle answer (for text answer type)
function showRiddleAnswer() {
    const answerText = document.getElementById('riddleAnswerText');
    const showButton = document.querySelector('.riddle-text-answer .riddle-answer-option');
    const nextButton = document.querySelector('.riddle-next-button');

    if (answerText) answerText.style.display = 'block';
    if (showButton) showButton.style.display = 'none';
    if (nextButton) nextButton.style.display = 'block';

    riddleScore++; // Give credit for viewing answer
}

// Next riddle
function nextRiddle() {
    currentRiddleIndex++;
    displayRiddle();
}

// Start riddle timer
function startRiddleTimer() {
    if (riddleTimerInterval) clearInterval(riddleTimerInterval);

    riddleTimerInterval = setInterval(() => {
        riddleTimeRemaining--;

        const timerEl = document.getElementById('riddleTimer');
        if (timerEl) {
            timerEl.textContent = `⏱️ ${formatTime(riddleTimeRemaining)}`;

            if (riddleTimeRemaining <= 10) {
                timerEl.classList.add('warning');
            }
        }

        if (riddleTimeRemaining <= 0) {
            clearInterval(riddleTimerInterval);
            showRiddleResults();
        }
    }, 1000);
}

// Show riddle results
function showRiddleResults() {
    if (riddleTimerInterval) clearInterval(riddleTimerInterval);

    // Hide all pages first
    document.querySelectorAll('.home-page, .chapter-selection, .level-selection, .quiz-container, .result-container, .timer-challenges-page, .timer-subject-level-selection, .practice-mode-page, .riddles-page, .dad-jokes-page').forEach(el => {
        el.classList.remove('active');
    });
    document.querySelector('.riddles-page').classList.add('active');

    const totalRiddles = shuffledRiddles.length;
    const percentage = Math.round((riddleScore / totalRiddles) * 100);
    const timeTaken = Math.floor((Date.now() - riddleStartTime) / 1000);
    const chapter = riddleChapters[currentRiddleChapter];

    let badge = '';
    let badgeText = '';

    if (percentage >= 90) {
        badge = '🏆';
        badgeText = 'MASTER!';
    } else if (percentage >= 70) {
        badge = '🥇';
        badgeText = 'EXCELLENT!';
    } else if (percentage >= 50) {
        badge = '🥈';
        badgeText = 'GOOD JOB!';
    } else {
        badge = '🥉';
        badgeText = 'KEEP TRYING!';
    }

    document.querySelector('.riddles-page').innerHTML = `
        <div class="result-content">
            <div class="result-title">Riddles Complete! 🎉</div>
            <div class="badge">${badge}</div>
            <div class="badge-text">${badgeText}</div>
            <div class="score-display">${riddleScore} / ${totalRiddles}</div>
            <div class="result-details">
                <div><span>⏱️ Time:</span><span>${timeTaken}s</span></div>
                <div><span>📊 Score:</span><span>${percentage}%</span></div>
                <div><span>📈 Chapter:</span><span>${chapter.name}</span></div>
                <div><span>🎯 Level:</span><span>${currentRiddleLevel.toUpperCase()}</span></div>
            </div>
            <button class="restart-button" onclick="startRiddleQuiz()">🔄 Retry</button>
            <button class="restart-button" onclick="showRiddleLevelSelection()">← Change Level</button>
            <button class="restart-button" onclick="showRiddlesHome()">🏠 Back to Chapters</button>
        </div>
    `;
}

// Quit riddle
function quitRiddle() {
    if (riddleTimerInterval) clearInterval(riddleTimerInterval);
    if (confirm('Are you sure you want to quit?')) {
        showRiddlesHome();
    }
}

// Start timer mix (all riddles)
function startRiddleTimerMix() {
    alert('Timer Mix feature coming soon!');
}

// Start no-timer mix (all riddles)
function startRiddleNoTimerMix() {
    alert('No-Timer Mix feature coming soon!');
}

// Update showRiddles function
function showRiddles() {
    showRiddlesHome();
}
