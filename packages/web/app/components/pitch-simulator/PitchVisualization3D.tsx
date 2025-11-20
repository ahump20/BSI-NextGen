'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid, Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import { PitchTrajectory, toSceneCoords } from '@/lib/pitch-simulator/physics';

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
}: PitchVisualization3DProps) {
  return (
    <div className="w-full h-full bg-gray-900 rounded-lg overflow-hidden">
      <Canvas>
        <CameraController view={cameraView} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, 10, -5]} intensity={0.5} />

        {/* Baseball field elements */}
        <Mound />
        {showStrikeZone && <StrikeZone />}
        <HomePlate />
        {showGrid && <Grid args={[20, 20]} cellColor="#444" sectionColor="#666" />}

        {/* Pitch trajectories */}
        {trajectories.map(
          (item, idx) =>
            item.visible && (
              <PitchTrajectoryLine
                key={idx}
                trajectory={item.trajectory}
                color={item.color}
                animationSpeed={animationSpeed}
                paused={paused}
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
function CameraController({ view }: { view: string }) {
  const cameraPositions = {
    catcher: [0, 0.5, 7], // Behind home plate looking at mound
    batter: [1, 0.5, 6.5], // Batter's box view
    side: [8, 2, 0], // Side view (first base side)
    top: [0, 10, 0], // Overhead view
    pitcher: [0, 1, -6], // From mound looking at plate
  };

  const position = cameraPositions[view as keyof typeof cameraPositions] || cameraPositions.catcher;

  return (
    <PerspectiveCamera
      makeDefault
      position={position as [number, number, number]}
      fov={75}
      near={0.1}
      far={1000}
    />
  );
}

/**
 * Pitcher's mound
 */
function Mound() {
  return (
    <group position={[0, 0, -6.05]}>
      {/* Mound dirt circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.9, 32]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* Rubber */}
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[0.6, 0.02, 0.1]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>

      {/* Label */}
      <Text
        position={[0, 0.1, -0.5]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.15}
        color="#FFFFFF"
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
        <edgesGeometry
          args={[new THREE.BoxGeometry(width, height, 0.01)]}
        />
        <lineBasicMaterial color="#FF0000" linewidth={2} />
      </lineSegments>

      {/* Semi-transparent zone */}
      <mesh>
        <boxGeometry args={[width, height, 0.01]} />
        <meshBasicMaterial
          color="#FF0000"
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
            color="#FF0000"
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
            color="#FF0000"
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
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <shapeGeometry args={[shape]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>

      {/* Label */}
      <Text
        position={[0, 0.1, 0.5]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.15}
        color="#FFFFFF"
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
  animationSpeed,
  paused,
}: {
  trajectory: PitchTrajectory;
  color: string;
  animationSpeed: number;
  paused: boolean;
}) {
  const ballRef = useRef<THREE.Mesh>(null);
  const progressRef = useRef(0);

  // Convert trajectory points to scene coordinates
  const points = useMemo(() => {
    return trajectory.points.map((p) => toSceneCoords(p.x, p.y, p.z));
  }, [trajectory]);

  // Animate ball along trajectory
  useFrame((state, delta) => {
    if (paused || !ballRef.current) return;

    progressRef.current += delta * animationSpeed * 0.5;

    // Loop animation
    if (progressRef.current >= 1) {
      progressRef.current = 0;
    }

    // Interpolate position along trajectory
    const pointIndex = Math.floor(progressRef.current * (points.length - 1));
    const nextIndex = Math.min(pointIndex + 1, points.length - 1);
    const t = (progressRef.current * (points.length - 1)) % 1;

    const currentPoint = points[pointIndex];
    const nextPoint = points[nextIndex];

    ballRef.current.position.lerpVectors(currentPoint, nextPoint, t);

    // Add spin effect
    ballRef.current.rotation.x += delta * 20;
    ballRef.current.rotation.y += delta * 15;
  });

  return (
    <group>
      {/* Trajectory line */}
      <Line
        points={points}
        color={color}
        lineWidth={2}
        transparent
        opacity={0.7}
      />

      {/* Animated baseball */}
      <mesh ref={ballRef} position={points[0]}>
        <sphereGeometry args={[0.037, 16, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Release point indicator */}
      <mesh position={points[0]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} />
      </mesh>

      {/* Plate location indicator */}
      <mesh position={[trajectory.plateLocation.x * 0.1, trajectory.plateLocation.y * 0.1, 0]}>
        <ringGeometry args={[0.05, 0.08, 16]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
