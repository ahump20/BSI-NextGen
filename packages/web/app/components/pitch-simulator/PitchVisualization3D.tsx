'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Grid, Html, Line, OrbitControls, PerspectiveCamera, Text } from '@react-three/drei';
import * as THREE from 'three';
import { PitchTrajectory, toSceneCoords } from '@/lib/pitch-simulator/physics';
import {
  CAMERA_PRESETS,
  VISUAL_ENGINE_THEME,
  VisualQuality,
  buildTrailGradient,
  createGlowMaterial,
  createRibbonGeometry,
  getFog,
  getQualityDpr,
} from '@/lib/pitch-simulator/visual-engine';

interface PitchVisualization3DProps {
  trajectories: Array<{
    trajectory: PitchTrajectory;
    color: string;
    name: string;
    visible: boolean;
  }>;
  cameraView: 'catcher' | 'batter' | 'side' | 'top' | 'pitcher';
  showStrikeZone?: boolean;
  showGrid?: boolean;
  animationSpeed?: number;
  paused?: boolean;
  qualityMode?: VisualQuality;
  showTrails?: boolean;
  showContextSurfaces?: boolean;
}

/**
 * Main 3D pitch visualization component
 */
export function PitchVisualization3D({
  trajectories,
  cameraView,
  showStrikeZone = true,
  showGrid = true,
  animationSpeed = 1.0,
  paused = false,
  qualityMode = 'balanced',
  showTrails = true,
  showContextSurfaces = true,
}: PitchVisualization3DProps) {
  return (
    <div className="w-full h-full bg-gray-900 rounded-lg overflow-hidden">
      <Canvas shadows dpr={getQualityDpr(qualityMode)}>
        <SceneEnvironment qualityMode={qualityMode} />
        <CameraController view={cameraView} qualityMode={qualityMode} />
        <ambientLight intensity={0.6} color={VISUAL_ENGINE_THEME.horizon} />
        <directionalLight position={[10, 10, 5]} intensity={1.2} castShadow />
        <pointLight position={[-10, 10, -5]} intensity={0.6} color={VISUAL_ENGINE_THEME.accent} />
        <StadiumLighting />

        {/* Baseball field elements */}
        {showContextSurfaces && <Runway />} 
        <Mound />
        {showStrikeZone && <StrikeZone />}
        <HomePlate />
        {showGrid && <ContextGrid />}

        {/* Pitch trajectories */}
        {trajectories.map(
          (item, idx) =>
            item.visible && (
              <PitchTrajectoryLine
                key={idx}
                trajectory={item.trajectory}
                color={item.color}
                name={item.name}
                animationSpeed={animationSpeed}
                paused={paused}
                showTrail={showTrails}
              />
            )
        )}

        {/* Reference axes */}
        <axesHelper args={[2]} />

        {/* Camera controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxDistance={15}
          minDistance={2}
        />
      </Canvas>
    </div>
  );
}

/**
 * Camera controller for different viewpoints
 */
function CameraController({ view, qualityMode }: { view: string; qualityMode: VisualQuality }) {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const { camera } = useThree();

  useEffect(() => {
    if (!cameraRef.current) return;
    cameraRef.current.lookAt(0, 1, 0);
  }, []);

  useFrame(() => {
    if (!cameraRef.current) return;
    const preset =
      CAMERA_PRESETS[view as keyof typeof CAMERA_PRESETS] || CAMERA_PRESETS.catcher;

    const lerpFactor = qualityMode === 'cinematic' ? 0.08 : qualityMode === 'balanced' ? 0.1 : 0.14;

    const targetPosition = new THREE.Vector3(...preset.position);
    cameraRef.current.position.lerp(targetPosition, lerpFactor);
    cameraRef.current.lookAt(...preset.target);
    cameraRef.current.fov = preset.fov ?? 65;
    cameraRef.current.updateProjectionMatrix();
  });

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      position={CAMERA_PRESETS.catcher.position}
      fov={CAMERA_PRESETS.catcher.fov}
      near={0.1}
      far={1000}
      onUpdate={(self) => {
        // Sync the scene camera for OrbitControls while maintaining our lerp rig
        camera.position.copy(self.position);
        camera.rotation.copy(self.rotation);
      }}
    />
  );
}

function SceneEnvironment({ qualityMode }: { qualityMode: VisualQuality }) {
  const fog = getFog(qualityMode);
  return (
    <group>
      <color attach="background" args={[VISUAL_ENGINE_THEME.background]} />
      <fog attach="fog" args={[VISUAL_ENGINE_THEME.horizon, fog.near, fog.far]} />
      <GroundPlane />
    </group>
  );
}

function GroundPlane() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
      <planeGeometry args={[40, 40]} />
      <meshStandardMaterial
        color={VISUAL_ENGINE_THEME.horizon}
        metalness={0.08}
        roughness={0.85}
      />
    </mesh>
  );
}

