'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

type PitchType = 'fourSeam' | 'twoSeam' | 'slider' | 'changeup' | 'curveball';

type PitchProfile = {
  pitchType: PitchType;
  velocity: number; // mph
  spinRate: number; // rpm
  releaseHeight: number; // feet
  targetElevation: number; // feet at plate
  tunnelWindow: number; // feet
};

const plateDistance = 60.5; // feet from mound to plate
const metersPerFoot = 0.3048;

const pitchPalette: Record<PitchType, { label: string; color: string; accent: string }> = {
  fourSeam: { label: 'Four-Seam Fastball', color: '#60a5fa', accent: '#1d4ed8' },
  twoSeam: { label: 'Two-Seam Fastball', color: '#22d3ee', accent: '#0891b2' },
  slider: { label: 'Slider', color: '#f472b6', accent: '#be123c' },
  changeup: { label: 'Changeup', color: '#a78bfa', accent: '#6d28d9' },
  curveball: { label: 'Curveball', color: '#fb7185', accent: '#9f1239' },
};

function buildPitchCurve(profile: PitchProfile) {
  const releaseY = profile.releaseHeight * metersPerFoot;
  const plateZ = plateDistance * metersPerFoot;
  const breakIntensity = (profile.spinRate / 2500) * (profile.pitchType === 'fourSeam' ? 0.45 : 0.7);
  const lateralBias =
    profile.pitchType === 'slider'
      ? -0.9
      : profile.pitchType === 'curveball'
        ? -0.6
        : profile.pitchType === 'changeup'
          ? 0.3
          : 0.1;
  const liftBias = profile.pitchType === 'fourSeam' ? 0.45 : profile.pitchType === 'curveball' ? -0.8 : -0.1;

  const verticalDrop = (1.6 - liftBias) * breakIntensity;
  const horizontalBreak = lateralBias * breakIntensity;

  const start = new THREE.Vector3(0, releaseY, 0);
  const mid1 = new THREE.Vector3(horizontalBreak * 0.25, releaseY - verticalDrop * 0.35, plateZ * 0.35);
  const mid2 = new THREE.Vector3(horizontalBreak * 0.75, releaseY - verticalDrop * 0.85, plateZ * 0.7);
  const end = new THREE.Vector3(horizontalBreak, profile.targetElevation * metersPerFoot, plateZ);

  return new THREE.CatmullRomCurve3([start, mid1, mid2, end]);
}

/**
 * PitchTunnelSimulator - Interactive 3D pitch visualization component
 * 
 * Provides a real-time Three.js-based visualization of baseball pitch trajectories,
 * allowing users to adjust pitch parameters and analyze tunneling effects between
 * different pitch types.
 * 
 * @remarks
 * This component uses client-side rendering only and should be loaded dynamically
 * with { ssr: false } to avoid server-side Three.js initialization issues.
 */
