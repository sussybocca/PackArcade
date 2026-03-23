// Three.js 3D Game Variables
let scene, camera, renderer;
let runner3D, obstacles3D = [];
let ground;
let lanePositions = [-2, 0, 2];
let currentLane = 1;
let targetLane = 1;
let laneSwitchSpeed = 0.2;
let gameRunning = true;
let lastTime = 0;
let obstacleSpawnTimer = 0;
let obstacleSpawnDelay = 1.2; // seconds
let baseSpeed = 8;
let scrollOffset = 0;

// Game State
let laps = 0;
let level = 1;
let points = 0;
let multiplier = 1;
let obstaclesPassed = 0; // Count obstacles passed for lap system

// Initialize Three.js
function initThreeJS() {
    // Get the canvas container
    const container = document.getElementById('gameCanvas');
    const canvas = document.getElementById('gameCanvas');
    
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1030);
    scene.fog = new THREE.FogExp2(0x0a1030, 0.008);
    
    // Create camera
    camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    camera.position.set(0, 4, 12);
    camera.lookAt(0, 1, 0);
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.shadowMap.enabled = true;
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404060);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    directionalLight.receiveShadow = true;
    scene.add(directionalLight);
    
    const backLight = new THREE.PointLight(0x4466ff, 0.5);
    backLight.position.set(0, 3, -5);
    scene.add(backLight);
    
    const fillLight = new THREE.PointLight(0xffaa66, 0.3);
    fillLight.position.set(3, 2, 4);
    scene.add(fillLight);
    
    // Create ground with grid
    const gridHelper = new THREE.GridHelper(200, 40, 0xffaa44, 0x336699);
    gridHelper.position.y = -1.5;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.5;
    scene.add(gridHelper);
    
    // Ground plane
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x2a4a6a, roughness: 0.8, metalness: 0.1 });
    const groundPlane = new THREE.Mesh(new THREE.PlaneGeometry(200, 20), groundMat);
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.position.y = -1.5;
    groundPlane.receiveShadow = true;
    scene.add(groundPlane);
    
    // Lane markers
    const laneMat = new THREE.MeshStandardMaterial({ color: 0xffaa66, emissive: 0x442200 });
    for (let i = -1; i <= 1; i++) {
        const marker = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 1), laneMat);
        marker.position.set(i * 2, -1.2, 0);
        marker.receiveShadow = true;
        scene.add(marker);
    }
    
    // Create runner (Martan character)
    const runnerGroup = new THREE.Group();
    
    // Body
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xff6b6b, emissive: 0x331100 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1, 0.6), bodyMat);
    body.castShadow = true;
    body.receiveShadow = true;
    body.position.y = 0.5;
    runnerGroup.add(body);
    
    // Head
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffaa88 });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.45, 32, 32), headMat);
    head.castShadow = true;
    head.position.y = 1.1;
    runnerGroup.add(head);
    
    // Eyes
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.12, 32, 32), eyeMat);
    leftEye.position.set(-0.2, 1.25, 0.45);
    runnerGroup.add(leftEye);
    
    const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.12, 32, 32), eyeMat);
    rightEye.position.set(0.2, 1.25, 0.45);
    runnerGroup.add(rightEye);
    
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const leftPupil = new THREE.Mesh(new THREE.SphereGeometry(0.07, 32, 32), pupilMat);
    leftPupil.position.set(-0.2, 1.23, 0.57);
    runnerGroup.add(leftPupil);
    
    const rightPupil = new THREE.Mesh(new THREE.SphereGeometry(0.07, 32, 32), pupilMat);
    rightPupil.position.set(0.2, 1.23, 0.57);
    runnerGroup.add(rightPupil);
    
    // Cape/Scarf
    const capeMat = new THREE.MeshStandardMaterial({ color: 0xff44aa });
    const cape = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.2), capeMat);
    cape.position.set(0, 0.7, -0.4);
    cape.castShadow = true;
    runnerGroup.add(cape);
    
    // Arms
    const armMat = new THREE.MeshStandardMaterial({ color: 0xff6b6b });
    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.2, 0.25), armMat);
    leftArm.position.set(-0.55, 0.85, 0);
    leftArm.castShadow = true;
    runnerGroup.add(leftArm);
    
    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.2, 0.25), armMat);
    rightArm.position.set(0.55, 0.85, 0);
    rightArm.castShadow = true;
    runnerGroup.add(rightArm);
    
    runnerGroup.position.set(0, -1, 3);
    runnerGroup.castShadow = true;
    scene.add(runnerGroup);
    runner3D = runnerGroup;
    
    // Add floating particles
    const particleCount = 300;
    const particles = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
        particlePositions[i * 3] = (Math.random() - 0.5) * 100;
        particlePositions[i * 3 + 1] = Math.random() * 8;
        particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 50 - 20;
    }
    particles.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({ color: 0x88aaff, size: 0.08 });
    const particleSystem = new THREE.Points(particles, particleMat);
    scene.add(particleSystem);
    
    // Animation variables
    let armSwing = 0;
    let jumpOffset = 0;
    let jumpVelocity = 0;
    let isJumping = false;
    
    // Obstacle types
    const obstacleTypes = [
        { color: 0xaa4a2a, height: 1.2, width: 0.8 },
        { color: 0x8a5a3a, height: 1.5, width: 0.7 },
        { color: 0xcc6a4a, height: 1, width: 1 },
        { color: 0xaa6a4a, height: 0.8, width: 1.2 }
    ];
    
    // Spawn obstacle function
    function spawnObstacle() {
        const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        const lane = Math.floor(Math.random() * 3);
        const obstacleMat = new THREE.MeshStandardMaterial({ color: type.color, roughness: 0.4, metalness: 0.1 });
        const obstacle = new THREE.Mesh(new THREE.BoxGeometry(type.width, type.height, type.width), obstacleMat);
        obstacle.castShadow = true;
        obstacle.receiveShadow = true;
        obstacle.userData = {
            lane: lane,
            passed: false,
            width: type.width,
            height: type.height
        };
        obstacle.position.set(lanePositions[lane], -1 + type.height / 2, 20);
        scene.add(obstacle);
        obstacles3D.push(obstacle);
    }
    
    // Jump function
    window.jump3D = function() {
        if (!isJumping && gameRunning) {
            jumpVelocity = 0.35;
            isJumping = true;
            if (window.playSound) window.playSound('jump');
        }
    };
    
    // Lane switching
    window.switchLane = function(direction) {
        if (!gameRunning) return;
        targetLane = Math.max(0, Math.min(2, targetLane + direction));
    };
    
    // Update game logic
    function updateGame3D(deltaTime) {
        if (!gameRunning) return;
        
        // Handle jumping
        if (isJumping) {
            jumpOffset += jumpVelocity;
            jumpVelocity -= deltaTime * 12;
            if (jumpOffset <= 0) {
                jumpOffset = 0;
                isJumping = false;
                jumpVelocity = 0;
            }
            runner3D.position.y = -1 + jumpOffset * 1.5;
        } else {
            runner3D.position.y = -1;
        }
        
        // Smooth lane switching
        const targetX = lanePositions[targetLane];
        runner3D.position.x += (targetX - runner3D.position.x) * 0.2;
        
        // Arm swing animation
        armSwing += deltaTime * 12;
        const leftArm = runner3D.children.find(c => c.position.x === -0.55);
        const rightArm = runner3D.children.find(c => c.position.x === 0.55);
        if (leftArm && rightArm) {
            leftArm.rotation.z = Math.sin(armSwing) * 0.5;
            rightArm.rotation.z = -Math.sin(armSwing) * 0.5;
        }
        
        // Spawn obstacles
        obstacleSpawnTimer -= deltaTime;
        if (obstacleSpawnTimer <= 0) {
            let spawnDelay = Math.max(0.6, obstacleSpawnDelay - (level * 0.02));
            obstacleSpawnTimer = spawnDelay;
            spawnObstacle();
        }
        
        // Update obstacles and check collisions
        for (let i = 0; i < obstacles3D.length; i++) {
            const obs = obstacles3D[i];
            obs.position.z -= baseSpeed * deltaTime;
            
            // Check if obstacle passed the runner
            if (!obs.userData.passed && obs.position.z < 1) {
                obs.userData.passed = true;
                obstaclesPassed++;
                
                // Every 10 obstacles passed = 1 lap
                if (obstaclesPassed >= 10) {
                    obstaclesPassed = 0;
                    completeLap3D();
                }
                
                // Add points for passing obstacle
                let obstaclePoints = 5 * multiplier;
                points += obstaclePoints;
                updateDisplay();
                
                // Show floating text
                showFloatingText(`+${obstaclePoints}`, obs.position.x, obs.position.y + 1, obs.position.z);
            }
            
            // Collision detection
            const runnerX = runner3D.position.x;
            const obsX = obs.position.x;
            const runnerZ = runner3D.position.z;
            const obsZ = obs.position.z;
            
            if (Math.abs(runnerX - obsX) < 0.6 && Math.abs(runnerZ - obsZ) < 0.8 && !isJumping) {
                gameOver3D();
            }
            
            // Remove obstacles that are behind camera
            if (obs.position.z < -8) {
                scene.remove(obs);
                obstacles3D.splice(i, 1);
                i--;
            }
        }
        
        // Camera slight bob
        camera.position.y = 4 + Math.sin(Date.now() * 0.008) * 0.05;
        camera.lookAt(runner3D.position.x, 1.5, runner3D.position.z + 3);
        
        // Update scroll offset for ground
        scrollOffset += deltaTime * 3;
        if (gridHelper) {
            gridHelper.position.z = (scrollOffset % 10) - 5;
        }
        
        // Increase difficulty over time
        baseSpeed = Math.min(18, 8 + level * 0.3);
    }
    
    function completeLap3D() {
        laps++;
        let lapPoints = 10 * multiplier;
        points += lapPoints;
        
        // Update level (every 5 laps)
        let newLevel = Math.floor(laps / 5) + 1;
        if (newLevel > level) {
            level = newLevel;
            if (window.playSound) window.playSound('levelUp');
            showMessage3D(`⭐ LEVEL UP! Level ${level} ⭐`);
        }
        
        updateDisplay();
        if (window.playSound) window.playSound('lapComplete');
        showMessage3D(`🏃 LAP ${laps} COMPLETE! +${lapPoints} 🏃`);
        
        // Visual feedback - flash
        const flashMat = new THREE.MeshStandardMaterial({ color: 0xffaa44, emissive: 0xff4422 });
        const flashPlane = new THREE.Mesh(new THREE.PlaneGeometry(15, 8), flashMat);
        flashPlane.position.set(0, 2, 5);
        scene.add(flashPlane);
        setTimeout(() => scene.remove(flashPlane), 100);
    }
    
    function gameOver3D() {
        gameRunning = false;
        if (window.playSound) window.playSound('gameOver');
        document.getElementById('finalLaps').textContent = laps;
        document.getElementById('finalPoints').textContent = Math.floor(points);
        document.getElementById('gameOverlay').style.display = 'flex';
        
        // Fall animation
        runner3D.position.y = -2;
    }
    
    function showFloatingText(text, x, y, z) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffaa44';
        ctx.font = 'Bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(text, 64, 32);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        sprite.position.set(x, y + 0.5, z);
        sprite.scale.set(1, 0.5, 1);
        scene.add(sprite);
        
        setTimeout(() => scene.remove(sprite), 800);
    }
    
    function showMessage3D(msg) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffaa44';
        ctx.font = 'Bold 32px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(msg, 256, 64);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        sprite.position.set(0, 4, 5);
        sprite.scale.set(5, 1.2, 1);
        scene.add(sprite);
        
        setTimeout(() => scene.remove(sprite), 1500);
    }
    
    // Animation loop
    let lastTimestamp = 0;
    function animate(currentTime) {
        requestAnimationFrame(animate);
        const deltaTime = Math.min(0.033, (currentTime - lastTimestamp) / 1000);
        lastTimestamp = currentTime;
        
        if (deltaTime > 0) {
            updateGame3D(deltaTime);
        }
        
        renderer.render(scene, camera);
    }
    
    requestAnimationFrame(animate);
    
    // Handle resize
    window.addEventListener('resize', onWindowResize, false);
    function onWindowResize() {
        const canvas = document.getElementById('gameCanvas');
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    }
    
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && gameRunning) {
            e.preventDefault();
            window.jump3D();
        }
        if (e.code === 'ArrowLeft' && gameRunning) {
            e.preventDefault();
            window.switchLane(-1);
        }
        if (e.code === 'ArrowRight' && gameRunning) {
            e.preventDefault();
            window.switchLane(1);
        }
    });
    
    // Touch controls for mobile
    let touchStartX = 0;
    canvas.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        if (gameRunning) window.jump3D();
    });
    canvas.addEventListener('touchmove', (e) => {
        const diff = e.touches[0].clientX - touchStartX;
        if (Math.abs(diff) > 30) {
            if (diff > 0) window.switchLane(1);
            else window.switchLane(-1);
            touchStartX = e.touches[0].clientX;
        }
        e.preventDefault();
    });
    
    canvas.addEventListener('click', () => {
        if (gameRunning) window.jump3D();
    });
    
    console.log("Three.js 3D Game Initialized!");
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
        showMessage2D(`✨ UPGRADED! x${multiplier} Multiplier ✨`);
        return true;
    } else if (newMultiplier <= multiplier) {
        showMessage2D("You already have equal or higher multiplier!");
        return false;
    } else {
        showMessage2D("Not enough points!");
        return false;
    }
}

