/**
 * FieldingSystem.ts
 * Complete fielding mechanics with:
 * - Position-specific AI and reactions
 * - Ball trajectory prediction
 * - Catch probability calculations
 * - Throwing mechanics and accuracy
 * - Defensive positioning strategies
 * - A* pathfinding for fielder movement
 * - Real-time fielder tracking and animation
 */

import { Vector3 } from "@babylonjs/core";
import { Player } from "../core/GameEngine";
import { Pathfinding } from "../ai/Pathfinding";

export interface FielderMovement {
  currentPosition: Vector3;
  targetPosition: Vector3 | null;
  path: Vector3[];
  pathIndex: number;
  isMoving: boolean;
  movementSpeed: number; // Units per second
}

export interface FielderPosition {
  id: string;
  position: string; // P, C, 1B, 2B, 3B, SS, LF, CF, RF
  defaultLocation: Vector3;
  coverageRadius: number;
  player: Player;
  movement: FielderMovement; // Real-time movement tracking
}

export interface BallTrajectory {
  positions: Vector3[];
  landingPoint: Vector3;
  hangTime: number;
  maxHeight: number;
  isFloor: boolean;
  isLineDrive: boolean;
  isFlyBall: boolean;
}

export interface CatchAttempt {
  fielder: FielderPosition;
  catchProbability: number;
  arrivalTime: number;
  catchPoint: Vector3;
}

export interface ThrowParameters {
  origin: Vector3;
  target: Vector3;
  throwingPower: number; // 1-10
  throwingAccuracy: number; // 1-10
  releasePoint: Vector3;
}

export interface BallState {
  position: Vector3;
  velocity: Vector3;
  hangTime: number;
  type: "ground" | "line_drive" | "fly_ball";
}

export interface FieldingDecision {
  targetPosition: Vector3;
  catchProbability: number;
  fielder: FielderPosition | null;
}

export class FieldingSystem {
  private fielders: Map<string, FielderPosition> = new Map();
  private ballPosition: Vector3 = Vector3.Zero();
  private ballVelocity: Vector3 = Vector3.Zero();
  private pathfinding: Pathfinding;
  private activeFielder: FielderPosition | null = null; // Fielder going for the ball

  constructor() {
    // Initialize A* pathfinding with reasonable grid size
    this.pathfinding = new Pathfinding({
      gridSize: 1.0, // 1 unit grid cells
      maxIterations: 500,
      smoothPath: true,
      allowDiagonal: true
    });
  }

  /**
   * Initialize fielders with defensive positions
   */
  public initializeDefense(players: Player[]): void {
    const positions: Array<{ pos: string; location: Vector3; radius: number }> = [
      { pos: "P", location: new Vector3(0, 0, 9), radius: 5 },
      { pos: "C", location: new Vector3(0, 0, -2), radius: 4 },
      { pos: "1B", location: new Vector3(12, 0, 11), radius: 8 },
      { pos: "2B", location: new Vector3(10, 0, 16), radius: 10 },
      { pos: "3B", location: new Vector3(-12, 0, 11), radius: 8 },
      { pos: "SS", location: new Vector3(-10, 0, 16), radius: 10 },
      { pos: "LF", location: new Vector3(-18, 0, 28), radius: 12 },
      { pos: "CF", location: new Vector3(0, 0, 32), radius: 14 },
      { pos: "RF", location: new Vector3(18, 0, 28), radius: 12 }
    ];

    players.forEach((player, index) => {
      if (index < positions.length) {
        const posData = positions[index];

        // Adjust coverage radius based on fielding range
        const adjustedRadius = posData.radius * (player.fieldingRange / 5);

        // Calculate movement speed from player speed stat (1-10 → 3-12 units/sec)
        const movementSpeed = 3 + (player.speed / 10) * 9;

        this.fielders.set(player.id, {
          id: player.id,
          position: posData.pos,
          defaultLocation: posData.location,
          coverageRadius: adjustedRadius,
          player,
          movement: {
            currentPosition: posData.location.clone(),
            targetPosition: null,
            path: [],
            pathIndex: 0,
            isMoving: false,
            movementSpeed
          }
        });
      }
    });
  }

  /**
   * Update ball tracking
   */
  public updateBallTracking(position: Vector3, velocity: Vector3): void {
    this.ballPosition = position;
    this.ballVelocity = velocity;
  }

  /**
   * Initialize ball in play
   */
  public initializeBallInPlay(ballState: BallState): void {
    this.ballPosition = ballState.position;
    this.ballVelocity = ballState.velocity;
  }

