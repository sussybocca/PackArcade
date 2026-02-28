// main.js – Entry point with mobile support and live log notifications
import * as THREE from 'three';
import { Game } from './core/Game.js';
import { Logger } from './utils/Logger.js';
import { Constants } from './utils/Constants.js';

// Global reference to game instance (for debugging)
window.game = null;

// Create notification bar
function createNotificationBar() {
  const bar = document.createElement('div');
  bar.id = 'log-notifications';
  bar.style.cssText = `
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    background: rgba(10, 10, 20, 0.9);
    backdrop-filter: blur(8px);
    color: #fff;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    padding: 8px 12px;
    z-index: 10000;
    border-top: 1px solid #ff4444;
    max-height: 120px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 4px;
    pointer-events: auto;
    transition: opacity 0.3s;
  `;

  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
    font-weight: bold;
    color: #ffaa00;
  `;
  header.innerHTML = '<span>📋 LIVE LOGS</span> <span id="log-count">0</span>';
  bar.appendChild(header);

  const messagesDiv = document.createElement('div');
  messagesDiv.id = 'log-messages';
  messagesDiv.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 2px;
  `;
  bar.appendChild(messagesDiv);

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.style.cssText = `
    position: absolute;
    top: 4px;
    right: 8px;
    background: transparent;
    border: none;
    color: #aaa;
    font-size: 16px;
    cursor: pointer;
  `;
  closeBtn.onclick = () => bar.style.display = 'none';
  bar.appendChild(closeBtn);

  document.body.appendChild(bar);
  return { bar, messagesDiv, countSpan: header.querySelector('#log-count') };
}

// Override Logger methods to also push to notification bar
function setupLoggerHook(notif) {
  const levels = ['debug', 'info', 'warn', 'error'];
  const levelColors = {
    debug: '#888',
    info: '#00ccff',
    warn: '#ffaa00',
    error: '#ff4444'
  };

  levels.forEach(level => {
    const original = Logger[level];
    Logger[level] = function(...args) {
      // Call original
      original.apply(this, args);

      // Format message
      const msg = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');

      // Create notification element
      const entry = document.createElement('div');
      entry.style.cssText = `
        color: ${levelColors[level]};
        border-left: 2px solid ${levelColors[level]};
        padding-left: 6px;
        font-size: 11px;
        word-break: break-word;
      `;
      entry.textContent = `[${level.toUpperCase()}] ${msg}`;

      // Add to messages div, limit to 10
      notif.messagesDiv.appendChild(entry);
      const children = notif.messagesDiv.children;
      if (children.length > 10) {
        children[0].remove();
      }
      notif.countSpan.textContent = children.length;
    };
  });
}

// Initialise when DOM ready
document.addEventListener('DOMContentLoaded', async () => {
    // Create notification bar (hidden until first log)
    const notif = createNotificationBar();
    setupLoggerHook(notif);

    Logger.info('Drugs.sim starting...');
    Logger.info('Mobile mode active – logs shown at bottom');

    try {
        // Create game instance
        const game = new Game();
        window.game = game;

        // Wait for assets to load
        await game.init();

        // Hide loading screen
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }

        // Start animation loop
        game.start();

        Logger.info('Game initialised successfully');
    } catch (error) {
        Logger.error('Failed to start game:', error);
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.innerHTML = 
                `Error loading game: ${error.message}<br>Please check console and asset paths.`;
        }
    }
});

// Optional: Add touch support hint (not implemented here, but can be extended)
if ('ontouchstart' in window) {
    Logger.info('Touch device detected – use on-screen controls? (Not yet implemented)');
}
