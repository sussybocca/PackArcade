// Audio Manager - With dedicated enable button
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
        });
    }
    
    setTimeout(() => {
        let available = [];
        for (let [name, data] of Object.entries(sounds)) {
            if (data.available) available.push(name);
        }
        console.log(`🎵 Audio ready! Sounds: ${available.length > 0 ? available.join(', ') : 'none'}`);
    }, 500);
}

// Enable audio
function enableAudio() {
    if (audioEnabled) return;
    
    let testAudio = new Audio();
    testAudio.volume = 0;
    testAudio.play().then(() => {
        audioEnabled = true;
        console.log("🔊 AUDIO ENABLED!");
        
        let hint = document.getElementById('audioHint');
        if (hint) hint.style.display = 'none';
        
        let enableBtn = document.getElementById('enableAudioBtn');
        if (enableBtn) {
            enableBtn.style.display = 'none';
        }
        
        testAudio.pause();
    }).catch(e => {
        console.log("Click the button to enable audio");
    });
}

// Play sound function
function playSound(soundName) {
    if (!audioEnabled) return;
    
    const soundData = sounds[soundName];
    if (soundData && soundData.available) {
        let audio = soundData.audio;
        audio.currentTime = 0;
        audio.play().catch(e => {});
    }
}

// Create enable button if it doesn't exist
function createAudioButton() {
    if (document.getElementById('enableAudioBtn')) return;
    
    let btn = document.createElement('button');
    btn.id = 'enableAudioBtn';
    btn.innerHTML = '🔊 ENABLE SOUND';
    btn.style.position = 'fixed';
    btn.style.bottom = '20px';
    btn.style.right = '20px';
    btn.style.backgroundColor = '#ffaa44';
    btn.style.color = '#1a1a2e';
    btn.style.border = 'none';
    btn.style.padding = '12px 24px';
    btn.style.borderRadius = '50px';
    btn.style.fontWeight = 'bold';
    btn.style.fontSize = '1rem';
    btn.style.cursor = 'pointer';
    btn.style.zIndex = '1000';
    btn.style.fontFamily = 'monospace';
    btn.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
    btn.style.animation = 'pulse 1.5s infinite';
    
    btn.onclick = function() {
        enableAudio();
    };
    
    document.body.appendChild(btn);
}

// Initialize when page loads
window.addEventListener('load', () => {
    loadSounds();
    createAudioButton();
    console.log("🎮 PlayLive Ready! Click 'ENABLE SOUND' button to enable audio.");
});

// Export for game.js
window.playSound = playSound;
