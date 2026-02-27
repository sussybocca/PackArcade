// entities/Hallucination.js – Next-level immersive hallucinations with custom shaders and advanced effects
import * as THREE from 'three';
import { MathUtils } from '../utils/MathUtils.js'; // kept for clamp, lerp, etc. (minimal)

export class Hallucination {
    constructor(scene, type, position, assetLoader = null) {
        this.scene = scene;
        this.type = type;
        this.assetLoader = assetLoader;
        this.mesh = null;
        this.particles = [];          // multiple particle systems
        this.glowSprites = [];         // multiple sprites for layered glow
        this.lifeTime = 8.0 + Math.random() * 5; // 8-13 sec
        this.age = 0;
        this.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.04,
            (Math.random() - 0.5) * 0.03,
            (Math.random() - 0.5) * 0.04
        );
        this.rotationSpeed = new THREE.Vector3(
            (Math.random() - 0.5) * 0.03,
            (Math.random() - 0.5) * 0.03,
            (Math.random() - 0.5) * 0.03
        );
        this.baseScale = 1.0 + Math.random() * 2.0; // 1-3
        this.pulseSpeed = 1.5 + Math.random() * 2.5;
        this.opacity = 1.0;
        this.fadeOut = false;
        this.customData = {}; // for type-specific state

