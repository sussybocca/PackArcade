import * as THREE from 'three';
import {
    EffectComposer,
    EffectPass,
    RenderPass,
    BloomEffect,
    DepthOfFieldEffect,
    MotionBlurEffect,
    ChromaticAberrationEffect,
    VignetteEffect,
    ColorGradingEffect,
    ToneMappingEffect,
    SMAAEffect,
    ShockWaveEffect,
    GlitchEffect,
    GodRaysEffect      // from postprocessing (if available)
} from 'postprocessing';
import { Nebula, SpriteRenderer } from 'three-nebula';

// If GodRaysEffect is not exported by your version, you can create a custom one:
// (Simplified version – replace with a proper implementation if needed)
class GodRaysEffect extends Effect {
    constructor(lightSource, options = {}) {
        super('GodRays', `
            uniform sampler2D tDiffuse;
            uniform vec3 lightPosition;
            uniform float exposure;
            uniform float decay;
            uniform float density;
            uniform float weight;
            uniform float clamp;
            uniform int samples;

            varying vec2 vUv;

            void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
                vec2 texCoord = uv;
                vec2 deltaTexCoord = texCoord - lightPosition.xy;
                deltaTexCoord *= 1.0 / float(samples) * density;
                float illuminationDecay = 1.0;
                vec4 color = texture2D(tDiffuse, texCoord);
                for(int i = 0; i < 100; i++) {
                    if(i >= samples) break;
                    texCoord -= deltaTexCoord;
                    vec4 sampleColor = texture2D(tDiffuse, texCoord);
                    sampleColor *= illuminationDecay * weight;
                    color += sampleColor;
                    illuminationDecay *= decay;
                }
                color *= exposure;
                outputColor = clamp(color, 0.0, clamp);
            }
        `, {
            uniforms: new Map([
                ['lightPosition', new THREE.Uniform(lightSource.position.clone())],
                ['exposure', new THREE.Uniform(options.exposure || 0.6)],
                ['decay', new THREE.Uniform(options.decay || 0.93)],
                ['density', new THREE.Uniform(options.density || 0.96)],
                ['weight', new THREE.Uniform(options.weight || 0.4)],
                ['clamp', new THREE.Uniform(options.clamp || 1.0)],
                ['samples', new THREE.Uniform(options.samples || 100)]
            ])
        });
        this.lightSource = lightSource;
    }
}

export class EffectsManager {
    constructor(renderer, camera, scene) {
        this.camera = camera;
        this.scene = scene;
        this.renderer = renderer;

        // Store original camera position for shake effects
        this.originalCameraPos = camera.position.clone();
        this.shakeIntensity = 0;
        this.time = 0;

        // Create a postprocessing EffectComposer
        this.composer = new EffectComposer(renderer);
        this.composer.addPass(new RenderPass(scene, camera));

        // --- BLOOM (ethereal glow) ---
        this.bloomEffect = new BloomEffect({
            intensity: 1.0,
            radius: 0.8,
            threshold: 0.1
        });

        // --- DEPTH OF FIELD (cinematic focus) ---
        this.dofEffect = new DepthOfFieldEffect(camera, {
            focusDistance: 10.0,   // distance from camera to focus plane
            focalLength: 0.15,      // how narrow the focus is
            bokehScale: 4.0         // blur intensity
        });

        // --- MOTION BLUR (responsive to movement) ---
        this.motionBlurEffect = new MotionBlurEffect({
            intensity: 1.0,
            jitter: 0.1
        });

        // --- CHROMATIC ABERRATION (realistic lens fringing) ---
        this.chromaticAberrationEffect = new ChromaticAberrationEffect({
            offset: new THREE.Vector2(0.001, 0.001)
        });

        // --- VIGNETTE (darkened edges) ---
        this.vignetteEffect = new VignetteEffect({
            darkness: 0.6,
            offset: 0.3
        });

        // --- COLOR GRADING (LUT-based) ---
        // Create a neutral LUT (you can load a custom one)
        const lut = new THREE.DataTexture(new Uint8Array(32*32*32*4), 32, 32);
        lut.minFilter = THREE.LinearFilter;
        lut.magFilter = THREE.LinearFilter;
        this.colorGradingEffect = new ColorGradingEffect({ lut });

        // --- TONE MAPPING (filmic) ---
        this.toneMappingEffect = new ToneMappingEffect({
            mode: ToneMappingEffect.MODE_REINHARD,
            resolution: 256
        });

        // --- SMAA (anti-aliasing) ---
        this.smaaEffect = new SMAAEffect();

        // --- GOD RAYS (volumetric light) ---
        // Create a light source for god rays (e.g., a bright point)
        this.godRayLight = new THREE.PointLight(0xffaa00, 2, 30);
        this.godRayLight.position.set(10, 10, 10);
        scene.add(this.godRayLight);

        this.godRaysEffect = new GodRaysEffect(this.godRayLight, {
            samples: 60,
            density: 0.97,
            decay: 0.95,
            weight: 0.5,
            exposure: 0.8
        });

        // --- GLITCH (digital distortion) ---
        this.glitchEffect = new GlitchEffect({
            chromaticAberrationOffset: new THREE.Vector2(0.01, 0.01)
        });

        // --- SHOCKWAVE (for jumpscares) ---
        this.shockWaveEffect = new ShockWaveEffect(camera, {
            speed: 2.0,
            size: 0.5
        });

        // --- Combine all effects into an EffectPass ---
        // Note: order matters! Apply effects in logical order.
        this.effects = [
            this.smaaEffect,                     // AA first
            this.bloomEffect,
            this.dofEffect,
            this.motionBlurEffect,
            this.chromaticAberrationEffect,
            this.vignetteEffect,
            this.colorGradingEffect,
            this.toneMappingEffect,
            this.godRaysEffect,
            this.glitchEffect,
            this.shockWaveEffect
        ];

        this.effectPass = new EffectPass(camera, ...this.effects);
        this.effectPass.renderToScreen = true;
        this.composer.addPass(this.effectPass);

        // Initially disable shockwave and glitch (they are triggered on demand)
        this.shockWaveEffect.enabled = false;
        this.glitchEffect.enabled = false;

        // --- STATE VARIABLES ---
        this.jumpscareActive = false;
        this.heartbeatIntensity = 0;

        // --- ATMOSPHERIC PARTICLES (using three-nebula) ---
        this.initParticles();
    }

