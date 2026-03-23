// Game Canvas Elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game State
let gameRunning = true;
let laps = 0;
let level = 1;
let points = 0;
let multiplier = 1;
let combo = 0;
let maxCombo = 0;

// Power-ups
let hasShield = false;
let shieldFrames = 0;
let speedBoost = 1;
let boostFrames = 0;
let magnetFrames = 0;
let doublePointsFrames = 0;

// Runner Variables
let runner = {
    x: 100,
    y: canvas.height - 80,
    width: 40,
    height: 50,
    yVelocity: 0,
    gravity: 0.8,
    jumpPower: -12,
    isJumping: false,
    color: '#FF6B6B'
};

// Obstacles with different types
let obstacles = [];
let powerups = [];
let frameCount = 0;
let obstacleSpawnRate = 55; // MORE OBSTACLES - was 80, now 55
let baseSpeed = 6; // FASTER - was 5, now 6
let scoreMultiplier = 1;

// Meme messages
const memes = [
    "😂 BRUH MOMENT", "🤣 LMAO", "💀 SKIBIDI", "🗿 CHAD RUN", 
    "😎 SIGMA GRIND", "🤡 YOU FELL OFF", "🔥 STRAIGHT FIRE", 
    "💪 GIGACHAD", "🥶 COLD AF", "✨ MAIN CHARACTER", 
    "🍿 W MOVIE", "🎮 GAMER MOMENT", "🤝 SUS", "🗣️ BET",
    "💀 RIZZ GOD", "😭 NO CAP", "🧢 FAKE NEWS", "🤓 ACKSHUALLY"
];

// Power-up types
const powerupTypes = [
    { emoji: "🛡️", name: "SHIELD", duration: 300, color: "#44aaff" },
    { emoji: "⚡", name: "SPEED", duration: 300, color: "#ffaa44" },
    { emoji: "🧲", name: "MAGNET", duration: 300, color: "#ff44aa" },
    { emoji: "2️⃣", name: "DOUBLE", duration: 300, color: "#88ff44" }
];

// Images
let runnerImage = null;
let obstacleImage = null;
let backgroundImage = null;
let imagesReady = false;

// Particle effects
let particles = [];

function setGameImages(runnerImg, obstacleImg, bgImg) {
    runnerImage = runnerImg;
    obstacleImage = obstacleImg;
    backgroundImage = bgImg;
    imagesReady = true;
}

// Jump Function
function jump() {
    if (!runner.isJumping && gameRunning) {
        runner.yVelocity = runner.jumpPower;
        runner.isJumping = true;
        if (window.playSound) window.playSound('jump');
        addParticles(runner.x + runner.width/2, runner.y + runner.height, 5, '#FFAA44');
    }
}

// Add particle effect
function addParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4 - 2,
            life: 20,
            color: color,
            size: Math.random() * 3 + 2
        });
    }
}

// Show random meme
function showMeme() {
    let meme = memes[Math.floor(Math.random() * memes.length)];
    let memeDiv = document.createElement('div');
    memeDiv.textContent = meme;
    memeDiv.style.position = 'fixed';
    memeDiv.style.top = Math.random() * 60 + 20 + '%';
    memeDiv.style.left = Math.random() * 60 + 20 + '%';
    memeDiv.style.backgroundColor = '#000000aa';
    memeDiv.style.color = '#ffaa44';
    memeDiv.style.padding = '8px 16px';
    memeDiv.style.borderRadius = '50px';
    memeDiv.style.fontWeight = 'bold';
    memeDiv.style.zIndex = '1000';
    memeDiv.style.fontSize = '1.1rem';
    memeDiv.style.fontFamily = 'monospace';
    memeDiv.style.whiteSpace = 'nowrap';
    memeDiv.style.animation = 'fadeOut 1s ease-out forwards';
    document.body.appendChild(memeDiv);
    
    setTimeout(() => memeDiv.remove(), 1000);
}

