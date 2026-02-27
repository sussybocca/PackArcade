// core/Player.js – Player state: health, intoxication, etc.
import { Constants } from '../utils/Constants.js';
import { InputHandler } from './InputHandler.js';

export class Player {
    constructor() {
        this.health = 100;
        this.intoxicationLevel = 0.0; // 0 to 1
        this.numPillsTaken = 0;
        this.isAlive = true;
    }
    
    takePill() {
        if (!this.isAlive) return;
        
        this.numPillsTaken++;
        // Intoxication increases, health decreases
        this.intoxicationLevel = Math.min(1.0, this.intoxicationLevel + 0.15);
        this.health = Math.max(0, this.health - 10);
        
        if (this.health <= 0) {
            this.die();
        }
    }
    
    die() {
        this.isAlive = false;
        this.health = 0;
        // Trigger game over UI etc.
    }
    
    update(deltaTime, inputHandler) {
        if (!this.isAlive) return;
        
        // Natural decay of intoxication over time? Actually drugs wear off slowly.
        this.intoxicationLevel = Math.max(0, this.intoxicationLevel - 0.005 * deltaTime);
        
        // If health too low, die
        if (this.health <= 0) {
            this.die();
        }
    }
}