// Show Temporary Message (2D overlay)
function showMessage2D(msg) {
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
        showMessage2D("Game is over! Restart to gamble.");
        return false;
    }
    
    if (betAmount <= 0 || betAmount > points) {
        showMessage2D("Invalid bet amount!");
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
        showMessage2D("Game is over! Restart to solve puzzles.");
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
        
        showMessage2D("🧩 +50 points! Great job!");
        generatePuzzle();
        
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

// Restart Game
function restartGame() {
    gameRunning = true;
    laps = 0;
    level = 1;
    points = 0;
    multiplier = parseInt(document.getElementById('multiplierValue').textContent.replace('x', '')) || 1;
    obstaclesPassed = 0;
    obstacleSpawnTimer = 0;
    baseSpeed = 8;
    
    // Clear existing obstacles
    for (let obs of obstacles3D) {
        scene.remove(obs);
    }
    obstacles3D = [];
    
    // Reset runner position
    if (runner3D) {
        runner3D.position.set(0, -1, 3);
        targetLane = 1;
        currentLane = 1;
    }
    
    updateDisplay();
    document.getElementById('gameOverlay').style.display = 'none';
    if (window.playSound) window.playSound('start');
}

// Event Listeners for UI
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

// Initialize puzzle
generatePuzzle();

// Wait for DOM to load then start Three.js
window.addEventListener('load', () => {
    initThreeJS();
    updateDisplay();
});

console.log("3D Game initialized - Martan is ready to run!");
