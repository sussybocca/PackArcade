// effects/VisualEffects.js – Contains custom shader definitions for drug effects
import * as THREE from 'three';

export const VisualEffects = {
    // Distortion shader (simulates waves/warping)
    DistortionShader: {
        uniforms: {
            'tDiffuse': { value: null },
            'intensity': { value: 0.0 },
            'time': { value: 0.0 }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform sampler2D tDiffuse;
            uniform float intensity;
            uniform float time;
            varying vec2 vUv;

            void main() {
                if (intensity == 0.0) {
                    gl_FragColor = texture2D(tDiffuse, vUv);
                    return;
                }
                
                // Distortion based on sin waves
                float amount = intensity * 0.1;
                vec2 distortedUv = vUv;
                distortedUv.x += sin(vUv.y * 10.0 + time * 5.0) * amount;
                distortedUv.y += cos(vUv.x * 8.0 + time * 4.0) * amount;
                
                vec4 color = texture2D(tDiffuse, distortedUv);
                gl_FragColor = color;
            }
        `
    },
    
    // Chromatic Aberration
    ChromaticAberrationShader: {
        uniforms: {
            'tDiffuse': { value: null },
            'amount': { value: 0.0 },
            'angle': { value: 0.0 }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform sampler2D tDiffuse;
            uniform float amount;
            uniform float angle;
            varying vec2 vUv;

            void main() {
                if (amount == 0.0) {
                    gl_FragColor = texture2D(tDiffuse, vUv);
                    return;
                }
                
                vec2 offset = vec2(amount * cos(angle), amount * sin(angle));
                float r = texture2D(tDiffuse, vUv + offset).r;
                float g = texture2D(tDiffuse, vUv).g;
                float b = texture2D(tDiffuse, vUv - offset).b;
                
                gl_FragColor = vec4(r, g, b, 1.0);
            }
        `
    }
};