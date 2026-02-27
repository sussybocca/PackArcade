// core/InputHandler.js – Keyboard and mouse input handling
export class InputHandler {
    constructor(domElement) {
        this.domElement = domElement;
        this.keys = {};
        this.mouseButtons = { left: false, middle: false, right: false };
        this.mouseDelta = { x: 0, y: 0 };
        this.mousePosition = { x: 0, y: 0 };
        
        this.initEventListeners();
    }
    
    initEventListeners() {
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
        this.domElement.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.domElement.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.domElement.addEventListener('contextmenu', (e) => e.preventDefault()); // prevent right-click menu
    }
    
    onKeyDown(e) {
        this.keys[e.code] = true;
    }
    
    onKeyUp(e) {
        this.keys[e.code] = false;
    }
    
    onMouseDown(e) {
        if (e.button === 0) this.mouseButtons.left = true;
        if (e.button === 1) this.mouseButtons.middle = true;
        if (e.button === 2) this.mouseButtons.right = true;
    }
    
    onMouseUp(e) {
        if (e.button === 0) this.mouseButtons.left = false;
        if (e.button === 1) this.mouseButtons.middle = false;
        if (e.button === 2) this.mouseButtons.right = false;
    }
    
    onMouseMove(e) {
        this.mouseDelta.x = e.movementX;
        this.mouseDelta.y = e.movementY;
        this.mousePosition.x = e.clientX;
        this.mousePosition.y = e.clientY;
    }
    
    isKeyPressed(code) {
        return this.keys[code] || false;
    }
    
    update() {
        // Reset mouse delta each frame after use
        this.mouseDelta.x = 0;
        this.mouseDelta.y = 0;
    }
}