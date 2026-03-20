// Audio Manager - Properly handles browser autoplay policies
let sounds = {};
let audioEnabled = false;

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
        audio.preload = 'auto';
        sounds[name] = audio;
        
        audio.addEventListener('canplaythrough', () => {
            console.log(`✅ Sound loaded: ${name}`);
        });
        
        audio.addEventListener('error', (e) => {
            console.log(`⚠️ Sound not found: ${path} - place your MP3 here`);
        });
    }
    console.log("Audio system ready - click anywhere to enable sounds");
}

// Initialize audio on first user interaction
function initAudio() {
    if (audioEnabled) return;
    
    // Test play a silent sound to unlock audio
    let testAudio = new Audio();
    testAudio.play().then(() => {
        audioEnabled = true;
        console.log("🔊 Audio enabled! Sounds will now play.");
        // Preload all sounds
        for (let key in sounds) {
            sounds[key].load();
        }
        testAudio.pause();
    }).catch(e => {
        console.log("Click/tap to enable sounds");
    });
}

// Play sound function - actually plays!
function playSound(soundName) {
    if (!audioEnabled) {
        // Try to enable audio on first play attempt
        initAudio();
        return;
    }
    
    if (sounds[soundName]) {
        let sound = sounds[soundName];
        sound.currentTime = 0;
        sound.play().catch(e => {
            console.log(`Failed to play ${soundName}:`, e);
        });
    } else {
        console.log(`Sound not found: ${soundName}`);
    }
}

// Force audio enable on any user interaction
function enableAudioOnInteraction() {
    initAudio();
    // Remove listeners after first interaction
    document.removeEventListener('click', enableAudioOnInteraction);
    document.removeEventListener('keydown', enableAudioOnInteraction);
    document.removeEventListener('touchstart', enableAudioOnInteraction);
}

// Listen for first user interaction to enable audio
document.addEventListener('click', enableAudioOnInteraction);
document.addEventListener('keydown', enableAudioOnInteraction);
document.addEventListener('touchstart', enableAudioOnInteraction);

// Initialize when page loads
window.addEventListener('load', () => {
    loadSounds();
    console.log("🎮 PlayLive Ready! Click anywhere to enable audio, then play!");
});

// Export for game.js
window.playSound = playSound;
