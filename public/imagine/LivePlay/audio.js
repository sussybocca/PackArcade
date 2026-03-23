// Audio Manager - Actually enables audio on click
let sounds = {};
let audioEnabled = false;

// Load all sounds
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
            console.log(`⚠️ Sound missing: ${name} - place sounds/${name}.mp3 to enable`);
        });
    }
    
    setTimeout(() => {
        let available = [];
        for (let [name, data] of Object.entries(sounds)) {
            if (data.available) available.push(name);
        }
        console.log(`🎵 Audio system ready! Available sounds: ${available.length > 0 ? available.join(', ') : 'none yet'}`);
    }, 500);
}

// Force enable audio immediately on ANY click
function enableAudio() {
    if (audioEnabled) return;
    
    // Play a silent sound to unlock audio
    let testAudio = new Audio();
    testAudio.volume = 0;
    testAudio.play().then(() => {
        audioEnabled = true;
        console.log("🔊 AUDIO ENABLED! Sounds will now play.");
        
        // Hide the hint
        let hint = document.getElementById('audioHint');
        if (hint) {
            hint.style.opacity = '0';
            setTimeout(() => hint.style.display = 'none', 500);
        }
        testAudio.pause();
    }).catch(e => {
        console.log("Audio enable failed, will retry on next click");
    });
}

// Play sound function
function playSound(soundName) {
    // If audio not enabled yet, try to enable it
    if (!audioEnabled) {
        enableAudio();
        // Don't play the sound yet, wait for next click
        return;
    }
    
    const soundData = sounds[soundName];
    if (soundData && soundData.available) {
        let audio = soundData.audio;
        audio.currentTime = 0;
        audio.play().catch(e => {
            // Silent fail
        });
    }
}

// Enable audio on ANY user interaction - click, keypress, touch
function handleUserInteraction() {
    if (!audioEnabled) {
        enableAudio();
    }
}

// Listen for ALL user interactions
document.addEventListener('click', handleUserInteraction);
document.addEventListener('keydown', handleUserInteraction);
document.addEventListener('touchstart', handleUserInteraction);
document.addEventListener('keypress', handleUserInteraction);

// Also listen for game canvas clicks
const canvas = document.getElementById('gameCanvas');
if (canvas) {
    canvas.addEventListener('click', handleUserInteraction);
}

// Initialize when page loads
window.addEventListener('load', () => {
    loadSounds();
    console.log("🎮 PlayLive Ready! Click anywhere to enable audio.");
});

// Export for game.js
window.playSound = playSound;
