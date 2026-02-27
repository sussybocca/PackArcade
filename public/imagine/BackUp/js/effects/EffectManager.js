// effects/EffectManager.js – Manages post-processing and dynamic hallucinations
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { VisualEffects } from './VisualEffects.js';
import { Hallucination } from '../entities/Hallucination.js';
import { Logger } from '../utils/Logger.js';

export class EffectManager {
    constructor(renderer, scene, camera, assetLoader) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.assetLoader = assetLoader;
        
        // Post-processing pipeline
        this.composer = new EffectComposer(renderer);
        const renderPass = new RenderPass(scene, camera);
        this.composer.addPass(renderPass);
        
        // Bloom pass
        this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        this.bloomPass.threshold = 0.1;
        this.bloomPass.strength = 1.2;
        this.bloomPass.radius = 0.5;
        this.composer.addPass(this.bloomPass);
        
        // Distortion pass
        this.distortionPass = new ShaderPass(VisualEffects.DistortionShader);
        this.distortionPass.uniforms['intensity'].value = 0.0;
        this.distortionPass.uniforms['time'].value = 0;
        this.composer.addPass(this.distortionPass);
        
        // Chromatic aberration pass
        this.chromaticPass = new ShaderPass(VisualEffects.ChromaticAberrationShader);
        this.chromaticPass.uniforms['amount'].value = 0.0;
        this.chromaticPass.uniforms['angle'].value = 0;
        this.composer.addPass(this.chromaticPass);
        
        // FXAA anti-aliasing pass (last)
        this.fxaaPass = new ShaderPass(FXAAShader);
        const pixelRatio = this.renderer.getPixelRatio();
        this.fxaaPass.uniforms['resolution'].value.x = 1 / (window.innerWidth * pixelRatio);
        this.fxaaPass.uniforms['resolution'].value.y = 1 / (window.innerHeight * pixelRatio);
        this.composer.addPass(this.fxaaPass);
        this.fxaaPass.renderToScreen = true; // last pass
        
        // Hallucination management
        this.hallucinations = [];
        this.lastSpawnTime = 0;
        this.spawnInterval = 1.0; // seconds between spawn attempts
        
        Logger.info('EffectManager initialized');
    }
    
    /**
     * Update all effects based on intoxication level and time
     * @param {number} intoxicationLevel - Current intoxication (0-1)
     * @param {number} time - Global elapsed time in seconds
     * @param {number} deltaTime - Time since last frame (for smooth updates)
     */
    update(intoxicationLevel, time, deltaTime = 1/60) {
        // Update shader intensities
        this.distortionPass.uniforms['intensity'].value = intoxicationLevel * 0.5;
        this.distortionPass.uniforms['time'].value = time;
        this.chromaticPass.uniforms['amount'].value = intoxicationLevel * 0.03;
        this.chromaticPass.uniforms['angle'].value = time * 0.5;
        this.bloomPass.strength = 1.0 + intoxicationLevel * 2.0;
        
        // Spawn hallucinations when intoxicated
        if (intoxicationLevel > 0.1) {
            if (time - this.lastSpawnTime > this.spawnInterval) {
                this.lastSpawnTime = time;
                // Spawn chance increases with intoxication
                const spawnChance = intoxicationLevel * 0.8;
                if (Math.random() < spawnChance) {
                    this.spawnHallucination();
                }
            }
        }
        
        // Update existing hallucinations
        for (let i = this.hallucinations.length - 1; i >= 0; i--) {
            const hallu = this.hallucinations[i];
            const isAlive = hallu.update(deltaTime);
            if (!isAlive) {
                this.scene.remove(hallu.mesh);
                this.hallucinations.splice(i, 1);
                Logger.debug('Hallucination removed');
            }
        }
    }
    
    spawnHallucination() {
        // Get player (camera) position
        const playerPos = this.camera.position.clone();
        
        // Spawn in a random direction, 2-4 units away
        const angle = Math.random() * Math.PI * 2;
        const dist = 2 + Math.random() * 2;
        const x = playerPos.x + Math.sin(angle) * dist;
        const z = playerPos.z + Math.cos(angle) * dist;
        const y = playerPos.y - 0.5 + Math.random() * 1.5; // around eye level
        
        const pos = new THREE.Vector3(x, y, z);
        
        // Random type
        const types = ['spider', 'shadow', 'eye', 'floater'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        Logger.info(`Spawning ${type} hallucination at (${x.toFixed(1)}, ${y.toFixed(1)}, ${z.toFixed(1)})`);
        
        try {
            const hallu = new Hallucination(this.scene, type, pos, this.assetLoader);
            this.hallucinations.push(hallu);
        } catch (e) {
            Logger.error('Failed to spawn hallucination:', e);
        }
    }
    
    render() {
        this.composer.render();
    }
    
    onResize() {
        this.composer.setSize(window.innerWidth, window.innerHeight);
        
        // Update FXAA resolution uniform
        const pixelRatio = this.renderer.getPixelRatio();
        this.fxaaPass.uniforms['resolution'].value.x = 1 / (window.innerWidth * pixelRatio);
        this.fxaaPass.uniforms['resolution'].value.y = 1 / (window.innerHeight * pixelRatio);
        
        Logger.debug('EffectManager resized');
    }
}