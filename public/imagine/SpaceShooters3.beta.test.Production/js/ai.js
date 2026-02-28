// Hard AI Logic - Production Ready
// These bots are designed to be very difficult to beat

const AI = (function() {
    // Difficulty scaling with wave
    let currentWave = 1;
    
    function setWave(wave) {
        currentWave = wave;
    }

    // Enemy decision making
    function updateEnemy(enemy, player, enemies, bullets, scene) {
        if (!enemy.active) return;
        
        // Calculate distance to player
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        // Aggression increases with wave
        const aggression = Math.min(0.5 + currentWave * 0.1, 1.0);
        
        // Movement patterns
        if (dist > 300) {
            // Move towards player if far
            enemy.vx += (dx / dist) * 0.5 * aggression;
            enemy.vy += (dy / dist) * 0.5 * aggression;
        } else if (dist < 150) {
            // Back off if too close (kiting behavior)
            enemy.vx -= (dx / dist) * 0.3;
            enemy.vy -= (dy / dist) * 0.3;
        } else {
            // Strafe around player
            const perpX = -dy / dist;
            const perpY = dx / dist;
            enemy.vx += perpX * 0.4 * (Math.random() > 0.5 ? 1 : -1);
            enemy.vy += perpY * 0.4 * (Math.random() > 0.5 ? 1 : -1);
        }
        
        // Limit speed
        const speed = Math.sqrt(enemy.vx*enemy.vx + enemy.vy*enemy.vy);
        const maxSpeed = 3 + currentWave * 0.5;
        if (speed > maxSpeed) {
            enemy.vx = (enemy.vx / speed) * maxSpeed;
            enemy.vy = (enemy.vy / speed) * maxSpeed;
        }
        
        // Firing decision - predictive aiming
        if (enemy.canFire && dist < 600) {
            // Predict player movement
            const bulletSpeed = 8;
            const timeToTarget = dist / bulletSpeed;
            const predictedX = player.x + player.vx * timeToTarget;
            const predictedY = player.y + player.vy * timeToTarget;
            
            const fireAngle = Math.atan2(predictedY - enemy.y, predictedX - enemy.x);
            
            // Add some inaccuracy based on wave (lower waves less accurate)
            const accuracy = 0.7 + currentWave * 0.05;
            if (Math.random() < accuracy) {
                bullets.push(new Bullet(enemy.x, enemy.y, fireAngle, 'enemy', scene));
                enemy.canFire = false;
                setTimeout(() => { enemy.canFire = true; }, 400 - currentWave * 20);
            }
        }
        
        // Collision avoidance with other enemies
        enemies.forEach(other => {
            if (other === enemy || !other.active) return;
            const dx2 = other.x - enemy.x;
            const dy2 = other.y - enemy.y;
            const dist2 = Math.sqrt(dx2*dx2 + dy2*dy2);
            if (dist2 < 50) {
                enemy.vx -= dx2 * 0.1;
                enemy.vy -= dy2 * 0.1;
            }
        });
    }

    // Wave spawning logic - gets harder each wave
    function getWaveSpawnCount(wave) {
        return 3 + wave * 2; // 5, 7, 9, 11...
    }

    return {
        setWave,
        updateEnemy,
        getWaveSpawnCount
    };
})();