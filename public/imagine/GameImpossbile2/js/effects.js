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
    LUTEffect,
    ToneMappingEffect,
    SMAAEffect,
    ShockWaveEffect,
    GlitchEffect,
    SSAOEffect,
    PixelationEffect,
    NoiseEffect,
    GridEffect,
    TiltShiftEffect,
    TextureEffect,
    Effect,
    BlendFunction
} from 'postprocessing';
import { Nebula, SpriteRenderer } from 'three-nebula';
import GUI from 'lil-gui';

// ----------------------------------------------------------------------
// Custom GodRaysEffect – uses the imported Effect base class
// ----------------------------------------------------------------------
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

// ----------------------------------------------------------------------
// Main Effects Manager
// ----------------------------------------------------------------------
export class EffectsManager {
    constructor(renderer, camera, scene, options = {}) {
        this.camera = camera;
        this.scene = scene;
        this.renderer = renderer;
        this.options = options;

        const gl = renderer.getContext();
        if (gl) {
            this.hasFloatTextures = gl.getExtension('OES_texture_float') !== null;
            this.hasHalfFloatTextures = gl.getExtension('OES_texture_half_float') !== null;
        }

        this.originalCameraPos = camera.position.clone();
        this.shakeIntensity = 0;
        this.time = 0;

        this.composer = new EffectComposer(renderer);
        this.composer.addPass(new RenderPass(scene, camera));

        // --- Effects ---
        this.bloomEffect = new BloomEffect({
            intensity: 1.2,
            radius: 0.8,
            threshold: 0.1
        });

        this.dofEffect = new DepthOfFieldEffect(camera, {
            focusDistance: 10.0,
            focalLength: 0.15,
            bokehScale: 4.0
        });

        this.motionBlurEffect = new MotionBlurEffect({
            intensity: 1.0,
            jitter: 0.1
        });

        this.chromaticAberrationEffect = new ChromaticAberrationEffect({
            offset: new THREE.Vector2(0.001, 0.001)
        });

        this.vignetteEffect = new VignetteEffect({
            darkness: 0.6,
            offset: 0.3
        });

        // LUT for color grading (neutral)
        const lut = new THREE.DataTexture(new Uint8Array(32*32*32*4), 32, 32);
        lut.minFilter = THREE.LinearFilter;
        lut.magFilter = THREE.LinearFilter;
        this.lutEffect = new LUTEffect({ lut });

        this.toneMappingEffect = new ToneMappingEffect({
            mode: ToneMappingEffect.MODE_REINHARD,
            resolution: 256
        });

        this.smaaEffect = new SMAAEffect();

        this.ssaoEffect = new SSAOEffect(camera, {
            intensity: 1.0,
            radius: 2.0,
            bias: 0.1,
            samples: 16
        });

        this.pixelationEffect = new PixelationEffect(2.0);
        this.pixelationEffect.enabled = false;

        this.noiseEffect = new NoiseEffect({ intensity: 0.02 });
        this.noiseEffect.enabled = false;

        this.gridEffect = new GridEffect({
            size: 0.5,
            lineWidth: 0.01,
            color: 0xffffff
        });
        this.gridEffect.enabled = false;

        this.tiltShiftEffect = new TiltShiftEffect({
            focusArea: 0.5,
            blurStrength: 0.5
        });
        this.tiltShiftEffect.enabled = false;

        const flareTexture = this.createFlareTexture();
        this.lensFlareEffect = new TextureEffect({
            texture: flareTexture,
            blendFunction: BlendFunction.ADD
        });
        this.lensFlareEffect.enabled = false;

        // God Rays
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

        this.glitchEffect = new GlitchEffect({
            chromaticAberrationOffset: new THREE.Vector2(0.01, 0.01)
        });
        this.glitchEffect.enabled = false;

        this.shockWaveEffect = new ShockWaveEffect(camera, {
            speed: 2.0,
            size: 0.5
        });
        this.shockWaveEffect.enabled = false;

        // Combine all effects
        this.effects = [
            this.smaaEffect,
            this.ssaoEffect,
            this.bloomEffect,
            this.dofEffect,
            this.motionBlurEffect,
            this.chromaticAberrationEffect,
            this.vignetteEffect,
            this.lutEffect,
            this.toneMappingEffect,
            this.godRaysEffect,
            this.pixelationEffect,
            this.noiseEffect,
            this.gridEffect,
            this.tiltShiftEffect,
            this.lensFlareEffect,
            this.glitchEffect,
            this.shockWaveEffect
        ];

        this.effectPass = new EffectPass(camera, ...this.effects);
        this.effectPass.renderToScreen = true;
        this.composer.addPass(this.effectPass);

        if (options.gui !== false) {
            this.gui = new GUI({ title: 'Effects Control' });
            this.setupGUI();
        }

        this.initParticles();

        this.jumpscareActive = false;
        this.heartbeatIntensity = 0;
    }