  /**
   * Get fielding decision for current ball state
   */
  public getFieldingDecision(ballState: BallState): FieldingDecision {
    // Find nearest fielder
    let nearestFielder: FielderPosition | null = null;
    let minDistance = Infinity;

    this.fielders.forEach(fielder => {
      const distance = Vector3.Distance(fielder.defaultLocation, ballState.position);
      if (distance < minDistance) {
        minDistance = distance;
        nearestFielder = fielder;
      }
    });

    let catchProbability = 0;
    if (nearestFielder !== null) {
      const fielder: FielderPosition = nearestFielder;
      catchProbability = Math.max(0, 1 - (minDistance / fielder.coverageRadius));
    }

    return {
      targetPosition: ballState.position,
      catchProbability,
      fielder: nearestFielder
    };
  }

  /**
   * Analyze ball trajectory
   */
  public analyzeBallTrajectory(trajectory: Vector3[]): BallTrajectory {
    if (trajectory.length === 0) {
      throw new Error("Empty trajectory");
    }

    const landingPoint = trajectory[trajectory.length - 1];
    const maxHeight = Math.max(...trajectory.map(p => p.y));
    const launchPoint = trajectory[0];

    // Calculate hang time (simplified - actual trajectory time)
    const hangTime = trajectory.length * 0.01; // Assuming 0.01s time steps

    // Classify ball type
    const launchAngle = Math.atan2(
      trajectory[1].y - trajectory[0].y,
      trajectory[1].z - trajectory[0].z
    ) * 180 / Math.PI;

    const isGroundBall = launchAngle < 15 || maxHeight < 2;
    const isLineDrive = launchAngle >= 15 && launchAngle < 35 && maxHeight < 8;
    const isFlyBall = launchAngle >= 35 || maxHeight >= 8;

    return {
      positions: trajectory,
      landingPoint,
      hangTime,
      maxHeight,
      isFloor: isGroundBall,
      isLineDrive,
      isFlyBall
    };
  }

  /**
   * Determine nearest fielder to ball
   */
  public getNearestFielder(ballLandingPoint: Vector3): FielderPosition | null {
    let nearest: FielderPosition | null = null;
    let minDistance = Infinity;

    this.fielders.forEach(fielder => {
      const distance = Vector3.Distance(
        fielder.defaultLocation,
        ballLandingPoint
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearest = fielder;
      }
    });

    return nearest;
  }

  /**
   * Calculate catch probability for a fielder
   */
  public calculateCatchProbability(
    fielder: FielderPosition,
    ballTrajectory: BallTrajectory
  ): CatchAttempt {
    const { landingPoint, hangTime, isFloor, isLineDrive, isFlyBall } = ballTrajectory;

    // Distance from fielder to landing point
    const distance = Vector3.Distance(fielder.defaultLocation, landingPoint);

    // Can fielder reach the ball?
    const fieldingRange = fielder.player.fieldingRange;
    const speed = fielder.player.speed;

    // Max distance fielder can cover in hang time
    // Assume 1 unit/s per speed point
    const maxReachDistance = speed * hangTime;

    if (distance > maxReachDistance) {
      // Ball out of reach
      return {
        fielder,
        catchProbability: 0,
        arrivalTime: Infinity,
        catchPoint: landingPoint
      };
    }

    // Calculate arrival time
    const arrivalTime = distance / speed;

    // Base catch probability
    let baseCatchRate = 0.7; // 70% base

    // Adjust for difficulty
    if (isFloor) {
      // Ground balls are easier but require good accuracy
      baseCatchRate = 0.8 + (fielder.player.fieldingAccuracy / 10) * 0.15;
    } else if (isLineDrive) {
      // Line drives are hardest
      baseCatchRate = 0.5 + (fielder.player.fieldingAccuracy / 10) * 0.2;
    } else if (isFlyBall) {
      // Fly balls give more time but require range
      baseCatchRate = 0.75 + (fieldingRange / 10) * 0.2;
    }

    // Distance penalty
    const distancePenalty = Math.min(distance / fielder.coverageRadius, 1) * 0.3;

    // Time pressure (too little time reduces catch rate)
    const timePressure = arrivalTime < 1 ? 0.2 : 0;

    const catchProbability = Math.max(0, Math.min(1,
      baseCatchRate - distancePenalty - timePressure
    ));

    return {
      fielder,
      catchProbability,
      arrivalTime,
      catchPoint: landingPoint
    };
  }

  /**
   * Determine best fielder for the play
   */
  public assignFielder(ballTrajectory: BallTrajectory): CatchAttempt | null {
    const catchAttempts: CatchAttempt[] = [];

    this.fielders.forEach(fielder => {
      const attempt = this.calculateCatchProbability(fielder, ballTrajectory);
      if (attempt.catchProbability > 0) {
        catchAttempts.push(attempt);
      }
    });

    if (catchAttempts.length === 0) {
      return null; // No one can reach it
    }

    // Choose fielder with highest catch probability
    catchAttempts.sort((a, b) => b.catchProbability - a.catchProbability);
    return catchAttempts[0];
  }

