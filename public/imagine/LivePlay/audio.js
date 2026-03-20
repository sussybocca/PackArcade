// Audio Manager - Will work silently if files are missing
let sounds = {};

// Load sounds - UPDATE THESE PATHS WITH YOUR ACTUAL MP3 FILES
function loadSounds() {
    const soundFiles = {
        jump: 'sounds/jump.mp3',
        lapComplete: 'sounds/lap.mp3',
        levelUp: 'sounds/levelup.mp3',
        gameOver: 'sounds/gameover.mp3',
        start: 'sounds/start.mp3',
        win: 'sounds/win.mp3',
        lose: 'sounds/lose.mp3',
        upgrade: 'sounds/upgrade.mp3',
        puzzleWin: 'sounds/puzzlewin.mp3',
        puzzleFail: 'sounds/puzzlefail.mp3'
    };
    
    for (let [name, path] of Object.entries(soundFiles)) {
        let audio = new Audio();
        audio.src = path;
        audio.load();
        sounds[name] = audio;
        
        // Log missing files but don't crash
        audio.addEventListener('error', () => {
            console.log(`Audio file not found: ${path} - will play silently`);
        });
    }
    console.log("Audio system ready - waiting for your MP3 files");
}

// Play sound function - safe even if audio fails
function playSound(soundName) {
    if (sounds[soundName]) {
        sounds[soundName].currentTime = 0;
        sounds[soundName].play().catch(e => {
            // Silently fail - game still works
        });
    }
}

// Initialize audio when page loads
window.addEventListener('load', () => {
    loadSounds();
});

// Export for game.js
window.playSound = playSound;