function ContextGrid() {
  return (
    <Grid
      args={[24, 24]}
      cellColor={VISUAL_ENGINE_THEME.grid}
      sectionColor={VISUAL_ENGINE_THEME.accent}
      infiniteGrid
      fadeDistance={28}
      fadeStrength={1}
    />
  );
}

function StadiumLighting() {
  return (
    <group>
      <spotLight
        position={[6, 10, 6]}
        angle={0.45}
        intensity={0.5}
        penumbra={0.4}
        color={VISUAL_ENGINE_THEME.accent}
      />
      <spotLight
        position={[-6, 10, 6]}
        angle={0.5}
        intensity={0.4}
        penumbra={0.45}
        color={VISUAL_ENGINE_THEME.strikeZone}
      />
      <hemisphereLight
        color={VISUAL_ENGINE_THEME.horizon}
        groundColor={VISUAL_ENGINE_THEME.background}
        intensity={0.45}
      />
    </group>
  );
}

/**
 * Context runway to anchor the plate-to-mound corridor
 */
function Runway() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, -3]} receiveShadow>
        <planeGeometry args={[4.5, 16]} />
        <meshStandardMaterial
          color={VISUAL_ENGINE_THEME.background}
          emissive={VISUAL_ENGINE_THEME.horizon}
          emissiveIntensity={0.08}
          metalness={0.2}
          roughness={0.75}
        />
      </mesh>

      <Line
        points={[
          new THREE.Vector3(0, 0.002, -10),
          new THREE.Vector3(0, 0.002, 3),
        ]}
        color={VISUAL_ENGINE_THEME.accent}
        lineWidth={2}
        transparent
        opacity={0.35}
      />
    </group>
  );
}

/**
 * Pitcher's mound
 */
function Mound() {
  return (
    <group position={[0, 0, -6.05]}>
      {/* Mound dirt circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <circleGeometry args={[0.9, 48]} />
        <meshStandardMaterial color={VISUAL_ENGINE_THEME.moundDirt} roughness={0.8} />
      </mesh>

      {/* Rubber */}
      <mesh position={[0, 0.05, 0]} castShadow>
        <boxGeometry args={[0.6, 0.03, 0.1]} />
        <meshStandardMaterial color={VISUAL_ENGINE_THEME.moundRiser} metalness={0.15} roughness={0.4} />
      </mesh>

      {/* Label */}
      <Text
        position={[0, 0.1, -0.5]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.15}
        color={VISUAL_ENGINE_THEME.ball}
        anchorX="center"
        anchorY="middle"
      >
        MOUND
      </Text>
    </group>
  );
}

/**
 * Strike zone visualization
 */
function StrikeZone() {
  const STRIKE_ZONE_WIDTH = 1.42; // feet
  const STRIKE_ZONE_HEIGHT = 3.5; // feet
  const PLATE_HEIGHT = 2.5; // feet (center)
  const SCALE = 0.1;

  const width = STRIKE_ZONE_WIDTH * SCALE;
  const height = STRIKE_ZONE_HEIGHT * SCALE;
  const centerY = PLATE_HEIGHT * SCALE;

  return (
    <group position={[0, centerY, 0]}>
      {/* Strike zone outline */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(width, height, 0.01)]} />
        <lineBasicMaterial color={VISUAL_ENGINE_THEME.strikeZone} linewidth={2} />
      </lineSegments>

      {/* Semi-transparent zone */}
      <mesh>
        <boxGeometry args={[width, height, 0.01]} />
        <meshBasicMaterial
          color={VISUAL_ENGINE_THEME.strikeZone}
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Zone divisions (9 zones) - Horizontal lines */}
      {[...Array(2)].map((_, i) => {
        const y = -height / 2 + ((i + 1) * height) / 3;
        const points = [
          new THREE.Vector3(-width / 2, y, 0),
          new THREE.Vector3(width / 2, y, 0),
        ];
        return (
          <Line
            key={`h-${i}`}
            points={points}
            color={VISUAL_ENGINE_THEME.strikeZone}
            lineWidth={1}
            transparent
            opacity={0.3}
          />
        );
      })}

      {/* Zone divisions - Vertical lines */}
      {[...Array(2)].map((_, i) => {
        const x = -width / 2 + ((i + 1) * width) / 3;
        const points = [
          new THREE.Vector3(x, -height / 2, 0),
          new THREE.Vector3(x, height / 2, 0),
        ];
        return (
          <Line
            key={`v-${i}`}
            points={points}
            color={VISUAL_ENGINE_THEME.strikeZone}
            lineWidth={1}
            transparent
            opacity={0.3}
          />
        );
      })}
    </group>
  );
}