  /**
   * Execute catch attempt
   */
  public attemptCatch(catchAttempt: CatchAttempt): {
    caught: boolean;
    bobbled: boolean;
    fielderLocation: Vector3;
  } {
    const randomRoll = Math.random();
    const caught = randomRoll < catchAttempt.catchProbability;

    // 10% chance of bobble if not caught cleanly
    const bobbled = !caught && randomRoll < catchAttempt.catchProbability + 0.1;

    return {
      caught,
      bobbled,
      fielderLocation: catchAttempt.catchPoint
    };
  }

  /**
   * Calculate throw parameters from fielder to base
   */
  public calculateThrow(
    fielderPosition: Vector3,
    fielder: Player,
    targetBase: Vector3
  ): ThrowParameters {
    const throwingPower = fielder.fieldingAccuracy; // Arm strength
    const throwingAccuracy = fielder.fieldingAccuracy;

    // Release point (above fielder)
    const releasePoint = fielderPosition.clone();
    releasePoint.y += 1.5;

    // Target is slightly above base
    const target = targetBase.clone();
    target.y += 1.0;

    return {
      origin: fielderPosition,
      target,
      throwingPower,
      throwingAccuracy,
      releasePoint
    };
  }

  /**
   * Simulate throw trajectory with accuracy variance
   */
  public simulateThrow(params: ThrowParameters): Vector3[] {
    const trajectory: Vector3[] = [];
    const distance = Vector3.Distance(params.origin, params.target);

    // Throw velocity based on power (1-10 → 40-90 mph)
    const throwVelocity = 40 + params.throwingPower * 5; // mph
    const throwVelocityMS = throwVelocity * 0.44704; // m/s

    // Accuracy variance (lower accuracy = more variance)
    const accuracyVariance = (11 - params.throwingAccuracy) * 0.2;
    const errorX = (Math.random() - 0.5) * accuracyVariance;
    const errorY = (Math.random() - 0.5) * accuracyVariance;

    const adjustedTarget = params.target.clone();
    adjustedTarget.x += errorX;
    adjustedTarget.y += errorY;

    // Calculate trajectory (simplified arc)
    const direction = adjustedTarget.subtract(params.releasePoint).normalize();
    const timeToTarget = distance / throwVelocityMS;

    const steps = Math.ceil(timeToTarget / 0.01);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const position = Vector3.Lerp(params.releasePoint, adjustedTarget, t);

      // Add arc (parabola)
      const arc = Math.sin(t * Math.PI) * (distance * 0.15);
      position.y += arc;

      trajectory.push(position);
    }

