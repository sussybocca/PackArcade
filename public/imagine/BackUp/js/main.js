// main.js – Entry point, initialises game and starts main loop
import * as THREE from 'three';
import { Game } from './core/Game.js';
import { Logger } from './utils/Logger.js';
import { Constants } from './utils/Constants.js';

// Global reference to game instance (for debugging)
window.game = null;

// Initialise when DOM ready
document.addEventListener('DOMContentLoaded', async () => {
    Logger.info('Drugs.sim starting...');
    
    try {
        // Create game instance
        const game = new Game();
        window.game = game;
        
        // Wait for assets to load (AssetLoader inside Game handles it)
        await game.init();
        
        // Hide loading screen
        document.getElementById('loading-screen').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('loading-screen').style.display = 'none';
        }, 500);
        
        // Start animation loop
        game.start();
        
        Logger.info('Game initialised successfully');
    } catch (error) {
        Logger.error('Failed to start game:', error);
        document.getElementById('loading-screen').innerHTML = 
            `Error loading game: ${error.message}<br>Please check console and asset paths.`;
    }
});