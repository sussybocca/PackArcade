// Video Texture Manager - Handles MP4 animations for immersive entities
// Expects MP4 files in assets/video/ (player.mp4, enemy1.mp4, enemy2.mp4)

const VideoManager = (function() {
    const videoElements = {
        player: document.getElementById('player-video'),
        enemy1: document.getElementById('enemy1-video'),
        enemy2: document.getElementById('enemy2-video')
    };

    // Check if videos are ready
    function areVideosReady() {
        for (let key in videoElements) {
            if (!videoElements[key] || videoElements[key].readyState < 2) {
                return false;
            }
        }
        return true;
    }

    // Get video element for drawing to canvas
    function getVideo(type) {
        return videoElements[type] || videoElements.enemy1; // fallback
    }

    // Ensure videos are playing
    function ensurePlay() {
        for (let key in videoElements) {
            let vid = videoElements[key];
            if (vid && vid.paused) {
                vid.play().catch(e => console.warn("Video play failed:", e));
            }
        }
    }

    // Call this frequently to keep videos playing
    function update() {
        ensurePlay();
    }

    return {
        getVideo,
        areVideosReady,
        update
    };
})();