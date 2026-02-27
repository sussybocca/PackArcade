// shaders/distortion.frag
uniform sampler2D tDiffuse;
uniform float intensity;
uniform float time;
varying vec2 vUv;

void main() {
    if (intensity == 0.0) {
        gl_FragColor = texture2D(tDiffuse, vUv);
        return;
    }
    float amount = intensity * 0.1;
    vec2 distortedUv = vUv;
    distortedUv.x += sin(vUv.y * 10.0 + time * 5.0) * amount;
    distortedUv.y += cos(vUv.x * 8.0 + time * 4.0) * amount;
    vec4 color = texture2D(tDiffuse, distortedUv);
    gl_FragColor = color;
}