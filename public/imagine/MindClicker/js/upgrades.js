// js/upgrades.js
// ========== UPGRADE DEFINITIONS ==========
// Now with way more upgrades – a deep, grindy tree
window.upgradeDefinitions = [
    // TIER 1 – basic
    {
        id: 'sharpMind',
        name: '🧠 Sharper Mind',
        desc: '+1 per click',
        baseCost: 10,
        effectClick: 1,
        effectPerSecond: 0,
        costScale: 1.6,
        icon: '⚡'
    },
    {
        id: 'meditate',
        name: '🧘 Meditation',
        desc: '+0.5 per second',
        baseCost: 50,
        effectClick: 0,
        effectPerSecond: 0.5,
        costScale: 1.7,
        icon: '🌿'
    },
    {
        id: 'deepFocus',
        name: '🔮 Deep Focus',
        desc: '+3 per click, +1 per second',
        baseCost: 250,
        effectClick: 3,
        effectPerSecond: 1,
        costScale: 1.8,
        icon: '🌀'
    },

    // TIER 2 – intermediate
    {
        id: 'astralProjection',
        name: '✨ Astral Projection',
        desc: '+10 per click, +5 per second',
        baseCost: 1500,
        effectClick: 10,
        effectPerSecond: 5,
        costScale: 1.9,
        icon: '🌌'
    },
    {
        id: 'mindPalace',
        name: '🏛️ Mind Palace',
        desc: '+30 per click, +15 per second',
        baseCost: 8000,
        effectClick: 30,
        effectPerSecond: 15,
        costScale: 2.0,
        icon: '🏛️'
    },
    {
        id: 'cognitiveEnhancement',
        name: '💊 Cognitive Enhancement',
        desc: '+25 per click',
        baseCost: 12000,
        effectClick: 25,
        effectPerSecond: 0,
        costScale: 2.1,
        icon: '💊'
    },
    {
        id: 'dreamWeaver',
        name: '🌙 Dream Weaver',
        desc: '+20 per second',
        baseCost: 20000,
        effectClick: 0,
        effectPerSecond: 20,
        costScale: 2.2,
        icon: '🌙'
    },

    // TIER 3 – advanced
    {
        id: 'neuralNetwork',
        name: '🧬 Neural Network',
        desc: '+75 per click, +40 per second',
        baseCost: 50000,
        effectClick: 75,
        effectPerSecond: 40,
        costScale: 2.15,
        icon: '🧬'
    },
    {
        id: 'quantumCognition',
        name: '⚛️ Quantum Cognition',
        desc: '+200 per click, +100 per second',
        baseCost: 150000,
        effectClick: 200,
        effectPerSecond: 100,
        costScale: 2.2,
        icon: '⚛️'
    },
    {
        id: 'egoDeath',
        name: '🔥 Ego Death',
        desc: '+500 per click, +250 per second',
        baseCost: 500000,
        effectClick: 500,
        effectPerSecond: 250,
        costScale: 2.25,
        icon: '🔥'
    },
    {
        id: 'collectiveUnconscious',
        name: '🌍 Collective Unconscious',
        desc: '+2000 per click, +1000 per second',
        baseCost: 2_000_000,
        effectClick: 2000,
        effectPerSecond: 1000,
        costScale: 2.3,
        icon: '🌍'
    },

    // TIER 4 – master
    {
        id: 'akashicRecords',
        name: '📜 Akashic Records',
        desc: '+5000 per click, +2500 per second',
        baseCost: 10_000_000,
        effectClick: 5000,
        effectPerSecond: 2500,
        costScale: 2.4,
        icon: '📜'
    },
    {
        id: 'omegaMind',
        name: 'Ω Omega Mind',
        desc: '+15000 per click, +7500 per second',
        baseCost: 50_000_000,
        effectClick: 15000,
        effectPerSecond: 7500,
        costScale: 2.5,
        icon: 'Ω'
    },

    // TIER 5 – transcendent (pure click / pure idle variants)
    {
        id: 'thoughtSeed',
        name: '🌱 Thought Seed',
        desc: '+1 per click (stacks sharply)',
        baseCost: 100,
        effectClick: 1,
        effectPerSecond: 0,
        costScale: 1.65,
        icon: '🌱'
    },
    {
        id: 'mentalOverclock',
        name: '⚡ Mental Overclock',
        desc: '+100 per click',
        baseCost: 300_000,
        effectClick: 100,
        effectPerSecond: 0,
        costScale: 2.2,
        icon: '⚡'
    },
    {
        id: 'psychicLeecher',
        name: '🕷️ Psychic Leecher',
        desc: '+300 per second',
        baseCost: 800_000,
        effectClick: 0,
        effectPerSecond: 300,
        costScale: 2.3,
        icon: '🕷️'
    },
    {
        id: 'mindOverMatter',
        name: '🧱 Mind Over Matter',
        desc: '+800 per click, +400 per second',
        baseCost: 4_000_000,
        effectClick: 800,
        effectPerSecond: 400,
        costScale: 2.35,
        icon: '🧱'
    },

    // TIER 6 – godlike
    {
        id: 'noosphere',
        name: '🌐 Noosphere',
        desc: '+10k per click, +5k per second',
        baseCost: 100_000_000,
        effectClick: 10000,
        effectPerSecond: 5000,
        costScale: 2.6,
        icon: '🌐'
    },
    {
        id: 'singularity',
        name: '⏺️ Singularity',
        desc: '+50k per click, +25k per second',
        baseCost: 1_000_000_000,
        effectClick: 50000,
        effectPerSecond: 25000,
        costScale: 2.8,
        icon: '⏺️'
    },

    // TIER 7 – absurd (post‑rebirth grind)
    {
        id: 'overmind',
        name: '👁️ Overmind',
        desc: '+200k per click, +100k per second',
        baseCost: 10_000_000_000,
        effectClick: 200000,
        effectPerSecond: 100000,
        costScale: 3.0,
        icon: '👁️'
    },
    {
        id: 'yaldabaoth',
        name: '🐉 Yaldabaoth',
        desc: '+1M per click, +500k per second',
        baseCost: 1e12, // 1e12
        effectClick: 1_000_000,
        effectPerSecond: 500_000,
        costScale: 3.5,
        icon: '🐉'
    },

    // BONUS: some cheap but scaling fast clickers
    {
        id: 'clickAddict',
        name: '🖱️ Click Addict',
        desc: '+2 per click',
        baseCost: 500,
        effectClick: 2,
        effectPerSecond: 0,
        costScale: 2.0,
        icon: '🖱️'
    },
    {
        id: 'doubleThought',
        name: '🤔 Double Thought',
        desc: '+5 per click, +2 per second',
        baseCost: 3000,
        effectClick: 5,
        effectPerSecond: 2,
        costScale: 2.1,
        icon: '🤔'
    },
    {
        id: 'thirdEye',
        name: '👁️ Third Eye',
        desc: '+15 per click, +8 per second',
        baseCost: 20000,
        effectClick: 15,
        effectPerSecond: 8,
        costScale: 2.2,
        icon: '👁️'
    }
];

