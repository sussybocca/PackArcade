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
let scrollX = 0;

// Power-ups
let shieldFrames = 0;
let speedBoost = 1;
let boostFrames = 0;
let magnetFrames = 0;
let doublePointsFrames = 0;

// Runner Variables
let runner = {
    x: 120,
    y: canvas.height - 95,
    width: 35,
    height: 55,
    yVelocity: 0,
    gravity: 0.8,
    jumpPower: -12,
    isJumping: false,
    legAngle: 0,
    armAngle: 0,
    trail: []
};

// Dynamic obstacle types
const obstacleTypes = [
    { 
        name: "Car", 
        width: 45, 
        height: 35, 
        color1: "#4a6a8a", 
        color2: "#2a4a6a",
        yOffset: 0,
        wheels: true,
        speed: 1
    },
    { 
        name: "Truck", 
        width: 65, 
        height: 45, 
        color1: "#6a4a2a", 
        color2: "#4a2a1a",
        yOffset: -5,
        wheels: true,
        speed: 0.9
    },
    { 
        name: "Bus", 
        width: 70, 
        height: 50, 
        color1: "#aa6a4a", 
        color2: "#8a4a2a",
        yOffset: -8,
        wheels: true,
        speed: 0.85
    },
    { 
        name: "Barrier", 
        width: 30, 
        height: 55, 
        color1: "#8a6a4a", 
        color2: "#6a4a2a",
        yOffset: 0,
        wheels: false,
        speed: 1.1
    },
    { 
        name: "Construction", 
        width: 40, 
        height: 60, 
        color1: "#ca8a4a", 
        color2: "#aa6a2a",
        yOffset: -5,
        wheels: false,
        speed: 1
    },
    { 
        name: "Traffic Cone", 
        width: 25, 
        height: 40, 
        color1: "#ff6a2a", 
        color2: "#cc4a1a",
        yOffset: 0,
        wheels: false,
        speed: 1.2
    }
];

// Background buildings
let buildings = [];
for (let i = 0; i < 8; i++) {
    buildings.push({
        x: i * 120,
        width: 60 + Math.random() * 40,
        height: 80 + Math.random() * 80,
        color: `hsl(${30 + Math.random() * 20}, 40%, 30%)`,
        windows: Math.floor(3 + Math.random() * 6)
    });
}

// Obstacles and powerups
let obstacles = [];
let powerups = [];
let particles = [];
let frameCount = 0;
let obstacleSpawnRate = 50;
let baseSpeed = 5;

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
    { emoji: "🛡️", name: "SHIELD", duration: 300, color: "#44aaff", icon: "🛡️" },
    { emoji: "⚡", name: "SPEED", duration: 300, color: "#ffaa44", icon: "⚡" },
    { emoji: "🧲", name: "MAGNET", duration: 300, color: "#ff44aa", icon: "🧲" },
    { emoji: "2️⃣", name: "DOUBLE", duration: 300, color: "#88ff44", icon: "2x" }
];

// Images
let runnerImage = null;
let obstacleImage = null;
let backgroundImage = null;

function setGameImages(runnerImg, obstacleImg, bgImg) {
    runnerImage = runnerImg;
    obstacleImage = obstacleImg;
    backgroundImage = bgImg;
    console.log("Images received by game.js");
}

