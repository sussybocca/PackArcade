// Game Canvas Elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game State
let gameRunning = true;
let laps = 0;
let level = 1;
let points = 0;
let multiplier = 1;

// Runner Variables
let runner = {
    x: 100,
    y: canvas.height - 80,
    width: 40,
    height: 50,
    yVelocity: 0,
    gravity: 0.8,
    jumpPower: -12,
    isJumping: false
};

// Obstacles
let obstacles = [];
let frameCount = 0;
let obstacleSpawnRate = 80;
let baseSpeed = 5;

// Images (will be loaded from assets.js, safe to use even if null)
let runnerImage = null;
let obstacleImage = null;
let backgroundImage = null;
let imagesReady = false;

// Set images from assets.js
function setGameImages(runnerImg, obstacleImg, bgImg) {
    runnerImage = runnerImg;
    obstacleImage = obstacleImg;
    backgroundImage = bgImg;
    imagesReady = true;
    console.log("Images received by game.js");
}

// Jump Function
function jump() {
    if (!runner.isJumping && gameRunning) {
        runner.yVelocity = runner.jumpPower;
        runner.isJumping = true;
        if (window.playSound) window.playSound('jump');
    }
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

    // Spawn obstacles
    frameCount++;
    if (frameCount >= obstacleSpawnRate) {
        frameCount = 0;
        let obstacle = {
            x: canvas.width,
            y: canvas.height - 75,
            width: 35,
            height: 45,
            speed: baseSpeed + Math.floor(level / 20)
        };
        obstacles.push(obstacle);
    }

    // Update obstacles
    for (let i = 0; i < obstacles.length; i++) {
        obstacles[i].x -= obstacles[i].speed;
        
        // Collision detection
        if (runner.x < obstacles[i].x + obstacles[i].width &&
            runner.x + runner.width > obstacles[i].x &&
            runner.y + runner.height > obstacles[i].y &&
            runner.y < obstacles[i].y + obstacles[i].height) {
            gameOver();
        }
        
        // Remove off-screen obstacles
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
            i--;
        }
    }

    // Lap completion (reached right side)
    if (runner.x > canvas.width - 50) {
        completeLap();
    }
}

// Complete a Lap
function completeLap() {
    runner.x = 100;
    let lapPoints = 10 * multiplier;
    points += lapPoints;
    laps++;
    
    // Update level (every 5 laps)
    let newLevel = Math.floor(laps / 5) + 1;
    if (newLevel > level) {
        level = newLevel;
        if (window.playSound) window.playSound('levelUp');
        showMessage(`⭐ LEVEL UP! Level ${level} ⭐`);
    }
    
    updateDisplay();
    if (window.playSound) window.playSound('lapComplete');
    
    // Increase difficulty
    if (obstacleSpawnRate > 40) {
        obstacleSpawnRate = Math.max(40, obstacleSpawnRate - 1);
    }
}

// Game Over
function gameOver() {
    gameRunning = false;
    if (window.playSound) window.playSound('gameOver');
    document.getElementById('finalLaps').textContent = laps;
    document.getElementById('finalPoints').textContent = points;
    document.getElementById('gameOverlay').style.display = 'flex';
}

// Restart Game
function restartGame() {
    gameRunning = true;
    laps = 0;
    level = 1;
    points = 0;
    multiplier = parseInt(document.getElementById('multiplierValue').textContent.replace('x', '')) || 1;
    obstacles = [];
    frameCount = 0;
    obstacleSpawnRate = 80;
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
        showMessage(`✨ UPGRADED! x${multiplier} Multiplier ✨`);
        return true;
    } else if (newMultiplier <= multiplier) {
        showMessage("You already have equal or higher multiplier!");
        return false;
    } else {
        showMessage("Not enough points!");
        return false;
    }
}

// Show Temporary Message
function showMessage(msg) {
    let msgDiv = document.createElement('div');
    msgDiv.textContent = msg;
    msgDiv.style.position = 'fixed';
    msgDiv.style.top = '30%';
    msgDiv.style.left = '50%';
    msgDiv.style.transform = 'translate(-50%, -50%)';
    msgDiv.style.backgroundColor = '#ffaa44';
    msgDiv.style.color = '#1a1a2e';
    msgDiv.style.padding = '10px 20px';
    msgDiv.style.borderRadius = '50px';
    msgDiv.style.fontWeight = 'bold';
    msgDiv.style.zIndex = '1000';
    msgDiv.style.fontSize = '1.2rem';
    msgDiv.style.whiteSpace = 'nowrap';
    document.body.appendChild(msgDiv);
    
    setTimeout(() => {
        msgDiv.remove();
    }, 1500);
}

