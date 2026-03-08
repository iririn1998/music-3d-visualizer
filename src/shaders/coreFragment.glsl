uniform vec3 uColor;
uniform vec3 uAccentColor;
uniform float uEnergy;

varying float vDisplacement;
varying vec3 vNormal;

void main() {
  float intensity = abs(vDisplacement) * 2.0 + 0.3;
  float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);

  vec3 color = mix(uColor, uAccentColor, abs(vDisplacement) * 3.0);
  color += fresnel * uAccentColor * 0.5;
  color *= intensity;

  float glow = uEnergy * 0.3 + 0.7;
  gl_FragColor = vec4(color * glow, 1.0);
}
