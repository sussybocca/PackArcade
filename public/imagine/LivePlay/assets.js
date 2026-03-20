// Image Manager - Game works perfectly without images, loads them when available
let gameAssets = {
    runner: null,
    obstacle: null,
    background: null
};

// Load images from your provided PNG files
function loadGameAssets() {
    // UPDATE THESE PATHS WITH YOUR ACTUAL PNG FILE LOCATIONS
    const imagePaths = {
        runner: 'images/runner.png',
        obstacle: 'images/obstacle.png',
        background: 'images/background.png'
    };
    
    gameAssets.runner = new Image();
    gameAssets.runner.src = imagePaths.runner;
    
    gameAssets.obstacle = new Image();
    gameAssets.obstacle.src = imagePaths.obstacle;
    
    gameAssets.background = new Image();
    gameAssets.background.src = imagePaths.background;
    
    let imagesLoaded = 0;
    const totalImages = 3;
    
    function checkAllLoaded() {
        imagesLoaded++;
        if (imagesLoaded === totalImages) {
            if (window.setGameImages) {
                window.setGameImages(gameAssets.runner, gameAssets.obstacle, gameAssets.background);
            }
            console.log("All game assets loaded! Your PNGs are now active.");
        }
    }
    
    gameAssets.runner.onload = checkAllLoaded;
    gameAssets.obstacle.onload = checkAllLoaded;
    gameAssets.background.onload = checkAllLoaded;
    
    // If images fail, still work with fallback graphics
    gameAssets.runner.onerror = () => { 
        console.log("Runner PNG not found - using colored character (still works!)"); 
        checkAllLoaded();
    };
    gameAssets.obstacle.onerror = () => { 
        console.log("Obstacle PNG not found - using colored obstacle (still works!)"); 
        checkAllLoaded();
    };
    gameAssets.background.onerror = () => { 
        console.log("Background PNG not found - using gradient background (still works!)"); 
        checkAllLoaded();
    };
}

// Initialize when page loads
window.addEventListener('DOMContentLoaded', () => {
    loadGameAssets();
});
