/**
 * Baseball Pitch Physics Engine
 *
 * Simulates realistic pitch trajectories using:
 * - Magnus force (spin-induced movement)
 * - Drag force (air resistance)
 * - Gravity
 *
 * Physics based on research from:
 * - Alan Nathan (University of Illinois)
 * - Barton Smith (Utah State University)
 * - MLB Statcast specifications
 */

import * as THREE from 'three';

// Physical constants
const GRAVITY = 32.174; // ft/s² (acceleration due to gravity)
const BALL_MASS = 0.145; // kg (baseball mass)
const BALL_DIAMETER = 0.073; // meters (2.87 inches)
const BALL_RADIUS = BALL_DIAMETER / 2;
const AIR_DENSITY = 1.225; // kg/m³ (at sea level, 15°C)
const DRAG_COEFFICIENT = 0.3; // Typical for baseball
const LIFT_COEFFICIENT = 0.4; // Magnus force coefficient

// Distance constants
const MOUND_DISTANCE = 60.5; // feet from mound to home plate
const STRIKE_ZONE_HEIGHT = 3.5; // feet (approximate)
const STRIKE_ZONE_WIDTH = 1.42; // feet (17 inches)
const PLATE_HEIGHT = 2.5; // feet (center of strike zone)

/**
 * Pitch parameters defining initial conditions
 */
export interface PitchParams {
  // Velocity (mph)
  velocity: number;

  // Release point (feet, relative to mound)
  releaseX: number; // horizontal (negative = first base side, positive = third base side)
  releaseY: number; // height above ground
  releaseZ: number; // distance toward home plate from rubber

  // Spin (rpm)
  spinRate: number;

  // Spin axis (degrees)
  // 0° = pure backspin (4-seam fastball)
  // 90° = pure sidespin
  // 180° = pure topspin
  spinAxis: number;

  // Spin direction (degrees, horizontal plane)
  // 0° = spinning toward home
  // 90° = spinning toward first base
  // 180° = spinning toward pitcher
  // 270° = spinning toward third base
  spinDirection: number;
}

/**
 * Point in 3D space with time
 */
export interface TrajectoryPoint {
  x: number; // horizontal position (feet)
  y: number; // height (feet)
  z: number; // distance from mound (feet)
  time: number; // time since release (seconds)
  vx: number; // horizontal velocity (ft/s)
  vy: number; // vertical velocity (ft/s)
  vz: number; // forward velocity (ft/s)
}

/**
 * Complete pitch trajectory
 */
export interface PitchTrajectory {
  points: TrajectoryPoint[];
  plateLocation: { x: number; y: number }; // where it crosses the plate
  plateVelocity: number; // mph at plate
  flightTime: number; // seconds
  maxHeight: number; // feet
  totalBreak: { horizontal: number; vertical: number }; // feet
}

/**
 * Calculate pitch trajectory using physics simulation
 */
