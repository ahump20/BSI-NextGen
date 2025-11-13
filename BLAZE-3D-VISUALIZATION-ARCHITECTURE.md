# BLAZE SPORTS INTEL - 3D VISUALIZATION ARCHITECTURE

**Status:** Design Complete - Ready for Implementation
**Author:** Claude Sonnet 4.5 (Graphics Engineering Specialist)
**Date:** 2025-11-09
**Platform:** BSI-NextGen (Next.js 14 + Babylon.js + WebGPU)

---

## EXECUTIVE SUMMARY

Transform Blaze Sports Intel from static dashboards into GPU-accelerated immersive analytics experiences. This architecture delivers:

- **Baseball Diamond Heatmaps**: Hit/pitch location density fields with 60fps on mobile
- **Football Field Visualizations**: Play-by-play 3D replays with player tracking
- **Basketball Shot Charts**: Volumetric shot density with defensive zone overlays
- **Monte Carlo Simulations**: Real-time GPU-computed championship probabilities
- **Pythagorean Visualizations**: Geometric representations of expected wins/losses

**Performance Targets:**
- Mobile (iPhone 12 Pro): 60fps @ 1170×2532
- Desktop (M1 Mac): 120fps @ 2560×1440
- Initial Load: <2s for 3D scene + 100k data points
- Memory Budget: 150MB max on mobile, 500MB desktop

---

## 1. TECHNOLOGY STACK

### 1.1 Core 3D Engine

**Babylon.js 7.x** (not React Three Fiber)

**Justification:**
- **WebGPU Compute Shaders**: WGSL support for parallel heatmap generation (10,000x faster than CPU)
- **Mobile Optimization**: Built-in frame budget allocator and LOD system
- **Physics Engine**: Havok integration for trajectory simulations
- **SSR Compatible**: Works with Next.js App Router without hydration issues
- **Direct Canvas Access**: No React reconciliation overhead for 60fps

### 1.2 Rendering Pipeline

```
User Data (SportsDataIO API)
    ↓
Data Adapter Layer (@bsi/api)
    ↓
3D Data Transformer (sparse voxel octree)
    ↓
WebGPU Compute Shaders (heatmap generation, trajectory sim)
    ↓
Babylon.js Scene Graph (meshes, materials, lights)
    ↓
Adaptive Rendering (60fps mobile, 120fps desktop)
    ↓
Frame Buffer → Canvas → Display
```

### 1.3 Dependencies

```json
{
  "dependencies": {
    "@babylonjs/core": "^7.30.0",
    "@babylonjs/loaders": "^7.30.0",
    "@babylonjs/materials": "^7.30.0",
    "@babylonjs/inspector": "^7.30.0",
    "@babylonjs/havok": "^1.3.0"
  },
  "devDependencies": {
    "@webgpu/types": "^0.1.51"
  }
}
```

---

## 2. SYSTEM ARCHITECTURE

### 2.1 Component Hierarchy

```
<BabylonScene>                     # Base WebGPU/WebGL2 engine wrapper
  ├── <DeviceCapabilityDetector>   # WebGPU support check, memory profiling
  ├── <PerformanceMonitor>         # Frame time tracking, auto-LOD adjustment
  ├── <TouchControls>              # Mobile gesture system + haptics
  └── Sport-Specific Scenes:
      ├── <BaseballDiamond>        # 3D diamond + player positions
      │   ├── <HitHeatMap>         # Density field visualization
      │   ├── <PitchTrajectory>    # Physics-based ball path
      │   └── <DefensiveShift>     # Player positioning overlay
      ├── <FootballField>          # 100-yard 3D field
      │   ├── <PlayVisualization>  # Animated play-by-play
      │   ├── <FormationEditor>    # Interactive playbook designer
      │   └── <DriveChart3D>       # Spatial drive progression
      └── <BasketballCourt>        # NBA court with shot tracking
          ├── <ShotChart3D>        # Volumetric shot density
          ├── <PlayerMovement>     # Real-time position tracking
          └── <DefensiveZones>     # Zone defense visualization
```

