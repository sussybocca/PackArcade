// Image Manager - REPLACE THESE PATHS WITH YOUR ACTUAL PNG FILES
let gameAssets = {
    runner: null,
    obstacle: null,
    background: null
};

// Load images from your provided PNG files
function loadGameAssets() {
    // UPDATE THESE PATHS WITH YOUR ACTUAL PNG FILE LOCATIONS
    gameAssets.runner = new Image();
    gameAssets.runner.src = 'images/runner.png';
    
    gameAssets.obstacle = new Image();
    gameAssets.obstacle.src = 'images/obstacle.png';
    
    gameAssets.background = new Image();
    gameAssets.background.src = 'images/background.png';
    
    // Wait for images to load then pass to game
    let imagesLoaded = 0;
    const totalImages = 3;
    
    function imageLoaded() {
        imagesLoaded++;
        if (imagesLoaded === totalImages) {
            if (window.setGameImages) {
                window.setGameImages(gameAssets.runner, gameAssets.obstacle, gameAssets.background);
            }
            console.log("All game assets loaded!");
        }
    }
    
    gameAssets.runner.onload = imageLoaded;
    gameAssets.obstacle.onload = imageLoaded;
    gameAssets.background.onload = imageLoaded;
    
    // If images fail to load, use fallback (game will still work with colored shapes)
    gameAssets.runner.onerror = () => { console.warn("Runner image not found, using fallback"); imageLoaded(); };
    gameAssets.obstacle.onerror = () => { console.warn("Obstacle image not found, using fallback"); imageLoaded(); };
    gameAssets.background.onerror = () => { console.warn("Background image not found, using fallback"); imageLoaded(); };
}

// Initialize when page loads
window.addEventListener('DOMContentLoaded', () => {
    loadGameAssets();
});