// Update Game Logic
function updateGame() {
    if (!gameRunning) return;

    // Apply gravity
    runner.yVelocity += runner.gravity;
    runner.y += runner.yVelocity;

    // Ground collision
    if (runner.y >= canvas.height - 80) {
        runner.y = canvas.height - 80;
        runner.isJumping = false;
        runner.yVelocity = 0;
    }

    // Ceiling collision
    if (runner.y <= 0) {
        runner.y = 0;
        if (runner.yVelocity < 0) runner.yVelocity = 0;
    }
    
    // Update power-up timers
    if (shieldFrames > 0) shieldFrames--;
    if (boostFrames > 0) {
        boostFrames--;
        speedBoost = 1.5;
    } else {
        speedBoost = 1;
    }
    if (magnetFrames > 0) magnetFrames--;
    if (doublePointsFrames > 0) doublePointsFrames--;
    
    // Spawn obstacles MORE FREQUENTLY
    frameCount++;
    let currentSpawnRate = Math.max(35, obstacleSpawnRate - Math.floor(level / 3));
    if (frameCount >= currentSpawnRate) {
        frameCount = 0;
        
        // Multiple obstacle types with different sizes and behaviors
        let obstacleTypes = [
            { width: 35, height: 45, color: '#AA4A2A', yOffset: 0 },
            { width: 50, height: 30, color: '#8A5A3A', yOffset: 10 },
            { width: 40, height: 60, color: '#CC6A4A', yOffset: -8 },
            { width: 30, height: 40, color: '#AA6A4A', yOffset: 5 },
            { width: 45, height: 35, color: '#5A8A6A', yOffset: 0 },
            { width: 55, height: 40, color: '#8A5A8A', yOffset: 5 }
        ];
        
        let type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        
        let obstacle = {
            x: canvas.width,
            y: canvas.height - 75 + type.yOffset,
            width: type.width,
            height: type.height,
            speed: (baseSpeed + Math.floor(level / 15)) * speedBoost,
            color: type.color,
            passed: false
        };
        obstacles.push(obstacle);
        
        // Sometimes spawn two obstacles at once for extra challenge
        if (level > 3 && Math.random() < 0.3) {
            let type2 = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
            obstacles.push({
                x: canvas.width + 40,
                y: canvas.height - 75 + type2.yOffset,
                width: type2.width,
                height: type2.height,
                speed: (baseSpeed + Math.floor(level / 15)) * speedBoost,
                color: type2.color,
                passed: false
            });
        }
    }
    
    // Spawn power-ups
    if (Math.random() < 0.008 && powerups.length < 2) {
        let powerType = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
        powerups.push({
            x: canvas.width,
            y: canvas.height - 90,
            width: 30,
            height: 30,
            speed: baseSpeed + Math.floor(level / 15),
            type: powerType,
            passed: false
        });
    }
    
    // Update obstacles
    for (let i = 0; i < obstacles.length; i++) {
        obstacles[i].x -= obstacles[i].speed;
        
        // Collision detection with shield
        let collided = runner.x < obstacles[i].x + obstacles[i].width &&
            runner.x + runner.width > obstacles[i].x &&
            runner.y + runner.height > obstacles[i].y &&
            runner.y < obstacles[i].y + obstacles[i].height;
        
        if (collided) {
            if (shieldFrames > 0) {
                // Shield blocks obstacle
                obstacles.splice(i, 1);
                addParticles(runner.x + runner.width/2, runner.y + runner.height/2, 15, '#44aaff');
                showMeme();
                i--;
                continue;
            } else {
                gameOver();
                return;
            }
        }
        
        // Pass obstacle points
        if (!obstacles[i].passed && obstacles[i].x + obstacles[i].width < runner.x) {
            obstacles[i].passed = true;
            let pointsGained = 5 * multiplier * (doublePointsFrames > 0 ? 2 : 1);
            points += pointsGained;
            combo++;
            
            if (combo > maxCombo) maxCombo = combo;
            
            // Show combo text
            showFloatingText(`+${pointsGained}`, obstacles[i].x + obstacles[i].width/2, obstacles[i].y - 20, '#88ff88');
            
            if (combo >= 5) {
                showFloatingText(`🔥 ${combo} COMBO! 🔥`, runner.x, runner.y - 40, '#ffaa44');
                if (combo % 10 === 0) showMeme();
            }
        }
        
        // Remove off-screen obstacles
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
            i--;
        }
    }
    
    // Update power-ups
    for (let i = 0; i < powerups.length; i++) {
        powerups[i].x -= powerups[i].speed;
        
        // Collect power-up
        if (runner.x < powerups[i].x + powerups[i].width &&
            runner.x + runner.width > powerups[i].x &&
            runner.y + runner.height > powerups[i].y &&
            runner.y < powerups[i].y + powerups[i].height) {
            
            let power = powerups[i].type;
            if (window.playSound) window.playSound('powerup');
            
            switch(power.name) {
                case "SHIELD":
                    shieldFrames = 300;
                    showFloatingText("🛡️ SHIELD ACTIVE!", runner.x, runner.y - 40, '#44aaff');
                    break;
                case "SPEED":
                    boostFrames = 300;
                    showFloatingText("⚡ SPEED BOOST!", runner.x, runner.y - 40, '#ffaa44');
                    break;
                case "MAGNET":
                    magnetFrames = 300;
                    showFloatingText("🧲 MAGNET ACTIVE!", runner.x, runner.y - 40, '#ff44aa');
                    break;
                case "DOUBLE":
                    doublePointsFrames = 300;
                    showFloatingText("2️⃣ DOUBLE POINTS!", runner.x, runner.y - 40, '#88ff44');
                    break;
            }
            
            addParticles(powerups[i].x + powerups[i].width/2, powerups[i].y + powerups[i].height/2, 10, power.color);
            powerups.splice(i, 1);
            i--;
            continue;
        }
        
        // Remove off-screen power-ups
        if (powerups[i].x + powerups[i].width < 0) {
            powerups.splice(i, 1);
            i--;
        }
    }
    
    // Magnet effect - pull points from obstacles
    if (magnetFrames > 0) {
        for (let obs of obstacles) {
            if (!obs.passed && obs.x + obs.width < runner.x + 100 && obs.x + obs.width > runner.x - 50) {
                addParticles(obs.x + obs.width/2, obs.y + obs.height/2, 2, '#ff44aa');
            }
        }
    }
    
    // Update particles
    for (let i = 0; i < particles.length; i++) {
        particles[i].x += particles[i].vx;
        particles[i].y += particles[i].vy;
        particles[i].life--;
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
            i--;
        }
    }
    
    // Lap completion
    if (runner.x > canvas.width - 50) {
        completeLap();
    }
}

