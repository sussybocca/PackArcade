// Bullet Class - Production Ready

class Bullet {
    constructor(x, y, angle, owner = 'player', scene) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = 20;
        this.damage = 50;
        this.owner = owner; // 'player' or 'enemy'
        this.active = true;
        
        this.width = 4;
        this.height = 10;
        
        // Velocity
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;

        // Three.js mesh (small glowing sphere)
        const geometry = new THREE.SphereGeometry(4, 8, 8);
        const material = new THREE.MeshStandardMaterial({ 
            color: owner === 'player' ? 0x00ffff : 0xff4444,
            emissive: owner === 'player' ? 0x008888 : 0x440000
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(this.x, this.y + 4, 0);
        scene.add(this.mesh);
    }

    update() {
        if (!this.active) return;
        this.x += this.vx;
        this.y += this.vy;
        this.mesh.position.set(this.x, this.y + 4, 0);
        
        // Deactivate if too far (open world, but we can set a large limit)
        if (this.x < -1000 || this.x > 6000 || this.y < -1000 || this.y > 6000) {
            this.active = false;
            this.mesh.visible = false;
        }
    }

    draw(ctx) {
        // No-op
    }
}