/**
 * BaseRunningSystem.ts
 * Complete base running mechanics with:
 * - Lead-offs and stealing
 * - Tagging up on fly balls
 * - Sliding mechanics
 * - Advance/hold decisions
 * - Runner AI based on speed and situation
 */

import { Vector3 } from "@babylonjs/core";
import { Player } from "../core/GameEngine";

export interface Runner {
  id: string;
  player: Player;
  currentBase: number; // 0=home, 1=first, 2=second, 3=third
  leadDistance: number; // units from base
  isRunning: boolean;
  targetBase: number;
  position: Vector3;
  speed: number; // units per second
}

export interface BaseRunDecision {
  advance: boolean;
  targetBase: number;
  aggressiveness: number; // 0-1
  slideRequired: boolean;
}

export interface StealAttempt {
  runner: Runner;
  targetBase: number;
  successProbability: number;
  reactionTime: number; // ms
}

export class BaseRunningSystem {
  private runners: Runner[] = [];
  private baseLocations: Vector3[] = [
    new Vector3(0, 0, 0), // Home
    new Vector3(13, 0, 13), // First
    new Vector3(0, 0, 18.4), // Second
    new Vector3(-13, 0, 13), // Third
  ];

  // Base running constants
  private readonly BASE_DISTANCE = 27.43; // meters (90 feet)
  private readonly LEAD_OFF_MAX = 3; // max lead off distance
  private readonly SLIDE_DISTANCE = 2; // start slide 2 units from base

  /**
   * Add runner to base
   */
  public addRunner(player: Player, base: number): Runner {
    const runner: Runner = {
      id: player.id,
      player,
      currentBase: base,
      leadDistance: 0,
      isRunning: false,
      targetBase: base,
      position: this.baseLocations[base].clone(),
      speed: player.speed // Base speed stat
    };

    this.runners.push(runner);
    return runner;
  }

  /**
   * Remove runner from bases (scored or out)
   */
  public removeRunner(runnerId: string): void {
    this.runners = this.runners.filter(r => r.id !== runnerId);
  }

  /**
   * Take lead off base
   */
  public takeLeadOff(runner: Runner, pitcherReady: boolean): void {
    if (runner.currentBase === 0 || runner.isRunning) return;

    // Calculate safe lead distance based on runner speed and pitcher attention
    const maxLead = this.LEAD_OFF_MAX * (runner.player.speed / 10);
    const pitcherPenalty = pitcherReady ? 0.5 : 1.0;

    runner.leadDistance = Math.min(maxLead * pitcherPenalty, this.LEAD_OFF_MAX);

    // Update position
    const nextBase = this.baseLocations[runner.currentBase + 1];
    const currentBase = this.baseLocations[runner.currentBase];
    const direction = nextBase.subtract(currentBase).normalize();

    runner.position = currentBase.add(direction.scale(runner.leadDistance));
  }

  /**
   * Return to base (pickoff attempt or pitch)
   */
  public returnToBase(runner: Runner): void {
    runner.leadDistance = 0;
    runner.position = this.baseLocations[runner.currentBase].clone();
  }

  /**
   * Decide whether to steal
   */
  public evaluateStealOpportunity(
    runner: Runner,
    pitcherControl: number,
    catcherArmStrength: number,
    gameContext: { outs: number; inning: number; score: number }
  ): StealAttempt | null {
    // Only steal from 1st or 2nd
    if (runner.currentBase === 0 || runner.currentBase === 3) {
      return null;
    }

    // Base success rate for stealing
    const speedFactor = runner.player.speed / 10; // 0.1-1.0
    const baseStealRate = 0.5 + speedFactor * 0.3; // 50-80% base rate

    // Pitcher impact (good pickoff move reduces success)
    const pitcherFactor = -pitcherControl * 0.03; // -3% to -30%

    // Catcher arm strength impact
    const catcherFactor = -catcherArmStrength * 0.04; // -4% to -40%

    // Lead off bonus
    const leadBonus = (runner.leadDistance / this.LEAD_OFF_MAX) * 0.1; // Up to +10%

    // Calculate final success probability
    const successProbability = Math.max(0.1, Math.min(0.95,
      baseStealRate + pitcherFactor + catcherFactor + leadBonus
    ));

    // Game context: more aggressive when behind late in game
    let aggressivenessModifier = 0;
    if (gameContext.inning >= 7 && gameContext.score < -2) {
      aggressivenessModifier = 0.15; // +15% willingness to try
    }

    // Only attempt if probability is good or desperate situation
    if (successProbability < 0.6 && aggressivenessModifier === 0) {
      return null;
    }

    // Reaction time (faster runners react quicker)
    const reactionTime = 250 - runner.player.speed * 15; // 100-235ms

    return {
      runner,
      targetBase: runner.currentBase + 1,
      successProbability: successProbability + aggressivenessModifier,
      reactionTime
    };
  }

  /**
   * Execute steal attempt
   */
  public executeSteal(stealAttempt: StealAttempt): void {
    const { runner, targetBase } = stealAttempt;

    runner.isRunning = true;
    runner.targetBase = targetBase;
  }

