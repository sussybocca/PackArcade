// utils/MathUtils.js – Utility math functions
export const MathUtils = {
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },
    
    lerp(a, b, t) {
        return a + (b - a) * t;
    },
    
    randomRange(min, max) {
        return Math.random() * (max - min) + min;
    }
};