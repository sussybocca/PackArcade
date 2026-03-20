// Audio Manager - Keeps all sounds, only plays what exists
let sounds = {};
let audioEnabled = false;

// Load all sounds - missing ones will be marked as unavailable
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
        sounds[name] = {
            audio: audio,
            available: false
        };
        
        audio.addEventListener('canplaythrough', () => {
            sounds[name].available = true;
            console.log(`✅ Sound ready: ${name}`);
        });
        
        audio.addEventListener('error', () => {
            sounds[name].available = false;
            console.log(`⚠️ Sound missing: ${name} - place ${path} to enable`);
        });
    }
    
    // Check which sounds are available after a short delay
    setTimeout(() => {
        let available = [];
        for (let [name, data] of Object.entries(sounds)) {
            if (data.available) available.push(name);
        }
        console.log(`🎵 Audio system ready! Available sounds: ${available.length > 0 ? available.join(', ') : 'none yet (add MP3 files to sounds/ folder)'}`);
    }, 500);
}

// Enable audio on first user interaction
function initAudio() {
    if (audioEnabled) return;
    
    // Try to play silent sound to unlock audio
    let testAudio = new Audio();
    testAudio.volume = 0;
    testAudio.play().then(() => {
        audioEnabled = true;
        console.log("🔊 AUDIO ENABLED! All sounds will now play.");
        
        // Hide the hint
        let hint = document.getElementById('audioHint');
        if (hint) {
            hint.style.opacity = '0';
            setTimeout(() => hint.style.display = 'none', 500);
        }
        testAudio.pause();
    }).catch(e => {
        console.log("Click/tap anywhere to enable sounds");
    });
}

// Play sound function - only plays if sound is available
function playSound(soundName) {
    if (!audioEnabled) {
        initAudio();
        console.log(`🔇 Audio not enabled yet - click the page first to hear ${soundName}`);
        return;
    }
    
    const soundData = sounds[soundName];
    if (soundData && soundData.available) {
        let audio = soundData.audio;
        audio.currentTime = 0;
        audio.play().catch(e => {
            // Silently fail - don't spam console
        });
    } else if (soundData && !soundData.available) {
        // Sound file missing - do nothing (no error spam)
    }
}

// Enable audio on any user interaction
function enableAudioOnInteraction() {
    if (!audioEnabled) {
        initAudio();
    }
}

// Listen for user interactions
document.addEventListener('click', enableAudioOnInteraction);
document.addEventListener('keydown', enableAudioOnInteraction);
document.addEventListener('touchstart', enableAudioOnInteraction);

// Initialize when page loads
window.addEventListener('load', () => {
    loadSounds();
    console.log("🎮 PlayLive Ready! Click anywhere to enable audio.");
});

// Export for game.js
window.playSound = playSound;
