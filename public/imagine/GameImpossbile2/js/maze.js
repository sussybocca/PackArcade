import * as THREE from 'three';

export class Maze {
    constructor(scene, size = 21) {
        this.scene = scene;
        this.size = size;
        this.cells = [];
        
        // Create materials with better visibility
        this.wallMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x885555, 
            roughness: 0.6, 
            metalness: 0.2,
            emissive: 0x221111
        });
        
        this.floorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x443333, 
            roughness: 0.9,
            emissive: 0x110000
        });
        
        this.ceilingMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x222222, 
            emissive: 0x220000,
            transparent: true,
            opacity: 0.9
        });

        // Edge material for visible outlines
        this.edgeMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
        
        this.generateMaze();
        this.buildWalls();
        this.addAtmosphere();
    }

    generateMaze() {
        // Initialize all cells with walls
        for (let i = 0; i < this.size; i++) {
            this.cells[i] = [];
            for (let j = 0; j < this.size; j++) {
                this.cells[i][j] = { 
                    walls: [true, true, true, true], 
                    visited: false 
                };
            }
        }

        // Recursive backtracking algorithm
        const stack = [];
        const start = [1, 1]; // Start from (1,1) to leave border
        this.cells[1][1].visited = true;
        stack.push(start);

        const dirs = [
            [0, 1, 1, 3],  // right: dx=0, dy=1, wall index 1 (right), neighbor wall 3 (left)
            [1, 0, 2, 0],  // down: dx=1, dy=0, wall index 2 (bottom), neighbor wall 0 (top)
            [0, -1, 3, 1], // left: dx=0, dy=-1, wall index 3 (left), neighbor wall 1 (right)
            [-1, 0, 0, 2]  // up: dx=-1, dy=0, wall index 0 (top), neighbor wall 2 (bottom)
        ];

        while (stack.length > 0) {
            const [x, y] = stack[stack.length - 1];
            const neighbors = [];

            for (const [dx, dy, wallIdx, oppIdx] of dirs) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx > 0 && nx < this.size - 1 && ny > 0 && ny < this.size - 1 && !this.cells[nx][ny].visited) {
                    neighbors.push([nx, ny, wallIdx, oppIdx]);
                }
            }

            if (neighbors.length > 0) {
                const [nx, ny, wallIdx, oppIdx] = neighbors[Math.floor(Math.random() * neighbors.length)];
                this.cells[x][y].walls[wallIdx] = false;
                this.cells[nx][ny].walls[oppIdx] = false;
                this.cells[nx][ny].visited = true;
                stack.push([nx, ny]);
            } else {
                stack.pop();
            }
        }

        // Ensure border walls are all present
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (i === 0 || i === this.size - 1 || j === 0 || j === this.size - 1) {
                    this.cells[i][j].walls = [true, true, true, true];
                }
            }
        }
    }

    buildWalls() {
        const wallHeight = 3.5;
        const wallThickness = 0.3;
        const cellSize = 2.0;
        
        // Create a group for all maze pieces
        const mazeGroup = new THREE.Group();

        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const x = i * cellSize;
                const z = j * cellSize;
                
                // Floor with slight texture variation
                const floorGeo = new THREE.BoxGeometry(cellSize - 0.1, 0.2, cellSize - 0.1);
                const floor = new THREE.Mesh(floorGeo, this.floorMaterial);
                floor.position.set(x + cellSize/2, 0, z + cellSize/2);
                floor.receiveShadow = true;
                floor.castShadow = false;
                mazeGroup.add(floor);

                // Ceiling (higher up)
                const ceilGeo = new THREE.BoxGeometry(cellSize - 0.1, 0.2, cellSize - 0.1);
                const ceil = new THREE.Mesh(ceilGeo, this.ceilingMaterial);
                ceil.position.set(x + cellSize/2, wallHeight, z + cellSize/2);
                ceil.receiveShadow = true;
                ceil.castShadow = false;
                mazeGroup.add(ceil);

                const walls = this.cells[i][j].walls;
                
                // Top wall (-z direction)
                if (walls[0]) {
                    const wallGeo = new THREE.BoxGeometry(cellSize - 0.1, wallHeight, wallThickness);
                    const wall = new THREE.Mesh(wallGeo, this.wallMaterial);
                    wall.position.set(x + cellSize/2, wallHeight/2, z);
                    wall.castShadow = true;
                    wall.receiveShadow = true;
                    mazeGroup.add(wall);
                    
                    // Add a glowing edge
                    this.addGlowEdges(wall, new THREE.Vector3(x + cellSize/2, wallHeight/2, z), cellSize, wallHeight);
                }
                
                // Right wall (+x direction)
                if (walls[1]) {
                    const wallGeo = new THREE.BoxGeometry(wallThickness, wallHeight, cellSize - 0.1);
                    const wall = new THREE.Mesh(wallGeo, this.wallMaterial);
                    wall.position.set(x + cellSize, wallHeight/2, z + cellSize/2);
                    wall.castShadow = true;
                    wall.receiveShadow = true;
                    mazeGroup.add(wall);
                    
                    this.addGlowEdges(wall, new THREE.Vector3(x + cellSize, wallHeight/2, z + cellSize/2), cellSize, wallHeight, true);
                }
                
                // Bottom wall (+z direction)
                if (walls[2]) {
                    const wallGeo = new THREE.BoxGeometry(cellSize - 0.1, wallHeight, wallThickness);
                    const wall = new THREE.Mesh(wallGeo, this.wallMaterial);
                    wall.position.set(x + cellSize/2, wallHeight/2, z + cellSize);
                    wall.castShadow = true;
                    wall.receiveShadow = true;
                    mazeGroup.add(wall);
                    
                    this.addGlowEdges(wall, new THREE.Vector3(x + cellSize/2, wallHeight/2, z + cellSize), cellSize, wallHeight);
                }
                
                // Left wall (-x direction)
                if (walls[3]) {
                    const wallGeo = new THREE.BoxGeometry(wallThickness, wallHeight, cellSize - 0.1);
                    const wall = new THREE.Mesh(wallGeo, this.wallMaterial);
                    wall.position.set(x, wallHeight/2, z + cellSize/2);
                    wall.castShadow = true;
                    wall.receiveShadow = true;
                    mazeGroup.add(wall);
                    
                    this.addGlowEdges(wall, new THREE.Vector3(x, wallHeight/2, z + cellSize/2), cellSize, wallHeight, true);
                }
            }
        }

        this.scene.add(mazeGroup);
    }

    addGlowEdges(wall, position, width, height, isVertical = false) {
        // Add a subtle red line at the edges of walls for visibility
        const edges = new THREE.EdgesGeometry(wall.geometry);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x440000 }));
        line.position.copy(position);
        this.scene.add(line);
    }

    addAtmosphere() {
        // Add floating dust particles inside maze
        const particleCount = 500;
        const particleGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i*3] = Math.random() * this.size * 2;
            positions[i*3+1] = Math.random() * 4;
            positions[i*3+2] = Math.random() * this.size * 2;
        }
        
        particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particleMat = new THREE.PointsMaterial({ 
            color: 0xaa4444, 
            size: 0.08, 
            transparent: true, 
            opacity: 0.3,
            blending: THREE.AdditiveBlending
        });
        const particles = new THREE.Points(particleGeo, particleMat);
        this.scene.add(particles);
    }
}