// effects/AudioEffects.js – Applies real-time audio effects based on intoxication
export class AudioEffects {
    constructor(audioContext, sourceNode) {
        this.audioContext = audioContext;
        this.source = sourceNode;
        
        // Create effect nodes
        this.distortion = this.audioContext.createWaveShaper();
        this.delay = this.audioContext.createDelay(1.0);
        this.delay.delayTime.value = 0.3;
        this.feedback = this.audioContext.createGain();
        this.feedback.gain.value = 0.3;
        this.filter = this.audioContext.createBiquadFilter();
        this.filter.type = 'lowpass';
        this.filter.frequency.value = 2000;
        
        // Connect: source -> distortion -> filter -> delay (with feedback) -> destination
        // But we'll make it configurable.
    }
    
    setIntoxicationLevel(level) {
        // Map level to effect parameters
        const distortionAmount = level * 100; // waveshaper curve intensity
        const delayTime = 0.1 + level * 0.5;
        const feedbackGain = level * 0.6;
        const filterFreq = 2000 - level * 1500;
        
        // Apply
        this.delay.delayTime.value = delayTime;
        this.feedback.gain.value = feedbackGain;
        this.filter.frequency.value = Math.max(500, filterFreq);
        
        // Rebuild waveshaper curve for distortion
        if (distortionAmount > 0) {
            const curve = this.makeDistortionCurve(distortionAmount);
            this.distortion.curve = curve;
        } else {
            this.distortion.curve = null;
        }
    }
    
    makeDistortionCurve(amount) {
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        const deg = Math.PI / 180;
        for (let i = 0; i < n_samples; ++i) {
            const x = (i * 2) / n_samples - 1;
            curve[i] = (3 + amount) * x * 20 * deg / (Math.PI + amount * Math.abs(x));
        }
        return curve;
    }
    
    connectChain() {
        // Disconnect everything first
        this.source.disconnect();
        
        if (this.distortion.curve) {
            this.source.connect(this.distortion);
            this.distortion.connect(this.filter);
        } else {
            this.source.connect(this.filter);
        }
        
        // Filter to delay and direct
        this.filter.connect(this.delay);
        this.filter.connect(this.audioContext.destination);
        
        // Delay feedback
        this.delay.connect(this.feedback);
        this.feedback.connect(this.delay);
        this.delay.connect(this.audioContext.destination);
    }
}