// Complete a Lap
function completeLap() {
    runner.x = 100;
    let lapPoints = (10 + Math.floor(combo / 2)) * multiplier * (doublePointsFrames > 0 ? 2 : 1);
    points += lapPoints;
    laps++;
    
    // Combo bonus
    if (combo >= 5) {
        let comboBonus = Math.floor(combo / 5) * 10;
        points += comboBonus;
        showFloatingText(`🎯 COMBO BONUS +${comboBonus}!`, runner.x, runner.y - 60, '#ffaa44');
    }
    
    // Reset combo
    combo = 0;
    
    // Update level (every 5 laps)
    let newLevel = Math.floor(laps / 5) + 1;
    if (newLevel > level) {
        level = newLevel;
        if (window.playSound) window.playSound('levelUp');
        showFloatingText(`⭐ LEVEL ${level}! ⭐`, canvas.width/2, 100, '#ffaa44');
        showMeme();
    }
    
    updateDisplay();
    if (window.playSound) window.playSound('lapComplete');
    addParticles(runner.x + runner.width/2, runner.y + runner.height/2, 20, '#FFD966');
    
    // Increase difficulty
    if (obstacleSpawnRate > 35) {
        obstacleSpawnRate = Math.max(35, obstacleSpawnRate - 1);
    }
}

// Game Over
function gameOver() {
    gameRunning = false;
    if (window.playSound) window.playSound('gameOver');
    document.getElementById('finalLaps').textContent = laps;
    document.getElementById('finalPoints').textContent = Math.floor(points);
    document.getElementById('gameOverlay').style.display = 'flex';
    
    // Show stats
    let statsDiv = document.createElement('div');
    statsDiv.innerHTML = `🔥 MAX COMBO: ${maxCombo} 🔥`;
    statsDiv.style.position = 'fixed';
    statsDiv.style.bottom = '30%';
    statsDiv.style.left = '50%';
    statsDiv.style.transform = 'translateX(-50%)';
    statsDiv.style.backgroundColor = '#ffaa44';
    statsDiv.style.color = '#1a1a2e';
    statsDiv.style.padding = '10px 20px';
    statsDiv.style.borderRadius = '50px';
    statsDiv.style.fontWeight = 'bold';
    statsDiv.style.zIndex = '1001';
    statsDiv.style.fontSize = '1rem';
    document.body.appendChild(statsDiv);
    setTimeout(() => statsDiv.remove(), 3000);
}

