// core/Game.js – Main game class, owns scene, camera, renderer, and managers
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectManager } from '../effects/EffectManager.js';
import { SceneBuilder } from '../scene/SceneBuilder.js';
import { Lighting } from '../scene/Lighting.js';
import { AssetLoader } from './AssetLoader.js';
import { InputHandler } from './InputHandler.js';
import { Player } from './Player.js';
import { AudioManager } from '../audio/AudioManager.js';
import { UIManager } from '../ui/UIManager.js';
import { Constants } from '../utils/Constants.js';
import { Logger } from '../utils/Logger.js';

export class Game {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.clock = new THREE.Clock();
        
        // Managers (to be initialised)
        this.assetLoader = new AssetLoader();
        this.effectManager = null;
        this.inputHandler = null;
        this.player = null;
        this.audioManager = null;
        this.uiManager = null;
        
        // Game state
        this.isRunning = false;
        this.lastTime = 0;
    }
    
    async init() {
        Logger.info('Initialising game...');
        
        // Create core Three.js objects
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x111122);
        
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 1.7, 5); // approximate eye height
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // performance
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);
        
        // Controls (first-person-like, but we'll restrict later)
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = true;
        this.controls.maxPolarAngle = Math.PI / 2; // prevent going below floor
        this.controls.enableZoom = true;
        this.controls.target.set(0, 1.7, 0);
        
        // Load assets (textures, audio)
        await this.assetLoader.loadAll();
        
        // Build scene
        const sceneBuilder = new SceneBuilder(this.scene, this.assetLoader);
        sceneBuilder.build();
        
        // Setup lighting
        const lighting = new Lighting(this.scene);
        lighting.setup();
        
        // Initialise managers
        this.effectManager = new EffectManager(this.renderer, this.scene, this.camera, this.assetLoader);
        this.inputHandler = new InputHandler(this.renderer.domElement);
        this.player = new Player();
        this.audioManager = new AudioManager(this.assetLoader);
        this.uiManager = new UIManager(this.player);
        
        // Start audio ambient
        this.audioManager.playAmbient();
        
        // Register event listeners
        window.addEventListener('resize', this.onResize.bind(this));
        
        Logger.info('Game initialised');
    }
    
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();
        Logger.info('Game loop started');
    }
    
    gameLoop() {
        if (!this.isRunning) return;
        
        const deltaTime = this.clock.getDelta();
        const elapsedTime = performance.now() / 1000; // seconds
        
        // Update subsystems
        this.inputHandler.update();
        this.checkPillKey(); // Check for pill-taking key
        this.player.update(deltaTime, this.inputHandler);
        this.audioManager.update(this.player.intoxicationLevel);
        // Pass deltaTime to effectManager for smooth hallucinations
        this.effectManager.update(this.player.intoxicationLevel, elapsedTime, deltaTime);
        this.uiManager.update();
        
        // Custom movement (WASD)
        this.updateMovement(deltaTime);
        
        this.controls.update();
        
        // Render scene with effects
        this.effectManager.render();
        
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    updateMovement(deltaTime) {
        // Simple first-person movement using inputHandler keys
        const speed = 3.0 * deltaTime;
        const dir = new THREE.Vector3();
        this.camera.getWorldDirection(dir);
        dir.y = 0;
        dir.normalize();
        
        const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
        
        if (this.inputHandler.isKeyPressed('KeyW')) {
            this.camera.position.addScaledVector(dir, speed);
        }
        if (this.inputHandler.isKeyPressed('KeyS')) {
            this.camera.position.addScaledVector(dir, -speed);
        }
        if (this.inputHandler.isKeyPressed('KeyA')) {
            this.camera.position.addScaledVector(right, -speed);
        }
        if (this.inputHandler.isKeyPressed('KeyD')) {
            this.camera.position.addScaledVector(right, speed);
        }
        
        // Update controls target to look direction
        const lookAt = new THREE.Vector3().copy(this.camera.position).add(dir);
        this.controls.target.copy(lookAt);
    }
    
    /**
     * Check for pill-taking key (P) and trigger effects
     */
    checkPillKey() {
        if (this.inputHandler.isKeyPressed('KeyP')) {
            this.player.takePill();
            this.audioManager.takePill();
            this.uiManager.showMessage('You took a pill...', 2000);
            Logger.info(`Pill taken. Intoxication: ${this.player.intoxicationLevel.toFixed(2)}`);
        }
    }
    
    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.effectManager.onResize();
    }
}