// entities/Hallucination.js – Advanced dynamic hallucinations that appear when intoxicated
import * as THREE from 'three';
import { MathUtils } from '../utils/MathUtils.js';
import { AssetLoader } from '../core/AssetLoader.js'; // we'll assume it's available globally or passed

export class Hallucination {
    /**
     * @param {THREE.Scene} scene - The scene to add the hallucination to
     * @param {string} type - Type: 'spider', 'shadow', 'eye', 'floater'
     * @param {THREE.Vector3} position - Initial position
     * @param {AssetLoader} assetLoader - To access textures
     */
    constructor(scene, type, position, assetLoader) {
        this.scene = scene;
        this.type = type;
        this.assetLoader = assetLoader;
        this.mesh = null;
        this.particles = null; // optional particle system
        this.lifeTime = 5.0 + Math.random() * 3; // seconds (varied)
        this.age = 0;
        this.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.02,
            (Math.random() - 0.5) * 0.01,
            (Math.random() - 0.5) * 0.02
        );
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;
        this.scaleFactor = 1.0;
        this.targetScale = 1.0;
        this.opacity = 1.0;
        this.fadeOut = false;

        this.createMesh();
        if (position) {
            this.mesh.position.copy(position);
        }
        // Add to scene
        this.scene.add(this.mesh);
    }

    createMesh() {
        switch (this.type) {
            case 'spider':
                this.createSpider();
                break;
            case 'shadow':
                this.createShadow();
                break;
            case 'eye':
                this.createEye();
                break;
            case 'floater':
                this.createFloater();
                break;
            default:
                this.createGeneric();
        }
    }

    createSpider() {
        const group = new THREE.Group();

        // Use spider texture if available
        const spiderTex = this.assetLoader ? this.assetLoader.getTexture('spider') : null;
        const bodyMat = spiderTex 
            ? new THREE.MeshStandardMaterial({ map: spiderTex, transparent: true })
            : new THREE.MeshStandardMaterial({ color: 0x442211, emissive: 0x220000 });

        // Body (segmented)
        const bodyGeom = new THREE.SphereGeometry(0.15, 8);
        const body = new THREE.Mesh(bodyGeom, bodyMat);
        body.position.y = 0.1;
        group.add(body);

        // Head
        const headGeom = new THREE.SphereGeometry(0.08, 6);
        const head = new THREE.Mesh(headGeom, bodyMat);
        head.position.set(0.12, 0.15, 0);
        group.add(head);

        // Eyes (glowing)
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0x440000 });
        const eyeGeom = new THREE.SphereGeometry(0.03, 4);
        const eyeL = new THREE.Mesh(eyeGeom, eyeMat);
        eyeL.position.set(0.15, 0.18, 0.05);
        group.add(eyeL);
        const eyeR = new THREE.Mesh(eyeGeom, eyeMat);
        eyeR.position.set(0.15, 0.18, -0.05);
        group.add(eyeR);

        // Legs (8 cylinders)
        const legMat = new THREE.MeshStandardMaterial({ color: 0x332211 });
        const legPositions = [
            [-0.1, 0.05, 0.12], [0.05, 0.05, 0.12], // right front/back
            [-0.1, 0.05, -0.12], [0.05, 0.05, -0.12], // left front/back
        ];
        legPositions.forEach((pos, i) => {
            const legGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.2, 4);
            const leg = new THREE.Mesh(legGeom, legMat);
            leg.position.set(pos[0], pos[1], pos[2]);
            leg.rotation.z = Math.PI / 4 * (i % 2 === 0 ? 1 : -1);
            leg.rotation.x = Math.PI / 6;
            group.add(leg);
        });

        // Add subtle glow
        const glowMat = new THREE.MeshStandardMaterial({ color: 0x331111, emissive: 0x110000, transparent: true, opacity: 0.3 });
        const glowGeom = new THREE.SphereGeometry(0.25, 8);
        const glow = new THREE.Mesh(glowGeom, glowMat);
        glow.position.y = 0.1;
        group.add(glow);

        this.mesh = group;
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
    }

    createShadow() {
        // A dark, semi-transparent humanoid shape
        const group = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x111111, transparent: true, opacity: 0.5 });

        // Body
        const bodyGeom = new THREE.CylinderGeometry(0.2, 0.2, 0.8);
        const body = new THREE.Mesh(bodyGeom, mat);
        body.position.y = 0.4;
        group.add(body);

        // Head
        const headGeom = new THREE.SphereGeometry(0.15, 6);
        const head = new THREE.Mesh(headGeom, mat);
        head.position.y = 0.9;
        group.add(head);

        // Arms
        const armGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.5);
        const armL = new THREE.Mesh(armGeom, mat);
        armL.position.set(-0.3, 0.6, 0);
        armL.rotation.z = 0.2;
        group.add(armL);
        const armR = new THREE.Mesh(armGeom, mat);
        armR.position.set(0.3, 0.6, 0);
        armR.rotation.z = -0.2;
        group.add(armR);

        this.mesh = group;
        this.mesh.castShadow = true;
    }

    createEye() {
        // A floating eye with pupil
        const group = new THREE.Group();
        const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x442222 });
        const pupilMat = new THREE.MeshStandardMaterial({ color: 0x000000 });

        // Eyeball
        const eyeGeom = new THREE.SphereGeometry(0.2, 16);
        const eyeball = new THREE.Mesh(eyeGeom, whiteMat);
        group.add(eyeball);

        // Pupil (small sphere inside)
        const pupilGeom = new THREE.SphereGeometry(0.08, 8);
        const pupil = new THREE.Mesh(pupilGeom, pupilMat);
        pupil.position.set(0.1, 0.1, 0.15); // offset to simulate looking direction
        group.add(pupil);

        // Blood vessels (thin lines, could be done with LineSegments, but for simplicity we'll add some small cylinders)
        const vesselMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        for (let i = 0; i < 3; i++) {
            const vesselGeom = new THREE.CylinderGeometry(0.01, 0.01, 0.1);
            const vessel = new THREE.Mesh(vesselGeom, vesselMat);
            vessel.position.set(Math.sin(i)*0.1, Math.cos(i)*0.1, 0.1);
            vessel.rotation.z = i;
            group.add(vessel);
        }

        this.mesh = group;
    }

    createFloater() {
        // Abstract shape with pulsating colors
        const geom = new THREE.TorusKnotGeometry(0.15, 0.04, 64, 8);
        const mat = new THREE.MeshStandardMaterial({ 
            color: 0xff44aa, 
            emissive: 0x331122,
            wireframe: true,
            transparent: true,
            opacity: 0.8
        });
        this.mesh = new THREE.Mesh(geom, mat);
    }

    createGeneric() {
        const geom = new THREE.DodecahedronGeometry(0.2);
        const mat = new THREE.MeshStandardMaterial({ color: 0x88ff88, emissive: 0x224422 });
        this.mesh = new THREE.Mesh(geom, mat);
    }

    /**
     * Update hallucination over time
     * @param {number} deltaTime - Time since last frame
     * @returns {boolean} - True if still alive, false if should be removed
     */
    update(deltaTime) {
        this.age += deltaTime;

        // Fade out near end of life
        if (this.age > this.lifeTime * 0.7) {
            this.fadeOut = true;
            this.opacity = Math.max(0, 1.0 - (this.age - this.lifeTime * 0.7) / (this.lifeTime * 0.3));
            this.mesh.traverse(obj => {
                if (obj.material) {
                    if (Array.isArray(obj.material)) {
                        obj.material.forEach(mat => mat.opacity = this.opacity);
                    } else {
                        obj.material.opacity = this.opacity;
                    }
                }
            });
        }

        if (this.age > this.lifeTime) {
            this.scene.remove(this.mesh);
            return false;
        }

        // Movement patterns based on type
        switch (this.type) {
            case 'spider':
                // Crawl in random direction, with slight turns
                this.velocity.x += (Math.random() - 0.5) * 0.005;
                this.velocity.z += (Math.random() - 0.5) * 0.005;
                // Clamp speed
                this.velocity.clampLength(0, 0.03);
                this.mesh.position.x += this.velocity.x * deltaTime * 30;
                this.mesh.position.z += this.velocity.z * deltaTime * 30;
                // Bob up and down
                this.mesh.position.y += Math.sin(this.age * 10) * 0.005;
                // Rotate to face movement direction (simple)
                if (this.velocity.length() > 0.001) {
                    this.mesh.rotation.y = Math.atan2(this.velocity.x, this.velocity.z);
                }
                break;

            case 'shadow':
                // Slow drift towards player? Or just hover
                this.mesh.position.y += Math.sin(this.age * 2) * 0.01;
                this.mesh.rotation.y += 0.01;
                break;

            case 'eye':
                // Rotate slowly, pupil moves
                this.mesh.rotation.y += 0.02;
                this.mesh.rotation.x += 0.01;
                // Pupil could track player, but we'll just move it randomly
                if (this.mesh.children[1]) { // pupil is second child
                    this.mesh.children[1].position.x = 0.1 + Math.sin(this.age * 3) * 0.05;
                    this.mesh.children[1].position.y = 0.1 + Math.cos(this.age * 2) * 0.05;
                }
                break;

            case 'floater':
                // Pulsating scale and color
                this.scaleFactor = 1.0 + Math.sin(this.age * 5) * 0.2;
                this.mesh.scale.set(this.scaleFactor, this.scaleFactor, this.scaleFactor);
                this.mesh.rotation.x += 0.01;
                this.mesh.rotation.y += 0.02;
                // Change emissive color over time
                if (this.mesh.material) {
                    const hue = (this.age * 0.1) % 1.0;
                    this.mesh.material.emissive.setHSL(hue, 0.8, 0.2);
                }
                break;

            default:
                // Default movement
                this.mesh.position.y += Math.sin(this.age * 3) * 0.01;
                this.mesh.rotation.y += 0.01;
        }

        return true;
    }
}