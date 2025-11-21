import * as THREE from 'three';

export type VisualQuality = 'performance' | 'balanced' | 'cinematic';

export const VISUAL_ENGINE_THEME = {
  background: '#050b14',
  horizon: '#0b1220',
  grid: '#1f2937',
  moundDirt: '#c08457',
  moundRiser: '#f5f5f4',
  strikeZone: '#fb7185',
  accent: '#22d3ee',
  ball: '#e5e7eb',
};

export const CAMERA_PRESETS: Record<
  'catcher' | 'batter' | 'side' | 'top' | 'pitcher',
  { position: [number, number, number]; target: [number, number, number]; fov?: number }
> = {
  catcher: { position: [0, 0.6, 7.5], target: [0, 1.2, -3], fov: 65 },
  batter: { position: [1.1, 0.6, 6.75], target: [0, 1.2, -2.5], fov: 60 },
  side: { position: [8.5, 2, 0], target: [0, 1, -2], fov: 55 },
  top: { position: [0, 11, 0], target: [0, 1, -3], fov: 50 },
  pitcher: { position: [0, 1, -6.5], target: [0, 1, 0], fov: 55 },
};

export function getQualityDpr(quality: VisualQuality): [number, number] {
  if (quality === 'cinematic') return [1.1, 2];
  if (quality === 'balanced') return [1, 1.5];
  return [0.9, 1.25];
}

export function getFog(quality: VisualQuality) {
  return {
    near: quality === 'performance' ? 10 : quality === 'balanced' ? 8 : 6,
    far: quality === 'cinematic' ? 32 : 24,
  };
}

export function buildTrailGradient(color: string, segments: number): THREE.ColorRepresentation[] {
  const base = new THREE.Color(color);
  const peak = base.clone().multiplyScalar(1.2);
  const tail = base.clone().multiplyScalar(0.6);

  return Array.from({ length: segments }, (_, idx) => {
    const ratio = idx / Math.max(1, segments - 1);
    if (ratio < 0.2) {
      return peak.clone().lerp(base, ratio * 5).getStyle();
    }
    return base.clone().lerp(tail, ratio).getStyle();
  });
}

export function createRibbonGeometry(points: THREE.Vector3[]) {
  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.TubeGeometry(curve, 120, 0.015, 12, false);
}

export function createGlowMaterial(color: string) {
  return new THREE.MeshStandardMaterial({
    color,
    transparent: true,
    opacity: 0.22,
    emissive: color,
    emissiveIntensity: 0.45,
    roughness: 0.25,
    metalness: 0.15,
  });
}
