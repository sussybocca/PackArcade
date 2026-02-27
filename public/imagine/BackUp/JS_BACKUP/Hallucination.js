// entities/Hallucination.js – Ultra‑immersive dynamic hallucinations
import * as THREE from 'three';
import { MathUtils } from '../utils/MathUtils.js';

export class Hallucination {
    constructor(scene, type, position, assetLoader = null) {
        this.scene = scene;
        this.type = type;
        this.assetLoader = assetLoader;
        this.mesh = null;
        this.particles = null;       // Particle system for extra effect
        this.glowSprite = null;       // Optional sprite glow
        this.lifeTime = 6.0 + Math.random() * 4; // 6-10 sec
        this.age = 0;
        this.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.03,
            (Math.random() - 0.5) * 0.02,
            (Math.random() - 0.5) * 0.03
        );
        this.rotationSpeed = new THREE.Vector3(
            (Math.random() - 0.5) * 0.02,
            (Math.random() - 0.5) * 0.02,
            (Math.random() - 0.5) * 0.02
        );
        this.baseScale = 0.8 + Math.random() * 1.2; // 0.8 - 2.0
        this.pulseSpeed = 1 + Math.random() * 2;
        this.opacity = 1.0;
        this.fadeOut = false;

        this.createMesh();
        if (position) this.mesh.position.copy(position);
        this.scene.add(this.mesh);