  /**
   * Decide whether to advance on batted ball
   */
  public decideAdvance(
    runner: Runner,
    ballTrajectory: {
      landingPoint: Vector3;
      hangTime: number;
      isFlyBall: boolean;
      isLineDrive: boolean;
      isGroundBall: boolean;
    },
    outs: number
  ): BaseRunDecision {
    const { landingPoint, hangTime, isFlyBall, isLineDrive } = ballTrajectory;

    // Calculate distance to next base
    const nextBase = runner.currentBase + 1;
    if (nextBase > 3) {
      // Runner already on third
      return this.decideScoreAttempt(runner, ballTrajectory, outs);
    }

    const distanceToNextBase = Vector3.Distance(
      runner.position,
      this.baseLocations[nextBase]
    );

    // Time to reach next base
    const timeToNextBase = distanceToNextBase / runner.speed;

    // Fly ball logic
    if (isFlyBall) {
      // Check if ball will be caught
      const ballDistance = Vector3.Distance(landingPoint, Vector3.Zero());

      if (ballDistance < 30) {
        // Likely caught - must tag up
        if (outs < 2) {
          return {
            advance: false,
            targetBase: runner.currentBase,
            aggressiveness: 0.3,
            slideRequired: false
          };
        } else {
          // 2 outs, run on contact
          return {
            advance: true,
            targetBase: nextBase,
            aggressiveness: 0.9,
            slideRequired: false
          };
        }
      } else {
        // Deep fly ball, advance
        return {
          advance: true,
          targetBase: nextBase,
          aggressiveness: 0.7,
          slideRequired: false
        };
      }
    }

    // Line drive - freeze initially
    if (isLineDrive) {
      // High risk of double play
      return {
        advance: false,
        targetBase: runner.currentBase,
        aggressiveness: 0.2,
        slideRequired: false
      };
    }

    // Ground ball - always advance
    const canBeatThrow = timeToNextBase < hangTime + 1.5; // 1.5s for fielding

    return {
      advance: true,
      targetBase: canBeatThrow ? nextBase + 1 : nextBase, // Try for extra base
      aggressiveness: canBeatThrow ? 0.8 : 0.5,
      slideRequired: !canBeatThrow
    };
  }

  /**
   * Decide whether to score from third
   */
  private decideScoreAttempt(
    runner: Runner,
    ballTrajectory: {
      landingPoint: Vector3;
      hangTime: number;
      isFlyBall: boolean;
    },
    outs: number
  ): BaseRunDecision {
    const { landingPoint, hangTime, isFlyBall } = ballTrajectory;
    const distanceToHome = Vector3.Distance(runner.position, this.baseLocations[0]);
    const timeToHome = distanceToHome / runner.speed;

    if (isFlyBall) {
      // Sacrifice fly depth check
      const ballDepth = landingPoint.z;

      if (ballDepth > 25) {
        // Deep enough to tag
        return {
          advance: true,
          targetBase: 0,
          aggressiveness: 0.9,
          slideRequired: false
        };
      } else {
        // Too shallow
        return {
          advance: false,
          targetBase: 3,
          aggressiveness: 0.2,
          slideRequired: false
        };
      }
    }

    // Ground ball - go on contact with 2 outs
    if (outs === 2) {
      return {
        advance: true,
        targetBase: 0,
        aggressiveness: 1.0,
        slideRequired: true
      };
    }

    // Be aggressive if fast runner
    const canScore = timeToHome < hangTime + 2.0;

    return {
      advance: canScore,
      targetBase: canScore ? 0 : 3,
      aggressiveness: canScore ? 0.8 : 0.3,
      slideRequired: canScore
    };
  }

  /**
   * Update runner positions during play
   */
  public updateRunners(deltaTime: number): void {
    this.runners.forEach(runner => {
      if (runner.isRunning) {
        const targetPosition = this.baseLocations[runner.targetBase];
        const direction = targetPosition.subtract(runner.position).normalize();
        const movement = direction.scale(runner.speed * deltaTime);

        runner.position = runner.position.add(movement);

        // Check if reached base
        const distanceToTarget = Vector3.Distance(runner.position, targetPosition);
        if (distanceToTarget < 0.5) {
          runner.currentBase = runner.targetBase;
          runner.isRunning = false;
          runner.position = targetPosition.clone();
        }
      }
    });
  }

  /**
   * Check if runner should slide
   */
  public shouldSlide(runner: Runner): boolean {
    if (!runner.isRunning) return false;

    const targetPosition = this.baseLocations[runner.targetBase];
    const distance = Vector3.Distance(runner.position, targetPosition);

    return distance < this.SLIDE_DISTANCE;
  }

  /**
   * Tag up on fly ball
   */
  public tagUp(runner: Runner, ballCaught: boolean): void {
    if (!ballCaught) return;

    // Runner must be on base to tag up
    if (runner.leadDistance > 0) {
      // Return to base first
      this.returnToBase(runner);
    }

    // Start running
    runner.isRunning = true;
    runner.targetBase = runner.currentBase + 1;
  }

  /**
   * Calculate time to reach base
   */
  public calculateTimeToBase(runner: Runner, targetBase: number): number {
    const targetPosition = this.baseLocations[targetBase];
    const distance = Vector3.Distance(runner.position, targetPosition);
    return distance / runner.speed;
  }

  /**
   * Get all runners
   */
  public getRunners(): Runner[] {
    return this.runners;
  }

  /**
   * Get runner on specific base
   */
  public getRunnerOnBase(base: number): Runner | undefined {
    return this.runners.find(r => r.currentBase === base);
  }

  /**
   * Clear all runners (end of inning)
   */
  public clearRunners(): void {
    this.runners = [];
  }

  /**
   * Check if bases are loaded
   */
  public areBasesLoaded(): boolean {
    return this.runners.length === 3 &&
      this.getRunnerOnBase(1) !== undefined &&
      this.getRunnerOnBase(2) !== undefined &&
      this.getRunnerOnBase(3) !== undefined;
  }
}