// Initialize upgrade counts in game state
window.game.upgrades = window.upgradeDefinitions.map(def => ({
    id: def.id,
    count: 0,
    def: def
}));

// Helper to get upgrade by id
window.getUpgrade = function(id) {
    return window.game.upgrades.find(u => u.id === id);
};

// Recalculate click power from upgrade counts
window.recalcClickPower = function() {
    let total = 1; // base
    window.game.upgrades.forEach(u => {
        total += u.count * u.def.effectClick;
    });
    window.game.clickPower = total * window.getRebirthMultiplier();
};

// Recalc auto income (used in game loop)
window.recalcAutoIncome = function() {
    let total = 0;
    window.game.upgrades.forEach(u => {
        total += u.count * u.def.effectPerSecond;
    });
    return total * window.getRebirthMultiplier();
};

// Purchase upgrade
window.purchaseUpgrade = function(upgradeId) {
    const upgrade = window.getUpgrade(upgradeId);
    if (!upgrade) return false;

    const cost = Math.floor(upgrade.def.baseCost * Math.pow(upgrade.def.costScale, upgrade.count));
    if (window.game.mindEnergy < cost) return false;

    window.game.mindEnergy -= cost;
    upgrade.count++;
    window.recalcClickPower();
    window.saveGame();
    return true;
};

// Get current upgrade cost
window.getUpgradeCost = function(upgradeId) {
    const upgrade = window.getUpgrade(upgradeId);
    if (!upgrade) return Infinity;
    return Math.floor(upgrade.def.baseCost * Math.pow(upgrade.def.costScale, upgrade.count));
};