        // Add extra effects based on type
        this.addSpecialEffects();
    }

    createMesh() {
        switch (this.type) {
            case 'spider':   this.createSpider(); break;
            case 'shadow':   this.createShadow(); break;
            case 'eye':      this.createEye(); break;
            case 'floater':  this.createFloater(); break;
            case 'face':     this.createFace(); break; // new type
            default:         this.createGeneric();
        }
    }

    // Safe texture getter
    getTexture(name) {
        return this.assetLoader && this.assetLoader.getTexture
            ? this.assetLoader.getTexture(name)
            : null;
    }

    // ========== SPIDER ==========
    createSpider() {
        const group = new THREE.Group();
        const spiderTex = this.getTexture('spider');
        const bodyMat = spiderTex
            ? new THREE.MeshStandardMaterial({ map: spiderTex, emissive: 0x331100 })
            : new THREE.MeshStandardMaterial({ color: 0x442211, emissive: 0x220000 });

        // Body (two segments)
        const body1 = new THREE.Mesh(new THREE.SphereGeometry(0.25, 10), bodyMat);
        body1.position.set(0, 0.1, 0);
        group.add(body1);
        const body2 = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8), bodyMat);
        body2.position.set(0.2, 0.15, 0);
        group.add(body2);

        // Head with fangs
        const headMat = new THREE.MeshStandardMaterial({ color: 0x332211 });
        const head = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.15, 6), headMat);
        head.position.set(0.35, 0.18, 0);
        head.rotation.x = 0.2;
        group.add(head);
        const fangL = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.1, 4), new THREE.MeshStandardMaterial({ color: 0x111111 }));
        fangL.position.set(0.4, 0.12, 0.05);
        fangL.rotation.z = -0.2;
        group.add(fangL);
        const fangR = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.1, 4), new THREE.MeshStandardMaterial({ color: 0x111111 }));
        fangR.position.set(0.4, 0.12, -0.05);
        fangR.rotation.z = 0.2;
        group.add(fangR);

        // Eyes (glowing red)
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0xff3333, emissive: 0x550000 });
        const eyeGeom = new THREE.SphereGeometry(0.05, 6);
        const eyeL = new THREE.Mesh(eyeGeom, eyeMat);
        eyeL.position.set(0.3, 0.22, 0.06);
        group.add(eyeL);
        const eyeR = new THREE.Mesh(eyeGeom, eyeMat);
        eyeR.position.set(0.3, 0.22, -0.06);
        group.add(eyeR);

        // Legs (8 cylinders with joints)
        const legMat = new THREE.MeshStandardMaterial({ color: 0x332211 });
        const legSegments = (xOff, zOff, angle, length) => {
            const seg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, length*0.5, 4), legMat);
            seg1.position.set(xOff, 0.05, zOff);
            seg1.rotation.z = angle;
            seg1.rotation.x = 0.3;
            group.add(seg1);
            const seg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, length*0.5, 4), legMat);
            seg2.position.set(xOff + Math.sin(angle)*length*0.25, 0.02, zOff + Math.cos(angle)*length*0.25);
            seg2.rotation.z = angle + 0.5;
            group.add(seg2);
        };
        // Four pairs
        legSegments(-0.15, 0.15,  0.3, 0.4);
        legSegments(-0.15, -0.15, -0.3, 0.4);
        legSegments( 0.1,  0.15,  0.5, 0.35);
        legSegments( 0.1, -0.15, -0.5, 0.35);
        legSegments( 0.25, 0.1,   0.7, 0.3);
        legSegments( 0.25, -0.1, -0.7, 0.3);
        legSegments( 0.4,  0.08,  0.9, 0.25);
        legSegments( 0.4, -0.08, -0.9, 0.25);

        // Hairy effect (small spikes)
        const hairMat = new THREE.MeshStandardMaterial({ color: 0x221100 });
        for (let i = 0; i < 12; i++) {
            const spike = new THREE.Mesh(new THREE.ConeGeometry(0.01, 0.05, 3), hairMat);
            spike.position.set(Math.random()*0.4-0.2, Math.random()*0.2+0.1, Math.random()*0.3-0.15);
            spike.rotation.set(Math.random(), Math.random(), Math.random());
            group.add(spike);
        }

        this.mesh = group;
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.scale.set(this.baseScale, this.baseScale, this.baseScale);
    }

    // ========== SHADOW ==========
    createShadow() {
        const group = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({
            color: 0x111111,
            emissive: 0x111111,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });

        // Body
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.2, 8), mat);
        body.position.y = 0.6;
        group.add(body);

        // Head
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 6), mat);
        head.position.y = 1.3;
        group.add(head);

        // Arms (moving)
        const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.8, 5), mat);
        armL.position.set(-0.4, 1.0, 0);
        armL.rotation.z = 0.3;
        group.add(armL);
        const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.8, 5), mat);
        armR.position.set(0.4, 1.0, 0);
        armR.rotation.z = -0.3;
        group.add(armR);

        // Legs
        const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.8, 5), mat);
        legL.position.set(-0.2, 0.2, 0);
        group.add(legL);
        const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.8, 5), mat);
        legR.position.set(0.2, 0.2, 0);
        group.add(legR);

        // Red eyes (glowing)
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0x440000 });
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.06, 4), eyeMat);
        eyeL.position.set(-0.1, 1.35, 0.2);
        group.add(eyeL);
        const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.06, 4), eyeMat);
        eyeR.position.set(0.1, 1.35, 0.2);
        group.add(eyeR);

        this.mesh = group;
        this.mesh.castShadow = true;
        this.mesh.scale.set(this.baseScale, this.baseScale, this.baseScale);
    }

    // ========== EYE ==========
    createEye() {
        const group = new THREE.Group();
        const whiteMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, emissive: 0x442222 });
        const pupilMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const veinMat = new THREE.MeshStandardMaterial({ color: 0xaa2222 });

        // Eyeball
        const eyeball = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24), whiteMat);
        group.add(eyeball);

        // Iris (colored ring)
        const irisMat = new THREE.MeshStandardMaterial({ color: 0x44aa44, emissive: 0x113311 });
        const iris = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 8, 20), irisMat);
        iris.rotation.x = Math.PI/2;
        iris.position.set(0, 0, 0.25);
        group.add(iris);

        // Pupil (black sphere)
        const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8), pupilMat);
        pupil.position.set(0, 0, 0.32);
        group.add(pupil);

        // Blood vessels (thin cylinders)
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const vessel = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.2, 3), veinMat);
            vessel.position.set(Math.sin(angle)*0.2, Math.cos(angle)*0.2, 0.15);
            vessel.rotation.z = angle;
            vessel.rotation.x = 0.5;
            group.add(vessel);
        }

        // Glow (halo)
        const glowMat = new THREE.MeshStandardMaterial({ color: 0xffaa88, emissive: 0x442211, transparent: true, opacity: 0.3 });
        const glow = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16), glowMat);
        group.add(glow);

        this.mesh = group;
        this.mesh.scale.set(this.baseScale, this.baseScale, this.baseScale);
    }

    // ========== FLOATER ==========
    createFloater() {
        const geom = new THREE.TorusKnotGeometry(0.2, 0.05, 100, 16);
        const mat = new THREE.MeshStandardMaterial({
            color: 0xff44aa,
            emissive: 0x331122,
            wireframe: true,
            transparent: true,
            opacity: 0.9
        });
        this.mesh = new THREE.Mesh(geom, mat);
        this.mesh.scale.set(this.baseScale, this.baseScale, this.baseScale);
    }

    // ========== FACE ==========
    createFace() {
        const group = new THREE.Group();
        const skinMat = new THREE.MeshStandardMaterial({ color: 0xeeddcc, emissive: 0x331100 });
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const pupilMat = new THREE.MeshStandardMaterial({ color: 0x000000 });

        // Head
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16), skinMat);
        group.add(head);

        // Eyes
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8), eyeMat);
        eyeL.position.set(-0.1, 0.1, 0.2);
        group.add(eyeL);
        const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8), eyeMat);
        eyeR.position.set(0.1, 0.1, 0.2);
        group.add(eyeR);

        // Pupils
        const pupilL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4), pupilMat);
        pupilL.position.set(-0.1, 0.1, 0.28);
        group.add(pupilL);
        const pupilR = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4), pupilMat);
        pupilR.position.set(0.1, 0.1, 0.28);
        group.add(pupilR);

        // Mouth (open scream)
        const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.02, 6, 12, Math.PI), new THREE.MeshStandardMaterial({ color: 0x330000 }));
        mouth.rotation.x = Math.PI/2;
        mouth.rotation.z = Math.PI;
        mouth.position.set(0, -0.05, 0.22);
        group.add(mouth);

        this.mesh = group;
        this.mesh.scale.set(this.baseScale*0.8, this.baseScale*0.8, this.baseScale*0.8);
    }

    createGeneric() {
        const geom = new THREE.DodecahedronGeometry(0.25);
        const mat = new THREE.MeshStandardMaterial({ color: 0x88ff88, emissive: 0x224422 });
        this.mesh = new THREE.Mesh(geom, mat);
        this.mesh.scale.set(this.baseScale, this.baseScale, this.baseScale);
    }

    // Add particle glow and sprite
    addSpecialEffects() {
        // Create a simple particle system (glowing dots) around the hallucination
        const particleCount = 20;
        const particleGeom = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount; i++) {
            const r = 0.5 + Math.random() * 0.5;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            positions[i*3] = Math.sin(phi) * Math.cos(theta) * r;
            positions[i*3+1] = Math.sin(phi) * Math.sin(theta) * r;
            positions[i*3+2] = Math.cos(phi) * r;
        }
        particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const particleMat = new THREE.PointsMaterial({
            color: 0xffaa88,
            size: 0.03,
            transparent: true,
            blending: THREE.AdditiveBlending
        });
        this.particles = new THREE.Points(particleGeom, particleMat);
        this.mesh.add(this.particles); // attach to mesh so they move with it

        // Optional sprite glow (a halo)
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255,200,150,1)');
        gradient.addColorStop(0.5, 'rgba(255,100,50,0.5)');
        gradient.addColorStop(1, 'rgba(255,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: texture, blending: THREE.AdditiveBlending, depthTest: false });
        this.glowSprite = new THREE.Sprite(spriteMat);
        this.glowSprite.scale.set(1.5, 1.5, 1);
        this.mesh.add(this.glowSprite);
    }

    update(deltaTime) {
        this.age += deltaTime;

        // Fade out and scale down near end
        if (this.age > this.lifeTime * 0.6) {
            this.fadeOut = true;
            const t = (this.age - this.lifeTime * 0.6) / (this.lifeTime * 0.4);
            this.opacity = Math.max(0, 1.0 - t);
            this.mesh.traverse(obj => {
                if (obj.material) {
                    if (Array.isArray(obj.material)) {
                        obj.material.forEach(mat => { if (mat.transparent) mat.opacity = this.opacity; });
                    } else {
                        if (obj.material.transparent) obj.material.opacity = this.opacity;
                    }
                }
            });
            // Also scale down
            this.mesh.scale.setScalar(this.baseScale * (0.5 + 0.5 * (1 - t)));
        }

        if (this.age > this.lifeTime) {
            this.dispose();
            return false;
        }

        // Type‑specific animations
        switch (this.type) {
            case 'spider':
                // Crawl on surfaces? For simplicity, just random walk + occasional wall climb?
                this.velocity.x += (Math.random() - 0.5) * 0.01;
                this.velocity.z += (Math.random() - 0.5) * 0.01;
                this.velocity.clampLength(0, 0.05);
                this.mesh.position.x += this.velocity.x * deltaTime * 30;
                this.mesh.position.z += this.velocity.z * deltaTime * 30;
                this.mesh.position.y += Math.sin(this.age * 8) * 0.01;
                if (this.velocity.length() > 0.001)
                    this.mesh.rotation.y = Math.atan2(this.velocity.x, this.velocity.z);
                break;

            case 'shadow':
                // Drift and wave arms
                this.mesh.position.y += Math.sin(this.age * 3) * 0.02;
                this.mesh.rotation.y += 0.01;
                if (this.mesh.children[2] && this.mesh.children[3]) { // arms
                    this.mesh.children[2].rotation.z = 0.3 + Math.sin(this.age * 5) * 0.2;
                    this.mesh.children[3].rotation.z = -0.3 + Math.sin(this.age * 5 + 2) * 0.2;
                }
                break;

            case 'eye':
                // Pupil dilation and movement
                this.mesh.rotation.y += 0.02;
                this.mesh.rotation.x += 0.01;
                if (this.mesh.children[2]) { // pupil
                    this.mesh.children[2].position.x = 0.1 + Math.sin(this.age * 4) * 0.05;
                    this.mesh.children[2].position.y = 0.1 + Math.cos(this.age * 3) * 0.05;
                }
                break;

            case 'floater':
                // Pulsate and change colors
                const pulse = 1.0 + Math.sin(this.age * this.pulseSpeed) * 0.3;
                this.mesh.scale.setScalar(this.baseScale * pulse);
                this.mesh.rotation.x += 0.01;
                this.mesh.rotation.y += 0.02;
                if (this.mesh.material) {
                    const hue = (this.age * 0.1) % 1.0;
                    this.mesh.material.emissive.setHSL(hue, 0.8, 0.2);
                }
                break;

            case 'face':
                // Bob and rotate, mouth open/close
                this.mesh.position.y += Math.sin(this.age * 4) * 0.03;
                this.mesh.rotation.y += 0.02;
                if (this.mesh.children[5]) { // mouth
                    this.mesh.children[5].scale.y = 0.8 + Math.sin(this.age * 10) * 0.2;
                }
                break;

            default:
                this.mesh.position.y += Math.sin(this.age * 3) * 0.02;
                this.mesh.rotation.y += 0.01;
        }

        // Rotate particles for extra effect
        if (this.particles) {
            this.particles.rotation.y += 0.01;
            this.particles.rotation.x += 0.005;
        }
        if (this.glowSprite) {
            this.glowSprite.material.opacity = 0.5 + Math.sin(this.age * 5) * 0.3;
        }

        return true;
    }

    dispose() {
        this.scene.remove(this.mesh);
        // Clean up geometries/materials if needed (optional)
        if (this.particles) {
            this.particles.geometry.dispose();
            this.particles.material.dispose();
        }
        if (this.glowSprite) {
            this.glowSprite.material.map.dispose();
            this.glowSprite.material.dispose();
        }
        // Note: mesh children's geometries/materials are not automatically disposed; but for a game with many hallucinations, we might need to.
        // For simplicity, we skip full disposal to avoid complexity.
    }
}