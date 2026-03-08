uniform float uTime;
uniform float uRms;
uniform float uEnergy;
uniform float uBass;
uniform float uParticleSize;

attribute float aAngle;
attribute float aRadius;
attribute float aSpeed;
attribute float aPhase;

varying float vAlpha;
varying float vDist;

void main() {
  float rotSpeed = 0.3 + uRms * 1.5;
  float angle = aAngle + uTime * aSpeed * rotSpeed;

  float spread = 1.0 + uRms * 0.8;
  float radius = aRadius * spread;

  float burstFactor = max(uBass - 0.6, 0.0) * 5.0;
  radius += burstFactor * aRadius * 0.5;

  float x = cos(angle) * radius;
  float z = sin(angle) * radius;
  float y = sin(angle * 0.5 + aPhase + uTime * 0.5) * (1.0 + uEnergy * 2.0);

  vec4 mvPosition = modelViewMatrix * vec4(x, y, z, 1.0);

  vDist = length(vec3(x, y, z));
  vAlpha = smoothstep(12.0, 0.0, vDist) * (0.5 + uEnergy * 0.5);

  gl_Position = projectionMatrix * mvPosition;
  float pointSize = uParticleSize * (200.0 / max(-mvPosition.z, 0.1));
  gl_PointSize = clamp(pointSize, 1.0, 64.0);
}