    initParticles() {
        // Create a Nebula instance
        this.nebula = new Nebula();

        // Create a sprite renderer for glowing particles
        const spriteRenderer = new SpriteRenderer(this.scene, THREE);

        // Define a particle emitter
        const emitter = new Nebula.Emitter()
            .setRate(new Nebula.Rate(
                new Nebula.Span(10, 20),  // particles per second
                new Nebula.Span(0.1, 0.25) // burst
            ))
            .addInitializers([
                new Nebula.Position(new THREE.Vector3(0, 5, 0), 20, 5, 20),
                new Nebula.Life(2, 5),
                new Nebula.BodySprite(this.createParticleTexture()),
                new Nebula.RadialVelocity(45, new THREE.Vector3(0, 1, 0), 0.5),
                new Nebula.Mass(1)
            ])
            .addBehaviours([
                new Nebula.Rotate(0.1, 0.5),
                new Nebula.Scale(0.5, 0.1),
                new Nebula.Color(new THREE.Color(0xffaa00), new THREE.Color(0xff4400)),
                new Nebula.Force(new THREE.Vector3(0, -0.5, 0))
            ]);

        this.nebula.addEmitter(emitter);
        this.nebula.renderers = [spriteRenderer];
    }

    createParticleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.4, 'rgba(255,200,100,0.8)');
        gradient.addColorStop(0.6, 'rgba(255,100,50,0.4)');
        gradient.addColorStop(1, 'rgba(255,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 32, 32);
        return new THREE.CanvasTexture(canvas);
    }

    triggerJumpscare() {
        this.jumpscareActive = true;

        // --- INTENSE VISUAL EFFECTS ---

        // Shockwave at camera position
        this.shockWaveEffect.enabled = true;
        this.shockWaveEffect.explode();

        // Glitch wild mode
        this.glitchEffect.enabled = true;
        this.glitchEffect.goWild = true;

        // Extreme chromatic aberration
        this.chromaticAberrationEffect.offset.set(0.02, 0.02);

        // Bloom burst
        this.bloomEffect.intensity = 3.0;

        // Camera shake
        this.shakeIntensity = 0.8;
        this.originalCameraPos.copy(this.camera.position);

        // Heartbeat effect
        this.heartbeatIntensity = 1.0;

        // Create a flash mesh (simple)
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

        setTimeout(() => this.scene.remove(flash), 100);

        // Reset after duration
        setTimeout(() => {
            this.glitchEffect.enabled = false;
            this.glitchEffect.goWild = false;
            this.chromaticAberrationEffect.offset.set(0.001, 0.001);
            this.bloomEffect.intensity = 1.0;
            this.shockWaveEffect.enabled = false;
            this.jumpscareActive = false;
        }, 1000);
    }

    setIntensity(level) {
        // Adjust effects based on game intensity (0-1)
        this.chromaticAberrationEffect.offset.set(0.001 + level * 0.005, 0.001 + level * 0.005);
        this.bloomEffect.intensity = 1.0 + level * 0.5;
        this.motionBlurEffect.intensity = level * 0.5;
        this.vignetteEffect.darkness = 0.6 + level * 0.3;
    }

    update(delta) {
        this.time += delta;

        // Update particles
        this.nebula.update(delta);

        // Update god rays light position (optional animation)
        this.godRayLight.position.x = 10 + Math.sin(this.time * 0.3) * 5;
        this.godRayLight.position.z = 10 + Math.cos(this.time * 0.5) * 5;

        // Camera shake
        if (this.shakeIntensity > 0) {
            this.camera.position.x = this.originalCameraPos.x + (Math.random() - 0.5) * this.shakeIntensity;
            this.camera.position.y = this.originalCameraPos.y + (Math.random() - 0.5) * this.shakeIntensity * 0.3;
            this.camera.position.z = this.originalCameraPos.z + (Math.random() - 0.5) * this.shakeIntensity;
            this.shakeIntensity *= 0.92;
            if (this.shakeIntensity < 0.01) {
                this.shakeIntensity = 0;
                this.camera.position.copy(this.originalCameraPos);
            }
        }

        // Heartbeat FOV pulsing
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

        // Subtle breathing
        if (!this.jumpscareActive && this.shakeIntensity === 0) {
            const breath = Math.sin(this.time * 2) * 0.2;
            this.camera.position.y = this.originalCameraPos.y + breath * 0.05;
        }
    }

    // Render the composer (call this in your animation loop)
    render() {
        this.composer.render();
    }

    // Clean up resources
    dispose() {
        this.nebula.destroy();
        this.composer.dispose();
        // Remove custom objects from scene
        this.scene.remove(this.godRayLight);
        // ... any other disposals
    }
}