export function calculateTrajectory(params: PitchParams): PitchTrajectory {
  const dt = 0.001; // time step (seconds) - 1ms for smooth animation
  const maxTime = 2.0; // max simulation time (seconds)

  // Convert initial conditions to feet/second
  const v0 = params.velocity * 1.467; // mph to ft/s

  // Initial position (feet)
  let x = params.releaseX;
  let y = params.releaseY;
  let z = params.releaseZ;

  // Initial velocity (all toward home plate initially)
  let vx = 0;
  let vy = 0;
  let vz = -v0; // negative z is toward home plate

  // Convert spin parameters
  const spinRad = (params.spinRate * 2 * Math.PI) / 60; // rpm to rad/s
  const spinAxisRad = (params.spinAxis * Math.PI) / 180;
  const spinDirRad = (params.spinDirection * Math.PI) / 180;

  // Spin vector (represents axis of rotation)
  const spinVector = new THREE.Vector3(
    Math.sin(spinAxisRad) * Math.cos(spinDirRad),
    Math.cos(spinAxisRad),
    Math.sin(spinAxisRad) * Math.sin(spinDirRad)
  ).multiplyScalar(spinRad);

  const points: TrajectoryPoint[] = [];
  let time = 0;
  let maxHeight = y;

  // Store initial straight-line trajectory for break calculation
  const straightLineY = y - (MOUND_DISTANCE - params.releaseZ) * (vy / vz);
  const straightLineX = x - (MOUND_DISTANCE - params.releaseZ) * (vx / vz);

  // Simulation loop
  while (time < maxTime && z > -MOUND_DISTANCE) {
    // Record current state
    points.push({
      x,
      y,
      z,
      time,
      vx,
      vy,
      vz,
    });

    // Calculate velocity magnitude
    const velocity = Math.sqrt(vx * vx + vy * vy + vz * vz);
    const velocityVector = new THREE.Vector3(vx, vy, vz);

    // Drag force (opposes motion)
    const dragMagnitude = 0.5 * DRAG_COEFFICIENT * AIR_DENSITY *
                         Math.PI * BALL_RADIUS * BALL_RADIUS * velocity * velocity;
    const dragForce = velocityVector.clone()
                                   .normalize()
                                   .multiplyScalar(-dragMagnitude / BALL_MASS);

    // Magnus force (perpendicular to velocity and spin axis)
    const magnusForce = new THREE.Vector3()
      .crossVectors(spinVector, velocityVector)
      .multiplyScalar(LIFT_COEFFICIENT * AIR_DENSITY * Math.PI *
                     BALL_RADIUS * BALL_RADIUS * BALL_RADIUS / BALL_MASS);

    // Gravity force
    const gravityForce = new THREE.Vector3(0, -GRAVITY, 0);

    // Total acceleration (F = ma, so a = F/m, but we already divided by mass above)
    const ax = dragForce.x + magnusForce.x;
    const ay = dragForce.y + magnusForce.y + gravityForce.y;
    const az = dragForce.z + magnusForce.z;

    // Update velocity (Euler integration)
    vx += ax * dt;
    vy += ay * dt;
    vz += az * dt;

    // Update position
    x += vx * dt;
    y += vy * dt;
    z += vz * dt;

    // Track max height
    if (y > maxHeight) {
      maxHeight = y;
    }

    time += dt;
  }

  // Find where pitch crosses the plate (z = -MOUND_DISTANCE)
  // eslint-disable-next-line prefer-const
  let plateLocation = { x: 0, y: 0 };
  let plateVelocity = params.velocity;

  for (let i = 1; i < points.length; i++) {
    const p1 = points[i - 1];
    const p2 = points[i];

    if (p1.z >= -MOUND_DISTANCE && p2.z < -MOUND_DISTANCE) {
      // Interpolate to find exact crossing point
      const t = (-MOUND_DISTANCE - p1.z) / (p2.z - p1.z);
      plateLocation.x = p1.x + t * (p2.x - p1.x);
      plateLocation.y = p1.y + t * (p2.y - p1.y);
      plateVelocity = Math.sqrt(p2.vx * p2.vx + p2.vy * p2.vy + p2.vz * p2.vz) / 1.467; // ft/s to mph
      break;
    }
  }

  // Calculate total break (deviation from straight line)
  const horizontalBreak = Math.abs(plateLocation.x - straightLineX) * 12; // feet to inches
  const verticalBreak = Math.abs(plateLocation.y - straightLineY) * 12; // feet to inches

  return {
    points,
    plateLocation,
    plateVelocity,
    flightTime: time,
    maxHeight,
    totalBreak: {
      horizontal: horizontalBreak,
      vertical: verticalBreak,
    },
  };
}

/**
 * Calculate if pitch is in strike zone
 */
export function isStrike(plateLocation: { x: number; y: number }): boolean {
  const inHorizontal = Math.abs(plateLocation.x) <= STRIKE_ZONE_WIDTH / 2;
  const inVertical = plateLocation.y >= (PLATE_HEIGHT - STRIKE_ZONE_HEIGHT / 2) &&
                     plateLocation.y <= (PLATE_HEIGHT + STRIKE_ZONE_HEIGHT / 2);
  return inHorizontal && inVertical;
}

/**
 * Calculate break comparison for tunneling effect
 * Returns the distance at which two pitches begin to diverge
 */
export function calculateTunnelingPoint(
  trajectory1: PitchTrajectory,
  trajectory2: PitchTrajectory,
  threshold: number = 0.5 // feet
): number {
  const minLength = Math.min(trajectory1.points.length, trajectory2.points.length);

  for (let i = 0; i < minLength; i++) {
    const p1 = trajectory1.points[i];
    const p2 = trajectory2.points[i];

    const distance = Math.sqrt(
      Math.pow(p1.x - p2.x, 2) +
      Math.pow(p1.y - p2.y, 2) +
      Math.pow(p1.z - p2.z, 2)
    );

    if (distance > threshold) {
      // Return z-position (distance from mound) where pitches diverge
      return Math.abs(p1.z);
    }
  }

  return 0; // Pitches never diverge significantly
}

/**
 * Convert feet coordinates to Three.js scene coordinates
 * Scale factor chosen to fit nice in 3D viewport
 */
export function toSceneCoords(x: number, y: number, z: number): THREE.Vector3 {
  const scale = 0.1; // Scale down for reasonable scene size
  return new THREE.Vector3(
    x * scale,
    y * scale,
    -z * scale // Flip z so home plate is in front
  );
}

/**
 * Get human-readable description of pitch movement
 */
export function describePitchMovement(trajectory: PitchTrajectory): string {
  const { horizontal, vertical } = trajectory.totalBreak;
  const plateX = trajectory.plateLocation.x;

  const horizontalDesc = plateX > 0.1 ? 'arm side' : plateX < -0.1 ? 'glove side' : 'straight';
  const verticalDesc = vertical > 5 ? 'dropping' : vertical < -5 ? 'rising' : 'flat';

  return `${horizontalDesc}, ${verticalDesc} (${horizontal.toFixed(1)}" H, ${vertical.toFixed(1)}" V)`;
}
