uniform float uTime;
uniform float uMid;
uniform float uEnergy;

attribute vec3 instanceOffset;

varying float vHeight;
varying float vWaveProgress;

void main() {
  vec3 offset = instanceOffset;

  float dist = length(offset.xz);
  float wavePhase = dist * 0.3 - uTime * 2.5;

  float midWave = sin(wavePhase) * uMid * 1.5;

  float energyWave = smoothstep(0.0, 1.0, 1.0 - abs(dist - uTime * 3.0) * 0.1) * uEnergy * 2.0;

  float height = midWave + energyWave;
  vHeight = height;
  vWaveProgress = energyWave;

  vec3 pos = position;
  pos.y *= 0.3 + abs(height) * 0.5;

  vec3 worldPos = pos + offset;
  worldPos.y += height;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(worldPos, 1.0);
}