    setupGUI() {
        const bloomFolder = this.gui.addFolder('Bloom');
        bloomFolder.add(this.bloomEffect, 'intensity', 0, 5).name('Intensity');
        bloomFolder.add(this.bloomEffect, 'radius', 0, 2).name('Radius');
        bloomFolder.add(this.bloomEffect, 'threshold', 0, 1).name('Threshold');
        bloomFolder.open();

        const dofFolder = this.gui.addFolder('Depth of Field');
        dofFolder.add(this.dofEffect, 'focusDistance', 0, 20).name('Focus Distance');
        dofFolder.add(this.dofEffect, 'focalLength', 0, 1).name('Focal Length');
        dofFolder.add(this.dofEffect, 'bokehScale', 0, 10).name('Bokeh Scale');
        dofFolder.open();

        const motionFolder = this.gui.addFolder('Motion Blur');
        motionFolder.add(this.motionBlurEffect, 'intensity', 0, 2).name('Intensity');
        motionFolder.add(this.motionBlurEffect, 'jitter', 0, 0.5).name('Jitter');
        motionFolder.open();

        const chromaFolder = this.gui.addFolder('Chromatic Aberration');
        chromaFolder.add(this.chromaticAberrationEffect.offset, 'x', 0, 0.02).name('Offset X');
        chromaFolder.add(this.chromaticAberrationEffect.offset, 'y', 0, 0.02).name('Offset Y');
        chromaFolder.open();

        const vignetteFolder = this.gui.addFolder('Vignette');
        vignetteFolder.add(this.vignetteEffect, 'darkness', 0, 1).name('Darkness');
        vignetteFolder.add(this.vignetteEffect, 'offset', 0, 1).name('Offset');
        vignetteFolder.open();

        const ssaoFolder = this.gui.addFolder('SSAO');
        ssaoFolder.add(this.ssaoEffect, 'intensity', 0, 5).name('Intensity');
        ssaoFolder.add(this.ssaoEffect, 'radius', 0, 5).name('Radius');
        ssaoFolder.add(this.ssaoEffect, 'bias', 0, 0.5).name('Bias');
        ssaoFolder.open();

        const extraFolder = this.gui.addFolder('Extra Effects');
        extraFolder.add(this.pixelationEffect, 'enabled').name('Pixelation');
        extraFolder.add(this.pixelationEffect, 'granularity', 1, 10).name('Pixel Size');
        extraFolder.add(this.noiseEffect, 'enabled').name('Noise');
        extraFolder.add(this.noiseEffect, 'intensity', 0, 0.5).name('Noise Intensity');
        extraFolder.add(this.gridEffect, 'enabled').name('Grid');
        extraFolder.add(this.tiltShiftEffect, 'enabled').name('Tilt‑Shift');
        extraFolder.add(this.lensFlareEffect, 'enabled').name('Lens Flare');
        extraFolder.open();
    }

    createFlareTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(255,255,255,0)';
        ctx.fillRect(0, 0, 64, 64);
        ctx.beginPath();
        ctx.arc(32, 32, 16, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 16);
        gradient.addColorStop(0, 'rgba(255,255,200,1)');
        gradient.addColorStop(0.5, 'rgba(255,200,100,0.5)');
        gradient.addColorStop(1, 'rgba(255,100,50,0)');
        ctx.fillStyle = gradient;
        ctx.fill();
        return new THREE.CanvasTexture(canvas);
    }

    initParticles() {
        this.nebula = new Nebula();
        const spriteRenderer = new SpriteRenderer(this.scene, THREE);
        const emitter = new Nebula.Emitter()
            .setRate(new Nebula.Rate(
                new Nebula.Span(10, 20),
                new Nebula.Span(0.1, 0.25)
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

        // Shockwave
        this.shockWaveEffect.enabled = true;
        this.shockWaveEffect.explode();

        // Glitch wild
        this.glitchEffect.enabled = true;
        this.glitchEffect.goWild = true;

        // Extreme chromatic aberration
        this.chromaticAberrationEffect.offset.set(0.02, 0.02);

        // Bloom burst
        this.bloomEffect.intensity = 3.0;

        // Camera shake
        this.shakeIntensity = 0.8;
        this.originalCameraPos.copy(this.camera.position);

        // Heartbeat
        this.heartbeatIntensity = 1.0;

        // Flash mesh
        const flashGeo = new THREE.PlaneGeometry(50, 50);
        const flashMat = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        const flash = new THREE.Mesh(flashGeo, flashMat);
        flash.position.copy(this.camera.position);
        flash.position.z -= 5;
        flash.rotation.copy(this.camera.rotation);
        this.scene.add(flash);
        setTimeout(() => this.scene.remove(flash), 100);

        // Reset after 1s
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
        this.chromaticAberrationEffect.offset.set(0.001 + level * 0.005, 0.001 + level * 0.005);
        this.bloomEffect.intensity = 1.0 + level * 0.5;
        this.motionBlurEffect.intensity = level * 0.5;
        this.vignetteEffect.darkness = 0.6 + level * 0.3;
        this.ssaoEffect.intensity = level * 2.0;
    }

    update(delta) {
        this.time += delta;

        // Particles
        this.nebula.update(delta);

        // Animate god ray light
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

        // Heartbeat FOV
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

    render() {
        this.composer.render();
    }

    dispose() {
        this.nebula.destroy();
        this.composer.dispose();
        this.scene.remove(this.godRayLight);
        if (this.gui) this.gui.destroy();
    }
}