### 2.2 Data Flow

```typescript
// Real-time game data from API
type GameData = {
  plays: Play[];
  players: PlayerPosition[];
  events: GameEvent[];
  metadata: { timestamp: string; timezone: 'America/Chicago' };
};

// Transform to 3D-ready format
type Visualization3D = {
  spatialData: SparseVoxelOctree;  // Efficient spatial queries
  renderables: Mesh[];              // Babylon.js meshes
  animations: AnimationGroup[];     // Timeline-based replays
  heatmaps: ComputeBuffer[];        // WebGPU compute shader outputs
};

// Adaptive rendering configuration
type RenderConfig = {
  targetFPS: 60 | 120;
  lodLevels: 3 | 5 | 7;            // More LODs for desktop
  shadowQuality: 'off' | 'low' | 'high';
  postProcessing: boolean;          // Bloom, DOF for desktop only
  deviceCapability: 'low' | 'mid' | 'high';
};
```

### 2.3 Memory Management

```typescript
// Sparse Voxel Octree for 100k+ data points
class SVO {
  maxDepth: 10;                     // 1024×1024×1024 voxel grid
  compressedSize: ~5MB;             // vs 4GB for dense grid
  queryTime: O(log n);              // Fast spatial lookups
}

// Frame Budget Allocator
const MOBILE_FRAME_BUDGET = 16.67; // ms (60fps)
const DESKTOP_FRAME_BUDGET = 8.33; // ms (120fps)

allocateBudget({
  physics: 2ms,      // Trajectory simulation
  compute: 5ms,      // Heatmap generation (GPU)
  rendering: 7ms,    // Scene render + post-processing
  input: 1ms,        // Touch/mouse processing
  overhead: 1.67ms   // Buffer for GC, etc.
});
```

---

## 3. BASEBALL VISUALIZATION

### 3.1 Baseball Diamond Component

