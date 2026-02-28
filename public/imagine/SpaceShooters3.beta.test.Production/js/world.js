// Three.js Open World Manager - Production Ready
// Maintains same function signatures: init, drawBackground, drawObstacles, getWorldSize

const World = (function() {
    const WORLD_SIZE = 5000;
    let scene, camera;
    let stars, obstacles = [];

    function init(container) {
        // Scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x050510);

        // Camera (will be positioned by Game)
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
        
        // Lights
        const ambient = new THREE.AmbientLight(0x404060);
        scene.add(ambient);
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(1, 1, 1);
        scene.add(dirLight);

        // Stars (particle system)
        const starGeo = new THREE.BufferGeometry();
        const starCount = 2000;
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount; i++) {
            const r = WORLD_SIZE * (0.8 + Math.random() * 0.4);
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            positions[i*3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i*3+2] = r * Math.cos(phi);
            
            const color = new THREE.Color().setHSL(0.6 + Math.random()*0.3, 0.5, 0.7);
            colors[i*3] = color.r;
            colors[i*3+1] = color.g;
            colors[i*3+2] = color.b;
        }
        starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        const starMat = new THREE.PointsMaterial({ size: 2, vertexColors: true, transparent: true, opacity: 0.9 });
        stars = new THREE.Points(starGeo, starMat);
        scene.add(stars);

        // Nebula (sprites)
        const nebulaTex = createNebulaTexture();
        const nebulaMat = new THREE.SpriteMaterial({ map: nebulaTex, blending: THREE.AdditiveBlending, depthWrite: false });
        for (let i = 0; i < 20; i++) {
            const sprite = new THREE.Sprite(nebulaMat);
            sprite.scale.set(800, 800, 1);
            sprite.position.set(
                (Math.random() - 0.5) * WORLD_SIZE * 1.5,
                (Math.random() - 0.5) * WORLD_SIZE * 0.5,
                (Math.random() - 0.5) * WORLD_SIZE * 1.5
            );
            scene.add(sprite);
        }

        // Obstacles (asteroids)
        for (let i = 0; i < 50; i++) {
            const radius = 20 + Math.random() * 40;
            const geo = new THREE.DodecahedronGeometry(radius, 0);
            const mat = new THREE.MeshStandardMaterial({ color: 0x886644, emissive: 0x331100 });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(
                Math.random() * WORLD_SIZE - WORLD_SIZE/2,
                Math.random() * 200 - 100,
                Math.random() * WORLD_SIZE - WORLD_SIZE/2
            );
            mesh.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
            scene.add(mesh);
            obstacles.push(mesh);
        }

        return { scene, camera };
    }

    function createNebulaTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(100, 50, 150, 0.8)');
        gradient.addColorStop(0.5, 'rgba(50, 20, 100, 0.3)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
        return new THREE.CanvasTexture(canvas);
    }

    // These functions are kept for compatibility with Game's draw calls
    function drawBackground(ctx, cameraX, cameraY) {
        // No-op: Three.js handles background rendering
    }

    function drawObstacles(ctx, cameraX, cameraY) {
        // No-op
    }

    function getWorldSize() {
        return WORLD_SIZE;
    }

    // New: get scene and camera for Game
    function getScene() { return scene; }
    function getCamera() { return camera; }

    return {
        init,
        drawBackground,
        drawObstacles,
        getWorldSize,
        getScene,
        getCamera
    };
})();