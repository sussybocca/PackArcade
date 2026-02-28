// Enemy Class - Production Ready
// Uses video textures (Three.js planes)

class Enemy {
    constructor(x, y, type = 1, wave = 1, scene) {
        this.x = x;
        this.y = y;
        this.z = 0;
        this.type = type; // 1 or 2 for different video/texture
        this.width = 64;
        this.height = 64;
        this.health = 30 + wave * 10;
        this.maxHealth = this.health;
        this.active = true;
        this.canFire = true;
        
        // Movement
        this.vx = 0;
        this.vy = 0;
        
        // For AI
        this.lastShot = 0;

        // Three.js mesh
        const video = VideoManager.getVideo(type === 1 ? 'enemy1' : 'enemy2');
        const texture = new THREE.VideoTexture(video);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        
        const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, transparent: true });
        const geometry = new THREE.PlaneGeometry(64, 64);
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(this.x, this.y + 32, 0);
        this.mesh.userData = { type: 'enemy', object: this };
        scene.add(this.mesh);
    }

    update(player, enemies, bullets, scene, camera) {
        if (!this.active) return;
        
        // AI handles movement and shooting (expects bullets array and scene for creating enemy bullets)
        AI.updateEnemy(this, player, enemies, bullets, scene);
        
        // Apply velocity
        this.x += this.vx;
        this.y += this.vy;
        
        // Update mesh position
        this.mesh.position.set(this.x, this.y + 32, 0);
        
        // Face camera
        this.mesh.quaternion.copy(camera.quaternion);
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.active = false;
            this.mesh.visible = false;
            return true; // killed
        }
        return false;
    }

    // No draw method
    draw(ctx) {}
}