// Card Gamble Function
function gamble(betAmount) {
    if (!gameRunning) {
        showMessage("Game is over! Restart to gamble.");
        return false;
    }
    
    if (betAmount <= 0 || betAmount > points) {
        showMessage("Invalid bet amount!");
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

// Puzzle Solve Function
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
        showMessage("Game is over! Restart to solve puzzles.");
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
        points += 50;
        updateDisplay();
        resultDiv.textContent = '✅ CORRECT! +50 POINTS!';
        resultDiv.style.color = '#88ff88';
        answerInput.value = '';
        if (window.playSound) window.playSound('puzzleWin');
        
        // Remove one obstacle as bonus
        if (obstacles.length > 0) {
            obstacles.pop();
            showMessage("🧩 Puzzle solved! Obstacle removed!");
        } else {
            showMessage("🧩 +50 points! Great job!");
        }
        
        generatePuzzle(); // New puzzle for next time
        
        setTimeout(() => {
            if (document.getElementById('puzzleResult').textContent === '✅ CORRECT! +50 POINTS!') {
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

// Draw Game - SAFE VERSION (checks if images are valid)
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background (safe check)
    if (backgroundImage && backgroundImage.complete && backgroundImage.naturalWidth > 0) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    } else {
        // Gradient background fallback
        let gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#2a5f7a');
        gradient.addColorStop(1, '#1a3a4a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Ground pattern
        ctx.fillStyle = '#5a3a2a';
        for (let i = 0; i < 20; i++) {
            ctx.fillRect(i * 60, canvas.height - 35, 40, 8);
        }
    }
    
    // Draw ground
    ctx.fillStyle = '#8B5A2B';
    ctx.fillRect(0, canvas.height - 30, canvas.width, 30);
    ctx.fillStyle = '#C97E3A';
    ctx.fillRect(0, canvas.height - 35, canvas.width, 5);
    
    // Draw runner (safe check)
    if (runnerImage && runnerImage.complete && runnerImage.naturalWidth > 0) {
        ctx.drawImage(runnerImage, runner.x, runner.y, runner.width, runner.height);
    } else {
        // Martan character fallback
        ctx.fillStyle = '#FF6B6B';
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
    
    // Draw obstacles (safe check)
    for (let obs of obstacles) {
        if (obstacleImage && obstacleImage.complete && obstacleImage.naturalWidth > 0) {
            ctx.drawImage(obstacleImage, obs.x, obs.y, obs.width, obs.height);
        } else {
            ctx.fillStyle = '#AA4A2A';
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
            ctx.fillStyle = '#8A3A1A';
            ctx.fillRect(obs.x + 5, obs.y - 5, obs.width - 10, 5);
            ctx.fillStyle = '#FF6B4A';
            ctx.fillRect(obs.x + 8, obs.y + 10, 6, 20);
            ctx.fillRect(obs.x + 21, obs.y + 10, 6, 20);
        }
    }
    
    // Draw level text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px monospace';
    ctx.shadowBlur = 3;
    ctx.shadowColor = 'black';
    ctx.fillText(`LEVEL ${level}`, canvas.width - 100, 40);
    ctx.fillText(`x${multiplier}`, canvas.width - 100, 70);
    ctx.fillStyle = '#FFD966';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(`LAP ${laps}`, 20, 40);
    ctx.shadowBlur = 0;
}

// Animation Loop
function gameLoop() {
    updateGame();
    draw();
    requestAnimationFrame(gameLoop);
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

// Gambling button
document.getElementById('gambleBtn').addEventListener('click', () => {
    let bet = parseInt(document.getElementById('betAmount').value);
    if (isNaN(bet)) bet = 10;
    gamble(bet);
});

// Puzzle button
document.getElementById('solvePuzzleBtn').addEventListener('click', solvePuzzle);

// Upgrade buttons
document.querySelectorAll('.btn-upgrade').forEach(btn => {
    btn.addEventListener('click', (e) => {
        let newMultiplier = parseInt(btn.getAttribute('data-multiplier'));
        buyUpgrade(newMultiplier);
    });
});

// Initialize puzzle
generatePuzzle();

// Initialize game
updateDisplay();
gameLoop();

console.log("Game initialized - ready for your PNG and MP3 files!");
