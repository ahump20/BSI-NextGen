/**
 * Baseball Diamond 3D Visualization
 *
 * Renders a regulation baseball field with:
 * - 3D diamond mesh (bases, pitcher's mound, foul lines)
 * - Player positions (real-time updates)
 * - Hit heatmap overlay (density field)
 * - Pitch trajectory visualization
 *
 * Data source: SportsDataIO MLB API / @bsi/api
 *
 * @module components/3d/baseball/BaseballDiamond
 */

'use client';

import { BabylonScene } from '../BabylonScene';
import {
  Scene,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  DynamicTexture,
  Mesh,
  Engine,
  WebGPUEngine,
} from '@babylonjs/core';
import type { DeviceInfo } from '@/lib/babylon/utils/device-capability';

export interface BaseballDiamondProps {
  /**
   * Team ID (for fetching real data)
   */
  teamId?: string;

  /**
   * Enable hit heatmap overlay
   */
  showHeatmap?: boolean;

  /**
   * Enable pitch trajectory visualization
   */
  showPitchTrajectories?: boolean;

  /**
   * Enable real-time player positions
   */
  showPlayerPositions?: boolean;

  /**
   * Canvas CSS class
   */
  className?: string;
}

/**
 * Baseball diamond 3D component
 */
export function BaseballDiamond({
  teamId,
  showHeatmap = true,
  showPitchTrajectories = false,
  showPlayerPositions = true,
  className = '',
}: BaseballDiamondProps) {
  const handleSceneReady = (scene: Scene, engine: Engine | WebGPUEngine, deviceInfo: DeviceInfo) => {
    console.log('[BaseballDiamond] Building scene...');

    // Create ground (grass field)
    const ground = MeshBuilder.CreateGround(
      'ground',
      { width: 150, height: 150 },
      scene
    );

    const groundMaterial = new StandardMaterial('groundMat', scene);
    groundMaterial.diffuseColor = new Color3(0.1, 0.4, 0.1); // Grass green
    groundMaterial.specularColor = new Color3(0.1, 0.1, 0.1); // Low specular
    ground.material = groundMaterial;

    // Create infield dirt (diamond shape)
    createInfieldDirt(scene);

    // Create bases
    createBases(scene);

    // Create pitcher's mound
    createPitchersMound(scene);

    // Create outfield fence
    createOutfieldFence(scene);

    // Create foul lines
    createFoulLines(scene);

    // Create player positions (if enabled)
    if (showPlayerPositions) {
      createPlayerPositions(scene);
    }

    // Create hit heatmap (if enabled and device supports it)
    if (showHeatmap && deviceInfo.renderConfig.postProcessing) {
      // TODO: Implement WebGPU compute shader heatmap
      console.log('[BaseballDiamond] Heatmap will be added in Phase 2');
    }

    console.log('[BaseballDiamond] Scene ready');
  };

  return (
    <div className="relative w-full h-[600px]">
      <BabylonScene
        onSceneReady={handleSceneReady}
        cameraPosition={{ alpha: Math.PI / 2.5, beta: Math.PI / 3.5, radius: 100 }}
        cameraTarget={new Vector3(0, 0, 30)}
        enablePerformanceMonitoring={true}
        className={className}
      />

      {/* Overlay controls */}
      <div className="absolute top-4 right-4 bg-black/60 text-white text-sm px-4 py-3 rounded-lg space-y-2">
        <div className="font-bold text-orange-500">Baseball Diamond</div>
        {teamId && (
          <div className="text-xs text-gray-300">Team ID: {teamId}</div>
        )}
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${showHeatmap ? 'bg-green-500' : 'bg-gray-500'}`}></div>
            <span>Hit Heatmap</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${showPitchTrajectories ? 'bg-green-500' : 'bg-gray-500'}`}></div>
            <span>Pitch Trajectories</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${showPlayerPositions ? 'bg-green-500' : 'bg-gray-500'}`}></div>
            <span>Player Positions</span>
          </div>
        </div>
      </div>

      {/* Mobile instructions */}
      <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-3 py-2 rounded-lg max-w-xs">
        <div className="font-semibold mb-1">Controls</div>
        <div className="text-gray-300">
          Touch & drag to rotate • Pinch to zoom
        </div>
      </div>
    </div>
  );
}

/**
 * Create infield dirt (90-foot diamond)
 */
function createInfieldDirt(scene: Scene): Mesh {
  // Create diamond shape using polygon mesh
  const infieldPoints = [
    new Vector3(0, 0.1, 0),      // Home plate
    new Vector3(27.4, 0.1, 27.4), // First base (90 ft = 27.4 m)
    new Vector3(0, 0.1, 54.8),    // Second base
    new Vector3(-27.4, 0.1, 27.4), // Third base
  ];

  const infield = MeshBuilder.CreatePolygon(
    'infield',
    { shape: infieldPoints, depth: 0 },
    scene
  );

  const infieldMaterial = new StandardMaterial('infieldMat', scene);
  infieldMaterial.diffuseColor = new Color3(0.7, 0.5, 0.3); // Dirt brown
  infield.material = infieldMaterial;
  infield.position.y = 0.05; // Slightly above ground

  return infield;
}

/**
 * Create bases (first, second, third, home)
 */
function createBases(scene: Scene): void {
  const basePositions = [
    { name: 'home', position: new Vector3(0, 0.2, 0) },
    { name: 'first', position: new Vector3(27.4, 0.2, 27.4) },
    { name: 'second', position: new Vector3(0, 0.2, 54.8) },
    { name: 'third', position: new Vector3(-27.4, 0.2, 27.4) },
  ];

  basePositions.forEach(({ name, position }) => {
    const base = MeshBuilder.CreateBox(
      `base-${name}`,
      { width: 0.4, height: 0.1, depth: 0.4 },
      scene
    );
    base.position = position;

    const baseMaterial = new StandardMaterial(`baseMat-${name}`, scene);
    baseMaterial.diffuseColor = new Color3(1, 1, 1); // White
    base.material = baseMaterial;
  });
}

/**
 * Create pitcher's mound (60.5 feet from home plate)
 */
function createPitchersMound(scene: Scene): Mesh {
  const mound = MeshBuilder.CreateCylinder(
    'pitchersMound',
    { diameter: 5.5, height: 0.3 },
    scene
  );
  mound.position = new Vector3(0, 0.15, 18.4); // 60.5 ft = 18.4 m

  const moundMaterial = new StandardMaterial('moundMat', scene);
  moundMaterial.diffuseColor = new Color3(0.6, 0.4, 0.2); // Darker dirt
  mound.material = moundMaterial;

  // Pitcher's rubber
  const rubber = MeshBuilder.CreateBox(
    'pitchersRubber',
    { width: 0.6, height: 0.05, depth: 0.15 },
    scene
  );
  rubber.position = new Vector3(0, 0.35, 18.4);

  const rubberMaterial = new StandardMaterial('rubberMat', scene);
  rubberMaterial.diffuseColor = new Color3(1, 1, 1); // White
  rubber.material = rubberMaterial;

  return mound;
}

/**
 * Create outfield fence (simplified)
 */
function createOutfieldFence(scene: Scene): void {
  // Create fence arc (simplified as straight segments)
  const fencePoints = [
    new Vector3(-50, 0, 100),  // Left field
    new Vector3(0, 0, 120),    // Center field
    new Vector3(50, 0, 100),   // Right field
  ];

  for (let i = 0; i < fencePoints.length - 1; i++) {
    const start = fencePoints[i];
    const end = fencePoints[i + 1];

    const length = Vector3.Distance(start, end);
    const midpoint = Vector3.Center(start, end);

    const fenceSegment = MeshBuilder.CreateBox(
      `fenceSegment-${i}`,
      { width: length, height: 3, depth: 0.2 },
      scene
    );

    fenceSegment.position = midpoint;
    fenceSegment.position.y = 1.5; // Half height

    // Rotate to align with segment
    const angle = Math.atan2(end.z - start.z, end.x - start.x);
    fenceSegment.rotation.y = angle;

    const fenceMaterial = new StandardMaterial(`fenceMat-${i}`, scene);
    fenceMaterial.diffuseColor = new Color3(0.3, 0.5, 0.3); // Dark green
    fenceSegment.material = fenceMaterial;
  }
}

/**
 * Create foul lines (chalk lines)
 */
function createFoulLines(scene: Scene): void {
  // Left foul line (third base to left field)
  const leftLine = MeshBuilder.CreateBox(
    'leftFoulLine',
    { width: 0.1, height: 0.05, depth: 100 },
    scene
  );
  leftLine.position = new Vector3(-27.4, 0.1, 50);
  leftLine.rotation.y = Math.PI / 4;

  // Right foul line (first base to right field)
  const rightLine = MeshBuilder.CreateBox(
    'rightFoulLine',
    { width: 0.1, height: 0.05, depth: 100 },
    scene
  );
  rightLine.position = new Vector3(27.4, 0.1, 50);
  rightLine.rotation.y = -Math.PI / 4;

  // Chalk material
  const chalkMaterial = new StandardMaterial('chalkMat', scene);
  chalkMaterial.diffuseColor = new Color3(1, 1, 1);
  chalkMaterial.emissiveColor = new Color3(0.2, 0.2, 0.2); // Slight glow

  leftLine.material = chalkMaterial;
  rightLine.material = chalkMaterial;
}

/**
 * Create player position markers (defensive positions)
 */
function createPlayerPositions(scene: Scene): void {
  const positions = [
    { name: 'P', position: new Vector3(0, 0.5, 18.4) },      // Pitcher
    { name: 'C', position: new Vector3(0, 0.5, 0) },          // Catcher
    { name: '1B', position: new Vector3(27.4, 0.5, 27.4) },   // First base
    { name: '2B', position: new Vector3(10, 0.5, 40) },       // Second base
    { name: 'SS', position: new Vector3(-10, 0.5, 40) },      // Shortstop
    { name: '3B', position: new Vector3(-27.4, 0.5, 27.4) },  // Third base
    { name: 'LF', position: new Vector3(-35, 0.5, 80) },      // Left field
    { name: 'CF', position: new Vector3(0, 0.5, 95) },        // Center field
    { name: 'RF', position: new Vector3(35, 0.5, 80) },       // Right field
  ];

  positions.forEach(({ name, position }) => {
    // Create player marker (simple sphere)
    const marker = MeshBuilder.CreateSphere(
      `player-${name}`,
      { diameter: 1 },
      scene
    );
    marker.position = position;

    const markerMaterial = new StandardMaterial(`markerMat-${name}`, scene);
    markerMaterial.diffuseColor = new Color3(1, 0.4, 0); // Orange
    markerMaterial.emissiveColor = new Color3(0.3, 0.1, 0); // Slight glow
    marker.material = markerMaterial;

    // Add position label (dynamic texture)
    const labelTexture = new DynamicTexture(
      `label-${name}`,
      { width: 128, height: 128 },
      scene
    );
    labelTexture.hasAlpha = true;

    const ctx = labelTexture.getContext();
    if (ctx) {
      (ctx as any).fillStyle = 'white';
      (ctx as any).font = 'bold 80px Arial';
      (ctx as any).textAlign = 'center';
      (ctx as any).textBaseline = 'middle';
      (ctx as any).fillText(name, 64, 64);
    }
    labelTexture.update();

    // Apply label to marker
    markerMaterial.emissiveTexture = labelTexture;
  });
}