/**
 * Home plate
 */
function HomePlate() {
  // Home plate is a pentagon
  const shape = new THREE.Shape();
  const scale = 0.1;
  const width = 17 * 0.0833 * scale; // 17 inches to feet to scene units
  const depth = 8.5 * 0.0833 * scale;

  shape.moveTo(0, 0);
  shape.lineTo(-width / 2, depth * 0.5);
  shape.lineTo(-width / 2, depth);
  shape.lineTo(width / 2, depth);
  shape.lineTo(width / 2, depth * 0.5);
  shape.closePath();

  return (
    <group position={[0, 0.01, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <shapeGeometry args={[shape]} />
        <meshStandardMaterial color={VISUAL_ENGINE_THEME.ball} metalness={0.2} roughness={0.2} />
      </mesh>

      {/* Label */}
      <Text
        position={[0, 0.1, 0.5]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.15}
        color={VISUAL_ENGINE_THEME.ball}
        anchorX="center"
        anchorY="middle"
      >
        HOME
      </Text>
    </group>
  );
}

/**
 * Animated pitch trajectory line with moving baseball
 */
function PitchTrajectoryLine({
  trajectory,
  color,
  name,
  animationSpeed,
  paused,
  showTrail,
}: {
  trajectory: PitchTrajectory;
  color: string;
  name: string;
  animationSpeed: number;
  paused: boolean;
  showTrail: boolean;
}) {
  const ballRef = useRef<THREE.Mesh>(null);
  const progressRef = useRef(0);

  const points = useMemo(() => {
    return trajectory.points.map((p) => toSceneCoords(p.x, p.y, p.z));
  }, [trajectory]);

  const trailColors = useMemo(
    () => buildTrailGradient(color, points.length),
    [color, points.length]
  );

  const ribbonGeometry = useMemo(() => createRibbonGeometry(points), [points]);
  useEffect(() => () => ribbonGeometry.dispose(), [ribbonGeometry]);

  const glowMaterial = useMemo(() => createGlowMaterial(color), [color]);
  const platePosition = useMemo(
    () => new THREE.Vector3(trajectory.plateLocation.x * 0.1, trajectory.plateLocation.y * 0.1, 0),
    [trajectory]
  );

  useFrame((_, delta) => {
    if (paused || !ballRef.current) return;

    progressRef.current += delta * animationSpeed * 0.5;

    if (progressRef.current >= 1) {
      progressRef.current = 0;
    }

    const pointIndex = Math.floor(progressRef.current * (points.length - 1));
    const nextIndex = Math.min(pointIndex + 1, points.length - 1);
    const t = (progressRef.current * (points.length - 1)) % 1;

    const currentPoint = points[pointIndex];
    const nextPoint = points[nextIndex];

    ballRef.current.position.lerpVectors(currentPoint, nextPoint, t);
    ballRef.current.rotation.x += delta * 20;
    ballRef.current.rotation.y += delta * 15;
  });

  return (
    <group>
      {showTrail && (
        <>
          <mesh geometry={ribbonGeometry} material={glowMaterial} />
          <Line
            points={points}
            vertexColors={trailColors}
            color={color}
            lineWidth={2.5}
            transparent
            opacity={0.85}
          />
        </>
      )}

      <mesh ref={ballRef} position={points[0]} castShadow>
        <sphereGeometry args={[0.037, 24, 24]} />
        <meshStandardMaterial
          color={VISUAL_ENGINE_THEME.ball}
          emissive={color}
          emissiveIntensity={0.3}
          metalness={0.2}
          roughness={0.4}
        />
      </mesh>

      <mesh position={points[0]} material={glowMaterial}>
        <sphereGeometry args={[0.05, 16, 16]} />
      </mesh>

      <mesh position={platePosition} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.05, 0.08, 24]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} />
      </mesh>

      <Html position={platePosition.toArray()} distanceFactor={20} center>
        <div className="px-3 py-2 rounded-md bg-black/70 backdrop-blur text-xs text-white border border-white/10 shadow-lg">
          <div className="font-semibold">{name}</div>
          <div className="opacity-80">
            {trajectory.plateVelocity.toFixed(1)} mph • Break {trajectory.totalBreak.horizontal.toFixed(1)}" H /
            {trajectory.totalBreak.vertical.toFixed(1)}" V
          </div>
        </div>
      </Html>
    </group>
  );
}
