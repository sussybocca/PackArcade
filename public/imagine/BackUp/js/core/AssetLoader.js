// core/AssetLoader.js – Loads textures and audio files, reports progress
import * as THREE from 'three';
import { Constants } from '../utils/Constants.js';
import { Logger } from '../utils/Logger.js';

export class AssetLoader {
    constructor() {
        this.textures = {};
        this.audioBuffers = {};
        this.loadingManager = new THREE.LoadingManager();
        this.textureLoader = new THREE.TextureLoader(this.loadingManager);
        this.audioLoader = new THREE.AudioLoader(); // uses AudioContext, but we'll just load buffers
        
        this.totalAssets = 0;
        this.loadedAssets = 0;
        
        // Set up loading manager callbacks
        this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            this.loadedAssets = itemsLoaded;
            this.totalAssets = itemsTotal;
            const percent = Math.round((itemsLoaded / itemsTotal) * 100);
            document.getElementById('loading-progress').textContent = percent + '%';
            Logger.debug(`Loading: ${url} (${itemsLoaded}/${itemsTotal})`);
        };
        
        this.loadingManager.onError = (url) => {
            Logger.error(`Error loading asset: ${url}`);
        };
    }
    
    async loadAll() {
        Logger.info('Starting asset loading...');
        
        // Define asset lists (user must provide these files in /assets/)
        const textureFiles = [
            { name: 'floor', path: 'assets/textures/floor.png' },
            { name: 'wall', path: 'assets/textures/wall.png' },
            { name: 'table', path: 'assets/textures/table.png' },
            { name: 'pill', path: 'assets/textures/pill.png' },
            { name: 'spider', path: 'assets/textures/spider.png' },
            { name: 'blood', path: 'assets/textures/blood.png' } // extra
        ];
        
        const audioFiles = [
            { name: 'ambient', path: 'assets/audio/ambient.mp3' },
            { name: 'takePill', path: 'assets/audio/take_pill.mp3' },
            { name: 'distortionLoop', path: 'assets/audio/distortion_loop.mp3' },
            { name: 'heartbeat', path: 'assets/audio/heartbeat.mp3' }
        ];
        
        this.totalAssets = textureFiles.length + audioFiles.length;
        
        // Load textures
        const texturePromises = textureFiles.map(file => 
            this.loadTexture(file.name, file.path)
        );
        
        // Load audio (as ArrayBuffer)
        const audioPromises = audioFiles.map(file => 
            this.loadAudio(file.name, file.path)
        );
        
        await Promise.all([...texturePromises, ...audioPromises]);
        
        Logger.info('All assets loaded successfully');
    }
    
    loadTexture(name, path) {
        return new Promise((resolve, reject) => {
            this.textureLoader.load(path, 
                (tex) => {
                    this.textures[name] = tex;
                    this.loadedAssets++;
                    resolve(tex);
                },
                undefined,
                (err) => {
                    Logger.warn(`Failed to load texture ${path}, using fallback.`);
                    // Create a fallback checkerboard texture
                    const canvas = document.createElement('canvas');
                    canvas.width = 512;
                    canvas.height = 512;
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = '#ff00ff';
                    ctx.fillRect(0, 0, 512, 512);
                    ctx.fillStyle = '#00ff00';
                    for (let i = 0; i < 8; i++) {
                        for (let j = 0; j < 8; j++) {
                            if ((i + j) % 2 === 0) {
                                ctx.fillRect(i*64, j*64, 64, 64);
                            }
                        }
                    }
                    const fallbackTex = new THREE.CanvasTexture(canvas);
                    this.textures[name] = fallbackTex;
                    this.loadedAssets++;
                    resolve(fallbackTex);
                }
            );
        });
    }
    
    loadAudio(name, path) {
        return new Promise((resolve, reject) => {
            this.audioLoader.load(path, 
                (buffer) => {
                    this.audioBuffers[name] = buffer;
                    this.loadedAssets++;
                    resolve(buffer);
                },
                undefined,
                (err) => {
                    Logger.warn(`Failed to load audio ${path}, will use silent fallback.`);
                    // Create empty buffer as fallback
                    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                    const emptyBuffer = audioCtx.createBuffer(1, 1, 22050);
                    this.audioBuffers[name] = emptyBuffer;
                    this.loadedAssets++;
                    resolve(emptyBuffer);
                }
            );
        });
    }
    
    getTexture(name) {
        return this.textures[name];
    }
    
    getAudioBuffer(name) {
        return this.audioBuffers[name];
    }
}