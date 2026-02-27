// scene/SceneBuilder.js – Constructs the 3D environment (no static hallucinations)
import * as THREE from 'three';

export class SceneBuilder {
    constructor(scene, assetLoader) {
        this.scene = scene;
        this.assetLoader = assetLoader;
    }
    
    build() {
        this.createFloor();
        this.createWalls();
        this.createFurniture();
        this.createPills(); // scattered pills to trigger effects
        // Removed createHallucinationObjects – now handled dynamically by EffectManager
    }
    
    createFloor() {
        const floorTex = this.assetLoader.getTexture('floor');
        floorTex.wrapS = THREE.RepeatWrapping;
        floorTex.wrapT = THREE.RepeatWrapping;
        floorTex.repeat.set(4, 4);
        
        const material = new THREE.MeshStandardMaterial({ map: floorTex });
        const geometry = new THREE.PlaneGeometry(10, 10);
        const floor = new THREE.Mesh(geometry, material);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        floor.receiveShadow = true;
        this.scene.add(floor);
    }
    
    createWalls() {
        const wallTex = this.assetLoader.getTexture('wall');
        wallTex.wrapS = THREE.RepeatWrapping;
        wallTex.wrapT = THREE.RepeatWrapping;
        wallTex.repeat.set(2, 2);
        
        const material = new THREE.MeshStandardMaterial({ map: wallTex });
        
        // Back wall
        const backWall = new THREE.Mesh(new THREE.BoxGeometry(10, 4, 0.2), material);
        backWall.position.set(0, 2, -5);
        backWall.receiveShadow = true;
        backWall.castShadow = true;
        this.scene.add(backWall);
        
        // Left wall
        const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4, 10), material);
        leftWall.position.set(-5, 2, 0);
        leftWall.receiveShadow = true;
        leftWall.castShadow = true;
        this.scene.add(leftWall);
        
        // Right wall
        const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4, 10), material);
        rightWall.position.set(5, 2, 0);
        rightWall.receiveShadow = true;
        rightWall.castShadow = true;
        this.scene.add(rightWall);
    }
    
    createFurniture() {
        const tableTex = this.assetLoader.getTexture('table');
        const tableMat = new THREE.MeshStandardMaterial({ map: tableTex });
        
        // Table top
        const top = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 1), tableMat);
        top.position.set(0, 0.8, 1);
        top.castShadow = true;
        top.receiveShadow = true;
        this.scene.add(top);
        
        // Table legs
        const legMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const legPositions = [[-0.8, 0.4, 0.6], [0.8, 0.4, 0.6], [-0.8, 0.4, 1.4], [0.8, 0.4, 1.4]];
        legPositions.forEach(pos => {
            const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 0.1), legMat);
            leg.position.set(pos[0], pos[1], pos[2]);
            leg.castShadow = true;
            leg.receiveShadow = true;
            this.scene.add(leg);
        });
    }
    
    createPills() {
        const pillTex = this.assetLoader.getTexture('pill');
        const pillMat = new THREE.MeshStandardMaterial({ map: pillTex });
        
        // Place a few pills on the table
        const positions = [[0, 0.9, 1], [0.3, 0.9, 1.1], [-0.2, 0.9, 0.9]];
        positions.forEach(pos => {
            const pill = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 8), pillMat);
            pill.position.set(pos[0], pos[1], pos[2]);
            pill.rotation.x = Math.PI/2;
            pill.castShadow = true;
            pill.receiveShadow = true;
            this.scene.add(pill);
        });
    }
}