import * as THREE from 'three';

export class AudioManager {
    constructor(camera) {
        this.camera = camera;
        this.listener = new THREE.AudioListener();
        camera.add(this.listener);

        this.ambientSound = new THREE.Audio(this.listener);
        this.footstepsSound = new THREE.Audio(this.listener);
        this.jumpscareSound = new THREE.Audio(this.listener);
        
        this.audioLoaded = {
            ambient: false,
            footsteps: false,
            jumpscare: false
        };

        // Load all audio files
        this.loadAudio();
    }

    loadAudio() {
        const audioLoader = new THREE.AudioLoader();
        
        // Load ambient (looping)
        audioLoader.load('./assets/audio/ambient.mp3', 
            (buffer) => { 
                this.ambientSound.setBuffer(buffer); 
                this.ambientSound.setLoop(true); 
                this.ambientSound.setVolume(0.3);
                this.audioLoaded.ambient = true;
                console.log('Ambient audio loaded');
            },
            undefined,
            (err) => { console.warn('Ambient audio not found (this is OK if files not added yet):', err); }
        );
        
        // Load footsteps (looping)
        audioLoader.load('./assets/audio/footsteps.mp3', 
            (buffer) => { 
                this.footstepsSound.setBuffer(buffer); 
                this.footstepsSound.setLoop(true); 
                this.footstepsSound.setVolume(0.5);
                this.audioLoaded.footsteps = true;
                console.log('Footsteps audio loaded');
            },
            undefined,
            (err) => { console.warn('Footsteps audio not found:', err); }
        );
        
        // Load jumpscare (one-shot)
        audioLoader.load('./assets/audio/jumpscare.mp3', 
            (buffer) => { 
                this.jumpscareSound.setBuffer(buffer); 
                this.jumpscareSound.setLoop(false); 
                this.jumpscareSound.setVolume(0.8);
                this.audioLoaded.jumpscare = true;
                console.log('Jumpscare audio loaded');
            },
            undefined,
            (err) => { console.warn('Jumpscare audio not found:', err); }
        );
    }

    playAmbient() {
        if (this.audioLoaded.ambient && !this.ambientSound.isPlaying) {
            this.ambientSound.play();
        }
    }

    playFootsteps() {
        if (this.audioLoaded.footsteps && !this.footstepsSound.isPlaying) {
            this.footstepsSound.play();
        }
    }

    stopFootsteps() {
        if (this.audioLoaded.footsteps && this.footstepsSound.isPlaying) {
            this.footstepsSound.stop();
        }
    }

    playJumpscare() {
        if (this.audioLoaded.jumpscare) {
            if (this.jumpscareSound.isPlaying) this.jumpscareSound.stop();
            this.jumpscareSound.play();
        }
    }
}