    return trajectory;
  }

  /**
   * Check if throw beats runner to base
   */
  public checkRunnerVsThrow(
    throwArrivalTime: number,
    runnerArrivalTime: number
  ): { safe: boolean; margin: number } {
    const margin = runnerArrivalTime - throwArrivalTime;

    return {
      safe: margin > 0.1, // Need 0.1s margin for tag
      margin
    };
  }

  /**
   * Determine defensive shift based on batter tendencies
   */
  public applyDefensiveShift(batterTendencies: {
    pullPercentage: number;
    flyBallPercentage: number;
    groundBallPercentage: number;
  }): void {
    const { pullPercentage, flyBallPercentage } = batterTendencies;

    // Shift fielders based on tendencies
    this.fielders.forEach(fielder => {
      const originalPos = fielder.defaultLocation.clone();

      if (pullPercentage > 0.6) {
        // Shift toward pull side
        if (fielder.position === "2B" || fielder.position === "SS") {
          fielder.defaultLocation.x += 3;
        }
        if (fielder.position === "RF" || fielder.position === "CF") {
          fielder.defaultLocation.x += 5;
        }
      }

      if (flyBallPercentage > 0.5) {
        // Shift outfielders back
        if (["LF", "CF", "RF"].includes(fielder.position)) {
          fielder.defaultLocation.z += 5;
        }
      } else {
        // Shift infielders back for ground ball hitters
        if (["1B", "2B", "3B", "SS"].includes(fielder.position)) {
          fielder.defaultLocation.z += 2;
        }
      }
    });
  }

  /**
   * Reset fielders to default positions
   */
  public resetPositions(): void {
    // Positions are reset in initializeDefense
  }

  /**
   * Get all fielders
   */
  public getFielders(): Map<string, FielderPosition> {
    return this.fielders;
  }

  /**
   * Get fielder by position
   */
  public getFielderByPosition(position: string): FielderPosition | undefined {
    return Array.from(this.fielders.values()).find(f => f.position === position);
  }

  /**
   * PHASE 3: FIELDING AI MOVEMENT
   * Move fielder to target position using A* pathfinding
   */
  public moveFielderTo(fielder: FielderPosition, targetPosition: Vector3): void {
    // Calculate path using A* pathfinding
    const obstacles: Vector3[] = [];

    // Add other fielders as obstacles (simplified)
    this.fielders.forEach(otherFielder => {
      if (otherFielder.id !== fielder.id) {
        obstacles.push(otherFielder.movement.currentPosition);
      }
    });

    const path = this.pathfinding.findPath(
      fielder.movement.currentPosition,
      targetPosition,
      obstacles
    );

    // Update fielder movement state
    fielder.movement.path = path;
    fielder.movement.pathIndex = 0;
    fielder.movement.targetPosition = targetPosition;
    fielder.movement.isMoving = true;

    console.log(
      `Fielder ${fielder.position} moving to ${targetPosition.toString()}, ` +
      `path length: ${path.length} waypoints`
    );
  }

  /**
   * Update all fielder movements (call every frame)
   * @param deltaTime Time since last frame in seconds
   */
  public updateFielderMovement(deltaTime: number): void {
    this.fielders.forEach(fielder => {
      if (!fielder.movement.isMoving) return;

      const movement = fielder.movement;
      const path = movement.path;

      // No path to follow
      if (path.length === 0 || movement.pathIndex >= path.length) {
        movement.isMoving = false;
        return;
      }

      // Current target waypoint
      const targetWaypoint = path[movement.pathIndex];
      const currentPos = movement.currentPosition;

      // Calculate movement direction and distance
      const direction = targetWaypoint.subtract(currentPos);
      const distanceToWaypoint = direction.length();

      // Movement distance this frame
      const moveDistance = movement.movementSpeed * deltaTime;

      if (distanceToWaypoint <= moveDistance) {
        // Reached waypoint - move to exact position
        movement.currentPosition = targetWaypoint.clone();
        movement.pathIndex++;

        // Check if path complete
        if (movement.pathIndex >= path.length) {
          movement.isMoving = false;
          movement.targetPosition = null;
          console.log(`Fielder ${fielder.position} reached target`);
        }
      } else {
        // Move toward waypoint
        const normalizedDirection = direction.normalize();
        const movementVector = normalizedDirection.scale(moveDistance);
        movement.currentPosition.addInPlace(movementVector);
      }
    });
  }

  /**
   * Check if fielder is at target position (within threshold)
   */
  public isFielderAtPosition(
    fielder: FielderPosition,
    position: Vector3,
    threshold: number = 0.5
  ): boolean {
    const distance = Vector3.Distance(fielder.movement.currentPosition, position);
    return distance <= threshold;
  }

  /**
   * Stop fielder movement immediately
   */
  public stopFielderMovement(fielder: FielderPosition): void {
    fielder.movement.isMoving = false;
    fielder.movement.path = [];
    fielder.movement.pathIndex = 0;
    fielder.movement.targetPosition = null;
  }

  /**
   * Stop all fielder movement
   */
  public stopAllFielderMovement(): void {
    this.fielders.forEach(fielder => this.stopFielderMovement(fielder));
    this.activeFielder = null;
  }

  /**
   * Assign fielder to pursue the ball
   * Uses ball trajectory prediction to position optimally
   */
  public assignFielderToBall(ballTrajectory: BallTrajectory): void {
    const catchAttempt = this.assignFielder(ballTrajectory);

    if (!catchAttempt) {
      console.warn("No fielder can reach the ball");
      return;
    }

    this.activeFielder = catchAttempt.fielder;

    // Move fielder to predicted catch point
    this.moveFielderTo(catchAttempt.fielder, ballTrajectory.landingPoint);

    console.log(
      `Assigned ${catchAttempt.fielder.position} to ball, ` +
      `catch probability: ${(catchAttempt.catchProbability * 100).toFixed(1)}%, ` +
      `arrival time: ${catchAttempt.arrivalTime.toFixed(2)}s`
    );
  }

  /**
   * Get active fielder pursuing the ball
   */
  public getActiveFielder(): FielderPosition | null {
    return this.activeFielder;
  }

  /**
   * Calculate if fielder will reach ball before it lands
   */
  public willFielderReachBall(
    fielder: FielderPosition,
    ballLandingPoint: Vector3,
    ballHangTime: number
  ): boolean {
    const distance = Vector3.Distance(
      fielder.movement.currentPosition,
      ballLandingPoint
    );
    const timeToReach = distance / fielder.movement.movementSpeed;

    return timeToReach < ballHangTime;
  }
}