// Restart Game
function restartGame() {
    gameRunning = true;
    laps = 0;
    level = 1;
    points = 0;
    multiplier = parseInt(document.getElementById('multiplierValue').textContent.replace('x', '')) || 1;
    combo = 0;
    maxCombo = 0;
    obstacles = [];
    powerups = [];
    particles = [];
    frameCount = 0;
    obstacleSpawnRate = 55;
    shieldFrames = 0;
    boostFrames = 0;
    magnetFrames = 0;
    doublePointsFrames = 0;
    speedBoost = 1;
    runner.y = canvas.height - 80;
    runner.yVelocity = 0;
    runner.isJumping = false;
    runner.x = 100;
    
    updateDisplay();
    document.getElementById('gameOverlay').style.display = 'none';
    if (window.playSound) window.playSound('start');
}

// Update UI Display
function updateDisplay() {
    document.getElementById('lapsValue').textContent = laps;
    document.getElementById('levelValue').textContent = level;
    document.getElementById('pointsValue').textContent = Math.floor(points);
    document.getElementById('multiplierValue').textContent = `x${multiplier}`;
}

// Show floating text
function showFloatingText(text, x, y, color) {
    let textDiv = document.createElement('div');
    textDiv.textContent = text;
    textDiv.style.position = 'absolute';
    textDiv.style.left = (canvas.getBoundingClientRect().left + x) + 'px';
    textDiv.style.top = (canvas.getBoundingClientRect().top + y) + 'px';
    textDiv.style.color = color;
    textDiv.style.fontWeight = 'bold';
    textDiv.style.fontSize = '1.2rem';
    textDiv.style.fontFamily = 'monospace';
    textDiv.style.textShadow = '1px 1px 0px black';
    textDiv.style.pointerEvents = 'none';
    textDiv.style.zIndex = '1000';
    textDiv.style.animation = 'floatUp 0.8s ease-out forwards';
    document.body.appendChild(textDiv);
    
    setTimeout(() => textDiv.remove(), 800);
}

// Buy Upgrade
function buyUpgrade(newMultiplier) {
    let cost = 0;
    if (newMultiplier === 2) cost = 100;
    else if (newMultiplier === 4) cost = 250;
    else if (newMultiplier === 6) cost = 500;
    else if (newMultiplier === 8) cost = 1000;
    else if (newMultiplier === 10) cost = 2000;
    
    if (points >= cost && newMultiplier > multiplier) {
        points -= cost;
        multiplier = newMultiplier;
        updateDisplay();
        if (window.playSound) window.playSound('upgrade');
        showFloatingText(`✨ x${multiplier} MULTIPLIER! ✨`, canvas.width/2, 100, '#ffaa44');
        return true;
    } else if (newMultiplier <= multiplier) {
        showFloatingText("Already have higher!", canvas.width/2, 100, '#ff8888');
        return false;
    } else {
        showFloatingText("Not enough points!", canvas.width/2, 100, '#ff8888');
        return false;
    }
}

