import * as THREE from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

export const WaterPass = function() {
    const shader = {
        uniforms: {
            tDiffuse: { value: null },
            time: { value: 0 },
            factor: { value: 0.05 }
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
            uniform float time;
            uniform float factor;
            varying vec2 vUv;

            void main() {
                vec2 uv = vUv;
                
                // Rippling effect
                float strength = factor;
                uv.x += sin(uv.y * 20.0 + time * 2.0) * strength;
                uv.y += cos(uv.x * 20.0 + time * 2.0) * strength;
                
                // Distortion
                uv.x += sin(time * 1.5) * strength * 0.5;
                uv.y += cos(time * 1.2) * strength * 0.5;
                
                vec4 color = texture2D(tDiffuse, uv);
                
                // Subtle blue tint
                color.rgb *= vec3(0.9, 0.95, 1.0);
                
                gl_FragColor = color;
            }
        `
    };

    // FIX: Use ShaderPass directly
    return new ShaderPass(shader);
};