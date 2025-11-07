/**
 * BallPhysics.ts
 * Hyper-realistic baseball physics engine with:
 * - Magnus effect (spin-induced curve)
 * - Air resistance (drag)
 * - Gravity
 * - Pitch types (fastball, curveball, slider, changeup)
 * - Exit velocity calculations
 * - Launch angle optimization
 */

import { Vector3 } from "@babylonjs/core";

export enum PitchType {
  FASTBALL = "fastball",
  CURVEBALL = "curveball",
  SLIDER = "slider",
  CHANGEUP = "changeup",
  KNUCKLEBALL = "knuckleball"
}

export interface PitchParameters {
  velocity: number; // mph
  spin: Vector3; // RPM in each axis
  releasePoint: Vector3;
  targetPoint: Vector3;
  type: PitchType;
}

export interface HitParameters {
  contactQuality: number; // 0-1
  swingSpeed: number; // mph
  launchAngle: number; // degrees
  sprayAngle: number; // degrees
  exitVelocity: number; // mph
}

export class BallPhysics {
  // Physical constants
  private static readonly BALL_MASS = 0.145; // kg
  private static readonly BALL_RADIUS = 0.0366; // meters (2.86 inches)
  private static readonly AIR_DENSITY = 1.225; // kg/m³ at sea level
  private static readonly DRAG_COEFFICIENT = 0.3; // baseball drag coefficient
  private static readonly GRAVITY = 9.81; // m/s²

  // Conversion factors
  private static readonly MPH_TO_MS = 0.44704;
  private static readonly MS_TO_MPH = 2.23694;
  private static readonly RPM_TO_RADS = 0.10472;

  /**
   * Calculate pitch trajectory with realistic physics
   * Includes Magnus force, drag, and gravity
   */
  public static calculatePitchTrajectory(
    params: PitchParameters,
    timeStep: number = 0.01
  ): Vector3[] {
    const trajectory: Vector3[] = [];
    let position = params.releasePoint.clone();

    // Initial velocity in m/s
    const velocityMS = params.velocity * this.MPH_TO_MS;
    const direction = params.targetPoint.subtract(params.releasePoint).normalize();
    let velocity = direction.scale(velocityMS);

    // Spin in rad/s
    const spinRadS = params.spin.scale(this.RPM_TO_RADS);

    // Apply pitch-specific spin characteristics
    const adjustedSpin = this.applyPitchTypePhysics(params.type, spinRadS, velocity);

    // Simulate trajectory
    let time = 0;
    const maxTime = 2; // 2 seconds max flight time

    while (time < maxTime && position.z < 50) {
      trajectory.push(position.clone());

      // Calculate forces
      const dragForce = this.calculateDragForce(velocity);
      const magnusForce = this.calculateMagnusForce(velocity, adjustedSpin);
      const gravityForce = new Vector3(0, -this.GRAVITY * this.BALL_MASS, 0);

      // Total force
      const totalForce = dragForce.add(magnusForce).add(gravityForce);

      // Acceleration (F = ma)
      const acceleration = totalForce.scale(1 / this.BALL_MASS);

      // Update velocity and position
      velocity = velocity.add(acceleration.scale(timeStep));
      position = position.add(velocity.scale(timeStep));

      time += timeStep;

      // Stop if ball hits ground
      if (position.y < 0) break;
    }

    return trajectory;
  }

  /**
   * Calculate drag force
   * F_drag = -0.5 * ρ * C_d * A * v² * v_hat
   */
  private static calculateDragForce(velocity: Vector3): Vector3 {
    const speed = velocity.length();
    if (speed === 0) return Vector3.Zero();

    const velocityDirection = velocity.normalize();
    const area = Math.PI * this.BALL_RADIUS * this.BALL_RADIUS;

    const dragMagnitude =
      0.5 * this.AIR_DENSITY * this.DRAG_COEFFICIENT * area * speed * speed;

    // Drag opposes velocity
    return velocityDirection.scale(-dragMagnitude);
  }

