// ui/UIManager.js – Displays HUD (health, intoxication)
export class UIManager {
    constructor(player) {
        this.player = player;
        this.container = document.getElementById('ui-container');
        this.healthElement = null;
        this.intoxElement = null;
        this.pillCountElement = null;
        
        this.createUI();
    }
    
    createUI() {
        this.healthElement = document.createElement('div');
        this.healthElement.innerHTML = 'Health: <span class="hud-value" id="health-value">100</span>';
        this.container.appendChild(this.healthElement);
        
        this.intoxElement = document.createElement('div');
        this.intoxElement.innerHTML = 'Intoxication: <span class="hud-value" id="intox-value">0%</span>';
        this.container.appendChild(this.intoxElement);
        
        this.pillCountElement = document.createElement('div');
        this.pillCountElement.innerHTML = 'Pills taken: <span class="hud-value" id="pill-count">0</span>';
        this.container.appendChild(this.pillCountElement);
    }
    
    update() {
        document.getElementById('health-value').textContent = Math.max(0, Math.floor(this.player.health));
        document.getElementById('intox-value').textContent = Math.floor(this.player.intoxicationLevel * 100) + '%';
        document.getElementById('pill-count').textContent = this.player.numPillsTaken;
        
        // Change color based on values
        if (this.player.health < 30) {
            this.healthElement.style.color = '#ff0000';
        } else {
            this.healthElement.style.color = 'white';
        }
    }
    
    showMessage(text, duration = 3000) {
        const msgBox = document.getElementById('message-box');
        msgBox.textContent = text;
        msgBox.classList.remove('hidden');
        
        setTimeout(() => {
            msgBox.classList.add('hidden');
        }, duration);
    }
}