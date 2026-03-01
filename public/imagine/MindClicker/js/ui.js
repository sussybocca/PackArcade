// js/ui.js
document.addEventListener('DOMContentLoaded', () => {
    // References
    const mindEnergySpan = document.getElementById('mindEnergy');
    const epcSpan = document.getElementById('epc');
    const rebirthCountSpan = document.getElementById('rebirthCount');
    const characterNameSpan = document.getElementById('characterName');
    const upgradeListDiv = document.getElementById('upgradeList');
    const mindClickArea = document.getElementById('mindClickArea');
    const rebirthBtn = document.getElementById('rebirthBtn');
    const hardResetBtn = document.getElementById('hardResetBtn');
    const saveStatus = document.getElementById('saveStatus');

    // ========== AUDIO ==========
    // Click sound
    const clickAudio = document.createElement('audio');
    clickAudio.id = 'clickSound';
    clickAudio.src = 'assets/audio/click.mp3';
    clickAudio.preload = 'auto';
    document.body.appendChild(clickAudio);

    // Rebirth sound
    const rebirthAudio = document.createElement('audio');
    rebirthAudio.id = 'rebirthSound';
    rebirthAudio.src = 'assets/audio/rebirth.mp3';
    rebirthAudio.preload = 'auto';
    document.body.appendChild(rebirthAudio);

    // Background music (loops, starts on first click)
    const bgMusic = document.createElement('audio');
    bgMusic.id = 'bgMusic';
    bgMusic.src = 'assets/audio/bg.mp3';
    bgMusic.loop = true;
    bgMusic.preload = 'auto';
    bgMusic.volume = 0.5; // comfortable background level
    document.body.appendChild(bgMusic);

    // Music control flag
    let bgMusicStarted = false;

    // Optional mute toggle button (add to DOM)
    const musicToggle = document.createElement('button');
    musicToggle.id = 'musicToggle';
    musicToggle.innerHTML = '🔊 Music';
    musicToggle.style.position = 'absolute';
    musicToggle.style.top = '20px';
    musicToggle.style.right = '30px';
    musicToggle.style.zIndex = '100';
    musicToggle.style.background = '#1f3a5f';
    musicToggle.style.color = 'white';
    musicToggle.style.border = '1px solid #4aa0ff';
    musicToggle.style.borderRadius = '40px';
    musicToggle.style.padding = '10px 20px';
    musicToggle.style.fontWeight = 'bold';
    musicToggle.style.cursor = 'pointer';
    musicToggle.style.boxShadow = '0 0 15px #2a6ebb';
    document.querySelector('.game-container').appendChild(musicToggle);

    musicToggle.addEventListener('click', () => {
        if (bgMusic.paused) {
            bgMusic.play().catch(() => {});
            musicToggle.innerHTML = '🔊 Music';
        } else {
            bgMusic.pause();
            musicToggle.innerHTML = '🔈 Music';
        }
    });

    // Load game from save
    window.loadGame();

    // Build upgrade list
    function renderUpgrades() {
        upgradeListDiv.innerHTML = '';
        window.game.upgrades.forEach(up => {
            const def = up.def;
            const cost = window.getUpgradeCost(def.id);
            const affordable = window.game.mindEnergy >= cost;

            const div = document.createElement('div');
            div.className = `upgrade-item ${affordable ? '' : 'disabled'}`;
            div.innerHTML = `
                <div class="upgrade-name">${def.icon} ${def.name} (${up.count})</div>
                <div class="upgrade-desc">${def.desc}</div>
                <div class="upgrade-cost">🔮 ${cost} Energy</div>
                <button class="upgrade-btn" data-id="${def.id}">BUY</button>
            `;
            div.querySelector('button').addEventListener('click', (e) => {
                e.stopPropagation();
                window.purchaseUpgrade(def.id);
                updateUI(); // immediate refresh
            });
            upgradeListDiv.appendChild(div);
        });
    }
    renderUpgrades();

    // Update UI numbers and states
    function updateUI() {
        mindEnergySpan.innerText = Math.floor(window.game.mindEnergy);
        epcSpan.innerText = window.game.clickPower.toFixed(1);
        rebirthCountSpan.innerText = window.game.rebirthCount;
        characterNameSpan.innerText = window.getCharacterName();

        // Update upgrade costs/disabled
        document.querySelectorAll('.upgrade-item').forEach((item, index) => {
            const up = window.game.upgrades[index];
            if (!up) return;
            const cost = window.getUpgradeCost(up.def.id);
            const affordable = window.game.mindEnergy >= cost;
            item.classList.toggle('disabled', !affordable);
            const costSpan = item.querySelector('.upgrade-cost');
            if (costSpan) costSpan.innerText = `🔮 ${cost} Energy`;
        });

        // Rebirth button condition
        rebirthBtn.disabled = window.game.mindEnergy < 10000;
    }

    // Click handler – starts background music on first click
    mindClickArea.addEventListener('click', () => {
        // Start background music on first interaction (if not already started)
        if (!bgMusicStarted) {
            bgMusic.play().then(() => {
                bgMusicStarted = true;
                musicToggle.innerHTML = '🔊 Music';
            }).catch(e => {
                // Autoplay still blocked? we ignore – user can click toggle
                console.log('Background music needs explicit play');
            });
        }

        window.clickMind();
        updateUI();
        window.saveGame();
    });

    // Rebirth
    rebirthBtn.addEventListener('click', () => {
        const success = window.rebirth();
        if (success) {
            window.recalcClickPower();
            updateUI();
        } else {
            alert('Need at least 10,000 Mind Energy');
        }
    });

    // Hard reset
    hardResetBtn.addEventListener('click', () => {
        window.hardReset();
        window.recalcClickPower();
        updateUI();
    });

    // Auto‑save every 5 seconds
    setInterval(() => {
        window.saveGame();
        saveStatus.innerText = '💾 Auto‑saved ' + new Date().toLocaleTimeString();
        setTimeout(() => { saveStatus.innerText = '💾 Auto‑saved'; }, 1500);
    }, 5000);

    // Game loop
    let last = Date.now();
    function gameLoop() {
        const now = Date.now();
        const delta = (now - last) / 1000;
        if (delta >= 0.05) {
            window.updateGameState(delta);
            updateUI();
            last = now;
        }
        requestAnimationFrame(gameLoop);
    }
    gameLoop();

    // Initial render
    updateUI();
});