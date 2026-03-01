import * as THREE from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

export const PixelationPass = function(width, height) {
    const shader = {
        uniforms: {
            tDiffuse: { value: null },
            pixelSize: { value: 4.0 },
            resolution: { value: new THREE.Vector2(width, height) }
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
            uniform float pixelSize;
            uniform vec2 resolution;
            varying vec2 vUv;

            void main() {
                vec2 dxy = pixelSize / resolution;
                vec2 coord = dxy * floor(vUv / dxy);
                gl_FragColor = texture2D(tDiffuse, coord);
            }
        `
    };

    // FIX: Use ShaderPass directly
    return new ShaderPass(shader);
};