// Draw Game
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    if (backgroundImage && backgroundImage.complete && backgroundImage.naturalWidth > 0) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    } else {
        let gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#1a3a5a');
        gradient.addColorStop(1, '#0a2a3a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Draw ground with gradient
    let groundGrad = ctx.createLinearGradient(0, canvas.height - 35, 0, canvas.height);
    groundGrad.addColorStop(0, '#8B5A2B');
    groundGrad.addColorStop(1, '#5A3A1A');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, canvas.height - 35, canvas.width, 35);
    
    // Draw ground details
    ctx.fillStyle = '#C97E3A';
    for (let i = 0; i < 30; i++) {
        ctx.fillRect(i * 40 + (Date.now() * 0.005 % 40), canvas.height - 38, 15, 5);
    }
    
    // Draw power-ups
    for (let power of powerups) {
        ctx.fillStyle = power.type.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = power.type.color;
        ctx.fillRect(power.x, power.y, power.width, power.height);
        ctx.fillStyle = 'white';
        ctx.font = '20px monospace';
        ctx.fillText(power.type.emoji, power.x + 5, power.y + 25);
    }
    
    // Draw obstacles with glow
    for (let obs of obstacles) {
        if (obstacleImage && obstacleImage.complete && obstacleImage.naturalWidth > 0) {
            ctx.drawImage(obstacleImage, obs.x, obs.y, obs.width, obs.height);
        } else {
            ctx.shadowBlur = 5;
            ctx.shadowColor = '#000000';
            ctx.fillStyle = obs.color;
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
            ctx.fillStyle = '#FF6B4A';
            ctx.fillRect(obs.x + 8, obs.y + 10, 6, 20);
            ctx.fillRect(obs.x + obs.width - 14, obs.y + 10, 6, 20);
        }
    }
    
    // Draw runner with shield effect
    if (shieldFrames > 0 && (Math.floor(Date.now() / 100) % 2 === 0)) {
        ctx.strokeStyle = '#44aaff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(runner.x + runner.width/2, runner.y + runner.height/2, 30, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    if (runnerImage && runnerImage.complete && runnerImage.naturalWidth > 0) {
        ctx.drawImage(runnerImage, runner.x, runner.y, runner.width, runner.height);
    } else {
        ctx.fillStyle = runner.color;
        ctx.fillRect(runner.x, runner.y, runner.width, runner.height);
        ctx.fillStyle = '#FFE66D';
        ctx.fillRect(runner.x + 5, runner.y - 8, 30, 8);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(runner.x + 8, runner.y + 10, 8, 8);
        ctx.fillRect(runner.x + 24, runner.y + 10, 8, 8);
        ctx.fillStyle = '#000000';
        ctx.fillRect(runner.x + 10, runner.y + 12, 4, 4);
        ctx.fillRect(runner.x + 26, runner.y + 12, 4, 4);
    }
    
    // Draw particles
    for (let p of particles) {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    
    // Draw power-up status icons
    ctx.shadowBlur = 0;
    let statusY = 80;
    if (shieldFrames > 0) {
        ctx.fillStyle = '#44aaff';
        ctx.font = '16px monospace';
        ctx.fillText(`🛡️ SHIELD ${Math.floor(shieldFrames / 60)}s`, 20, statusY);
        statusY += 25;
    }
    if (boostFrames > 0) {
        ctx.fillStyle = '#ffaa44';
        ctx.fillText(`⚡ SPEED ${Math.floor(boostFrames / 60)}s`, 20, statusY);
        statusY += 25;
    }
    if (doublePointsFrames > 0) {
        ctx.fillStyle = '#88ff44';
        ctx.fillText(`2️⃣ 2X POINTS ${Math.floor(doublePointsFrames / 60)}s`, 20, statusY);
        statusY += 25;
    }
    
    // Draw combo meter
    if (combo >= 3) {
        ctx.fillStyle = '#ffaa44';
        ctx.font = 'bold 20px monospace';
        ctx.fillText(`🔥 ${combo} COMBO! 🔥`, runner.x - 30, runner.y - 20);
    }
    
    // Draw level and stats
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px monospace';
    ctx.shadowBlur = 3;
    ctx.fillText(`LEVEL ${level}`, canvas.width - 110, 40);
    ctx.fillText(`x${multiplier}`, canvas.width - 110, 70);
    ctx.fillStyle = '#FFD966';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(`🏃 LAP ${laps}`, 20, 40);
    ctx.fillText(`💯 BEST: ${maxCombo}`, 20, 65);
    ctx.shadowBlur = 0;
}

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
    @keyframes floatUp {
        0% { opacity: 1; transform: translateY(0px); }
        100% { opacity: 0; transform: translateY(-40px); }
    }
    @keyframes fadeOut {
        0% { opacity: 1; }
        100% { opacity: 0; }
    }
`;
document.head.appendChild(style);

// Gamble Function (kept from original)
function gamble(betAmount) {
    if (!gameRunning) {
        showFloatingText("Game over! Restart first!", canvas.width/2, 100, '#ff8888');
        return false;
    }
    if (betAmount <= 0 || betAmount > points) {
        showFloatingText("Invalid bet!", canvas.width/2, 100, '#ff8888');
        return false;
    }
    
    let win = Math.random() < 0.5;
    let cardLeft = document.getElementById('cardLeft');
    let cardRight = document.getElementById('cardRight');
    let resultDiv = document.getElementById('gambleResult');
    
    if (win) {
        points += betAmount;
        cardLeft.textContent = '🎉';
        cardRight.textContent = 'WIN';
        resultDiv.textContent = `🎉 YOU WON +${betAmount} POINTS! 🎉`;
        resultDiv.style.color = '#88ff88';
        if (window.playSound) window.playSound('win');
        showMeme();
    } else {
        points -= betAmount;
        cardLeft.textContent = '💀';
        cardRight.textContent = 'LOSE';
        resultDiv.textContent = `💀 YOU LOST -${betAmount} POINTS! 💀`;
        resultDiv.style.color = '#ff8888';
        if (window.playSound) window.playSound('lose');
    }
    
    updateDisplay();
    setTimeout(() => {
        cardLeft.textContent = '?';
        cardRight.textContent = '?';
        resultDiv.textContent = '';
    }, 1500);
    return win;
}

// Puzzle Function (kept from original)
let currentPuzzleAnswer = 0;
let currentPuzzleQuestion = "";

function generatePuzzle() {
    let num1 = Math.floor(Math.random() * 20) + 1;
    let num2 = Math.floor(Math.random() * 20) + 1;
    let operators = ['+', '-', '*'];
    let operator = operators[Math.floor(Math.random() * 3)];
    let answer;
    if (operator === '+') answer = num1 + num2;
    else if (operator === '-') answer = num1 - num2;
    else answer = num1 * num2;
    currentPuzzleAnswer = answer;
    currentPuzzleQuestion = `${num1} ${operator} ${num2} = ?`;
    document.getElementById('puzzleQuestion').textContent = currentPuzzleQuestion;
}

function solvePuzzle() {
    if (!gameRunning) {
        showFloatingText("Game over!", canvas.width/2, 100, '#ff8888');
        return false;
    }
    let answerInput = document.getElementById('puzzleAnswer');
    let userAnswer = parseInt(answerInput.value);
    let resultDiv = document.getElementById('puzzleResult');
    
    if (isNaN(userAnswer)) {
        resultDiv.textContent = '❌ Enter a number!';
        resultDiv.style.color = '#ff8888';
        setTimeout(() => resultDiv.textContent = '', 1500);
        return false;
    }
    
    if (userAnswer === currentPuzzleAnswer) {
        let puzzlePoints = 50 * (doublePointsFrames > 0 ? 2 : 1);
        points += puzzlePoints;
        updateDisplay();
        resultDiv.textContent = '✅ CORRECT! +' + puzzlePoints + ' POINTS!';
        resultDiv.style.color = '#88ff88';
        answerInput.value = '';
        if (window.playSound) window.playSound('puzzleWin');
        
        if (obstacles.length > 0) {
            obstacles.pop();
            showFloatingText("🧩 Obstacle removed!", canvas.width/2, 100, '#88ff88');
        }
        generatePuzzle();
        showMeme();
        
        setTimeout(() => {
            if (document.getElementById('puzzleResult').textContent === '✅ CORRECT! +' + puzzlePoints + ' POINTS!') {
                resultDiv.textContent = '';
            }
        }, 2000);
        return true;
    } else {
        if (window.playSound) window.playSound('puzzleFail');
        resultDiv.textContent = `❌ WRONG! ${currentPuzzleQuestion}`;
        resultDiv.style.color = '#ff8888';
        setTimeout(() => resultDiv.textContent = '', 2000);
        return false;
    }
}

// Event Listeners
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && gameRunning) {
        e.preventDefault();
        jump();
    }
});

canvas.addEventListener('click', () => {
    if (gameRunning) jump();
});

document.getElementById('restartBtn').addEventListener('click', restartGame);
document.getElementById('gambleBtn').addEventListener('click', () => {
    let bet = parseInt(document.getElementById('betAmount').value);
    if (isNaN(bet)) bet = 10;
    gamble(bet);
});
document.getElementById('solvePuzzleBtn').addEventListener('click', solvePuzzle);

document.querySelectorAll('.btn-upgrade').forEach(btn => {
    btn.addEventListener('click', (e) => {
        let newMultiplier = parseInt(btn.getAttribute('data-multiplier'));
        buyUpgrade(newMultiplier);
    });
});

// Initialize
generatePuzzle();
updateDisplay();
gameLoop();

console.log("🔥 EPIC 2D GAME INITIALIZED! More obstacles, power-ups, memes, and combos! 🔥");
