import * as THREE from 'three';

export class CutsceneManager {
    constructor(scene, camera, cssRenderer, overlayElement) {
        this.scene = scene;
        this.camera = camera;
        this.cssRenderer = cssRenderer;
        this.overlay = overlayElement;
        this.active = false;
        this.textTimeout = null;
        this.videoElement = null;
        this.videoTexture = null;
        this.videoPlane = null;
    }

    showText(text, duration = 3000) {
        this.active = true;
        this.overlay.style.opacity = '1';
        this.overlay.textContent = text;
        
        if (this.textTimeout) clearTimeout(this.textTimeout);
        
        this.textTimeout = setTimeout(() => {
            this.overlay.style.opacity = '0';
            this.active = false;
        }, duration);
    }

    playIntro() {
        this.active = true;
        this.showText('Loading memories...', 2000);
        
        // Try to play intro video
        this.playVideo('./assets/videos/intro.mp4').catch(error => {
            console.warn('Intro video not found, using text fallback:', error);
            this.showText('You wake up in a dark maze...', 4000);
            
            setTimeout(() => {
                this.showText('Something is watching you...', 3000);
            }, 4500);
            
            setTimeout(() => {
                this.showText('Find the exit before it finds you.', 4000);
                setTimeout(() => {
                    this.active = false;
                }, 4000);
            }, 8000);
        });
    }

    playVideo(src, duration = null) {
        return new Promise((resolve, reject) => {
            // Clean up any existing video
            this.hideVideo();
            
            const video = document.createElement('video');
            video.src = src;
            video.loop = false;
            video.muted = false;
            video.crossOrigin = 'anonymous';
            video.style.display = 'none'; // Hide HTML element, we'll use texture
            
            // Set up event handlers
            video.oncanplaythrough = () => {
                // Play the video
                video.play().catch(e => {
                    console.warn('Autoplay prevented:', e);
                    // Still try to show texture even if autoplay fails
                });
                
                // Create texture
                this.videoTexture = new THREE.VideoTexture(video);
                this.videoTexture.minFilter = THREE.LinearFilter;
                this.videoTexture.magFilter = THREE.LinearFilter;
                
                // Create plane with video texture
                const aspect = video.videoWidth / video.videoHeight;
                const planeWidth = 8;
                const planeHeight = planeWidth / aspect;
                
                const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
                const material = new THREE.MeshBasicMaterial({ 
                    map: this.videoTexture, 
                    side: THREE.DoubleSide,
                    toneMapped: false
                });
                
                this.videoPlane = new THREE.Mesh(geometry, material);
                this.videoPlane.position.set(0, 2, -5); // In front of camera
                this.camera.add(this.videoPlane);
                this.scene.add(this.camera);
                
                this.active = true;
                this.videoElement = video;
                
                // Auto-hide after duration if specified
                if (duration) {
                    setTimeout(() => {
                        this.hideVideo();
                        if (this.textTimeout) {
                            clearTimeout(this.textTimeout);
                            this.overlay.style.opacity = '0';
                        }
                        this.active = false;
                    }, duration);
                }
                
                resolve();
            };
            
            video.onerror = (error) => {
                console.error('Video failed to load:', src, error);
                this.hideVideo();
                reject(error);
            };
            
            // Start loading
            video.load();
            document.body.appendChild(video); // Need to append to DOM for iOS? Maybe not
        });
    }

    hideVideo() {
        if (this.videoPlane) {
            this.camera.remove(this.videoPlane);
            this.scene.remove(this.videoPlane);
            this.videoPlane = null;
        }
        
        if (this.videoElement) {
            this.videoElement.pause();
            this.videoElement.remove();
            this.videoElement = null;
        }
        
        if (this.videoTexture) {
            this.videoTexture.dispose();
            this.videoTexture = null;
        }
    }

    update(delta) {
        if (this.videoTexture) {
            this.videoTexture.needsUpdate = true;
        }
    }
}