'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

interface PitchParams {
  velocity: number; // mph
  spinRate: number; // rpm
  spinAxis: number; // degrees (0 = pure backspin, 90 = glove side run)
  releaseHeight: number; // feet
  releaseSide: number; // feet (negative = 3B side, positive = 1B side)
  extension: number; // feet
  targetHeight: number; // feet
  lateralTarget: number; // feet at plate
  drag: number; // drag coefficient scaling
  spinEfficiency: number; // 0-1
  seamShift: number; // extra break force
}

interface Point3D {
  x: number; // forward distance from release
  y: number; // horizontal (glove side +)
  z: number; // height
  t: number; // time seconds
}

interface SimulationResult {
  path: Point3D[];
  flightTime: number;
  platePoint: Point3D;
  tunnelPoint: Point3D | null;
  idealTunnelPoint: Point3D | null;
  tunnelDeviation: number;
  strikeLikelihood: number;
}

const PLATE_DISTANCE = 60.5; // feet
const STRIKE_ZONE = {
  top: 3.5,
  bottom: 1.5,
  halfWidth: (17 / 12) / 2, // 17 inches wide strike zone plate approximation
};

function mphToFps(mph: number) {
  return mph * 1.46667;
}

function magnitude(v: { x: number; y: number; z: number }) {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

function normalize(v: { x: number; y: number; z: number }) {
  const mag = magnitude(v) || 1;
  return { x: v.x / mag, y: v.y / mag, z: v.z / mag };
}

function cross(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function interpolateAtX(path: Point3D[], targetX: number): Point3D | null {
  if (!path.length) return null;

  for (let i = 1; i < path.length; i++) {
    const prev = path[i - 1];
    const curr = path[i];
    if (prev.x <= targetX && curr.x >= targetX) {
      const span = curr.x - prev.x || 1;
      const ratio = (targetX - prev.x) / span;
      return {
        x: targetX,
        y: lerp(prev.y, curr.y, ratio),
        z: lerp(prev.z, curr.z, ratio),
        t: lerp(prev.t, curr.t, ratio),
      };
    }
  }

  return path[path.length - 1] || null;
}

function simulatePitch(params: PitchParams, tunnelWindowFromPlate: number): SimulationResult {
  const dt = 0.005;
  const path: Point3D[] = [];
  const travelDistance = Math.max(5, PLATE_DISTANCE - params.extension);
  const release = { x: 0, y: params.releaseSide, z: params.releaseHeight };
  const target = { x: travelDistance, y: params.lateralTarget, z: params.targetHeight };

  const initialDirection = normalize({
    x: target.x - release.x,
    y: target.y - release.y,
    z: target.z - release.z,
  });

  let velocity = {
    x: initialDirection.x * mphToFps(params.velocity),
    y: initialDirection.y * mphToFps(params.velocity),
    z: initialDirection.z * mphToFps(params.velocity),
  };

  let position = { ...release };
  let time = 0;

  const spinAxisRad = (params.spinAxis * Math.PI) / 180;
  const spinAxisVec = normalize({ x: 0, y: Math.sin(spinAxisRad), z: Math.cos(spinAxisRad) });
  const magnusScale = 0.00025 * params.spinEfficiency * (params.spinRate / 2200);
  const dragScale = params.drag * 0.0024;
  const seamShiftForce = params.seamShift * 0.08;

  while (position.x < travelDistance && position.z > -5 && time < 5) {
    const speed = magnitude(velocity);
    const dragAccel = {
      x: -dragScale * speed * velocity.x,
      y: -dragScale * speed * velocity.y,
      z: -dragScale * speed * velocity.z,
    };

    const magnusAccel = cross(spinAxisVec, velocity);
    magnusAccel.x *= magnusScale;
    magnusAccel.y *= magnusScale;
    magnusAccel.z *= magnusScale;

    const gravity = { x: 0, y: 0, z: -32.174 };

    const seamShiftAccel = {
      x: 0,
      y: seamShiftForce * Math.cos(spinAxisRad + Math.PI / 3),
      z: seamShiftForce * Math.sin(spinAxisRad),
    };

    velocity = {
      x: velocity.x + (gravity.x + dragAccel.x + magnusAccel.x + seamShiftAccel.x) * dt,
      y: velocity.y + (gravity.y + dragAccel.y + magnusAccel.y + seamShiftAccel.y) * dt,
      z: velocity.z + (gravity.z + dragAccel.z + magnusAccel.z + seamShiftAccel.z) * dt,
    };

    position = {
      x: position.x + velocity.x * dt,
      y: position.y + velocity.y * dt,
      z: position.z + velocity.z * dt,
    };

    time += dt;
    path.push({ ...position, t: time });
  }

  const platePoint = interpolateAtX(path, travelDistance) || path[path.length - 1];
  const tunnelTargetX = Math.max(0, travelDistance - tunnelWindowFromPlate);
  const tunnelPoint = interpolateAtX(path, tunnelTargetX);

  const idealTunnelPoint = {
    x: tunnelTargetX,
    y: release.y + (tunnelTargetX / travelDistance) * (target.y - release.y),
    z: release.z + (tunnelTargetX / travelDistance) * (target.z - release.z),
    t: 0,
  };

  const tunnelDeviation = tunnelPoint
    ? Math.sqrt(
        Math.pow(tunnelPoint.y - idealTunnelPoint.y, 2) + Math.pow(tunnelPoint.z - idealTunnelPoint.z, 2)
      ) * 12 // convert to inches
    : 0;

  const strikeLikelihood = (() => {
    if (!platePoint) return 0;
    const inZone =
      Math.abs(platePoint.y) <= STRIKE_ZONE.halfWidth &&
      platePoint.z >= STRIKE_ZONE.bottom &&
      platePoint.z <= STRIKE_ZONE.top;

    const missDistance = Math.max(0, Math.abs(platePoint.y) - STRIKE_ZONE.halfWidth) * 12 +
      (platePoint.z < STRIKE_ZONE.bottom
        ? (STRIKE_ZONE.bottom - platePoint.z) * 12
        : platePoint.z > STRIKE_ZONE.top
        ? (platePoint.z - STRIKE_ZONE.top) * 12
        : 0);

    if (inZone) return 0.93;
    if (missDistance < 3) return 0.7;
    if (missDistance < 6) return 0.52;
    return 0.28;
  })();

  return {
    path,
    flightTime: time,
    platePoint,
    tunnelPoint,
    idealTunnelPoint,
    tunnelDeviation,
    strikeLikelihood,
  };
}

interface ProjectionConfig {
  width: number;
  height: number;
}

function project(point: Point3D, config: ProjectionConfig) {
  const cameraDistance = 120;
  const scale = cameraDistance / (cameraDistance + point.x);
  const centerX = config.width / 2;
  const groundY = config.height * 0.82;
  const yScale = 14;
  const zScale = 26;

  return {
    x: centerX + point.y * yScale * scale,
    y: groundY - point.z * zScale * scale,
  };
}

interface PitchTunnelSimulatorProps {
  title?: string;
}

export function PitchTunnelSimulator({ title = 'Pitch Tunnel Simulator' }: PitchTunnelSimulatorProps) {
  const [params, setParams] = useState<PitchParams>({
    velocity: 95,
    spinRate: 2400,
    spinAxis: 180,
    releaseHeight: 6.1,
    releaseSide: -1.6,
    extension: 6.5,
    targetHeight: 2.4,
    lateralTarget: 0,
    drag: 0.78,
    spinEfficiency: 0.88,
    seamShift: 0.3,
  });

  const [tunnelWindow, setTunnelWindow] = useState(23); // feet from plate
  const [tunnelWidth, setTunnelWidth] = useState(6); // inches
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 920, height: 560 });

  const simulation = useMemo(() => simulatePitch(params, tunnelWindow), [params, tunnelWindow]);

  useEffect(() => {
    const resize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = Math.max(420, Math.round(width * 0.55));
      setCanvasSize({ width, height });
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;
    const startTime = performance.now();

    const render = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      drawScene(ctx, canvasSize, simulation, elapsed);
      animationFrame = requestAnimationFrame(render);
    };

    animationFrame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrame);
  }, [canvasSize, simulation]);

  const updateParam = (key: keyof PitchParams, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const tunnelHealth = Math.max(0, 100 - Math.abs(simulation.tunnelDeviation - tunnelWidth));

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3">
        <p className="text-sm text-indigo-200 uppercase tracking-[0.2em]">Real-Time 3D Physics</p>
        <h2 className="text-3xl md:text-4xl font-bold text-white drop-shadow-sm">{title}</h2>
        <p className="text-indigo-100 max-w-4xl">
          Design elite pitch shapes, watch real-time ball flight, and validate tunneling windows before they reach the hitter. The
          simulation blends drag, Magnus lift, seam-shift wake, and extension to stay production-ready for BlazeSportsIntel.com.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr,1.1fr] gap-6">
        <div className="bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-950 border border-indigo-700/50 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-indigo-800/60 bg-black/20">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-indigo-600/40 border border-indigo-400/50 backdrop-blur" />
              <div>
                <p className="text-sm text-indigo-100">Ball Flight Canvas</p>
                <p className="text-lg font-semibold text-white">Tunneling + Strike Fit</p>
              </div>
            </div>
            <div className="flex gap-3 text-sm text-indigo-100">
              <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-400/40 rounded-full">
                Flight {simulation.flightTime.toFixed(2)}s
              </span>
              <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/40 rounded-full">
                Strike {Math.round(simulation.strikeLikelihood * 100)}%
              </span>
            </div>
          </div>
          <div ref={containerRef} className="p-3">
            <canvas ref={canvasRef} className="w-full h-full rounded-xl bg-slate-950" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="bg-slate-900/80 border border-indigo-800/60 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-indigo-200">Tunneling Health</p>
              <span className="text-xs px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-100">
                Window {tunnelWindow}ft | Width {tunnelWidth} in
              </span>
            </div>
            <div className="flex items-end gap-3 mb-3">
              <p className="text-5xl font-semibold text-white">{Math.round(tunnelHealth)}%</p>
              <p className="text-indigo-200">cohesion</p>
            </div>
            <p className="text-indigo-100 text-sm mb-4">
              Deviations inside the corridor keep pitches visually identical out of the hand. Anything outside raises hitter pickup risk.
            </p>
            <div className="space-y-2">
              <RangeRow
                label="Tunnel window from plate"
                value={tunnelWindow}
                min={10}
                max={45}
                step={1}
                unit="ft"
                onChange={(v) => setTunnelWindow(v)}
              />
              <RangeRow
                label="Tunnel width"
                value={tunnelWidth}
                min={2}
                max={12}
                step={0.5}
                unit="in"
                onChange={(v) => setTunnelWidth(v)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MetricCard title="Plate Entry" value={`${simulation.platePoint.z.toFixed(2)} ft`} hint="Height at plate" />
            <MetricCard
              title="Edge Distance"
              value={`${Math.abs(simulation.platePoint.y).toFixed(2)} ft`}
              hint="Horizontal offset"
            />
            <MetricCard
              title="Tunnel Deviation"
              value={`${simulation.tunnelDeviation.toFixed(1)} in`}
              hint="vs. ideal corridor"
            />
            <MetricCard title="Time to Plate" value={`${simulation.flightTime.toFixed(2)} s`} hint="Total flight" />
          </div>

          <div className="bg-slate-900/80 border border-indigo-800/60 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-indigo-200">Pitch DNA</p>
              <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-100">
                Real-time recalculation
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <RangeRow
                label="Velocity"
                value={params.velocity}
                min={70}
                max={102}
                step={0.5}
                unit="mph"
                onChange={(v) => updateParam('velocity', v)}
              />
              <RangeRow
                label="Spin Rate"
                value={params.spinRate}
                min={1600}
                max={3200}
                step={50}
                unit="rpm"
                onChange={(v) => updateParam('spinRate', v)}
              />
              <RangeRow
                label="Spin Axis"
                value={params.spinAxis}
                min={0}
                max={360}
                step={5}
                unit="deg"
                onChange={(v) => updateParam('spinAxis', v)}
              />
              <RangeRow
                label="Spin Efficiency"
                value={params.spinEfficiency}
                min={0.4}
                max={1}
                step={0.01}
                unit="%"
                format={(v) => `${Math.round(v * 100)}%`}
                onChange={(v) => updateParam('spinEfficiency', Number(v.toFixed(2)))}
              />
              <RangeRow
                label="Drag / Air Density"
                value={params.drag}
                min={0.4}
                max={1.4}
                step={0.02}
                unit="x"
                onChange={(v) => updateParam('drag', Number(v.toFixed(2)))}
              />
              <RangeRow
                label="Seam-Shift Force"
                value={params.seamShift}
                min={0}
                max={0.8}
                step={0.05}
                unit="g"
                onChange={(v) => updateParam('seamShift', Number(v.toFixed(2)))}
              />
              <RangeRow
                label="Release Height"
                value={params.releaseHeight}
                min={4.5}
                max={7}
                step={0.05}
                unit="ft"
                onChange={(v) => updateParam('releaseHeight', Number(v.toFixed(2)))}
              />
              <RangeRow
                label="Release Side"
                value={params.releaseSide}
                min={-3}
                max={3}
                step={0.05}
                unit="ft"
                onChange={(v) => updateParam('releaseSide', Number(v.toFixed(2)))}
              />
              <RangeRow
                label="Extension"
                value={params.extension}
                min={4}
                max={8}
                step={0.1}
                unit="ft"
                onChange={(v) => updateParam('extension', Number(v.toFixed(1)))}
              />
              <RangeRow
                label="Target Height"
                value={params.targetHeight}
                min={1.5}
                max={4.5}
                step={0.05}
                unit="ft"
                onChange={(v) => updateParam('targetHeight', Number(v.toFixed(2)))}
              />
              <RangeRow
                label="Glove Side Target"
                value={params.lateralTarget}
                min={-2}
                max={2}
                step={0.05}
                unit="ft"
                onChange={(v) => updateParam('lateralTarget', Number(v.toFixed(2)))}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

interface RangeRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
  format?: (value: number) => string;
}

