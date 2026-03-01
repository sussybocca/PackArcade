import * as THREE from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

export const GodRaysPass = function(camera, scene, options = {}) {
    const shader = {
        uniforms: {
            tDiffuse: { value: null },
            fov: { value: 70 },
            cameraPos: { value: camera.position.clone() },
            lightPos: { value: new THREE.Vector3(10, 20, 10) },
            density: { value: options.density || 0.96 },
            decay: { value: options.decay || 0.97 },
            weight: { value: options.weight || 0.5 },
            exposure: { value: options.exposure || 0.6 },
            samples: { value: options.samples || 60 }
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
            uniform vec3 lightPos;
            uniform vec3 cameraPos;
            uniform float density;
            uniform float decay;
            uniform float weight;
            uniform float exposure;
            uniform int samples;
            varying vec2 vUv;

            void main() {
                vec2 texCoord = vUv;
                vec2 deltaTexCoord = (texCoord - lightPos.xy);
                deltaTexCoord *= 1.0 / float(samples) * density;
                
                float illuminationDecay = 1.0;
                vec4 color = texture2D(tDiffuse, texCoord);
                
                for(int i = 0; i < 60; i++) {
                    if(i >= samples) break;
                    texCoord -= deltaTexCoord;
                    vec4 sampleColor = texture2D(tDiffuse, texCoord);
                    sampleColor *= illuminationDecay * weight;
                    color += sampleColor;
                    illuminationDecay *= decay;
                }
                
                gl_FragColor = color * exposure;
            }
        `
    };

    // FIX: Use ShaderPass directly, not THREE.ShaderPass
    return new ShaderPass(shader);
};