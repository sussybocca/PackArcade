// Player Class - Production Ready
// Uses player.mp4 for animated texture (now as Three.js plane)

class Player {
    constructor(scene) {
        this.scene = scene; // store scene reference
        this.x = 2500;
        this.y = 2500;
        this.z = 0;
        this.width = 64;
        this.height = 64;
        this.health = 200;
        this.maxHealth = 200;
        this.speed = 5;
        this.vx = 0;
        this.vy = 0;
        this.active = true;
        
        // Shooting
        this.canShoot = true;
        this.shootCooldown = 100;
        this.lastShot = 0;

        // Three.js mesh
        const video = VideoManager.getVideo('player');
        const texture = new THREE.VideoTexture(video);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.format = THREE.RGBAFormat;
        
        const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, transparent: true });
        const geometry = new THREE.PlaneGeometry(64, 64);
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(this.x, this.y + 32, this.z); // raise slightly above ground
        // Store reference to player for raycasting if needed
        this.mesh.userData = { type: 'player', object: this };
        scene.add(this.mesh);
    }

    update(keys, mouseX, mouseY, bullets, camera) {
        if (!this.active) return;
        
        // Movement input
        this.vx = 0;
        this.vy = 0;
        if (keys['KeyW']) this.vy = -this.speed;
        if (keys['KeyS']) this.vy = this.speed;
        if (keys['KeyA']) this.vx = -this.speed;
        if (keys['KeyD']) this.vx = this.speed;
        
        // Diagonal normalization
        if (this.vx !== 0 && this.vy !== 0) {
            this.vx *= 0.707;
            this.vy *= 0.707;
        }
        
        this.x += this.vx;
        this.y += this.vy;
        
        // No bounds - open world (can go anywhere)
        
        // Update mesh position
        this.mesh.position.set(this.x, this.y + 32, 0);
        
        // Make mesh always face camera (billboard)
        this.mesh.quaternion.copy(camera.quaternion);
        
        // Shooting
        if (keys['MouseLeft'] && this.canShoot) {
            const dx = mouseX - this.x;
            const dy = mouseY - this.y;
            const angle = Math.atan2(dy, dx);
            
            bullets.push(new Bullet(this.x, this.y, angle, 'player', this.scene));
            AudioManager.playLaser();
            
            this.canShoot = false;
            setTimeout(() => { this.canShoot = true; }, this.shootCooldown);
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.active = false;
            this.mesh.visible = false;
            return true; // dead
        }
        return false;
    }

    // No draw method - Three.js handles rendering
    draw(ctx) {
        // Kept for compatibility but does nothing
    }
}