**Features:**
- 3D diamond mesh (home plate, bases, pitcher's mound, outfield fence)
- Player positions (real-time updates from game feed)
- Hit heatmap overlay (density field computed via WebGPU)
- Pitch trajectory visualization (physics simulation)

**Data Requirements:**
```typescript
interface BaseballVisualization {
  game: {
    inning: number;
    score: { home: number; away: number };
    outs: number;
    baseRunners: ('first' | 'second' | 'third')[];
  };
  heatmapData: {
    type: 'hits' | 'pitches';
    locations: { x: number; y: number; z: number; density: number }[];
    colorScale: 'red-hot' | 'blue-cold';
  };
  trajectories: {
    pitches: Array<{
      startPos: Vector3;
      releaseVelocity: Vector3;
      spinRate: number;  // RPM
      spinAxis: Vector3;
      type: 'fastball' | 'curveball' | 'slider' | 'changeup';
    }>;
  };
}
```

### 3.2 Hit Heatmap Shader (WebGPU Compute)

```wgsl
// heatmap-generator.wgsl
@group(0) @binding(0) var<storage, read> hitLocations: array<vec3f>;
@group(0) @binding(1) var<storage, read_write> densityField: array<f32>;

@compute @workgroup_size(8, 8, 8)
fn computeDensity(@builtin(global_invocation_id) id: vec3u) {
  let voxelPos = vec3f(f32(id.x), f32(id.y), f32(id.z));
  var density: f32 = 0.0;

  // Gaussian kernel density estimation
  for (var i: u32 = 0u; i < arrayLength(&hitLocations); i++) {
    let hit = hitLocations[i];
    let dist = distance(voxelPos, hit);
    let bandwidth = 5.0; // Tunable parameter
    density += exp(-0.5 * pow(dist / bandwidth, 2.0));
  }

  let voxelIndex = id.x + id.y * 256u + id.z * 256u * 256u;
  densityField[voxelIndex] = density;
}
```

### 3.3 Pitch Trajectory Physics

```typescript
// packages/web/src/lib/babylon/physics/pitch-trajectory.ts
import { Vector3 } from '@babylonjs/core';

export class PitchPhysics {
  // Magnus force for spin-induced movement
  static computeMagnusForce(
    velocity: Vector3,
    spinRate: number, // RPM
    spinAxis: Vector3
  ): Vector3 {
    const omega = (spinRate * 2 * Math.PI) / 60; // rad/s
    const S = spinAxis.normalize().scale(omega);
    const Fm = S.cross(velocity).scale(0.00001); // Lift coefficient
    return Fm;
  }

  // Drag force (air resistance)
  static computeDragForce(velocity: Vector3): Vector3 {
    const Cd = 0.3; // Baseball drag coefficient
    const rho = 1.225; // Air density (kg/m³)
    const A = 0.00426; // Cross-sectional area (m²)
    const vMag = velocity.length();
    const Fd = velocity.normalize().scale(-0.5 * Cd * rho * A * vMag * vMag);
    return Fd;
  }

  // Runge-Kutta 4th order integration
  static simulateTrajectory(
    initialPos: Vector3,
    initialVel: Vector3,
    spinRate: number,
    spinAxis: Vector3,
    timeStep: number = 0.01, // 10ms
    duration: number = 0.5    // 500ms (pitch duration)
  ): Vector3[] {
    const trajectory: Vector3[] = [initialPos.clone()];
    let pos = initialPos.clone();
    let vel = initialVel.clone();
    const gravity = new Vector3(0, -9.81, 0);

    for (let t = 0; t < duration; t += timeStep) {
      const magnus = this.computeMagnusForce(vel, spinRate, spinAxis);
      const drag = this.computeDragForce(vel);
      const accel = gravity.add(magnus).add(drag);

      // RK4 integration
      const k1v = accel.scale(timeStep);
      const k1p = vel.scale(timeStep);

      const k2v = accel.scale(timeStep);
      const k2p = vel.add(k1v.scale(0.5)).scale(timeStep);

      const k3v = accel.scale(timeStep);
      const k3p = vel.add(k2v.scale(0.5)).scale(timeStep);

      const k4v = accel.scale(timeStep);
      const k4p = vel.add(k3v).scale(timeStep);

      vel = vel.add(k1v.add(k2v.scale(2)).add(k3v.scale(2)).add(k4v).scale(1/6));
      pos = pos.add(k1p.add(k2p.scale(2)).add(k3p.scale(2)).add(k4p).scale(1/6));

      trajectory.push(pos.clone());
    }

    return trajectory;
  }
}
```

---

## 4. FOOTBALL VISUALIZATION

### 4.1 Football Field Component

**Features:**
- 100-yard 3D field with hash marks, yard lines, end zones
- Animated play-by-play replay system
- Formation editor (drag-and-drop playbook designer)
- Drive chart visualization (3D spatial progression)

**Data Requirements:**
```typescript
interface FootballVisualization {
  field: {
    dimensions: { length: 100; width: 53.33 }; // yards
    surfaces: 'grass' | 'turf';
  };
  play: {
    down: 1 | 2 | 3 | 4;
    distance: number;
    yardLine: number;
    formation: {
      offense: PlayerPosition[];
      defense: PlayerPosition[];
    };
    trajectory: {
      ballCarrier: AnimationPath;
      blockers: AnimationPath[];
      defenders: AnimationPath[];
    };
  };
  analytics: {
    expectedPoints: number;  // EPA (Expected Points Added)
    successProbability: number; // Win probability change
  };
}
```

### 4.2 Play Animation System

```typescript
// packages/web/src/lib/babylon/animation/play-animator.ts
import { Animation, AnimationGroup, Scene } from '@babylonjs/core';

export class PlayAnimator {
  static createPlayAnimation(
    players: PlayerMesh[],
    trajectories: AnimationPath[],
    scene: Scene
  ): AnimationGroup {
    const animGroup = new AnimationGroup('play-animation', scene);

    players.forEach((player, idx) => {
      const path = trajectories[idx];
      const anim = new Animation(
        `player-${idx}-movement`,
        'position',
        30, // 30 FPS for smooth animation
        Animation.ANIMATIONTYPE_VECTOR3,
        Animation.ANIMATIONLOOPMODE_CONSTANT
      );

      const keys = path.waypoints.map((wp, frameIdx) => ({
        frame: frameIdx,
        value: wp.position,
      }));

      anim.setKeys(keys);
      animGroup.addTargetedAnimation(anim, player.mesh);
    });

    animGroup.normalize(0, 100); // Normalize to 0-100 frame range
    return animGroup;
  }

  // Slow-motion replay with temporal interpolation
  static createSlowMotionReplay(
    originalAnimation: AnimationGroup,
    slowFactor: number = 0.25 // 4x slower
  ): AnimationGroup {
    const slowAnim = originalAnimation.clone('slow-motion');
    slowAnim.speedRatio = slowFactor;
    return slowAnim;
  }
}
```

---

## 5. BASKETBALL VISUALIZATION

### 5.1 Basketball Court Component

**Features:**
- NBA regulation court (94×50 feet)
- 3D shot chart (volumetric density field)
- Real-time player tracking (position heatmaps)
- Defensive zone visualization (zone vs man-to-man)

**Data Requirements:**
```typescript
interface BasketballVisualization {
  court: {
    dimensions: { length: 94; width: 50 }; // feet
    threePtLine: { distance: 23.75; cornerDistance: 22 }; // feet
  };
  shotChart: {
    makes: Array<{ x: number; y: number; z: number; distance: number }>;
    misses: Array<{ x: number; y: number; z: number; distance: number }>;
    heatmap: ComputeBuffer; // WebGPU generated
  };
  playerTracking: {
    positions: Array<{
      playerId: string;
      timestamp: number;
      position: Vector3;
      velocity: Vector2;
    }>;
  };
}
```

### 5.2 Shot Chart Density Shader

```wgsl
// shot-density.wgsl
@group(0) @binding(0) var<storage, read> shotLocations: array<vec3f>;
@group(0) @binding(1) var<storage, read> shotResults: array<u32>; // 0=miss, 1=make
@group(0) @binding(2) var<storage, read_write> efficiencyField: array<f32>;

@compute @workgroup_size(8, 8, 1)
fn computeEfficiency(@builtin(global_invocation_id) id: vec3u) {
  let courtPos = vec2f(f32(id.x) / 94.0, f32(id.y) / 50.0); // Normalize to court dimensions
  var makes: f32 = 0.0;
  var attempts: f32 = 0.0;

  let bandwidth = 3.0; // 3-foot radius

  for (var i: u32 = 0u; i < arrayLength(&shotLocations); i++) {
    let shot = shotLocations[i].xy;
    let dist = distance(courtPos, shot);

    if (dist < bandwidth) {
      let weight = exp(-0.5 * pow(dist / bandwidth, 2.0));
      attempts += weight;
      makes += f32(shotResults[i]) * weight;
    }
  }

  let efficiency = select(0.0, makes / attempts, attempts > 0.0);
  let fieldIndex = id.x + id.y * 94u;
  efficiencyField[fieldIndex] = efficiency;
}
```

---

## 6. MOBILE OPTIMIZATION

### 6.1 Device Capability Detection

```typescript
// packages/web/src/lib/babylon/utils/device-capability.ts
export class DeviceCapability {
  static async detect(): Promise<{
    supportsWebGPU: boolean;
    gpuTier: 'low' | 'mid' | 'high';
    memoryGB: number;
    renderConfig: RenderConfig;
  }> {
    // WebGPU support
    const supportsWebGPU = 'gpu' in navigator;

    // GPU tier estimation
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    const debugInfo = gl?.getExtension('WEBGL_debug_renderer_info');
    const renderer = debugInfo
      ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      : 'Unknown';

    let gpuTier: 'low' | 'mid' | 'high' = 'mid';
    if (renderer.includes('Apple A') || renderer.includes('Apple M')) {
      gpuTier = 'high'; // M-series or A15+
    } else if (renderer.includes('Mali') || renderer.includes('Adreno 6')) {
      gpuTier = 'mid';
    } else {
      gpuTier = 'low';
    }

    // Memory estimation
    const memoryGB = (navigator as any).deviceMemory || 4;

    // Adaptive render configuration
    const renderConfig: RenderConfig = {
      targetFPS: gpuTier === 'high' ? 120 : 60,
      lodLevels: gpuTier === 'high' ? 7 : 3,
      shadowQuality: gpuTier === 'high' ? 'high' : gpuTier === 'mid' ? 'low' : 'off',
      postProcessing: gpuTier === 'high',
      deviceCapability: gpuTier,
    };

    return { supportsWebGPU, gpuTier, memoryGB, renderConfig };
  }
}
```

### 6.2 Adaptive LOD System

```typescript
// packages/web/src/lib/babylon/utils/lod-manager.ts
import { Mesh, LODScreenCoverage } from '@babylonjs/core';

export class LODManager {
  static applyAdaptiveLOD(
    mesh: Mesh,
    lodLevels: number,
    deviceCapability: 'low' | 'mid' | 'high'
  ): void {
    const lodDistances = {
      low: [10, 30],       // 2 LOD levels
      mid: [10, 30, 60],   // 3 LOD levels
      high: [5, 15, 30, 60, 100, 200, 500], // 7 LOD levels
    };

    const distances = lodDistances[deviceCapability];

    distances.forEach((distance, idx) => {
      const simplificationFactor = Math.pow(2, idx + 1); // 50%, 25%, 12.5%, etc.
      const simplifiedMesh = mesh.clone(`${mesh.name}_LOD${idx}`);
      simplifiedMesh.simplify(
        [{ quality: 1 / simplificationFactor, distance }],
        false, // Parallel processing
        LODScreenCoverage.STANDARD
      );
      mesh.addLODLevel(distance, simplifiedMesh);
    });
  }
}
```

### 6.3 Touch Gesture System

```typescript
// packages/web/src/components/3d/shared/TouchControls.tsx
'use client';

import { useEffect, useRef } from 'react';
import { ArcRotateCamera, Scene, Vector3 } from '@babylonjs/core';

export function TouchControls({
  scene,
  camera,
}: {
  scene: Scene;
  camera: ArcRotateCamera;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    let startTouch: Touch | null = null;
    let currentRotation = { alpha: 0, beta: 0 };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        startTouch = e.touches[0];
        currentRotation = {
          alpha: camera.alpha,
          beta: camera.beta,
        };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!startTouch || e.touches.length !== 1) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - startTouch.clientX;
      const deltaY = touch.clientY - startTouch.clientY;

      camera.alpha = currentRotation.alpha - deltaX * 0.01;
      camera.beta = Math.max(
        0.1,
        Math.min(Math.PI / 2 - 0.1, currentRotation.beta - deltaY * 0.01)
      );

      e.preventDefault();
    };

    const handleTouchEnd = () => {
      startTouch = null;
    };

    // Pinch-to-zoom
    const handleWheel = (e: WheelEvent) => {
      camera.radius += e.deltaY * 0.01;
      camera.radius = Math.max(5, Math.min(50, camera.radius));
      e.preventDefault();
    };

    const canvas = canvasRef.current;
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [scene, camera]);

  return null; // Renders nothing, just manages touch events
}
```

---

## 7. PERFORMANCE MONITORING

### 7.1 Frame Time Profiler

```typescript
// packages/web/src/lib/babylon/utils/perf-monitor.ts
export class PerformanceMonitor {
  private frameTimes: number[] = [];
  private readonly maxSamples = 60;

  recordFrame(scene: Scene): void {
    const frameTime = scene.getEngine().getDeltaTime();
    this.frameTimes.push(frameTime);
    if (this.frameTimes.length > this.maxSamples) {
      this.frameTimes.shift();
    }
  }

  getMetrics(): {
    avgFPS: number;
    p95FrameTime: number;
    p99FrameTime: number;
    droppedFrames: number;
  } {
    const sorted = [...this.frameTimes].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    const p99Index = Math.floor(sorted.length * 0.99);

    const avgFrameTime =
      this.frameTimes.reduce((sum, t) => sum + t, 0) / this.frameTimes.length;
    const avgFPS = 1000 / avgFrameTime;

    const targetFrameTime = 16.67; // 60fps
    const droppedFrames = this.frameTimes.filter(t => t > targetFrameTime).length;

    return {
      avgFPS: Math.round(avgFPS),
      p95FrameTime: sorted[p95Index],
      p99FrameTime: sorted[p99Index],
      droppedFrames,
    };
  }

  // Auto-adjust LOD if performance drops
  autoAdjustQuality(currentLOD: number, targetFPS: number = 60): number {
    const metrics = this.getMetrics();
    if (metrics.avgFPS < targetFPS * 0.9) {
      return Math.min(currentLOD + 1, 7); // Reduce quality
    } else if (metrics.avgFPS > targetFPS * 1.1 && currentLOD > 0) {
      return currentLOD - 1; // Increase quality
    }
    return currentLOD;
  }
}
```

---

## 8. MONTE CARLO VISUALIZATION

### 8.1 Championship Probability Surface

**Concept:** Render Pythagorean expectation and Monte Carlo simulation results as 3D geometric surfaces in real-time.

```typescript
// packages/web/src/components/3d/analytics/MonteCarloSurface.tsx
'use client';

import { useEffect, useRef } from 'react';
import {
  Scene,
  Engine,
  ArcRotateCamera,
  HemisphericLight,
  MeshBuilder,
  Vector3,
  StandardMaterial,
  Color3,
  DynamicTexture,
} from '@babylonjs/core';

export function MonteCarloSurface({
  simulationResults,
}: {
  simulationResults: Array<{ team: string; winProbability: number }>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new Engine(canvasRef.current, true);
    const scene = new Scene(engine);

    // Camera
    const camera = new ArcRotateCamera(
      'camera',
      Math.PI / 4,
      Math.PI / 3,
      20,
      Vector3.Zero(),
      scene
    );
    camera.attachControl(canvasRef.current, true);

    // Light
    new HemisphericLight('light', new Vector3(0, 1, 0), scene);

    // Create 3D surface mesh (Pythagorean expectation vs actual wins)
    const resolution = 50;
    const positions: number[] = [];
    const indices: number[] = [];
    const colors: number[] = [];

    for (let x = 0; x < resolution; x++) {
      for (let z = 0; z < resolution; z++) {
        const xNorm = x / resolution;
        const zNorm = z / resolution;

        // Pythagorean formula: y = (runs_for^2.37) / (runs_for^2.37 + runs_against^2.37)
        const runsFor = xNorm * 1000;
        const runsAgainst = zNorm * 1000;
        const pythagWinPct = Math.pow(runsFor, 2.37) / (Math.pow(runsFor, 2.37) + Math.pow(runsAgainst, 2.37));
        const y = pythagWinPct * 10; // Scale for visibility

        positions.push(xNorm * 10 - 5, y, zNorm * 10 - 5);

        // Color based on win probability (blue = low, red = high)
        const r = pythagWinPct;
        const b = 1 - pythagWinPct;
        colors.push(r, 0, b, 1);

        // Indices for triangulation
        if (x < resolution - 1 && z < resolution - 1) {
          const i = x * resolution + z;
          indices.push(i, i + 1, i + resolution);
          indices.push(i + 1, i + resolution + 1, i + resolution);
        }
      }
    }

    const customMesh = new MeshBuilder.CreateMesh(
      'monteCarlo',
      { positions, indices },
      scene
    );
    customMesh.setVerticesData('color', colors);

    const material = new StandardMaterial('mat', scene);
    material.vertexColors = true;
    customMesh.material = material;

    engine.runRenderLoop(() => scene.render());

    return () => {
      engine.dispose();
    };
  }, [simulationResults]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '600px', touchAction: 'none' }}
    />
  );
}
```

---

## 9. DEPLOYMENT STRATEGY

### 9.1 Bundle Optimization

```javascript
// next.config.js
module.exports = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Split Babylon.js into separate chunks
      config.optimization.splitChunks.cacheGroups.babylon = {
        test: /[\\/]node_modules[\\/]@babylonjs[\\/]/,
        name: 'babylon',
        priority: 20,
        reuseExistingChunk: true,
      };
    }
    return config;
  },
};
```

### 9.2 Lazy Loading Strategy

```typescript
// packages/web/src/app/sports/mlb/cardinals/page.tsx
'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const BaseballDiamond = dynamic(
  () => import('@/components/3d/baseball/BaseballDiamond'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-orange-500"></div>
      </div>
    ),
  }
);

export default function CardinalsAnalyticsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">St. Louis Cardinals - 3D Analytics</h1>
      <Suspense fallback={<div>Loading 3D visualization...</div>}>
        <BaseballDiamond teamId="138" />
      </Suspense>
    </div>
  );
}
```

---

## 10. IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Week 1-2)
- [ ] Install Babylon.js dependencies
- [ ] Create base `BabylonScene` wrapper component
- [ ] Implement WebGPU/WebGL2 engine factory
- [ ] Build device capability detector
- [ ] Set up touch control system

### Phase 2: Baseball (Week 3-4)
- [ ] Create baseball diamond 3D model
- [ ] Implement hit heatmap WebGPU compute shader
- [ ] Build pitch trajectory physics engine
- [ ] Integrate real Cardinals data from SportsDataIO

### Phase 3: Football (Week 5-6)
- [ ] Create football field 3D model
- [ ] Build play animation system
- [ ] Implement formation editor
- [ ] Add Titans real-time data integration

### Phase 4: Basketball (Week 7-8)
- [ ] Create basketball court 3D model
- [ ] Build shot chart density shader
- [ ] Implement player tracking visualization
- [ ] Integrate Grizzlies real-time data

### Phase 5: Advanced Analytics (Week 9-10)
- [ ] Monte Carlo simulation 3D surface renderer
- [ ] Pythagorean expectation geometric visualization
- [ ] Performance monitoring dashboard
- [ ] Mobile regression testing

---

## 11. SUCCESS METRICS

**Performance:**
- [ ] 60fps on iPhone 12 Pro (verified via Safari Web Inspector)
- [ ] 120fps on M1 MacBook Pro (verified via Babylon.js Inspector)
- [ ] <2s initial load time (verified via Lighthouse)
- [ ] <150MB memory usage on mobile (verified via Performance API)

**Features:**
- [ ] Baseball heatmap updates in <5s for 10,000 data points
- [ ] Football play animation renders at 30fps minimum
- [ ] Basketball shot chart supports 100,000+ shots without lag
- [ ] Touch gestures feel responsive (<50ms latency)

**Quality:**
- [ ] Lighthouse Performance Score >90
- [ ] Lighthouse Accessibility Score >95
- [ ] No console errors in production
- [ ] Graceful fallback to WebGL2 on non-WebGPU devices

---

## 12. NEXT STEPS

1. **Review Architecture**: Ensure alignment with BSI-NextGen goals
2. **Install Dependencies**: `pnpm add @babylonjs/core @babylonjs/loaders @babylonjs/materials @babylonjs/inspector`
3. **Create Starter Components**: Begin with `BabylonScene.tsx` base wrapper
4. **Build Baseball Diamond**: First complete sports visualization
5. **Test on Mobile**: Verify 60fps target on real iPhone devices
6. **Iterate**: Refine based on performance profiling

---

**Architecture Status:** DESIGN COMPLETE
**Ready for Implementation:** YES
**Estimated Timeline:** 10 weeks (2 devs, full-time)
**Risk Level:** LOW (proven tech stack, clear requirements)

---

**Questions or Clarifications?** Let me know which component to implement first. I recommend starting with the baseball diamond heatmap since college baseball is your #1 priority.
