window.threeEngine = {
    scene: null,
    camera: null,
    renderer: null,
    meshes: new Map(),
    particles: new Map(),
    initialized: false,

    initialize: function (canvasId, width, height) {
        console.log("Initializing Three.js...");
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error("Canvas element not found:", canvasId);
            return;
        }

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404060);
        this.scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(100, 200, 100);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        const d = 300;
        dirLight.shadow.camera.left = -d;
        dirLight.shadow.camera.right = d;
        dirLight.shadow.camera.top = d;
        dirLight.shadow.camera.bottom = -d;
        dirLight.shadow.camera.near = 1;
        dirLight.shadow.camera.far = 500;
        this.scene.add(dirLight);

        // Ground grid (temporary, will be replaced by terrain)
        const gridHelper = new THREE.GridHelper(1000, 20, 0x444444, 0x888888);
        this.scene.add(gridHelper);

        this.initialized = true;
        console.log("Three.js initialized.");
    },

    addTerrain: function (data) {
        if (!this.initialized) return;
        // Remove the temporary grid
        this.scene.children = this.scene.children.filter(child => !(child instanceof THREE.GridHelper));

        const resolution = data.resolution;
        const worldSize = data.worldSize;
        const heights = data.heights;

        // Create geometry with many segments
        const geometry = new THREE.PlaneGeometry(worldSize, worldSize, resolution - 1, resolution - 1);
        geometry.rotateX(-Math.PI / 2); // Make it horizontal

        const positionAttribute = geometry.attributes.position;
        for (let i = 0; i < positionAttribute.count; i++) {
            const ix = i % resolution;
            const iz = Math.floor(i / resolution);
            // Map vertex to heightmap index (assumes vertex order matches)
            const h = heights[iz * resolution + ix];
            positionAttribute.setY(i, h);
        }

        geometry.computeVertexNormals();

        const material = new THREE.MeshStandardMaterial({ color: 0x3a7a3a, wireframe: false, flatShading: false });
        const terrain = new THREE.Mesh(geometry, material);
        terrain.receiveShadow = true;
        terrain.castShadow = true;
        terrain.position.set(0, 0, 0);
        this.scene.add(terrain);
        console.log("Terrain added");
    },

    addMesh: function (data) {
        if (!this.initialized) {
            console.warn("addMesh called before initialization – mesh will be ignored", data);
            return;
        }
        let geometry, material;
        if (data.type === 'dragon') {
            geometry = new THREE.BoxGeometry(2, 1, 3);
            material = new THREE.MeshStandardMaterial({ color: data.color });
        } else if (data.type === 'tree') {
            // Simple tree: trunk + foliage
            const group = new THREE.Group();
            const trunkGeo = new THREE.CylinderGeometry(0.5, 0.7, 2);
            const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
            const trunk = new THREE.Mesh(trunkGeo, trunkMat);
            trunk.position.y = 1;
            trunk.castShadow = true;
            trunk.receiveShadow = true;
            group.add(trunk);
            const foliageGeo = new THREE.ConeGeometry(1.5, 2, 8);
            const foliageMat = new THREE.MeshStandardMaterial({ color: 0x228B22 });
            const foliage = new THREE.Mesh(foliageGeo, foliageMat);
            foliage.position.y = 2.5;
            foliage.castShadow = true;
            foliage.receiveShadow = true;
            group.add(foliage);
            const mesh = group;
            mesh.position.set(data.position.x, data.position.y, data.position.z);
            mesh.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
            mesh.scale.set(data.scale, data.scale, data.scale);
            mesh.userData = { id: data.id, type: data.type };
            this.scene.add(mesh);
            this.meshes.set(data.id, mesh);
            console.log("Tree added:", data.id);
            return;
        } else if (data.type === 'rock') {
            geometry = new THREE.DodecahedronGeometry(1);
            material = new THREE.MeshStandardMaterial({ color: 0x808080 });
        } else {
            geometry = new THREE.BoxGeometry(1, 1, 1);
            material = new THREE.MeshStandardMaterial({ color: 0x888888 });
        }
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.position.set(data.position.x, data.position.y, data.position.z);
        mesh.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
        mesh.scale.set(data.scale, data.scale, data.scale);
        mesh.userData = { id: data.id, type: data.type };
        this.scene.add(mesh);
        this.meshes.set(data.id, mesh);
        console.log("Mesh added:", data.id);
    },

    updateMesh: function (id, transform) {
        if (!this.initialized) return;
        const mesh = this.meshes.get(id);
        if (mesh) {
            mesh.position.set(transform.position.x, transform.position.y, transform.position.z);
            mesh.rotation.set(transform.rotation.x, transform.rotation.y, transform.rotation.z);
        }
    },

    removeMesh: function (id) {
        if (!this.initialized) return;
        const mesh = this.meshes.get(id);
        if (mesh) {
            this.scene.remove(mesh);
            this.meshes.delete(id);
        }
    },

    addParticleSystem: function (config) {
        if (!this.initialized) return;
        const particleCount = 100;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = config.origin.x + (Math.random() - 0.5) * 2;
            positions[i * 3 + 1] = config.origin.y + (Math.random() - 0.5) * 2;
            positions[i * 3 + 2] = config.origin.z + (Math.random() - 0.5) * 2;
        }
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({ color: 0xff5500, size: 0.5 });
        const particles = new THREE.Points(geometry, material);
        particles.userData = { config, age: 0, velocities: new Array(particleCount).fill().map(() => new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        )) };
        this.scene.add(particles);
        this.particles.set(config.id, particles);
    },

    render: function () {
        if (!this.initialized) return;
        // Update particles
        for (let [id, particles] of this.particles) {
            particles.userData.age += 0.016;
            if (particles.userData.age > particles.userData.config.duration) {
                this.scene.remove(particles);
                this.particles.delete(id);
                continue;
            }
            const positions = particles.geometry.attributes.position.array;
            const dir = particles.userData.config.direction;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i] += dir.x * 0.1 + particles.userData.velocities[i/3].x * 0.01;
                positions[i + 1] += dir.y * 0.1 + particles.userData.velocities[i/3].y * 0.01;
                positions[i + 2] += dir.z * 0.1 + particles.userData.velocities[i/3].z * 0.01;
            }
            particles.geometry.attributes.position.needsUpdate = true;
        }

        // Camera follow
        const playerDragon = Array.from(this.meshes.values()).find(m => m.userData.type === 'dragon' && m.userData.isRidden);
        if (playerDragon) {
            const offset = new THREE.Vector3(0, 5, 15);
            this.camera.position.copy(playerDragon.position).add(offset);
            this.camera.lookAt(playerDragon.position);
        } else {
            // Default view
            this.camera.position.set(50, 50, 50);
            this.camera.lookAt(0, 0, 0);
        }

        this.renderer.render(this.scene, this.camera);
    },

    resize: function (width, height) {
        if (!this.initialized) return;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
};