  /**
   * Calculate Magnus force (spin-induced curve)
   * F_magnus = 0.5 * C_L * ρ * A * v² * (ω × v_hat)
   */
  public static calculateMagnusForce(velocity: Vector3, spin: Vector3): Vector3 {
    const speed = velocity.length();
    if (speed === 0) return Vector3.Zero();

    const velocityDirection = velocity.normalize();
    const area = Math.PI * this.BALL_RADIUS * this.BALL_RADIUS;

    // Cross product of spin and velocity direction
    const liftDirection = Vector3.Cross(spin, velocityDirection).normalize();

    // Magnus coefficient (empirical, depends on spin rate)
    const spinRate = spin.length();
    const C_L = 0.5 * Math.min(spinRate / 2000, 1); // Max at high spin

    const magnusMagnitude = 0.5 * C_L * this.AIR_DENSITY * area * speed * speed;

    return liftDirection.scale(magnusMagnitude);
  }

  /**
   * Apply pitch-specific physics characteristics
   */
  private static applyPitchTypePhysics(
    pitchType: PitchType,
    baseSpin: Vector3,
    velocity: Vector3
  ): Vector3 {
    const speed = velocity.length();

    switch (pitchType) {
      case PitchType.FASTBALL:
        // High backspin (negative X-axis rotation)
        return new Vector3(-2400, 0, 200).scale(this.RPM_TO_RADS);

      case PitchType.CURVEBALL:
        // High topspin + some sidespin
        return new Vector3(2500, 0, -300).scale(this.RPM_TO_RADS);

      case PitchType.SLIDER:
        // Diagonal spin (topspin + sidespin)
        return new Vector3(1500, 0, -2000).scale(this.RPM_TO_RADS);

      case PitchType.CHANGEUP:
        // Low backspin
        return new Vector3(-1200, 0, 100).scale(this.RPM_TO_RADS);

      case PitchType.KNUCKLEBALL:
        // Minimal spin with erratic movement
        const randomX = (Math.random() - 0.5) * 200;
        const randomZ = (Math.random() - 0.5) * 200;
        return new Vector3(randomX, 0, randomZ).scale(this.RPM_TO_RADS);

      default:
        return baseSpin;
    }
  }

  /**
   * Calculate hit trajectory with exit velocity and launch angle
   */
  public static calculateHitTrajectory(
    hitParams: HitParameters,
    contactPoint: Vector3,
    timeStep: number = 0.01
  ): Vector3[] {
    const trajectory: Vector3[] = [];
    let position = contactPoint.clone();

    // Convert exit velocity to m/s
    const exitVelocityMS = hitParams.exitVelocity * this.MPH_TO_MS;

    // Calculate initial velocity vector
    const launchAngleRad = hitParams.launchAngle * Math.PI / 180;
    const sprayAngleRad = hitParams.sprayAngle * Math.PI / 180;

    let velocity = new Vector3(
      Math.sin(sprayAngleRad) * Math.cos(launchAngleRad) * exitVelocityMS,
      Math.sin(launchAngleRad) * exitVelocityMS,
      Math.cos(sprayAngleRad) * Math.cos(launchAngleRad) * exitVelocityMS
    );

    // Backspin on hit (reduces drop rate)
    const backspin = new Vector3(-1500 * this.RPM_TO_RADS, 0, 0);

    let time = 0;
    const maxTime = 6; // 6 seconds max flight time

    while (time < maxTime) {
      trajectory.push(position.clone());

      // Calculate forces
      const dragForce = this.calculateDragForce(velocity);
      const magnusForce = this.calculateMagnusForce(velocity, backspin);
      const gravityForce = new Vector3(0, -this.GRAVITY * this.BALL_MASS, 0);

      const totalForce = dragForce.add(magnusForce).add(gravityForce);
      const acceleration = totalForce.scale(1 / this.BALL_MASS);

      velocity = velocity.add(acceleration.scale(timeStep));
      position = position.add(velocity.scale(timeStep));

      time += timeStep;

      // Stop if ball hits ground
      if (position.y < 0.2) {
        position.y = 0.2; // Ground level
        break;
      }
    }

    return trajectory;
  }