function RangeRow({ label, value, min, max, step, unit, format, onChange }: RangeRowProps) {
  return (
    <div className="flex flex-col gap-2 bg-slate-950/40 rounded-xl p-3 border border-slate-800/70">
      <div className="flex items-center justify-between text-sm text-indigo-100">
        <p>{label}</p>
        <p className="font-semibold text-white">{format ? format(value) : `${value} ${unit ?? ''}`}</p>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-indigo-400"
      />
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  hint?: string;
}

function MetricCard({ title, value, hint }: MetricCardProps) {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow">
      <p className="text-sm text-indigo-200">{title}</p>
      <p className="text-2xl font-semibold text-white">{value}</p>
      {hint ? <p className="text-xs text-slate-300 mt-1">{hint}</p> : null}
    </div>
  );
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  size: ProjectionConfig,
  simulation: SimulationResult,
  elapsed: number
) {
  ctx.clearRect(0, 0, size.width, size.height);
  ctx.fillStyle = '#030712';
  ctx.fillRect(0, 0, size.width, size.height);

  // Background grid
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.15)';
  ctx.lineWidth = 1;
  const gridSpacing = 60;
  for (let x = 0; x < size.width; x += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size.height);
    ctx.stroke();
  }
  for (let y = 0; y < size.height; y += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size.width, y);
    ctx.stroke();
  }

  // Plate + strike zone
  const plate = project({ x: PLATE_DISTANCE, y: 0, z: 0, t: 0 }, size);
  const plateWidth = 120;
  const plateHeight = 80;
  const zone = project({ x: PLATE_DISTANCE, y: 0, z: STRIKE_ZONE.bottom, t: 0 }, size);
  const zoneTop = project({ x: PLATE_DISTANCE, y: 0, z: STRIKE_ZONE.top, t: 0 }, size);

  ctx.fillStyle = 'rgba(59, 130, 246, 0.08)';
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(plate.x - plateWidth / 2, plate.y - plateHeight / 2, plateWidth, plateHeight, 8);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = 'rgba(16, 185, 129, 0.7)';
  ctx.setLineDash([6, 6]);
  ctx.strokeRect(plate.x - 24, zoneTop.y, 48, zone.y - zoneTop.y);
  ctx.setLineDash([]);

  // Tunnel corridor
  const tunnelDistance = simulation.tunnelPoint?.x ?? PLATE_DISTANCE - 23;
  const tunnelWidth = 12; // visual only
  const tunnelPointProjected = project({ x: tunnelDistance, y: 0, z: 2.5, t: 0 }, size);
  const corridorOpacity = 0.18;
  const corridorWidthPx = Math.max(18, 180 * (tunnelWidth / 12));

  const gradient = ctx.createRadialGradient(
    tunnelPointProjected.x,
    tunnelPointProjected.y,
    20,
    tunnelPointProjected.x,
    tunnelPointProjected.y,
    corridorWidthPx
  );
  gradient.addColorStop(0, `rgba(167, 139, 250, ${corridorOpacity + 0.1})`);
  gradient.addColorStop(1, `rgba(79, 70, 229, ${corridorOpacity})`);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(
    tunnelPointProjected.x,
    tunnelPointProjected.y,
    corridorWidthPx,
    corridorWidthPx * 0.4,
    Math.PI / 16,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Path rendering
  const path = simulation.path;
  if (path.length > 1) {
    const progress = (elapsed % Math.max(simulation.flightTime + 0.4, 0.6)) / Math.max(simulation.flightTime + 0.4, 0.6);
    const travelTime = progress * simulation.flightTime;
    const timeIndex = Math.min(path.length - 1, Math.floor((travelTime / simulation.flightTime) * path.length));
    const activePoint = path[timeIndex];

    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(96, 165, 250, 0.7)';
    ctx.beginPath();
    path.forEach((p, idx) => {
      const proj = project(p, size);
      if (idx === 0) ctx.moveTo(proj.x, proj.y);
      else ctx.lineTo(proj.x, proj.y);
    });
    ctx.stroke();

    // Highlight tunnel point
    if (simulation.tunnelPoint) {
      const projTunnel = project(simulation.tunnelPoint, size);
      ctx.fillStyle = 'rgba(167, 139, 250, 0.8)';
      ctx.beginPath();
      ctx.arc(projTunnel.x, projTunnel.y, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Current ball
    if (activePoint) {
      const projActive = project(activePoint, size);
      ctx.shadowColor = 'rgba(251, 191, 36, 0.7)';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(projActive.x, projActive.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  // Text overlays
  ctx.fillStyle = 'rgba(226, 232, 240, 0.8)';
  ctx.font = '12px Inter, sans-serif';
  ctx.fillText('Plate', plate.x - 16, plate.y + plateHeight / 2 + 14);
  ctx.fillText('Strike zone', plate.x - 28, zoneTop.y - 10);
  ctx.fillText(`Tunnel deviation: ${simulation.tunnelDeviation.toFixed(1)} in`, 24, 28);
  ctx.fillText(`Plate height: ${simulation.platePoint.z.toFixed(2)} ft`, 24, 46);
}

export default PitchTunnelSimulator;