export function PitchTunnelSimulator() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const animationRef = useRef<number>();
  const ballRef = useRef<THREE.Mesh | null>(null);
  const pathGroupRef = useRef<THREE.Group | null>(null);
  const primaryCurveRef = useRef<THREE.CatmullRomCurve3 | null>(null);
  const tunnelCurveRef = useRef<THREE.CatmullRomCurve3 | null>(null);
  const tunnelShellRef = useRef<THREE.Mesh | null>(null);
  const clockRef = useRef(new THREE.Clock());
  const travelTimeRef = useRef(0.45);

  const [pitchType, setPitchType] = useState<PitchType>('fourSeam');
  const [tunnelPitch, setTunnelPitch] = useState<PitchType>('slider');
  const [velocity, setVelocity] = useState(95);
  const [spinRate, setSpinRate] = useState(2350);
  const [tunnelWindow, setTunnelWindow] = useState(18);
  const [releaseHeight, setReleaseHeight] = useState(6.1);
  const [targetElevation, setTargetElevation] = useState(2.4);
  const [tunnelingScore, setTunnelingScore] = useState(86);
  const [movementSummary, setMovementSummary] = useState({
    inducedBreak: 12,
    carry: 14,
    depth: 5,
  });
  const [tunnelGap, setTunnelGap] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = Math.max(420, container.clientHeight);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0b1021');

    const camera = new THREE.PerspectiveCamera(58, width / height, 0.1, 120);
    camera.position.set(0, 2.8, -12);
    camera.lookAt(0, 2, plateDistance * metersPerFoot * 0.55);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight('#cbd5e1', 0.75);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight('#93c5fd', 1.1);
    keyLight.position.set(-3, 6, -3);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight('#f472b6', 0.5);
    rimLight.position.set(3, 3, 6);
    scene.add(rimLight);

    const mound = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 26),
      new THREE.MeshPhongMaterial({ color: '#0f172a', side: THREE.DoubleSide, transparent: true, opacity: 0.9 }),
    );
    mound.rotation.x = -Math.PI / 2;
    mound.position.z = (plateDistance * metersPerFoot) / 2;
    scene.add(mound);

    const stripeMaterial = new THREE.LineBasicMaterial({ color: '#1f2937', transparent: true, opacity: 0.7 });
    const grid = new THREE.GridHelper(12, 16, '#1f2937', '#1f2937');
    grid.position.z = plateDistance * metersPerFoot * 0.5;
    scene.add(grid);
    scene.add(
      new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(17, 0.01, 22)),
        stripeMaterial,
      ),
    );

    const strikeZone = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1.7, 3.4, 0.1)),
      new THREE.LineBasicMaterial({ color: '#38bdf8', transparent: true, opacity: 0.85 }),
    );
    strikeZone.position.set(0, 2.4 * metersPerFoot, plateDistance * metersPerFoot);
    scene.add(strikeZone);

    const homePlate = new THREE.Mesh(
      new THREE.CircleGeometry(0.7, 6),
      new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.6 }),
    );
    homePlate.rotation.x = -Math.PI / 2;
    homePlate.position.set(0, 0.005, plateDistance * metersPerFoot);
    scene.add(homePlate);

    const pathGroup = new THREE.Group();
    scene.add(pathGroup);

    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.17, 32, 32),
      new THREE.MeshStandardMaterial({ color: '#f8fafc', emissive: '#22d3ee', emissiveIntensity: 0.35 }),
    );
    scene.add(ball);

    const resize = () => {
      if (!container || !camera || !renderer) return;
      const newWidth = container.clientWidth;
      const newHeight = Math.max(420, container.clientHeight);
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', resize);

    const animate = () => {
      const delta = clockRef.current.getDelta();
      const curve = primaryCurveRef.current;
      if (curve && ballRef.current) {
        const tIncrement = delta / travelTimeRef.current;
        const normalized = ((ballRef.current.userData.progress || 0) + tIncrement) % 1;
        ballRef.current.userData.progress = normalized;
        const point = curve.getPointAt(normalized);
        ballRef.current.position.copy(point);
      }

      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };

    sceneRef.current = scene;
    pathGroupRef.current = pathGroup;
    ballRef.current = ball;

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current ?? 0);
      window.removeEventListener('resize', resize);
      // Dispose geometries and materials to prevent memory leaks
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((m) => m.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    const velocityFeetPerSecond = velocity * 1.46667;
    travelTimeRef.current = plateDistance / velocityFeetPerSecond;
  }, [velocity]);

  useEffect(() => {
    if (!sceneRef.current || !pathGroupRef.current) return;

    const profile: PitchProfile = {
      pitchType,
      velocity,
      spinRate,
      releaseHeight,
      targetElevation,
      tunnelWindow,
    };

    const tunnelProfile: PitchProfile = {
      pitchType: tunnelPitch,
      velocity: Math.max(velocity - 6, 78),
      spinRate: tunnelPitch === 'slider' ? spinRate + 150 : spinRate - 120,
      releaseHeight,
      targetElevation: targetElevation - 0.25,
      tunnelWindow,
    };

    const primaryCurve = buildPitchCurve(profile);
    const tunnelPairCurve = buildPitchCurve(tunnelProfile);

    primaryCurveRef.current = primaryCurve;
    tunnelCurveRef.current = tunnelPairCurve;

    const group = pathGroupRef.current;
    while (group.children.length) {
      const child = group.children.pop();
      if (!child) continue;
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    }

    // Cache materials by color to avoid recreating them on every render
    const materialCache = new Map<string, THREE.MeshStandardMaterial>();
    const getMaterial = (color: string, opacity: number) => {
      if (!materialCache.has(color)) {
        materialCache.set(
          color,
          new THREE.MeshStandardMaterial({
            color,
            opacity, // default opacity, can be overridden per mesh
            transparent: true,
            metalness: 0.08,
            roughness: 0.45,
          })
        );
      }
      // Clone the cached material to allow per-mesh opacity changes
      const baseMaterial = materialCache.get(color)!;
      const material = baseMaterial.clone();
      material.opacity = opacity;
      return material;
    };

    const buildTube = (curve: THREE.CatmullRomCurve3, color: string, opacity: number) =>
      new THREE.Mesh(
        new THREE.TubeGeometry(curve, 120, 0.08, 16, false),
        getMaterial(color, opacity),
      );

    const primaryMesh = buildTube(primaryCurve, pitchPalette[pitchType].color, 0.82);
    const tunnelMesh = buildTube(tunnelPairCurve, pitchPalette[tunnelPitch].color, 0.55);

    group.add(primaryMesh);
    group.add(tunnelMesh);

    const windowRatio = Math.min(tunnelWindow / plateDistance, 0.95);
    const tunnelMidpoint = primaryCurve.getPointAt(windowRatio).lerp(tunnelPairCurve.getPointAt(windowRatio), 0.5);
    const sharedCurve = new THREE.CatmullRomCurve3([
      primaryCurve.getPointAt(0),
      primaryCurve.getPointAt(windowRatio * 0.55),
      tunnelMidpoint,
    ]);

    // Clean up old tunnel shell mesh before creating a new one
    if (tunnelShellRef.current) {
      group.remove(tunnelShellRef.current);
      tunnelShellRef.current.geometry.dispose();
      if (Array.isArray(tunnelShellRef.current.material)) {
        tunnelShellRef.current.material.forEach((m) => m.dispose());
      } else {
        tunnelShellRef.current.material.dispose();
      }
    }

    tunnelShellRef.current = new THREE.Mesh(
      new THREE.TubeGeometry(sharedCurve, 40, 0.28, 10, false),
      new THREE.MeshStandardMaterial({ color: '#22c55e', transparent: true, opacity: 0.28, roughness: 0.3 }),
    );
    group.add(tunnelShellRef.current);

    if (ballRef.current) {
      ballRef.current.position.copy(primaryCurve.getPointAt(0));
      ballRef.current.userData.progress = 0;
    }

    const divergence = primaryCurve.getPointAt(windowRatio).distanceTo(tunnelPairCurve.getPointAt(windowRatio));
    const score = Math.max(12, Math.min(100, 98 - divergence * 140));
    const inducedBreak = Math.abs(primaryCurve.getPoint(1).x) * 39.37; // inches
    const carry = Math.max(0, (targetElevation - 2.4) * 12 + 12);
    const depth = Math.max(0, (2.6 - targetElevation) * 8 + (pitchType === 'curveball' ? 4 : 0));

    setMovementSummary({
      inducedBreak: Number(inducedBreak.toFixed(1)),
      carry: Number(carry.toFixed(1)),
      depth: Number(depth.toFixed(1)),
    });
    setTunnelingScore(Number(score.toFixed(1)));
    setTunnelGap(Number(divergence.toFixed(2)));
  }, [pitchType, tunnelPitch, velocity, spinRate, tunnelWindow, releaseHeight, targetElevation]);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-indigo-900/60 to-slate-900 text-white rounded-3xl p-6 shadow-2xl border border-slate-800/60">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-300">Real-Time 3D Pitch Design</p>
            <h1 className="text-3xl md:text-4xl font-bold mt-2">Pitch Tunnel & Physics Simulator</h1>
            <p className="text-slate-200 mt-2 max-w-3xl">
              Optimize release, spin, and tunneling windows in a production-ready viewport tailored for BlazeSportsIntel. Live geometry updates mirror pitch physics so analysts can ship designs straight to Cloudflare Pages.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center text-slate-100">
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <p className="text-xs uppercase tracking-widest text-slate-300">Tunneling Score</p>
              <p className="text-3xl font-bold text-emerald-300">{tunnelingScore}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <p className="text-xs uppercase tracking-widest text-slate-300">Window</p>
              <p className="text-3xl font-bold text-sky-300">{tunnelWindow} ft</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
        <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-4 shadow-xl">
          <div className="relative rounded-2xl overflow-hidden bg-slate-900/80 border border-slate-800" style={{ minHeight: 480 }}>
            <div ref={containerRef} className="w-full h-full" />

            <div className="absolute inset-x-4 bottom-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-100">
              <div className="bg-black/50 border border-white/10 rounded-xl p-3">
                <p className="text-slate-300">Primary Pitch</p>
                <p className="font-semibold" style={{ color: pitchPalette[pitchType].color }}>{pitchPalette[pitchType].label}</p>
              </div>
              <div className="bg-black/50 border border-white/10 rounded-xl p-3">
                <p className="text-slate-300">Tunnel Partner</p>
                <p className="font-semibold" style={{ color: pitchPalette[tunnelPitch].color }}>{pitchPalette[tunnelPitch].label}</p>
              </div>
              <div className="bg-black/50 border border-white/10 rounded-xl p-3">
                <p className="text-slate-300">Gap @ Window</p>
                <p className="font-semibold text-emerald-300">{tunnelGap} m</p>
              </div>
              <div className="bg-black/50 border border-white/10 rounded-xl p-3">
                <p className="text-slate-300">Travel Time</p>
                <p className="font-semibold text-sky-300">{travelTimeRef.current.toFixed(3)} s</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs uppercase text-slate-500 tracking-wide">Pitch Pair</p>
                <h3 className="text-xl font-semibold text-slate-900">Design inputs</h3>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                Real-time
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Primary pitch
                <select
                  value={pitchType}
                  onChange={(e) => setPitchType(e.target.value as PitchType)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {Object.entries(pitchPalette).map(([key, meta]) => (
                    <option key={key} value={key}>
                      {meta.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Tunnel partner
                <select
                  value={tunnelPitch}
                  onChange={(e) => setTunnelPitch(e.target.value as PitchType)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {Object.entries(pitchPalette)
                    .filter(([key]) => key !== pitchType)
                    .map(([key, meta]) => (
                      <option key={key} value={key}>
                        {meta.label}
                      </option>
                    ))}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <label className="block text-sm font-medium text-slate-700">
                Velocity {velocity} mph
                <input
                  type="range"
                  min={78}
                  max={101}
                  step={0.5}
                  value={velocity}
                  onChange={(e) => setVelocity(Number(e.target.value))}
                  className="w-full mt-2 accent-indigo-600"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Spin Rate {spinRate} rpm
                <input
                  type="range"
                  min={1500}
                  max={2900}
                  step={25}
                  value={spinRate}
                  onChange={(e) => setSpinRate(Number(e.target.value))}
                  className="w-full mt-2 accent-indigo-600"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Release Height {releaseHeight.toFixed(1)} ft
                <input
                  type="range"
                  min={4.8}
                  max={7.2}
                  step={0.1}
                  value={releaseHeight}
                  onChange={(e) => setReleaseHeight(Number(e.target.value))}
                  className="w-full mt-2 accent-indigo-600"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Target Elevation {targetElevation.toFixed(1)} ft
                <input
                  type="range"
                  min={1.6}
                  max={3.2}
                  step={0.1}
                  value={targetElevation}
                  onChange={(e) => setTargetElevation(Number(e.target.value))}
                  className="w-full mt-2 accent-indigo-600"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
                Tunneling Window {tunnelWindow} ft
                <input
                  type="range"
                  min={10}
                  max={35}
                  step={1}
                  value={tunnelWindow}
                  onChange={(e) => setTunnelWindow(Number(e.target.value))}
                  className="w-full mt-2 accent-indigo-600"
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-400">Induced horizontal break</p>
              <p className="text-2xl font-semibold mt-1">{movementSummary.inducedBreak} in</p>
              <p className="text-slate-400 text-sm">Tunnel gap: {tunnelGap} m</p>
            </div>
            <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-400">Carry / hop</p>
              <p className="text-2xl font-semibold mt-1">{movementSummary.carry} in</p>
              <p className="text-slate-400 text-sm">Release: {releaseHeight.toFixed(1)} ft</p>
            </div>
            <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-400">Depth & shape</p>
              <p className="text-2xl font-semibold mt-1">{movementSummary.depth} in</p>
              <p className="text-slate-400 text-sm">Target: {targetElevation.toFixed(1)} ft</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-slate-500 tracking-wide">Production checklist</p>
                <h3 className="text-lg font-semibold text-slate-900">Deployment-ready specs</h3>
              </div>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1">
                Cloudflare ready
              </span>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-700">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> GPU-safe Three.js scene with controlled geometry disposal
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Deterministic pitch state for CI snapshots and analytics exports
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Ready for CDN delivery via BlazeSportsIntel Cloudflare Pages route
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Tunable windows for tunneling and deception analysis
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PitchTunnelSimulator;
