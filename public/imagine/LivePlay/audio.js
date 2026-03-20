// Audio Manager - Replace with your actual MP3 files
let sounds = {
    jump: null,
    lapComplete: null,
    levelUp: null,
    gameOver: null,
    start: null,
    win: null,
    lose: null,
    upgrade: null,
    puzzleWin: null,
    puzzleFail: null
};

// Load sounds - UPDATE THESE PATHS WITH YOUR ACTUAL MP3 FILES
function loadSounds() {
    sounds.jump = new Audio('sounds/jump.mp3');
    sounds.lapComplete = new Audio('sounds/lap.mp3');
    sounds.levelUp = new Audio('sounds/levelup.mp3');
    sounds.gameOver = new Audio('sounds/gameover.mp3');
    sounds.start = new Audio('sounds/start.mp3');
    sounds.win = new Audio('sounds/win.mp3');
    sounds.lose = new Audio('sounds/lose.mp3');
    sounds.upgrade = new Audio('sounds/upgrade.mp3');
    sounds.puzzleWin = new Audio('sounds/puzzlewin.mp3');
    sounds.puzzleFail = new Audio('sounds/puzzlefail.mp3');
    
    // Optional: preload all sounds
    for (let key in sounds) {
        if (sounds[key]) {
            sounds[key].load();
        }
    }
}

// Play sound function
function playSound(soundName) {
    if (sounds[soundName]) {
        sounds[soundName].currentTime = 0;
        sounds[soundName].play().catch(e => console.log("Audio play failed:", e));
    }
}

// Initialize audio when page loads
window.addEventListener('load', () => {
    loadSounds();
});

// Export for game.js
window.playSound = playSound;
