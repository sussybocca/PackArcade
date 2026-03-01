import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { Maze } from './maze.js';
import { CutsceneManager } from './cutscene.js';
import { EffectsManager } from './effects.js';
import { AudioManager } from './audio.js';

// --- GLOBAL STATE ---
const state = {
    clock: new THREE.Clock(),
    loading: true,
    progress: 0,
    cutsceneActive: false,
    jumpscareCooldown: false,
    mazeSize: 21
};

// --- SETUP SCENE ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050510); // Darker background
scene.fog = new THREE.FogExp2(0x050510, 0.01);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// --- RENDERERS ---
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 1.5; // Brighter
document.body.appendChild(renderer.domElement);

const css2DRenderer = new CSS2DRenderer();
css2DRenderer.setSize(window.innerWidth, window.innerHeight);
css2DRenderer.domElement.style.position = 'absolute';
css2DRenderer.domElement.style.top = '0px';
css2DRenderer.domElement.style.left = '0px';
css2DRenderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(css2DRenderer.domElement);

// --- CONTROLS (AUTO-LOCKED) ---
const controls = new PointerLockControls(camera, document.body);
controls.pointerSpeed = 0.5;

// Auto-lock immediately after loading
controls.lock();

// Instruction
const instruction = document.getElementById('instruction');
instruction.innerHTML = '🎮 WASD to move • Mouse to look • ESC to unlock';

// Handle pointer lock change
controls.addEventListener('lock', () => {
    instruction.style.opacity = '0.3';
});

controls.addEventListener('unlock', () => {
    instruction.style.opacity = '1';
});

// --- POST PROCESSING ---
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// --- INIT MANAGERS (WITH MAZE VISIBILITY FIXES) ---
console.log('Generating maze...');
const maze = new Maze(scene, state.mazeSize);
console.log('Maze generated with', maze.cells.length, 'cells');

// Set camera to a guaranteed open position
camera.position.set(5, 1.8, 5); // Simple starting point
camera.rotation.set(0, Math.PI / 4, 0); // Look diagonal

const cutscene = new CutsceneManager(scene, camera, css2DRenderer, document.getElementById('cutscene-overlay'));
const effects = new EffectsManager(composer, camera, scene, renderer);
const audio = new AudioManager(camera);

// --- ENHANCED LIGHTING FOR VISIBILITY ---
// Ambient light (brighter)
const ambient = new THREE.AmbientLight(0x40406b, 1.2);
scene.add(ambient);

// Main directional light (brighter)
const dirLight = new THREE.DirectionalLight(0xffccaa, 1.5);
dirLight.position.set(10, 20, 10);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 1024;
dirLight.shadow.mapSize.height = 1024;
const d = 30;
dirLight.shadow.camera.left = -d;
dirLight.shadow.camera.right = d;
dirLight.shadow.camera.top = d;
dirLight.shadow.camera.bottom = -d;
dirLight.shadow.camera.near = 1;
dirLight.shadow.camera.far = 50;
scene.add(dirLight);

// Fill light from below
const fillLight = new THREE.PointLight(0x4466ff, 0.8);
fillLight.position.set(0, 0, 0);
scene.add(fillLight);

// Multiple colored lights for visibility
const colors = [0xff3300, 0x33ff33, 0x3333ff, 0xff33ff];
for (let i = 0; i < 12; i++) {
    const light = new THREE.PointLight(colors[i % colors.length], 0.6, 20);
    light.castShadow = true;
    light.position.set(
        Math.random() * 40,
        3 + Math.random() * 4,
        Math.random() * 40
    );
    scene.add(light);
}

// Add a grid helper to see if anything is there (debug)
const gridHelper = new THREE.GridHelper(50, 20, 0xff0000, 0x333333);
gridHelper.position.y = 0.01;
scene.add(gridHelper);

// Add axis helper to see orientation
// const axesHelper = new THREE.AxesHelper(5);
// scene.add(axesHelper);

// Atmospheric particles (more visible)
const particleGeo = new THREE.BufferGeometry();
const particleCount = 1500;
const positions = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount; i++) {
    positions[i*3] = (Math.random() - 0.5) * 80;
    positions[i*3+1] = Math.random() * 12;
    positions[i*3+2] = (Math.random() - 0.5) * 80;
}
particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const particleMat = new THREE.PointsMaterial({ 
    color: 0xff6666, 
    size: 0.15, 
    transparent: true, 
    opacity: 0.6,
    blending: THREE.AdditiveBlending
});
const particles = new THREE.Points(particleGeo, particleMat);
scene.add(particles);

