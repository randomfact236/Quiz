const subjects = {
    'scienceQuestions': { name: 'Science', emoji: '🔬', priority: 10 },
    'mathQuestions': { name: 'Math', emoji: '🔢', priority: 11 },
    'historyQuestions': { name: 'History', emoji: '📜', priority: 12 },
    'geographyQuestions': { name: 'Geography', emoji: '🌍', priority: 13 },
    'englishQuestions': { name: 'English', emoji: '📖', priority: 14 },
    'healthQuestions': { name: 'Health', emoji: '💪', priority: 15 },
    'environmentQuestions': { name: 'Environment', emoji: '🌱', priority: 16 },
    'businessQuestions': { name: 'Business', emoji: '💼', priority: 17 },
    'technologyQuestions': { name: 'Technology', emoji: '💻', priority: 18 },
    'parentingQuestions': { name: 'Parenting', emoji: '👶', priority: 19 }
};

function runTests() {
    const resultsDiv = document.getElementById('results');
    const summaryDiv = document.getElementById('summary');
    const fixInstructionsDiv = document.getElementById('fixInstructions');

    resultsDiv.innerHTML = '';
    let loadedCount = 0;
    let missingCount = 0;
    const missingSubjects = [];

    for (const [varName, info] of Object.entries(subjects)) {
        const result = document.createElement('div');

        if (typeof window[varName] !== 'undefined' && window[varName] !== null) {
            result.className = 'result success';
            const chapters = Object.keys(window[varName]).length;
            result.innerHTML = `
                <span class="icon">✅</span>
                <div>
                    <strong>${info.emoji} ${info.name}</strong> - LOADED
                    <div class="details">Variable: ${varName} | Chapters: ${chapters} | Priority: ${info.priority}</div>
                </div>
            `;
            loadedCount++;
        } else {
            result.className = 'result error';
            result.innerHTML = `
                <span class="icon">❌</span>
                <div>
                    <strong>${info.emoji} ${info.name}</strong> - MISSING
                    <div class="details">Variable "${varName}" is not defined! Priority should be: ${info.priority}</div>
                </div>
            `;
            missingCount++;
            missingSubjects.push(info.name);
        }

        resultsDiv.appendChild(result);
    }

    // Show summary
    summaryDiv.style.display = 'block';
    summaryDiv.className = 'summary';
    summaryDiv.innerHTML = `
        <h3>📈 Summary</h3>
        <div class="stats">
            <div class="stat">
                <div class="stat-number">${loadedCount}</div>
                <div class="stat-label">Loaded</div>
            </div>
            <div class="stat">
                <div class="stat-number">${missingCount}</div>
                <div class="stat-label">Missing</div>
            </div>
            <div class="stat">
                <div class="stat-number">${Math.round((loadedCount/10)*100)}%</div>
                <div class="stat-label">Success Rate</div>
            </div>
        </div>
        ${missingCount > 0 ? `<p style="margin-top:15px; color:#856404;"><strong>⚠️ Missing Subjects:</strong> ${missingSubjects.join(', ')}</p>` : '<p style="margin-top:15px; color:#155724;"><strong>🎉 All subjects loaded successfully!</strong></p>'}
    `;

    // Show fix instructions if there are missing subjects
    if (missingCount > 0) {
        fixInstructionsDiv.style.display = 'block';
    } else {
        fixInstructionsDiv.style.display = 'none';
    }
}

// Auto-run tests on load
window.onload = function() {
    runTests();
};
