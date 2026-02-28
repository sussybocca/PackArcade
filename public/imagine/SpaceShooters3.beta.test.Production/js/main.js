// Entry Point - Production Ready
// Initializes the game when DOM is fully loaded

document.addEventListener('DOMContentLoaded', () => {
    console.log('SpaceShooters 3 - Production Build');
    console.log('Ensure MP3 and MP4 files are placed in assets/audio/ and assets/video/');
    
    // Start the game (Three.js will create its own canvas)
    Game.init();
});