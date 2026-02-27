// config/EffectConfig.js – Parameters for visual/audio effects
export const EffectConfig = {
    VISUAL: {
        MAX_DISTORTION: 0.5,
        MAX_CHROMATIC: 0.03,
        BLOOM_BASE: 1.0,
        BLOOM_INTENSITY_FACTOR: 2.0,
        HALLUCINATION_APPEAR_THRESHOLD: 0.6
    },
    AUDIO: {
        MAX_DELAY: 0.8,
        MAX_FEEDBACK: 0.7,
        MIN_FILTER_FREQ: 300,
        HEARTBEAT_THRESHOLD: 0.4
    }
};