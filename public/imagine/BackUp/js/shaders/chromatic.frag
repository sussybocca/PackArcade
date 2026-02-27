// shaders/chromatic.frag
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