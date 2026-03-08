uniform vec3 uColor;
uniform vec3 uAccentColor;
uniform float uEnergy;

varying float vAlpha;
varying float vDist;

void main() {
  float distFromCenter = length(gl_PointCoord - vec2(0.5));
  if (distFromCenter > 0.5) discard;

  float softEdge = 1.0 - smoothstep(0.2, 0.5, distFromCenter);

  float colorMix = clamp(vDist * 0.1, 0.0, 1.0);
  vec3 color = mix(uColor, uAccentColor, colorMix);

  float glow = 1.0 + uEnergy * 0.5;
  color *= glow;

  gl_FragColor = vec4(color, vAlpha * softEdge);
}