  /**
   * Calculate exit velocity based on bat speed and contact quality
   */
  public static calculateExitVelocity(
    pitchSpeed: number, // mph
    batSpeed: number, // mph
    contactQuality: number // 0-1
  ): number {
    // Coefficient of restitution (0.5 for baseball)
    const COR = 0.5;

    // Exit velocity formula (simplified)
    const baseExitVelocity = (1 + COR) * batSpeed - COR * pitchSpeed;

    // Apply contact quality multiplier
    const exitVelocity = baseExitVelocity * (0.5 + contactQuality * 0.5);

    // Clamp to realistic range
    return Math.max(40, Math.min(120, exitVelocity));
  }

  /**
   * Determine optimal launch angle for home run (25-35 degrees)
   */
  public static getOptimalLaunchAngle(contactQuality: number): number {
    // Sweet spot is 25-30 degrees
    const baseAngle = 27;
    const variance = (1 - contactQuality) * 20; // Poor contact = more variance

    return baseAngle + (Math.random() - 0.5) * variance;
  }

  /**
   * Calculate spray angle based on bat angle and timing
   */
  public static calculateSprayAngle(
    timing: number, // -1 to 1 (early to late)
    batterAccuracy: number // 1-10
  ): number {
    // Early swing = pull, late swing = opposite field
    const baseAngle = timing * 45; // -45 to +45 degrees

    // Accuracy reduces variance
    const variance = (11 - batterAccuracy) * 5;
    const randomVariance = (Math.random() - 0.5) * variance;

    return baseAngle + randomVariance;
  }

  /**
   * Determine if ball is in strike zone
   */
  public static isStrike(ballPosition: Vector3, strikeZone: {
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number,
    zMin: number,
    zMax: number
  }): boolean {
    return (
      ballPosition.x >= strikeZone.xMin &&
      ballPosition.x <= strikeZone.xMax &&
      ballPosition.y >= strikeZone.yMin &&
      ballPosition.y <= strikeZone.yMax &&
      ballPosition.z >= strikeZone.zMin &&
      ballPosition.z <= strikeZone.zMax
    );
  }

  /**
   * Calculate hang time for fly ball
   */
  public static calculateHangTime(launchAngle: number, exitVelocity: number): number {
    const velocityMS = exitVelocity * this.MPH_TO_MS;
    const launchAngleRad = launchAngle * Math.PI / 180;
    const verticalVelocity = velocityMS * Math.sin(launchAngleRad);

    // Time to peak + time from peak to ground (simplified, ignoring drag)
    const timeToApex = verticalVelocity / this.GRAVITY;
    return timeToApex * 2;
  }

  /**
   * Estimate distance of hit
   */
  public static estimateHitDistance(trajectory: Vector3[]): number {
    if (trajectory.length === 0) return 0;

    const finalPosition = trajectory[trajectory.length - 1];
    const startPosition = trajectory[0];

    return Math.sqrt(
      Math.pow(finalPosition.x - startPosition.x, 2) +
      Math.pow(finalPosition.z - startPosition.z, 2)
    );
  }

  // Instance methods for GameEngine integration

  public simulatePitch(pitchType: string, speed: number, control: number, target: {x: number, y: number, z: number}) {
    return {
      velocity: { x: 0, y: 0, z: -speed * 0.44704 },
      spin: { x: 0, y: 2500, z: 0 }
    };
  }

  public simulateBattedBall(batterStats: any, pitchType: string, contactQuality: number) {
    const power = batterStats.power || 5;
    const exitVelo = 40 + (power * 8) + (contactQuality * 40);
    const launchAngle = 10 + (contactQuality * 30);

    return {
      velocity: {
        x: Math.sin(launchAngle * Math.PI / 180) * exitVelo * 0.44704,
        y: Math.sin(launchAngle * Math.PI / 180) * exitVelo * 0.44704,
        z: Math.cos(launchAngle * Math.PI / 180) * exitVelo * 0.44704
      },
      spin: { x: 0, y: 0, z: 0 },
      launchAngle,
      hangTime: BallPhysics.calculateHangTime(launchAngle, exitVelo)
    };
  }

  public calculateMagnusForce(velocity: {x: number, y: number, z: number}, spin: {x: number, y: number, z: number}) {
    const v = new Vector3(velocity.x, velocity.y, velocity.z);
    const s = new Vector3(spin.x, spin.y, spin.z);
    const force = BallPhysics.calculateMagnusForce(v, s);
    return { x: force.x, y: force.y, z: force.z };
  }
}
