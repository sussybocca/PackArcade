// Audio Manager - Actually works
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
            console.log(`⚠️ Sound missing: ${name}`);
        });
    }
    
    setTimeout(() => {
        let available = [];
        for (let [name, data] of Object.entries(sounds)) {
            if (data.available) available.push(name);
        }
        console.log(`🎵 Audio ready! Available: ${available.length > 0 ? available.join(', ') : 'none'}`);
    }, 500);
}

// Enable audio and play test sound
function enableAudio() {
    if (audioEnabled) {
        console.log("Audio already enabled");
        return;
    }
    
    // Try to play a test sound
    let testAudio = new Audio();
    testAudio.volume = 0.5;
    testAudio.src = 'sounds/win.mp3';
    
    testAudio.play().then(() => {
        audioEnabled = true;
        console.log("🔊 AUDIO ENABLED! You should hear a test sound!");
        
        // Hide the button
        let enableBtn = document.getElementById('enableAudioBtn');
        if (enableBtn) {
            enableBtn.style.opacity = '0.5';
            enableBtn.innerHTML = '✓ SOUND ON';
            enableBtn.style.backgroundColor = '#44aa44';
            setTimeout(() => {
                enableBtn.style.display = 'none';
            }, 2000);
        }
        
        // Preload all sounds
        for (let key in sounds) {
            if (sounds[key].available) {
                sounds[key].audio.load();
            }
        }
        
        testAudio.pause();
        testAudio.currentTime = 0;
        
    }).catch(e => {
        console.log("Click the button again - browser requires user interaction first");
        // Create a visible message
        let msg = document.createElement('div');
        msg.textContent = '⚠️ Click the button again to enable sound (browser requires double click)';
        msg.style.position = 'fixed';
        msg.style.bottom = '100px';
        msg.style.right = '20px';
        msg.style.backgroundColor = '#ff4444';
        msg.style.color = 'white';
        msg.style.padding = '10px';
        msg.style.borderRadius = '10px';
        msg.style.fontSize = '12px';
        msg.style.zIndex = '1001';
        document.body.appendChild(msg);
        setTimeout(() => msg.remove(), 3000);
    });
}

// Play sound function
function playSound(soundName) {
    if (!audioEnabled) {
        console.log(`🔇 Audio not enabled - click the ENABLE SOUND button first`);
        return;
    }
    
    const soundData = sounds[soundName];
    if (soundData && soundData.available) {
        let audio = soundData.audio;
        audio.currentTime = 0;
        audio.play().then(() => {
            console.log(`🔊 Playing: ${soundName}`);
        }).catch(e => {
            console.log(`Failed to play ${soundName}:`, e);
        });
    } else if (soundData && !soundData.available) {
        console.log(`⚠️ Sound ${soundName} not available (MP3 missing)`);
    }
}

// Create enable button
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
    btn.style.transition = 'all 0.3s';
    
    btn.onclick = function(e) {
        e.stopPropagation();
        console.log("Button clicked! Enabling audio...");
        enableAudio();
    };
    
    document.body.appendChild(btn);
    console.log("✅ Audio button created - click it to enable sound!");
}

// Also enable on game canvas click
function setupCanvasClick() {
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
        canvas.addEventListener('click', function() {
            if (!audioEnabled) {
                console.log("Canvas clicked - enabling audio");
                enableAudio();
            }
        });
    }
}

// Initialize when page loads
window.addEventListener('DOMContentLoaded', () => {
    loadSounds();
    createAudioButton();
    setupCanvasClick();
    console.log("🎮 PlayLive Ready! Click the ORANGE BUTTON to enable sound.");
});

// Export for game.js
window.playSound = playSound;
