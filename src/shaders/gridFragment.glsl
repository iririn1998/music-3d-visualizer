uniform vec3 uColor;
uniform vec3 uAccentColor;
uniform float uEnergy;

varying float vHeight;
varying float vWaveProgress;

void main() {
  float heightFactor = clamp(abs(vHeight) * 0.5, 0.0, 1.0);
  vec3 color = mix(uColor, uAccentColor, heightFactor);

  float brightness = 0.4 + heightFactor * 0.6 + vWaveProgress * 0.5;

  float edgeGlow = uEnergy * 0.2 + 0.8;
  color *= brightness * edgeGlow;

  gl_FragColor = vec4(color, 0.85);
}
