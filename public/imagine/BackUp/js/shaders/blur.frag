// shaders/blur.frag (simple gaussian, not used in main effect chain but available for hallucinations)
uniform sampler2D tDiffuse;
uniform float blurAmount;
varying vec2 vUv;

void main() {
    vec4 sum = vec4(0.0);
    float offset = blurAmount * 0.01;
    sum += texture2D(tDiffuse, vUv + vec2(-offset, -offset));
    sum += texture2D(tDiffuse, vUv + vec2(0.0, -offset));
    sum += texture2D(tDiffuse, vUv + vec2(offset, -offset));
    sum += texture2D(tDiffuse, vUv + vec2(-offset, 0.0));
    sum += texture2D(tDiffuse, vUv);
    sum += texture2D(tDiffuse, vUv + vec2(offset, 0.0));
    sum += texture2D(tDiffuse, vUv + vec2(-offset, offset));
    sum += texture2D(tDiffuse, vUv + vec2(0.0, offset));
    sum += texture2D(tDiffuse, vUv + vec2(offset, offset));
    gl_FragColor = sum / 9.0;
}