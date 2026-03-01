// js/save.js
const SAVE_KEY = 'mindclicker_prod_save';

window.saveGame = function() {
    const saveData = {
        mindEnergy: game.mindEnergy,
        rebirthCount: game.rebirthCount,
        upgrades: game.upgrades.map(u => ({ id: u.id, count: u.count }))
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
};

window.loadGame = function() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;

    try {
        const data = JSON.parse(raw);
        game.mindEnergy = data.mindEnergy || 0;
        game.rebirthCount = data.rebirthCount || 0;

        // Restore upgrade counts
        if (data.upgrades && Array.isArray(data.upgrades)) {
            data.upgrades.forEach(savedUp => {
                const target = game.upgrades.find(u => u.id === savedUp.id);
                if (target) target.count = savedUp.count || 0;
            });
        }

        // Recalc click power after loading
        window.recalcClickPower();
    } catch (e) {
        console.warn('Save corrupted, starting fresh');
        localStorage.removeItem(SAVE_KEY);
    }
};

// Manual reset function (called from ui)
window.hardReset = function() {
    if (confirm('Completely wipe all progress? This cannot be undone.')) {
        game.mindEnergy = 0;
        game.rebirthCount = 0;
        game.upgrades.forEach(u => u.count = 0);
        window.recalcClickPower();
        window.saveGame();
    }
};