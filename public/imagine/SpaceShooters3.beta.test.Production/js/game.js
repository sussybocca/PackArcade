// Core Game Loop - Production Ready (with Three.js)

const Game = (function() {
    // Three.js components
    let scene, camera, renderer;
    
    // Game state
    let player = null;
    let enemies = [];
    let bullets = [];
    let wave = 1;
    let score = 0;
    let gameActive = true;
    let gameOver = false;
    
    // Input
    let keys = {};
    let mouseX = 0, mouseY = 0;
    let mousePressed = false;
    
    // Camera (2D coordinates for logic, but we use Three.js camera)
    let cameraX = 0, cameraY = 0;
    
    // Timing
    let lastTimestamp = 0;
    let frameCount = 0;
    
    function init() {
        // Initialize Three.js world
        const container = document.getElementById('game-container');
        const worldInit = World.init(container);
        scene = worldInit.scene;
        camera = worldInit.camera;
        
        // Create renderer
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = false;
        container.appendChild(renderer.domElement);
        
        // Set canvas size (for minimap and UI)
        // No 2D canvas, but we keep resize for UI
        window.addEventListener('resize', resize);
        
        // Initialize modules
        World.drawBackground = function(){}; // No-op
        AudioManager.init();
        
        // Create player (pass scene)
        player = new Player(scene);
        
        // Spawn initial enemies
        spawnWave();
        
        // Event listeners
        setupEventListeners();
        
        // Start game loop
        requestAnimationFrame(gameLoop);
    }
    
    function resize() {
        // Update renderer size
        if (renderer) {
            renderer.setSize(window.innerWidth, window.innerHeight);
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
        }
    }
    
    function setupEventListeners() {
        window.addEventListener('keydown', (e) => { keys[e.code] = true; });
        window.addEventListener('keyup', (e) => { keys[e.code] = false; });
        
        renderer.domElement.addEventListener('mousemove', (e) => {
            const rect = renderer.domElement.getBoundingClientRect();
            // Convert mouse to world coordinates on the plane z=0
            // Use raycasting from camera through mouse
            const vector = new THREE.Vector3(
                (e.clientX / rect.width) * 2 - 1,
                -(e.clientY / rect.height) * 2 + 1,
                0.5
            );
            vector.unproject(camera);
            const dir = vector.sub(camera.position).normalize();
            const distance = -camera.position.z / dir.z; // plane at z=0
            const pos = camera.position.clone().add(dir.multiplyScalar(distance));
            mouseX = pos.x;
            mouseY = pos.y;
        });
        
        renderer.domElement.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                keys['MouseLeft'] = true;
                e.preventDefault();
            }
        });
        
        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                keys['MouseLeft'] = false;
            }
        });
        
        renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
        
        document.getElementById('restart-btn').addEventListener('click', restartGame);
    }
    
    function spawnWave() {
        AI.setWave(wave);
        const enemyCount = AI.getWaveSpawnCount(wave);
        
        for (let i = 0; i < enemyCount; i++) {
            let x, y;
            // Spawn outside player view
            do {
                x = player.x + (Math.random() - 0.5) * 800;
                y = player.y + (Math.random() - 0.5) * 800;
            } while (Math.hypot(x - player.x, y - player.y) < 200);
            
            // No bounds - open world
            // x = Math.max(100, Math.min(4900, x));
            // y = Math.max(100, Math.min(4900, y));
            
            const type = Math.random() > 0.5 ? 1 : 2;
            enemies.push(new Enemy(x, y, type, wave, scene));
        }
    }
    
    function update() {
        if (!gameActive) return;
        
        // Update video textures
        VideoManager.update();
        
        // Update player
        if (player.active) {
            player.update(keys, mouseX, mouseY, bullets, camera);
        } else {
            gameOver = true;
            gameActive = false;
            AudioManager.playGameOver();
            document.getElementById('game-over-screen').classList.remove('hidden');
            document.getElementById('final-score').textContent = score;
            return;
        }
        
        // Update enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            enemy.update(player, enemies, bullets, scene, camera);
            
            // Check collision with player
            if (enemy.active && player.active) {
                const dx = enemy.x - player.x;
                const dy = enemy.y - player.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 50) {
                    player.takeDamage(15);
                    enemy.active = false;
                    enemy.mesh.visible = false;
                    AudioManager.playExplosion();
                }
            }
            
            if (!enemy.active) {
                enemies.splice(i, 1);
            }
        }
        
        // Update bullets
        for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i];
            bullet.update();
            
            // Check collisions
            if (bullet.owner === 'player') {
                // Player bullet hits enemies
                for (let j = enemies.length - 1; j >= 0; j--) {
                    const enemy = enemies[j];
                    if (!enemy.active) continue;
                    
                    const dx = bullet.x - enemy.x;
                    const dy = bullet.y - enemy.y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    
                    if (dist < 40) {
                        if (enemy.takeDamage(bullet.damage)) {
                            score += 100;
                            AudioManager.playExplosion();
                        }
                        bullet.active = false;
                        bullet.mesh.visible = false;
                        break;
                    }
                }
            } else {
                // Enemy bullet hits player
                if (player.active) {
                    const dx = bullet.x - player.x;
                    const dy = bullet.y - player.y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    
                    if (dist < 40) {
                        player.takeDamage(10);
                        bullet.active = false;
                        bullet.mesh.visible = false;
                        AudioManager.playExplosion();
                    }
                }
            }
            
            if (!bullet.active) {
                bullets.splice(i, 1);
            }
        }
        
        // Check if wave cleared
        if (enemies.length === 0 && gameActive) {
            wave++;
            document.getElementById('wave-value').textContent = wave;
            spawnWave();
        }
        
        // Update UI
        document.getElementById('health-value').textContent = player.health;
        document.getElementById('score-value').textContent = score;
        
        // Update camera to follow player (top-down view)
        if (player) {
            camera.position.set(player.x, player.y + 300, 500);
            camera.lookAt(player.x, player.y, 0);
            
            // For compatibility with mouse coordinate calculation, we might store cameraX/Y
            // But we don't need them for drawing anymore
            cameraX = player.x - window.innerWidth / 2;
            cameraY = player.y - window.innerHeight / 2;
        }
    }
    
    function draw() {
        // Three.js rendering
        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        }
        
        // Draw minimap (still 2D)
        drawMinimap();
    }
    
    function drawMinimap() {
        const minimapEl = document.getElementById('minimap');
        const mapCtx = minimapEl.querySelector('canvas');
        if (!mapCtx) {
            // Create canvas for minimap
            const canvas = document.createElement('canvas');
            canvas.width = 200;
            canvas.height = 200;
            minimapEl.innerHTML = '';
            minimapEl.appendChild(canvas);
        }
        
        const mapCanvas = minimapEl.querySelector('canvas');
        const mCtx = mapCanvas.getContext('2d');
        
        mCtx.clearRect(0, 0, 200, 200);
        
        // Background
        mCtx.fillStyle = '#112';
        mCtx.fillRect(0, 0, 200, 200);
        
        // World bounds (optional, we can show full range)
        mCtx.strokeStyle = '#0ff';
        mCtx.lineWidth = 1;
        mCtx.strokeRect(0, 0, 200, 200);
        
        // Scale factor: 5000 world units -> 200px (adjust if world is larger)
        const scale = 200 / 5000;
        
        // Draw enemies (red dots)
        mCtx.fillStyle = '#f00';
        enemies.forEach(enemy => {
            // Clamp to minimap area
            let x = enemy.x * scale;
            let y = enemy.y * scale;
            if (x >= 0 && x <= 200 && y >= 0 && y <= 200) {
                mCtx.beginPath();
                mCtx.arc(x, y, 3, 0, 2*Math.PI);
                mCtx.fill();
            }
        });
        
        // Draw player (cyan dot)
        if (player) {
            mCtx.fillStyle = '#0ff';
            const px = player.x * scale;
            const py = player.y * scale;
            mCtx.beginPath();
            mCtx.arc(px, py, 4, 0, 2*Math.PI);
            mCtx.fill();
        }
        
        // Draw camera view (optional)
        // Not needed with open world
    }
    
    function gameLoop(timestamp) {
        if (gameActive) {
            update();
        }
        draw();
        
        requestAnimationFrame(gameLoop);
    }
    
    function restartGame() {
        // Remove old meshes from scene
        if (player && player.mesh) scene.remove(player.mesh);
        enemies.forEach(e => scene.remove(e.mesh));
        bullets.forEach(b => scene.remove(b.mesh));
        
        // Reset game state
        player = new Player(scene);
        enemies = [];
        bullets = [];
        wave = 1;
        score = 0;
        gameActive = true;
        gameOver = false;
        
        document.getElementById('game-over-screen').classList.add('hidden');
        document.getElementById('wave-value').textContent = wave;
        document.getElementById('health-value').textContent = player.health;
        document.getElementById('score-value').textContent = score;
        
        AudioManager.restartMusic();
        
        spawnWave();
    }
    
    return {
        init
    };
})();