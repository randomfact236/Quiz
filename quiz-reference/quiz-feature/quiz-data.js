/**
 * Quiz Data Module
 * =================
 * Handles data loading, chapter management, and subject configuration.
 */

// ===================================================
// DATA LOADING AND CONFIGURATION
// ===================================================

// Get available chapters for current subject
function getAvailableChapters(subject) {
    const chapters = [];
    const subjectData = subjectQuestionBank[subject];

    if (!subjectData) {
        console.warn(`Subject "${subject}" not found in question bank`);
        return chapters; // Return empty array
    }

    // Get all chapter numbers that exist in the question bank
    for (let chapterNum in subjectData) {
        if (subjectData.hasOwnProperty(chapterNum)) {
            chapters.push(parseInt(chapterNum));
        }
    }

    // Sort chapters numerically
    chapters.sort((a, b) => a - b);
    return chapters;
}

// Initialize chapters - DYNAMIC based on question bank
function initializeChapters() {
    const grid = document.getElementById('chapterGrid');
    if (!grid) return; // Exit if element doesn't exist (not on quiz page)

    grid.innerHTML = ''; // Clear existing

    // Get only chapters that have questions
    const availableChapters = getAvailableChapters(currentSubject);

    if (availableChapters.length === 0) {
        // No chapters available for this subject
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #999;">No chapters available yet. Check back soon!</div>';
        return;
    }

    // Display only available chapters
    availableChapters.forEach((chapterNum, index) => {
        const card = document.createElement('div');
        card.className = 'chapter-card';
        // Use color based on chapter number (not index)
        card.style.background = chapterColors[(chapterNum - 1) % chapterColors.length];
        card.textContent = `Chapter ${chapterNum}`;
        card.onclick = () => selectChapter(chapterNum);
        grid.appendChild(card);
    });
}

// Initialize timer subjects
function initializeTimerSubjects() {
    const grid = document.getElementById('timerSubjectGrid');
    grid.innerHTML = ''; // Clear existing
    Object.keys(subjects).forEach(subjectKey => {
        const subjectData = subjects[subjectKey];
        const card = document.createElement('div');
        card.className = 'subject-card';
        card.onclick = () => selectTimerSubject(subjectKey);
        card.innerHTML = `
            <div class="subject-emoji">${subjectData.emoji}</div>
            <div class="subject-name">${subjectData.name}</div>
        `;
        grid.appendChild(card);
    });
}
