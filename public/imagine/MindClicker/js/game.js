// js/game.js
// ========== GLOBAL GAME STATE ==========
window.game = {
    mindEnergy: 0,
    rebirthCount: 0,
    clickPower: 1,
    autoIncome: 0,          // per second
    upgrades: [],           // will be populated from upgrades.js
    characterTier: 0,
    lastUpdate: Date.now(),
};

// Character names based on rebirth count
const characterNames = [
    "Seeker", "Dreamer", "Mind Walker", "Thought Sculptor", 
    "Ego Weaver", "Psychonaut", "Architect of Consciousness",
    "The Awakened", "Infinite Insight"
];

// Helper to get current character name
window.getCharacterName = function() {
    const idx = Math.min(game.rebirthCount, characterNames.length - 1);
    return characterNames[idx];
};

// Rebirth multiplier (each rebirth gives +50% base)
window.getRebirthMultiplier = function() {
    return 1 + game.rebirthCount * 0.5;
};

// Calculate click power with upgrades and rebirth
window.calculateClickPower = function() {
    let base = 1;
    // add upgrade effects (handled in upgrades.js via modifiers)
    // upgrades.js will patch this value
    return base * window.getRebirthMultiplier();
};

// Calculate auto income per second
window.calculateAutoIncome = function() {
    let total = 0;
    if (game.upgrades) {
        game.upgrades.forEach(up => {
            if (up.effectPerSecond) total += up.count * up.effectPerSecond;
        });
    }
    return total * window.getRebirthMultiplier();
};

// Update game state each tick (called by ui.js)
window.updateGameState = function(deltaSeconds) {
    game.autoIncome = window.calculateAutoIncome();
    game.mindEnergy += game.autoIncome * deltaSeconds;
    // clamp to avoid floating point craziness
    if (game.mindEnergy < 0) game.mindEnergy = 0;
};

// Click action (called from ui)
window.clickMind = function() {
    let gain = game.clickPower;
    game.mindEnergy += gain;
    // Play click sound (if available)
    const audio = document.getElementById('clickSound');
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {}); // ignore autoplay blockers
    }
    return gain;
};

// Rebirth (prestige)
window.rebirth = function() {
    const required = 10000;
    if (game.mindEnergy < required) return false;

    // Play rebirth sound
    const audio = document.getElementById('rebirthSound');
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
    }

    // Increase rebirth count
    game.rebirthCount++;

    // Reset resources & upgrades
    game.mindEnergy = 0;
    game.upgrades.forEach(up => up.count = 0);
    game.clickPower = window.calculateClickPower(); // will be recalc later

    // Save after rebirth
    window.saveGame();
    return true;
};

// Hard reset (wipe everything)
window.hardReset = function() {
    if (confirm('Completely wipe all progress? This cannot be undone.')) {
        game.mindEnergy = 0;
        game.rebirthCount = 0;
        game.upgrades.forEach(up => up.count = 0);
        game.clickPower = 1;
        window.saveGame();
    }
};