        this.createMesh();
        if (position) this.mesh.position.copy(position);
        this.scene.add(this.mesh);
        this.addSpecialEffects();
    }

    createMesh() {
        switch (this.type) {
            case 'spider':   this.createSpider(); break;
            case 'shadow':   this.createShadow(); break;
            case 'eye':      this.createEye(); break;
            case 'floater':  this.createFloater(); break;
            case 'face':     this.createFace(); break;
            case 'skull':    this.createSkull(); break;
            case 'hand':     this.createHand(); break;
            case 'tentacle': this.createTentacle(); break;
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
            ? new THREE.MeshStandardMaterial({ map: spiderTex, emissive: 0x331100, emissiveIntensity: 0.5 })
            : new THREE.MeshPhongMaterial({ color: 0x442211, emissive: 0x220000, shininess: 30 });

        // Body (three segments for more realism)
        const body1 = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16), bodyMat);
        body1.position.set(0, 0.15, 0);
        group.add(body1);
        const body2 = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12), bodyMat);
        body2.position.set(0.25, 0.2, 0);
        group.add(body2);
        const body3 = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10), bodyMat);
        body3.position.set(0.45, 0.18, 0);
        group.add(body3);

        // Head with fangs
        const headMat = new THREE.MeshStandardMaterial({ color: 0x332211, emissive: 0x110000 });
        const head = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.2, 8), headMat);
        head.position.set(0.6, 0.22, 0);
        head.rotation.x = 0.3;
        group.add(head);
        const fangGeom = new THREE.ConeGeometry(0.04, 0.12, 4);
        const fangL = new THREE.Mesh(fangGeom, new THREE.MeshStandardMaterial({ color: 0x111111 }));
        fangL.position.set(0.68, 0.16, 0.07);
        fangL.rotation.z = -0.3;
        group.add(fangL);
        const fangR = new THREE.Mesh(fangGeom, new THREE.MeshStandardMaterial({ color: 0x111111 }));
        fangR.position.set(0.68, 0.16, -0.07);
        fangR.rotation.z = 0.3;
        group.add(fangR);

        // Eyes (glowing red with lens flare effect via sprite)
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0xff3333, emissive: 0x550000 });
        const eyeGeom = new THREE.SphereGeometry(0.08, 8);
        const eyeL = new THREE.Mesh(eyeGeom, eyeMat);
        eyeL.position.set(0.55, 0.28, 0.09);
        group.add(eyeL);
        const eyeR = new THREE.Mesh(eyeGeom, eyeMat);
        eyeR.position.set(0.55, 0.28, -0.09);
        group.add(eyeR);

        // Legs (8 with multiple joints)
        const legMat = new THREE.MeshStandardMaterial({ color: 0x332211 });
        const legJoint = (x, y, z, angle, length, dir) => {
            const seg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, length*0.4, 5), legMat);
            seg1.position.set(x, y, z);
            seg1.rotation.z = angle;
            seg1.rotation.x = dir * 0.3;
            group.add(seg1);
            const seg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, length*0.4, 5), legMat);
            seg2.position.set(x + Math.sin(angle)*length*0.2, y-0.02, z + Math.cos(angle)*length*0.2);
            seg2.rotation.z = angle + 0.5;
            group.add(seg2);
            const seg3 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, length*0.3, 5), legMat);
            seg3.position.set(x + Math.sin(angle)*length*0.4, y-0.04, z + Math.cos(angle)*length*0.4);
            seg3.rotation.z = angle + 0.8;
            group.add(seg3);
        };
        // Pairs at different angles
        legJoint(-0.2, 0.1, 0.2,  0.5, 0.7, 1);
        legJoint(-0.2, 0.1, -0.2, -0.5, 0.7, -1);
        legJoint( 0.1, 0.15, 0.2,  0.8, 0.6, 1);
        legJoint( 0.1, 0.15, -0.2, -0.8, 0.6, -1);
        legJoint( 0.3, 0.12, 0.15, 1.1, 0.5, 1);
        legJoint( 0.3, 0.12, -0.15, -1.1, 0.5, -1);
        legJoint( 0.5, 0.1, 0.1,  1.4, 0.4, 1);
        legJoint( 0.5, 0.1, -0.1, -1.4, 0.4, -1);

        // Hairs (many tiny cones)
        const hairMat = new THREE.MeshStandardMaterial({ color: 0x221100 });
        for (let i = 0; i < 30; i++) {
            const spike = new THREE.Mesh(new THREE.ConeGeometry(0.01, 0.08, 3), hairMat);
            spike.position.set(Math.random()*0.8-0.2, Math.random()*0.3+0.1, Math.random()*0.5-0.25);
            spike.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
            group.add(spike);
        }

        this.mesh = group;
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.scale.set(this.baseScale*0.8, this.baseScale*0.8, this.baseScale*0.8);
    }

    // ========== SHADOW ==========
    createShadow() {
        const group = new THREE.Group();
        const mat = new THREE.MeshPhongMaterial({
            color: 0x111111,
            emissive: 0x222222,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide,
            shininess: 10
        });

        // Body (more detailed)
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.6, 12), mat);
        body.position.y = 0.8;
        group.add(body);

        // Head
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10), mat);
        head.position.y = 1.7;
        group.add(head);

        // Arms with multiple segments
        const armGeom = new THREE.CylinderGeometry(0.1, 0.1, 0.9, 6);
        const armL = new THREE.Mesh(armGeom, mat);
        armL.position.set(-0.5, 1.2, 0);
        armL.rotation.z = 0.4;
        armL.rotation.x = 0.2;
        group.add(armL);
        const armR = new THREE.Mesh(armGeom, mat);
        armR.position.set(0.5, 1.2, 0);
        armR.rotation.z = -0.4;
        armR.rotation.x = -0.2;
        group.add(armR);

        // Hands (claws)
        const clawMat = new THREE.MeshStandardMaterial({ color: 0x333333, emissive: 0x110000 });
        const clawGeom = new THREE.ConeGeometry(0.12, 0.25, 4);
        const handL = new THREE.Mesh(clawGeom, clawMat);
        handL.position.set(-0.9, 1.1, 0.2);
        handL.rotation.z = 0.2;
        group.add(handL);
        const handR = new THREE.Mesh(clawGeom, clawMat);
        handR.position.set(0.9, 1.1, -0.2);
        handR.rotation.z = -0.2;
        group.add(handR);

        // Red eyes with glow
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0x440000 });
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6), eyeMat);
        eyeL.position.set(-0.15, 1.75, 0.25);
        group.add(eyeL);
        const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6), eyeMat);
        eyeR.position.set(0.15, 1.75, 0.25);
        group.add(eyeR);

        this.mesh = group;
        this.mesh.castShadow = true;
        this.mesh.scale.set(this.baseScale, this.baseScale, this.baseScale);
    }

    // ========== EYE ==========
    createEye() {
        const group = new THREE.Group();
        // Use custom shader for realistic eye with vein movement
        const whiteMat = new THREE.MeshPhongMaterial({ color: 0xeeeeee, emissive: 0x442222, shininess: 50 });
        const pupilMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const veinMat = new THREE.MeshStandardMaterial({ color: 0xaa2222 });

        // Eyeball (slightly oblong)
        const eyeball = new THREE.Mesh(new THREE.SphereGeometry(0.35, 32), whiteMat);
        eyeball.scale.set(1, 1, 0.9);
        group.add(eyeball);

        // Iris (textured ring)
        const irisMat = new THREE.MeshPhongMaterial({ color: 0x44aa44, emissive: 0x113311 });
        const iris = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.04, 16, 32), irisMat);
        iris.rotation.x = Math.PI/2;
        iris.position.set(0, 0, 0.3);
        group.add(iris);

        // Pupil (black sphere)
        const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16), pupilMat);
        pupil.position.set(0, 0, 0.38);
        group.add(pupil);

        // Blood vessels (curved cylinders)
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const vessel = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.01, 6, 20, Math.PI/2), veinMat);
            vessel.rotation.y = angle;
            vessel.rotation.x = 0.3;
            vessel.position.set(Math.sin(angle)*0.1, Math.cos(angle)*0.1, 0.15);
            group.add(vessel);
        }

        // Inner glow (emissive sphere)
        const glowMat = new THREE.MeshStandardMaterial({ color: 0xffaa88, emissive: 0x552211, transparent: true, opacity: 0.4 });
        const glow = new THREE.Mesh(new THREE.SphereGeometry(0.4, 24), glowMat);
        group.add(glow);

        this.mesh = group;
        this.mesh.scale.set(this.baseScale, this.baseScale, this.baseScale);
    }

    // ========== FLOATER ==========
    createFloater() {
        // Use a custom shader material for iridescent, pulsating knot
        const uniforms = {
            time: { value: 0 },
            color1: { value: new THREE.Color(0xff44aa) },
            color2: { value: new THREE.Color(0x44ffaa) },
            intensity: { value: 1.0 }
        };
        const vertexShader = `
            varying vec3 vPosition;
            varying float vDist;
            void main() {
                vPosition = position;
                vDist = length(position);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
        const fragmentShader = `
            uniform float time;
            uniform vec3 color1;
            uniform vec3 color2;
            uniform float intensity;
            varying vec3 vPosition;
            varying float vDist;
            void main() {
                float t = sin(vDist * 5.0 - time * 3.0) * 0.5 + 0.5;
                vec3 col = mix(color1, color2, t);
                float alpha = 0.7 + 0.3 * sin(vDist * 10.0 - time * 5.0);
                gl_FragColor = vec4(col * intensity, alpha);
            }
        `;
        const shaderMat = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            transparent: true,
            side: THREE.DoubleSide,
            wireframe: false
        });

        const geom = new THREE.TorusKnotGeometry(0.25, 0.08, 180, 24);
        this.mesh = new THREE.Mesh(geom, shaderMat);
        this.customData.shaderUniforms = uniforms;
        this.mesh.scale.set(this.baseScale, this.baseScale, this.baseScale);
    }

    // ========== FACE ==========
    createFace() {
        const group = new THREE.Group();
        const skinMat = new THREE.MeshPhongMaterial({ color: 0xeeddcc, emissive: 0x331100, shininess: 20 });
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const pupilMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const mouthMat = new THREE.MeshStandardMaterial({ color: 0x330000 });

        // Head (elongated)
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24), skinMat);
        head.scale.set(0.9, 1.1, 0.8);
        group.add(head);

        // Eye sockets
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12), eyeMat);
        eyeL.position.set(-0.15, 0.15, 0.25);
        group.add(eyeL);
        const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12), eyeMat);
        eyeR.position.set(0.15, 0.15, 0.25);
        group.add(eyeR);

        // Pupils (moving)
        const pupilL = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8), pupilMat);
        pupilL.position.set(-0.15, 0.15, 0.35);
        group.add(pupilL);
        const pupilR = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8), pupilMat);
        pupilR.position.set(0.15, 0.15, 0.35);
        group.add(pupilR);

        // Mouth (open, screaming)
        const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.03, 8, 20, Math.PI), mouthMat);
        mouth.rotation.x = Math.PI/2;
        mouth.rotation.z = Math.PI;
        mouth.position.set(0, -0.1, 0.28);
        group.add(mouth);
        // Tongue
        const tongue = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.1, 6), new THREE.MeshStandardMaterial({ color: 0xff6666 }));
        tongue.position.set(0, -0.15, 0.35);
        tongue.rotation.x = 0.3;
        group.add(tongue);

        // Tears (glowing)
        const tearMat = new THREE.MeshStandardMaterial({ color: 0x88aaff, emissive: 0x224488, transparent: true, opacity: 0.7 });
        const tearL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4), tearMat);
        tearL.position.set(-0.2, 0.0, 0.3);
        group.add(tearL);
        const tearR = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4), tearMat);
        tearR.position.set(0.2, 0.0, 0.3);
        group.add(tearR);

        this.mesh = group;
        this.mesh.scale.set(this.baseScale*0.7, this.baseScale*0.7, this.baseScale*0.7);
    }

    // ========== SKULL ==========
    createSkull() {
        const group = new THREE.Group();
        const boneMat = new THREE.MeshPhongMaterial({ color: 0xeeddcc, emissive: 0x442211, shininess: 40 });

        // Main skull
        const skull = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24), boneMat);
        skull.scale.set(0.9, 1.1, 0.8);
        group.add(skull);

        // Jaw
        const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16), boneMat);
        jaw.position.set(0, -0.15, 0.2);
        jaw.scale.set(0.9, 0.5, 0.8);
        group.add(jaw);

        // Eye sockets (black)
        const socketMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const socketL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8), socketMat);
        socketL.position.set(-0.15, 0.15, 0.25);
        group.add(socketL);
        const socketR = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8), socketMat);
        socketR.position.set(0.15, 0.15, 0.25);
        group.add(socketR);

        // Nose hole
        const nose = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.1, 4), socketMat);
        nose.position.set(0, 0.05, 0.3);
        group.add(nose);

        // Teeth
        const toothMat = new THREE.MeshStandardMaterial({ color: 0xffffdd });
        for (let i = -3; i <= 3; i++) {
            const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.04), toothMat);
            tooth.position.set(i*0.07, -0.1, 0.35);
            group.add(tooth);
        }

        // Cracks (using lines, but we can add small dark lines via geometry – simpler to use emissive lines)
        // Not implemented for brevity, but we could add a few thin cylinders as cracks

        this.mesh = group;
        this.mesh.scale.set(this.baseScale, this.baseScale, this.baseScale);
    }

    // ========== HAND ==========
    createHand() {
        const group = new THREE.Group();
        const skinMat = new THREE.MeshPhongMaterial({ color: 0xccaa88, emissive: 0x331100, shininess: 30 });

        // Palm
        const palm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.2), skinMat);
        palm.position.set(0, 0, 0);
        group.add(palm);

        // Fingers (4)
        const fingerGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.25, 6);
        for (let i = -1; i <= 2; i++) {
            const finger = new THREE.Mesh(fingerGeom, skinMat);
            finger.position.set(i*0.1, 0.15, 0);
            finger.rotation.x = 0.2;
            group.add(finger);
        }

        // Thumb
        const thumb = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.2, 6), skinMat);
        thumb.position.set(-0.15, 0.1, -0.1);
        thumb.rotation.z = 0.5;
        thumb.rotation.x = -0.3;
        group.add(thumb);

        // Fingernails (small cubes)
        const nailMat = new THREE.MeshStandardMaterial({ color: 0xaa8866 });
        for (let i = -1; i <= 2; i++) {
            const nail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 0.04), nailMat);
            nail.position.set(i*0.1, 0.27, 0.03);
            group.add(nail);
        }

        // Blood dripping (particles) – will be added in addSpecialEffects
        this.customData.isHand = true;
        this.mesh = group;
        this.mesh.scale.set(this.baseScale, this.baseScale, this.baseScale);
    }

    // ========== TENTACLE ==========
    createTentacle() {
        // A segmented, bending tentacle
        const group = new THREE.Group();
        const mat = new THREE.MeshPhongMaterial({ color: 0x884422, emissive: 0x221100, shininess: 20 });

        const segments = 10;
        const segmentLength = 0.15;
        for (let i = 0; i < segments; i++) {
            const geom = new THREE.SphereGeometry(0.1 * (1 - i/segments*0.5), 8);
            const seg = new THREE.Mesh(geom, mat);
            seg.position.y = i * segmentLength;
            group.add(seg);
        }
        // Tip
        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.15, 6), mat);
        tip.position.y = segments * segmentLength;
        group.add(tip);

        // Suckers (small spheres)
        const suckerMat = new THREE.MeshStandardMaterial({ color: 0xaa6644 });
        for (let i = 1; i < segments; i+=2) {
            const sucker = new THREE.Mesh(new THREE.SphereGeometry(0.03, 4), suckerMat);
            sucker.position.set(0.08, i*segmentLength, 0.05);
            group.add(sucker);
        }

        this.mesh = group;
        this.mesh.scale.set(this.baseScale, this.baseScale, this.baseScale);
        this.customData.segments = segments;
        this.customData.segmentLength = segmentLength;
    }

    createGeneric() {
        const geom = new THREE.IcosahedronGeometry(0.3, 2);
        const mat = new THREE.MeshPhongMaterial({ color: 0x88ff88, emissive: 0x224422, shininess: 50, wireframe: true });
        this.mesh = new THREE.Mesh(geom, mat);
        this.mesh.scale.set(this.baseScale, this.baseScale, this.baseScale);
    }

    // Add particle glow and sprite
    addSpecialEffects() {
        // Glowing particles (multiple layers)
        const particleCount = 40;
        const particleGeom = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount; i++) {
            const r = 0.7 + Math.random() * 0.8;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            positions[i*3] = Math.sin(phi) * Math.cos(theta) * r;
            positions[i*3+1] = Math.sin(phi) * Math.sin(theta) * r;
            positions[i*3+2] = Math.cos(phi) * r;
            // Random colors
            colors[i*3] = Math.random() * 0.8 + 0.2;
            colors[i*3+1] = Math.random() * 0.5;
            colors[i*3+2] = Math.random() * 0.5 + 0.2;
        }
        particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particleMat = new THREE.PointsMaterial({
            size: 0.05,
            vertexColors: true,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const particles = new THREE.Points(particleGeom, particleMat);
        this.mesh.add(particles);
        this.particles.push(particles);

        // Second layer (finer, faster)
        const particleGeom2 = new THREE.BufferGeometry();
        const positions2 = new Float32Array(20 * 3);
        for (let i = 0; i < 20; i++) {
            const r = 1.0 + Math.random() * 1.0;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            positions2[i*3] = Math.sin(phi) * Math.cos(theta) * r;
            positions2[i*3+1] = Math.sin(phi) * Math.sin(theta) * r;
            positions2[i*3+2] = Math.cos(phi) * r;
        }
        particleGeom2.setAttribute('position', new THREE.BufferAttribute(positions2, 3));
        const particleMat2 = new THREE.PointsMaterial({
            color: 0xffaa88,
            size: 0.03,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const particles2 = new THREE.Points(particleGeom2, particleMat2);
        this.mesh.add(particles2);
        this.particles.push(particles2);

        // Glow sprites (multiple)
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255,200,150,1)');
        gradient.addColorStop(0.4, 'rgba(255,100,50,0.8)');
        gradient.addColorStop(0.8, 'rgba(255,0,0,0.2)');
        gradient.addColorStop(1, 'rgba(255,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
        const texture = new THREE.CanvasTexture(canvas);

        const spriteMat = new THREE.SpriteMaterial({ map: texture, blending: THREE.AdditiveBlending, depthTest: false });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(2.0, 2.0, 1);
        this.mesh.add(sprite);
        this.glowSprites.push(sprite);

        // Second sprite (different color)
        const canvas2 = document.createElement('canvas');
        canvas2.width = 64;
        canvas2.height = 64;
        const ctx2 = canvas2.getContext('2d');
        const gradient2 = ctx2.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient2.addColorStop(0, 'rgba(100,200,255,1)');
        gradient2.addColorStop(0.5, 'rgba(50,100,255,0.6)');
        gradient2.addColorStop(1, 'rgba(0,0,255,0)');
        ctx2.fillStyle = gradient2;
        ctx2.fillRect(0, 0, 64, 64);
        const texture2 = new THREE.CanvasTexture(canvas2);
        const spriteMat2 = new THREE.SpriteMaterial({ map: texture2, blending: THREE.AdditiveBlending, depthTest: false });
        const sprite2 = new THREE.Sprite(spriteMat2);
        sprite2.scale.set(1.5, 1.5, 1);
        this.mesh.add(sprite2);
        this.glowSprites.push(sprite2);

        // If hand, add blood particles
        if (this.customData.isHand) {
            const bloodGeom = new THREE.BufferGeometry();
            const bloodPos = new Float32Array(15 * 3);
            for (let i = 0; i < 15; i++) {
                bloodPos[i*3] = (Math.random() - 0.5) * 0.4;
                bloodPos[i*3+1] = -Math.random() * 0.5;
                bloodPos[i*3+2] = (Math.random() - 0.5) * 0.2;
            }
            bloodGeom.setAttribute('position', new THREE.BufferAttribute(bloodPos, 3));
            const bloodMat = new THREE.PointsMaterial({ color: 0xaa2222, size: 0.03, blending: THREE.AdditiveBlending });
            const blood = new THREE.Points(bloodGeom, bloodMat);
            this.mesh.add(blood);
            this.particles.push(blood);
        }
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
            // Scale down
            this.mesh.scale.setScalar(this.baseScale * (0.5 + 0.5 * (1 - t)));
        }

        if (this.age > this.lifeTime) {
            this.dispose();
            return false;
        }

        // Type‑specific animations
        switch (this.type) {
            case 'spider':
                this.velocity.x += (Math.random() - 0.5) * 0.015;
                this.velocity.z += (Math.random() - 0.5) * 0.015;
                this.velocity.clampLength(0, 0.08);
                this.mesh.position.x += this.velocity.x * deltaTime * 30;
                this.mesh.position.z += this.velocity.z * deltaTime * 30;
                this.mesh.position.y += Math.sin(this.age * 8) * 0.02;
                if (this.velocity.length() > 0.001)
                    this.mesh.rotation.y = Math.atan2(this.velocity.x, this.velocity.z);
                break;

            case 'shadow':
                this.mesh.position.y += Math.sin(this.age * 3) * 0.03;
                this.mesh.rotation.y += 0.01;
                if (this.mesh.children[2] && this.mesh.children[3]) {
                    this.mesh.children[2].rotation.z = 0.4 + Math.sin(this.age * 5) * 0.3;
                    this.mesh.children[3].rotation.z = -0.4 + Math.sin(this.age * 5 + 2) * 0.3;
                }
                break;

            case 'eye':
                this.mesh.rotation.y += 0.02;
                this.mesh.rotation.x += 0.01;
                if (this.mesh.children[2]) { // pupil
                    this.mesh.children[2].position.x = 0.1 + Math.sin(this.age * 4) * 0.1;
                    this.mesh.children[2].position.y = 0.1 + Math.cos(this.age * 3) * 0.1;
                }
                // Dilate pupil
                if (this.mesh.children[2]) {
                    const scale = 1.0 + Math.sin(this.age * 6) * 0.2;
                    this.mesh.children[2].scale.set(scale, scale, scale);
                }
                break;

            case 'floater':
                if (this.customData.shaderUniforms) {
                    this.customData.shaderUniforms.time.value = this.age;
                }
                this.mesh.rotation.x += 0.01;
                this.mesh.rotation.y += 0.02;
                break;

            case 'face':
                this.mesh.position.y += Math.sin(this.age * 4) * 0.04;
                this.mesh.rotation.y += 0.02;
                if (this.mesh.children[5]) { // mouth
                    this.mesh.children[5].scale.y = 0.8 + Math.sin(this.age * 10) * 0.3;
                }
                // Eyes move
                if (this.mesh.children[2] && this.mesh.children[3]) {
                    this.mesh.children[2].position.x = -0.15 + Math.sin(this.age * 5) * 0.05;
                    this.mesh.children[3].position.x = 0.15 + Math.cos(this.age * 5) * 0.05;
                }
                break;

            case 'skull':
                this.mesh.rotation.y += 0.01;
                this.mesh.rotation.x += Math.sin(this.age) * 0.005;
                break;

            case 'hand':
                this.mesh.rotation.z += Math.sin(this.age * 2) * 0.02;
                this.mesh.position.y += Math.sin(this.age * 5) * 0.02;
                break;

            case 'tentacle':
                // Sinusoidal bending
                for (let i = 0; i < this.customData.segments; i++) {
                    const seg = this.mesh.children[i];
                    if (seg) {
                        seg.position.x = Math.sin(this.age * 3 + i * 0.5) * 0.1;
                        seg.position.z = Math.cos(this.age * 2 + i * 0.3) * 0.1;
                    }
                }
                break;

            default:
                this.mesh.position.y += Math.sin(this.age * 3) * 0.02;
                this.mesh.rotation.y += 0.01;
        }

        // Update particles (rotate)
        this.particles.forEach((p, idx) => {
            p.rotation.y += 0.01 * (idx+1);
            p.rotation.x += 0.005 * (idx+1);
        });
        this.glowSprites.forEach((s, idx) => {
            s.material.opacity = 0.5 + Math.sin(this.age * (5 + idx)) * 0.3;
        });

        return true;
    }

    dispose() {
        this.scene.remove(this.mesh);
        // Clean up geometries and materials to prevent memory leaks
        this.mesh.traverse(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(m => m.dispose());
                } else {
                    obj.material.dispose();
                }
            }
        });
        this.particles.forEach(p => {
            p.geometry.dispose();
            p.material.dispose();
        });
        this.glowSprites.forEach(s => {
            s.material.map.dispose();
            s.material.dispose();
        });
    }
}