// Jump Function
function jump() {
    if (!runner.isJumping && gameRunning) {
        runner.yVelocity = runner.jumpPower;
        runner.isJumping = true;
        if (window.playSound) window.playSound('jump');
        addParticles(runner.x + runner.width/2, runner.y + runner.height, 8, '#FFAA44');
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
            life: 25,
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

// Draw detailed car/truck
function drawVehicle(x, y, width, height, type, color1, color2) {
    // Body
    ctx.fillStyle = color1;
    ctx.fillRect(x, y, width, height);
    
    // Roof/Roofline
    ctx.fillStyle = color2;
    ctx.fillRect(x + 5, y - 8, width - 10, 12);
    
    // Windows
    ctx.fillStyle = "#88aacc";
    ctx.fillRect(x + 8, y - 6, width - 16, 8);
    
    // Headlights
    ctx.fillStyle = "#ffcc88";
    ctx.fillRect(x + 2, y + 5, 5, 8);
    ctx.fillRect(x + width - 7, y + 5, 5, 8);
    
    // Wheels
    ctx.fillStyle = "#222";
    ctx.fillRect(x + 5, y + height - 5, 8, 8);
    ctx.fillRect(x + width - 13, y + height - 5, 8, 8);
    ctx.fillStyle = "#444";
    ctx.fillRect(x + 6, y + height - 4, 6, 6);
    ctx.fillRect(x + width - 12, y + height - 4, 6, 6);
}

// Draw detailed bus
function drawBus(x, y, width, height, color1, color2) {
    ctx.fillStyle = color1;
    ctx.fillRect(x, y, width, height);
    
    ctx.fillStyle = color2;
    ctx.fillRect(x + 5, y - 10, width - 10, 15);
    
    // Windows (multiple)
    ctx.fillStyle = "#aaddff";
    let windowWidth = (width - 20) / 4;
    for (let i = 0; i < 4; i++) {
        ctx.fillRect(x + 8 + i * windowWidth, y - 8, windowWidth - 3, 10);
    }
    
    ctx.fillStyle = "#ffcc88";
    ctx.fillRect(x + 2, y + 5, 6, 8);
    ctx.fillRect(x + width - 8, y + 5, 6, 8);
    
    ctx.fillStyle = "#222";
    ctx.fillRect(x + 8, y + height - 5, 8, 8);
    ctx.fillRect(x + width - 16, y + height - 5, 8, 8);
    ctx.fillRect(x + width/2 - 4, y + height - 5, 8, 8);
}

// Draw runner character
function drawRunner() {
    if (runnerImage && runnerImage.complete && runnerImage.naturalWidth > 0) {
        ctx.drawImage(runnerImage, runner.x, runner.y, runner.width, runner.height);
    } else {
        // Update leg swing
        runner.legAngle += 0.3;
        runner.armAngle = Math.sin(runner.legAngle) * 0.6;
        
        // Body
        ctx.fillStyle = '#FF6B6B';
        ctx.fillRect(runner.x, runner.y, runner.width, runner.height);
        
        // Head
        ctx.fillStyle = '#FFD966';
        ctx.beginPath();
        ctx.arc(runner.x + runner.width/2, runner.y - 8, 18, 0, Math.PI * 2);
        ctx.fill();
        
        // Face
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(runner.x + runner.width/2 - 6, runner.y - 12, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(runner.x + runner.width/2 + 6, runner.y - 12, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Smile
        ctx.beginPath();
        ctx.arc(runner.x + runner.width/2, runner.y - 5, 8, 0.1, Math.PI - 0.1);
        ctx.stroke();
        
        // Hair
        ctx.fillStyle = '#8B5A2B';
        ctx.fillRect(runner.x + 10, runner.y - 20, 15, 12);
        
        // Arms with swing animation
        ctx.fillStyle = '#FF6B6B';
        ctx.save();
        ctx.translate(runner.x + 5, runner.y + 15);
        ctx.rotate(runner.armAngle);
        ctx.fillRect(-3, -5, 8, 20);
        ctx.restore();
        
        ctx.save();
        ctx.translate(runner.x + runner.width - 5, runner.y + 15);
        ctx.rotate(-runner.armAngle);
        ctx.fillRect(-5, -5, 8, 20);
        ctx.restore();
        
        // Legs
        ctx.fillStyle = '#C97E3A';
        ctx.fillRect(runner.x + 8, runner.y + runner.height - 8, 8, 12);
        ctx.fillRect(runner.x + runner.width - 16, runner.y + runner.height - 8, 8, 12);
        
        // Cape
        ctx.fillStyle = '#FF44AA';
        ctx.fillRect(runner.x + runner.width - 8, runner.y + 10, 10, 30);
        
        // Trail effect
        runner.trail.push({ x: runner.x, y: runner.y, life: 10 });
        for (let i = 0; i < runner.trail.length; i++) {
            runner.trail[i].life--;
            if (runner.trail[i].life <= 0) {
                runner.trail.splice(i, 1);
                i--;
            } else {
                ctx.globalAlpha = runner.trail[i].life / 10;
                ctx.fillStyle = '#FFAA44';
                ctx.fillRect(runner.trail[i].x - 5, runner.trail[i].y, 8, 8);
            }
        }
        ctx.globalAlpha = 1;
    }
}

// Update Game Logic
function updateGame() {
    if (!gameRunning) return;
    
    // Scroll background
    scrollX += baseSpeed * speedBoost;
    
    // Apply gravity
    runner.yVelocity += runner.gravity;
    runner.y += runner.yVelocity;
    
    // Ground collision
    if (runner.y >= canvas.height - 85) {
        runner.y = canvas.height - 85;
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
    
    // Spawn obstacles - MORE FREQUENTLY
    frameCount++;
    let currentSpawnRate = Math.max(40, obstacleSpawnRate - Math.floor(level / 2));
    if (frameCount >= currentSpawnRate) {
        frameCount = 0;
        
        let type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        
        let obstacle = {
            x: canvas.width,
            y: canvas.height - 80 + type.yOffset,
            width: type.width,
            height: type.height,
            speed: (baseSpeed + Math.floor(level / 12)) * speedBoost,
            type: type,
            passed: false
        };
        obstacles.push(obstacle);
        
        // Spawn double obstacles at higher levels
        if (level > 5 && Math.random() < 0.3) {
            let type2 = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
            obstacles.push({
                x: canvas.width + 50,
                y: canvas.height - 80 + type2.yOffset,
                width: type2.width,
                height: type2.height,
                speed: (baseSpeed + Math.floor(level / 12)) * speedBoost,
                type: type2,
                passed: false
            });
        }
    }
    
    // Spawn power-ups
    if (Math.random() < 0.006 && powerups.length < 2) {
        let powerType = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
        powerups.push({
            x: canvas.width,
            y: canvas.height - 90,
            width: 28,
            height: 28,
            speed: baseSpeed + Math.floor(level / 15),
            type: powerType,
            passed: false
        });
    }
    
    // Update obstacles
    for (let i = 0; i < obstacles.length; i++) {
        obstacles[i].x -= obstacles[i].speed;
        
        // Collision detection
        let collided = runner.x < obstacles[i].x + obstacles[i].width &&
            runner.x + runner.width > obstacles[i].x &&
            runner.y + runner.height > obstacles[i].y &&
            runner.y < obstacles[i].y + obstacles[i].height;
        
        if (collided) {
            if (shieldFrames > 0) {
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
        
        // Pass obstacle - earn points
        if (!obstacles[i].passed && obstacles[i].x + obstacles[i].width < runner.x) {
            obstacles[i].passed = true;
            let pointsGained = 8 * multiplier * (doublePointsFrames > 0 ? 2 : 1);
            points += pointsGained;
            combo++;
            
            if (combo > maxCombo) maxCombo = combo;
            
            showFloatingText(`+${pointsGained}`, obstacles[i].x + obstacles[i].width/2, obstacles[i].y - 20, '#88ff88');
            
            if (combo >= 5) {
                showFloatingText(`🔥 ${combo} COMBO! 🔥`, runner.x, runner.y - 40, '#ffaa44');
                if (combo % 10 === 0) showMeme();
            }
        }
        
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
            i--;
        }
    }
    
    // Update power-ups
    for (let i = 0; i < powerups.length; i++) {
        powerups[i].x -= powerups[i].speed;
        
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
            
            addParticles(powerups[i].x + powerups[i].width/2, powerups[i].y + powerups[i].height/2, 12, power.color);
            powerups.splice(i, 1);
            i--;
            continue;
        }
        
        if (powerups[i].x + powerups[i].width < 0) {
            powerups.splice(i, 1);
            i--;
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
    
    // Lap completion (endless running - every 800px is a lap)
    if (runner.x > canvas.width - 50) {
        completeLap();
    }
}

// Complete a Lap
function completeLap() {
    runner.x = 100;
    let lapPoints = (12 + Math.floor(combo / 2)) * multiplier * (doublePointsFrames > 0 ? 2 : 1);
    points += lapPoints;
    laps++;
    
    if (combo >= 5) {
        let comboBonus = Math.floor(combo / 5) * 12;
        points += comboBonus;
        showFloatingText(`🎯 COMBO BONUS +${comboBonus}!`, runner.x, runner.y - 60, '#ffaa44');
    }
    
    combo = 0;
    
    let newLevel = Math.floor(laps / 4) + 1;
    if (newLevel > level) {
        level = newLevel;
        if (window.playSound) window.playSound('levelUp');
        showFloatingText(`⭐ LEVEL ${level}! ⭐`, canvas.width/2, 100, '#ffaa44');
        showMeme();
    }
    
    updateDisplay();
    if (window.playSound) window.playSound('lapComplete');
    addParticles(runner.x + runner.width/2, runner.y + runner.height/2, 25, '#FFD966');
    
    if (obstacleSpawnRate > 35) {
        obstacleSpawnRate = Math.max(35, obstacleSpawnRate - 1);
    }
    baseSpeed = Math.min(12, 5 + Math.floor(level / 8));
}

// Game Over
function gameOver() {
    gameRunning = false;
    if (window.playSound) window.playSound('gameOver');
    document.getElementById('finalLaps').textContent = laps;
    document.getElementById('finalPoints').textContent = Math.floor(points);
    document.getElementById('gameOverlay').style.display = 'flex';
    
    let statsDiv = document.createElement('div');
    statsDiv.innerHTML = `🔥 MAX COMBO: ${maxCombo} 🔥 | 🏃 LEVEL REACHED: ${level} 🏃`;
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
    statsDiv.style.whiteSpace = 'nowrap';
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
    obstacleSpawnRate = 50;
    baseSpeed = 5;
    shieldFrames = 0;
    boostFrames = 0;
    magnetFrames = 0;
    doublePointsFrames = 0;
    speedBoost = 1;
    runner.y = canvas.height - 85;
    runner.yVelocity = 0;
    runner.isJumping = false;
    runner.x = 100;
    runner.trail = [];
    
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
    
    // Sky gradient
    let skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, '#1a4a6a');
    skyGrad.addColorStop(1, '#2a5a7a');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw buildings
    for (let building of buildings) {
        let x = (building.x - scrollX * 0.3) % (canvas.width + building.width) - building.width;
        ctx.fillStyle = building.color;
        ctx.fillRect(x, canvas.height - building.height - 35, building.width - 10, building.height);
        
        // Windows
        ctx.fillStyle = '#ffdd99';
        let windowH = building.height / building.windows;
        for (let w = 0; w < building.windows; w++) {
            ctx.fillRect(x + 8, canvas.height - building.height - 30 + w * windowH, 8, 12);
            ctx.fillRect(x + building.width - 18, canvas.height - building.height - 30 + w * windowH, 8, 12);
        }
    }
    
    // Draw ground with asphalt effect
    ctx.fillStyle = '#3a3a4a';
    ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
    ctx.fillStyle = '#5a5a6a';
    for (let i = 0; i < 20; i++) {
        ctx.fillRect(i * 50 + (scrollX * 0.5 % 50), canvas.height - 38, 20, 3);
    }
    
    // Yellow road lines
    ctx.fillStyle = '#ffcc44';
    for (let i = 0; i < 15; i++) {
        ctx.fillRect(i * 80 + (scrollX * 0.8 % 80), canvas.height - 20, 40, 4);
    }
    
    // Draw power-ups
    for (let power of powerups) {
        ctx.fillStyle = power.type.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = power.type.color;
        ctx.fillRect(power.x, power.y, power.width, power.height);
        ctx.fillStyle = 'white';
        ctx.font = '18px monospace';
        ctx.fillText(power.type.icon, power.x + 5, power.y + 22);
    }
    
    // Draw obstacles as vehicles/objects
    for (let obs of obstacles) {
        ctx.shadowBlur = 5;
        let t = obs.type;
        if (t.name === "Bus") {
            drawBus(obs.x, obs.y, t.width, t.height, t.color1, t.color2);
        } else if (t.name === "Car") {
            drawVehicle(obs.x, obs.y, t.width, t.height, t.name, t.color1, t.color2);
        } else if (t.name === "Truck") {
            drawVehicle(obs.x, obs.y, t.width, t.height, t.name, t.color1, t.color2);
            // Truck bed
            ctx.fillStyle = "#8a6a4a";
            ctx.fillRect(obs.x + 10, obs.y - 5, 25, 12);
        } else {
            ctx.fillStyle = t.color1;
            ctx.fillRect(obs.x, obs.y, t.width, t.height);
            ctx.fillStyle = t.color2;
            ctx.fillRect(obs.x + 5, obs.y - 5, t.width - 10, 8);
            if (t.name === "Barrier") {
                ctx.fillStyle = "#ffaa44";
                for (let s = 0; s < 3; s++) {
                    ctx.fillRect(obs.x + 5 + s * 8, obs.y + 10, 4, 25);
                }
            }
        }
    }
    
    // Draw runner with shield effect
    if (shieldFrames > 0 && (Math.floor(Date.now() / 100) % 2 === 0)) {
        ctx.strokeStyle = '#44aaff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(runner.x + runner.width/2, runner.y + runner.height/2, 35, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    drawRunner();
    
    // Draw particles
    for (let p of particles) {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    
    // Draw status icons
    ctx.shadowBlur = 0;
    let statusY = 80;
    if (shieldFrames > 0) {
        ctx.fillStyle = '#44aaff';
        ctx.font = '14px monospace';
        ctx.fillText(`🛡️ SHIELD ${Math.floor(shieldFrames / 60)}s`, 20, statusY);
        statusY += 22;
    }
    if (boostFrames > 0) {
        ctx.fillStyle = '#ffaa44';
        ctx.fillText(`⚡ SPEED ${Math.floor(boostFrames / 60)}s`, 20, statusY);
        statusY += 22;
    }
    if (doublePointsFrames > 0) {
        ctx.fillStyle = '#88ff44';
        ctx.fillText(`2️⃣ 2X ${Math.floor(doublePointsFrames / 60)}s`, 20, statusY);
        statusY += 22;
    }
    
    // Draw combo meter
    if (combo >= 3) {
        ctx.fillStyle = '#ffaa44';
        ctx.font = 'bold 20px monospace';
        ctx.shadowBlur = 3;
        ctx.fillText(`🔥 ${combo} COMBO! 🔥`, runner.x - 35, runner.y - 25);
    }
    
    // Draw stats
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px monospace';
    ctx.shadowBlur = 3;
    ctx.fillText(`LEVEL ${level}`, canvas.width - 110, 40);
    ctx.fillStyle = '#FFD966';
    ctx.font = '14px monospace';
    ctx.fillText(`🏃 LAP ${laps}`, 15, 35);
    ctx.fillText(`💯 BEST: ${maxCombo}`, 15, 55);
    ctx.shadowBlur = 0;
}

// Add CSS animations
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

// Gamble Function
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

// Puzzle Function
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

// Make sure DOM elements exist before adding listeners
if (document.getElementById('restartBtn')) {
    document.getElementById('restartBtn').addEventListener('click', restartGame);
}
if (document.getElementById('gambleBtn')) {
    document.getElementById('gambleBtn').addEventListener('click', () => {
        let bet = parseInt(document.getElementById('betAmount').value);
        if (isNaN(bet)) bet = 10;
        gamble(bet);
    });
}
if (document.getElementById('solvePuzzleBtn')) {
    document.getElementById('solvePuzzleBtn').addEventListener('click', solvePuzzle);
}

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

console.log("🔥 EPIC ENDLESS RUNNER INITIALIZED! Cars, trucks, buildings, and dynamic objects! 🔥");
