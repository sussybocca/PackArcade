// Audio Manager - Production Ready
// Expects MP3 files to be placed in assets/audio/ by user

const AudioManager = (function() {
    let bgMusic = document.getElementById('audio-bg');
    let laserSound = document.getElementById('audio-laser');
    let explosionSound = document.getElementById('audio-explosion');
    let gameOverSound = document.getElementById('audio-gameover');
    
    let isMuted = false;
    let bgVolume = 0.3;
    let sfxVolume = 0.5;

    function init() {
        if (!bgMusic) {
            console.error("Audio elements not found. Ensure audio files are placed in assets/audio/");
            return;
        }
        
        // Set initial volumes
        bgMusic.volume = bgVolume;
        laserSound.volume = sfxVolume;
        explosionSound.volume = sfxVolume;
        gameOverSound.volume = sfxVolume;
        
        // Preload and prepare
        bgMusic.load();
        laserSound.load();
        explosionSound.load();
        gameOverSound.load();
        
        // Start background music (will play after user interaction)
        document.addEventListener('click', function startAudio() {
            if (bgMusic.paused) {
                bgMusic.play().catch(e => console.log("Audio play failed:", e));
            }
            document.removeEventListener('click', startAudio);
        }, { once: true });
    }

    function playLaser() {
        if (laserSound) {
            laserSound.currentTime = 0;
            laserSound.play().catch(e => {});
        }
    }

    function playExplosion() {
        if (explosionSound) {
            explosionSound.currentTime = 0;
            explosionSound.play().catch(e => {});
        }
    }

    function playGameOver() {
        if (gameOverSound) {
            gameOverSound.currentTime = 0;
            gameOverSound.play().catch(e => {});
        }
        if (bgMusic) {
            bgMusic.pause();
        }
    }

    function stopAll() {
        if (bgMusic) bgMusic.pause();
        if (laserSound) laserSound.pause();
        if (explosionSound) explosionSound.pause();
        if (gameOverSound) gameOverSound.pause();
    }

    function restartMusic() {
        if (bgMusic && !isMuted) {
            bgMusic.currentTime = 0;
            bgMusic.play().catch(e => {});
        }
    }

    return {
        init,
        playLaser,
        playExplosion,
        playGameOver,
        stopAll,
        restartMusic
    };
})();