// --- LOADING PROGRESS ---
const updateProgress = () => {
    if (!state.loading) return;
    state.progress += 0.02;
    document.getElementById('progress-fill').style.width = (state.progress * 100) + '%';
    if (state.progress < 1) {
        requestAnimationFrame(updateProgress);
    } else {
        setTimeout(() => {
            document.getElementById('loading-screen').style.opacity = '0';
            setTimeout(() => {
                document.getElementById('loading-screen').style.display = 'none';
                state.loading = false;
                
                // Play intro
                cutscene.playIntro();
                audio.playAmbient();
                
                // Log camera position for debugging
                console.log('Game ready at position:', camera.position);
            }, 1000);
        }, 500);
    }
};
updateProgress();

// --- MOVEMENT STATE ---
const keyState = { w: false, a: false, s: false, d: false };

document.addEventListener('keydown', (e) => {
    switch(e.code) {
        case 'KeyW': keyState.w = true; e.preventDefault(); break;
        case 'KeyA': keyState.a = true; e.preventDefault(); break;
        case 'KeyS': keyState.s = true; e.preventDefault(); break;
        case 'KeyD': keyState.d = true; e.preventDefault(); break;
        case 'Escape': controls.unlock(); break;
    }
});

document.addEventListener('keyup', (e) => {
    switch(e.code) {
        case 'KeyW': keyState.w = false; e.preventDefault(); break;
        case 'KeyA': keyState.a = false; e.preventDefault(); break;
        case 'KeyS': keyState.s = false; e.preventDefault(); break;
        case 'KeyD': keyState.d = false; e.preventDefault(); break;
    }
});

// --- COLLISION DETECTION ---
function checkCollision(newPos) {
    // Simple bounds checking
    if (newPos.x < 1 || newPos.x > 40 || newPos.z < 1 || newPos.z > 40) {
        return true;
    }
    return false;
}

// --- JUMPSCARE TRIGGER ---
function checkJumpscare() {
    if (state.jumpscareCooldown || state.cutsceneActive) return;
    
    if (Math.random() < 0.002) { // Reduced chance
        state.jumpscareCooldown = true;
        
        effects.triggerJumpscare();
        audio.playJumpscare();
        cutscene.showText('GET OUT!', 1500);
        
        cutscene.playVideo('./assets/videos/jumpscare1.mp4', 1500).catch(() => {});
        
        const flashLight = new THREE.PointLight(0xff0000, 8, 20);
        flashLight.position.copy(camera.position);
        scene.add(flashLight);
        setTimeout(() => scene.remove(flashLight), 200);
        
        setTimeout(() => { state.jumpscareCooldown = false; }, 3000);
    }
}

// --- GAME LOOP ---
function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min(state.clock.getDelta(), 0.1);

    // MOVEMENT - ALWAYS ACTIVE (no click needed)
    if (!state.loading && !state.cutsceneActive) {
        const speed = 5.0 * delta;
        
        // Store old position for collision
        const oldX = camera.position.x;
        const oldZ = camera.position.z;
        
        if (keyState.w) controls.moveForward(speed);
        if (keyState.s) controls.moveForward(-speed);
        if (keyState.a) controls.moveRight(-speed);
        if (keyState.d) controls.moveRight(speed);
        
        // Simple collision - revert if out of bounds
        if (camera.position.x < 1 || camera.position.x > 41 || 
            camera.position.z < 1 || camera.position.z > 41) {
            camera.position.x = oldX;
            camera.position.z = oldZ;
        }

        // Footsteps
        if (keyState.w || keyState.s || keyState.a || keyState.d) {
            audio.playFootsteps();
        } else {
            audio.stopFootsteps();
        }

        checkJumpscare();
    }

    // Rotate particles
    particles.rotation.y += 0.0005;

    // Update managers
    cutscene.update(delta);
    effects.update(delta);

    // Render
    composer.render();
    css2DRenderer.render(scene, camera);
}

animate();

// --- RESIZE ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    css2DRenderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});

// Debug
window.gameState = { scene, camera, controls, maze, cutscene, effects, audio };