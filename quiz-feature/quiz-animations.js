/**
 * Quiz Animations Module
 * =======================
 * Handles all visual effects including falling emojis,
 * celebration animations, and floating background emojis.
 */

// ===================================================
// ANIMATION AND EMOJI EFFECTS
// ===================================================

function createFallingEmojis(type) {
    // Working emojis - these display properly!
    const workingEmojis = {
        correct: ['⭐', '✨', '⚡', '❤️', '💙', '💚', '💛', '💜', '✅', '✔️', '☀️', '🌟', '💫', '🎉', '🎊', '🎈'],
        incorrect: ['💭', '🤔', '📚', '🔍', '💡', '🧠', '❓', '🤷', '📝', '📖']
    };

    // Get emojis based on answer type
    const emojisToUse = type === 'correct' ? workingEmojis.correct : workingEmojis.incorrect;

    // Fisher-Yates shuffle for true randomization
    function shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // Create a pool of emojis with better distribution
    let emojis = shuffleArray(emojisToUse);

    const interval = setInterval(() => {
        if (answered && fallingEmojis.length < 45) {  // HEAVY foam: 45 emojis at once!
            const emoji = document.createElement('span');
            emoji.className = 'falling-emoji';

            // ✅ DIRECT TEXT ASSIGNMENT - KEY FIX!
            const selectedEmoji = emojis[Math.floor(Math.random() * emojis.length)];
            emoji.textContent = selectedEmoji;  // No HTML entities, no conversions!
            emoji.setAttribute('role', 'img');
            emoji.setAttribute('aria-label', 'celebration emoji');

            // Reshuffle frequently for maximum variety
            if (Math.random() > 0.5) {
                emojis = shuffleArray(emojis);
            }

            // Position outside quiz container on left, from back button to topic area
            emoji.style.left = (0.3 + Math.random() * 2) + '%';  // More horizontal spread
            emoji.style.top = (5 + Math.random() * 75) + '%';  // 5% to 80% vertical coverage
            emoji.style.animationDuration = (Math.random() * 1.2 + 1.3) + 's';  // 1.3-2.5s variation
            emoji.style.fontSize = (1 + Math.random() * 0.8) + 'em';  // 1-1.8em size variation
            emoji.style.display = 'inline-block';  // Ensure proper rendering
            document.body.appendChild(emoji);
            fallingEmojis.push(emoji);

            setTimeout(() => {
                emoji.remove();
                fallingEmojis = fallingEmojis.filter(e => e !== emoji);
            }, 2500);  // Match animation duration
        }
    }, 100);  // VERY fast interval - HEAVY FOAM EFFECT!

    // Store interval to clear later
    window.fallingInterval = interval;
}

function clearFallingEmojis(instant = true) {
    clearInterval(window.fallingInterval);

    const emojisToRemove = [...fallingEmojis]; // Copy array
    fallingEmojis = []; // Clear reference immediately

    // Instant removal - sudden disappearance like original backup
    emojisToRemove.forEach(emoji => {
        if (emoji && emoji.parentNode) {
            emoji.remove();
        }
    });
}

function createCelebrationEmoji(emoji) {
    const elem = document.createElement('div');
    elem.className = 'celebration-emoji';
    elem.textContent = emoji;
    // Start from left corner (0-15% from left)
    elem.style.left = Math.random() * 15 + '%';
    elem.style.bottom = '0';
    document.body.appendChild(elem);

    setTimeout(() => elem.remove(), 3000);
}

function addFloatingEmojis(emoji) {
    // Remove old floating emojis
    document.querySelectorAll('.floating-bg-emoji').forEach(e => e.remove());

    // Add new floating emojis
    const emojis = emoji.split('');
    for (let i = 0; i < 5; i++) {
        const elem = document.createElement('div');
        elem.className = 'floating-bg-emoji';
        elem.textContent = emojis[i % emojis.length];
        elem.style.left = Math.random() * 100 + '%';
        elem.style.top = Math.random() * 100 + '%';
        elem.style.animationDelay = Math.random() * 5 + 's';
        document.body.appendChild(elem);
    }
}
