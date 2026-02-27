// scene/Lighting.js – Sets up lights and shadows
import * as THREE from 'three';

export class Lighting {
    constructor(scene) {
        this.scene = scene;
    }
    
    setup() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404060);
        this.scene.add(ambientLight);
        
        // Main directional light (sun)
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(2, 5, 3);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        const d = 5;
        dirLight.shadow.camera.left = -d;
        dirLight.shadow.camera.right = d;
        dirLight.shadow.camera.top = d;
        dirLight.shadow.camera.bottom = -d;
        dirLight.shadow.camera.near = 1;
        dirLight.shadow.camera.far = 10;
        this.scene.add(dirLight);
        
        // Fill light
        const fillLight = new THREE.PointLight(0x446688, 0.5);
        fillLight.position.set(-2, 1, 2);
        this.scene.add(fillLight);
    }
}