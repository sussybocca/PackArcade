import * as THREE from 'three';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GlitchPass } from 'three/addons/postprocessing/GlitchPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RGBShiftShader } from 'three/addons/shaders/RGBShiftShader.js';
import { AfterimagePass } from 'three/addons/postprocessing/AfterimagePass.js';
import { FilmPass } from 'three/addons/postprocessing/FilmPass.js';
import { DotScreenPass } from 'three/addons/postprocessing/DotScreenPass.js';

export class EffectsManager {
    constructor(composer, camera, scene) {
        this.composer = composer;
        this.camera = camera;
        this.scene = scene;
        
        // Store original camera position for shake effects
        this.originalCameraPos = camera.position.clone();
        this.shakeIntensity = 0;
        this.time = 0;
        
        // --- BLOOM PASS (Ethereal glow) ---
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight), 
            1.2,    // strength
            0.6,    // radius
            0.2     // threshold
        );
        this.bloomPass.threshold = 0.1;
        this.bloomPass.strength = 1.0;
        this.bloomPass.radius = 0.8;
        composer.addPass(this.bloomPass);

        // --- AFTERIMAGE PASS (Motion trails/ghosting) ---
        this.afterimagePass = new AfterimagePass(0.85); // damp factor
        this.afterimagePass.enabled = true;
        composer.addPass(this.afterimagePass);

        // --- FILM PASS (Grain/scanlines for horror atmosphere) ---
        this.filmPass = new FilmPass(
            0.25,      // noise intensity
            0.5,       // scanline intensity
            648,       // scanline count
            false      // grayscale
        );
        this.filmPass.renderToScreen = false;
        composer.addPass(this.filmPass);

        // --- GLITCH PASS (Digital distortion) ---
        this.glitchPass = new GlitchPass();
        this.glitchPass.goWild = false;
        this.glitchPass.enabled = true;
        composer.addPass(this.glitchPass);

        // --- RGB SHIFT PASS (Chromatic aberration) ---
        this.rgbShiftPass = new ShaderPass(RGBShiftShader);
        this.rgbShiftPass.uniforms['amount'].value = 0.002; // subtle default
        composer.addPass(this.rgbShiftPass);

        // --- DOT SCREEN PASS (Optional retro effect - disabled by default) ---
        this.dotScreenPass = new DotScreenPass(
            new THREE.Vector2(0, 0),
            0.5,
            0.8
        );
        this.dotScreenPass.enabled = false; // Disabled by default, enable during jumpscares
        composer.addPass(this.dotScreenPass);

        // --- CUSTOM SHADER PASS (Pulsing distortion) ---
        this.pulseShader = {
            uniforms: {
                tDiffuse: { value: null },
                time: { value: 0 },
                intensity: { value: 0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float time;
                uniform float intensity;
                varying vec2 vUv;

                void main() {
                    vec2 uv = vUv;
                    
                    // Pulsing distortion
                    float pulse = sin(uv.y * 10.0 + time * 5.0) * 0.02 * intensity;
                    uv.x += pulse;
                    
                    // Slight warping near edges
                    float distFromCenter = length(uv - 0.5);
                    uv += (uv - 0.5) * distFromCenter * 0.1 * intensity;
                    
                    vec4 color = texture2D(tDiffuse, uv);
                    
                    // Vignette (darker edges)
                    float vignette = 1.0 - distFromCenter * 0.8;
                    color.rgb *= vignette;
                    
                    gl_FragColor = color;
                }
            `
        };
        
        this.pulsePass = new ShaderPass(this.pulseShader);
        this.pulsePass.enabled = true;
        composer.addPass(this.pulsePass);

        // --- ADD ATMOSPHERIC VOLUMETRIC LIGHT EFFECT ---
        this.createVolumetricLight();

        // --- ADD FLOATING PARTICLES FOR ATMOSPHERE ---
        this.createAtmosphericParticles();

        // --- STATE VARIABLES ---
        this.jumpscareActive = false;
        this.heartbeatIntensity = 0;
        this.lastTime = performance.now() / 1000;
    }

    createVolumetricLight() {
        // Create a volumetric light beam using a custom mesh
        const geometry = new THREE.CylinderGeometry(0.5, 2.0, 10, 32, 1, true);
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color: { value: new THREE.Color(0xff5500) }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                varying vec3 vNormal;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * viewMatrix * worldPosition;
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 color;
                varying vec3 vWorldPosition;
                varying vec3 vNormal;
                
                void main() {
                    float alpha = abs(vNormal.y) * 0.3;
                    alpha *= 0.5 + 0.5 * sin(vWorldPosition.y * 2.0 + time * 3.0);
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
        });

        this.volumetricLight = new THREE.Mesh(geometry, material);
        this.volumetricLight.position.set(10, 5, 10);
        this.volumetricLight.rotation.x = Math.PI / 4;
        this.scene.add(this.volumetricLight);
    }

    createAtmosphericParticles() {
        // Create complex particle system for atmosphere
        const particleCount = 2000;
        const geometry = new THREE.BufferGeometry();
        
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            // Position in a spherical volume
            const radius = 15 + Math.random() * 20;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta) * 0.5; // Flatten vertically
            const z = radius * Math.cos(phi);
            
            positions[i*3] = x;
            positions[i*3+1] = y + 5;
            positions[i*3+2] = z;
            
            // Color based on position
            const color = new THREE.Color();
            if (Math.random() > 0.7) {
                color.setHSL(0.0, 0.9, 0.5); // Red
            } else if (Math.random() > 0.4) {
                color.setHSL(0.6, 0.8, 0.4); // Blue
            } else {
                color.setHSL(0.1, 0.8, 0.3); // Orange
            }
            
            colors[i*3] = color.r;
            colors[i*3+1] = color.g;
            colors[i*3+2] = color.b;
            
            sizes[i] = Math.random() * 0.5 + 0.2;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pointTexture: { value: this.createParticleTexture() }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                uniform float time;
                
                void main() {
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    
                    // Add subtle movement
                    mvPosition.x += sin(time * 0.5 + position.z) * 0.1;
                    mvPosition.z += cos(time * 0.3 + position.x) * 0.1;
                    
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform sampler2D pointTexture;
                varying vec3 vColor;
                
                void main() {
                    vec4 texColor = texture2D(pointTexture, gl_PointCoord);
                    gl_FragColor = vec4(vColor, 0.6) * texColor;
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.atmosphereParticles = new THREE.Points(geometry, material);
        this.scene.add(this.atmosphereParticles);
    }

    createParticleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        // Draw a soft glow
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(16, 16, 16, 0, Math.PI * 2);
        ctx.fill();
        
        // Add radial gradient for soft edge
        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.5, 'rgba(255,255,255,0.5)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 32, 32);
        
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    triggerJumpscare() {
        this.jumpscareActive = true;
        
        // --- INTENSE VISUAL EFFECTS ---
        
        // Wild glitch
        this.glitchPass.goWild = true;
        
        // Extreme RGB shift
        this.rgbShiftPass.uniforms['amount'].value = 0.05;
        
        // Bloom burst
        this.bloomPass.strength = 3.0;
        
        // Enable dot screen for distortion
        this.dotScreenPass.enabled = true;
        
        // Pulse intensity
        this.pulseShader.uniforms.intensity.value = 1.0;
        
        // Heavy afterimage
        this.afterimagePass.damp = 0.95;
        
        // Camera shake
        this.shakeIntensity = 0.8;
        this.originalCameraPos.copy(this.camera.position);
        
        // Heartbeat effect
        this.heartbeatIntensity = 1.0;

        // Create flash effect
        const flashGeometry = new THREE.PlaneGeometry(50, 50);
        const flashMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        flash.position.copy(this.camera.position);
        flash.position.z -= 5;
        flash.rotation.copy(this.camera.rotation);
        this.scene.add(flash);
        
        setTimeout(() => {
            this.scene.remove(flash);
        }, 100);

        // Reset after duration
        setTimeout(() => {
            this.glitchPass.goWild = false;
            this.rgbShiftPass.uniforms['amount'].value = 0.002;
            this.bloomPass.strength = 1.0;
            this.dotScreenPass.enabled = false;
            this.pulseShader.uniforms.intensity.value = 0.2;
            this.afterimagePass.damp = 0.85;
            this.jumpscareActive = false;
        }, 1000);
    }

    setIntensity(level) {
        // Adjust effects based on game intensity (0-1)
        this.rgbShiftPass.uniforms['amount'].value = 0.002 + level * 0.01;
        this.bloomPass.strength = 1.0 + level * 0.5;
        this.pulseShader.uniforms.intensity.value = 0.2 + level * 0.3;
        this.filmPass.uniforms.intensity.value = 0.25 + level * 0.3;
    }

    update(delta) {
        this.time += delta;
        
        // Update shader uniforms
        this.pulseShader.uniforms.time.value = this.time * 2;
        
        if (this.volumetricLight) {
            this.volumetricLight.material.uniforms.time.value = this.time;
            // Rotate slowly
            this.volumetricLight.rotation.y += delta * 0.2;
        }
        
        if (this.atmosphereParticles) {
            this.atmosphereParticles.material.uniforms.time.value = this.time;
            // Gentle rotation
            this.atmosphereParticles.rotation.y += delta * 0.02;
        }

        // Camera shake with smooth decay
        if (this.shakeIntensity > 0) {
            this.camera.position.x = this.originalCameraPos.x + (Math.random() - 0.5) * this.shakeIntensity;
            this.camera.position.y = this.originalCameraPos.y + (Math.random() - 0.5) * this.shakeIntensity * 0.3;
            this.camera.position.z = this.originalCameraPos.z + (Math.random() - 0.5) * this.shakeIntensity;
            this.shakeIntensity *= 0.92; // Smooth decay
            
            if (this.shakeIntensity < 0.01) {
                this.shakeIntensity = 0;
                this.camera.position.copy(this.originalCameraPos);
            }
        }

        // Heartbeat effect (pulsing FOV)
        if (this.heartbeatIntensity > 0) {
            const pulse = Math.sin(this.time * 20) * 0.1 * this.heartbeatIntensity;
            this.camera.fov = 75 + pulse;
            this.camera.updateProjectionMatrix();
            this.heartbeatIntensity *= 0.95;
            
            if (this.heartbeatIntensity < 0.01) {
                this.heartbeatIntensity = 0;
                this.camera.fov = 75;
                this.camera.updateProjectionMatrix();
            }
        }

        // Subtle breathing effect when not in jumpscare
        if (!this.jumpscareActive && this.shakeIntensity === 0) {
            const breath = Math.sin(this.time * 2) * 0.2;
            this.camera.position.y = this.originalCameraPos.y + breath * 0.05;
        }
    }

    // Clean up resources
    dispose() {
        if (this.atmosphereParticles) {
            this.scene.remove(this.atmosphereParticles);
            this.atmosphereParticles.geometry.dispose();
            this.atmosphereParticles.material.dispose();
        }
        
        if (this.volumetricLight) {
            this.scene.remove(this.volumetricLight);
            this.volumetricLight.geometry.dispose();
            this.volumetricLight.material.dispose();
        }
    }
}