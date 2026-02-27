// audio/AudioManager.js – Manages all audio playback and effects
import * as THREE from 'three';
import { AudioEffects } from '../effects/AudioEffects.js';
import { EffectConfig } from '../config/EffectConfig.js';
import { Logger } from '../utils/Logger.js';

export class AudioManager {
    constructor(assetLoader) {
        this.assetLoader = assetLoader;
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.listener = new THREE.AudioListener();
        
        this.sounds = {};
        this.activeSources = [];
        
        // Main ambient sound
        this.ambientSound = null;
        this.heartbeatSound = null;
        
        // Distortion effect chain
        this.effects = null;
    }
    
    init() {
        // Attach listener to camera (will be done in Game)
    }
    
    playAmbient() {
        const buffer = this.assetLoader.getAudioBuffer('ambient');
        if (!buffer) return;
        
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        
        // Create effect chain
        this.effects = new AudioEffects(this.audioContext, source);
        this.effects.connectChain();
        
        source.start(0);
        this.activeSources.push(source);
    }
    
    playHeartbeat() {
        const buffer = this.assetLoader.getAudioBuffer('heartbeat');
        if (!buffer) return;
        
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.connect(this.audioContext.destination);
        source.start(0);
        this.activeSources.push(source);
        this.heartbeatSound = source;
    }
    
    takePill() {
        const buffer = this.assetLoader.getAudioBuffer('takePill');
        if (!buffer) return;
        
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioContext.destination);
        source.start(0);
        this.activeSources.push(source);
    }
    
    update(intoxicationLevel) {
        if (this.effects) {
            this.effects.setIntoxicationLevel(intoxicationLevel);
        }
        
        // Heartbeat starts at threshold
        if (intoxicationLevel > EffectConfig.AUDIO.HEARTBEAT_THRESHOLD && !this.heartbeatSound) {
            this.playHeartbeat();
        } else if (intoxicationLevel <= EffectConfig.AUDIO.HEARTBEAT_THRESHOLD && this.heartbeatSound) {
            this.heartbeatSound.stop();
            this.heartbeatSound = null;
        }
        
        // Adjust volume or other parameters
    }
}