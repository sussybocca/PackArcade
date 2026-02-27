// entities/Pill.js – Pill object that can be taken
import * as THREE from 'three';

export class Pill {
    constructor(scene, assetLoader, position) {
        this.scene = scene;
        this.mesh = null;
        this.position = position.clone();
        
        const tex = assetLoader.getTexture('pill');
        const mat = new THREE.MeshStandardMaterial({ map: tex });
        const geom = new THREE.CylinderGeometry(0.1, 0.1, 0.05, 8);
        this.mesh = new THREE.Mesh(geom, mat);
        this.mesh.position.copy(position);
        this.mesh.rotation.x = Math.PI/2;
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // Add to scene
        this.scene.add(this.mesh);
    }
    
    // Check if player is near and can take pill
    isPlayerNear(playerPosition, distanceThreshold = 0.5) {
        return this.mesh.position.distanceTo(playerPosition) < distanceThreshold;
    }
    
    remove() {
        this.scene.remove(this.mesh);
    }
}