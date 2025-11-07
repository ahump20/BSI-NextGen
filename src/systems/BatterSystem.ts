/**
 * BatterSystem.ts
 * Complete batting mechanics with:
 * - Swing timing windows
 * - Contact quality detection
 * - Power vs. contact trade-offs
 * - Hot/cold zones for batters
 * - Situational hitting adjustments
 */

import { Vector3 } from "@babylonjs/core";
import { HitParameters, BallPhysics } from "../physics/BallPhysics";
import { Player } from "../core/GameEngine";
import { PitchType } from "../physics/BallPhysics";

export interface SwingWindow {
  perfectStart: number; // ms
  perfectEnd: number; // ms
  goodStart: number; // ms
  goodEnd: number; // ms
  maxWindow: number; // ms
}

export interface HitZone {
  zone: string;
  contactRate: number; // 0-1
  powerMultiplier: number; // 0-2
}

export interface GameSituation {
  outs: number;
  runnersOn: boolean[];
  score: { home: number; away: number };
  inning: number;
}

export class BatterSystem {
  private batter: Player;
  private hotZones: HitZone[];
  private coldZones: HitZone[];
  private confidence: number = 75; // 0-100
  private plateAppearances: number = 0;

  // Swing mechanics
  private batSpeed: number; // mph
  private swingWindow: SwingWindow;

  constructor(batter: Player) {
    this.batter = batter;
    this.batSpeed = this.calculateBatSpeed(batter);
    this.swingWindow = this.calculateSwingWindow(batter);
    this.hotZones = this.generateHotZones(batter);
    this.coldZones = this.generateColdZones(batter);
  }

  /**
   * Calculate bat speed based on power stat
   */
  private calculateBatSpeed(batter: Player): number {
    // Average MLB bat speed is ~70 mph
    // Range: 50-90 mph
    return 50 + batter.battingPower * 4;
  }

  /**
   * Calculate swing timing window based on speed/reactions
   */
  private calculateSwingWindow(batter: Player): SwingWindow {
    // Faster batters have larger timing windows
    const speedFactor = batter.speed / 10;
    const accuracyFactor = batter.battingAccuracy / 10;

    const perfectWindow = 50 * speedFactor; // 5-50ms perfect timing
    const goodWindow = 100 * accuracyFactor; // 10-100ms good timing
    const maxWindow = 200 + accuracyFactor * 100; // 210-300ms total window

    return {
      perfectStart: 0,
      perfectEnd: perfectWindow,
      goodStart: perfectWindow,
      goodEnd: perfectWindow + goodWindow,
      maxWindow
    };
  }

  /**
   * Generate hot zones for this batter
   */
  private generateHotZones(batter: Player): HitZone[] {
    const zones = [
      "high-inside", "high-middle", "high-outside",
      "middle-inside", "middle-middle", "middle-outside",
      "low-inside", "low-middle", "low-outside"
    ];

    // Power hitters love middle-in
    if (batter.battingPower >= 8) {
      return [
        { zone: "middle-inside", contactRate: 0.4, powerMultiplier: 1.5 },
        { zone: "middle-middle", contactRate: 0.45, powerMultiplier: 1.4 },
        { zone: "low-inside", contactRate: 0.35, powerMultiplier: 1.3 }
      ];
    }

    // Contact hitters like the outer half
    if (batter.battingAccuracy >= 8) {
      return [
        { zone: "middle-outside", contactRate: 0.5, powerMultiplier: 1.0 },
        { zone: "high-outside", contactRate: 0.45, powerMultiplier: 0.9 },
        { zone: "low-outside", contactRate: 0.4, powerMultiplier: 0.85 }
      ];
    }

    // Balanced hitters
    return [
      { zone: "middle-middle", contactRate: 0.45, powerMultiplier: 1.2 },
      { zone: "middle-outside", contactRate: 0.4, powerMultiplier: 1.0 }
    ];
  }

  /**
   * Generate cold zones for this batter
   */
  private generateColdZones(batter: Player): HitZone[] {
    // Power hitters struggle low and away
    if (batter.battingPower >= 8) {
      return [
        { zone: "low-outside", contactRate: 0.15, powerMultiplier: 0.5 },
        { zone: "high-outside", contactRate: 0.2, powerMultiplier: 0.6 }
      ];
    }

    // Contact hitters struggle inside
    if (batter.battingAccuracy >= 8) {
      return [
        { zone: "high-inside", contactRate: 0.2, powerMultiplier: 0.7 },
        { zone: "middle-inside", contactRate: 0.25, powerMultiplier: 0.75 }
      ];
    }

    // Balanced hitters struggle high and low
    return [
      { zone: "high-outside", contactRate: 0.2, powerMultiplier: 0.6 },
      { zone: "low-inside", contactRate: 0.22, powerMultiplier: 0.65 }
    ];
  }

  /**
   * Determine if batter makes contact based on timing and pitch location
   */
  public attemptContact(
    swingTiming: number, // ms from perfect timing
    ballPosition: Vector3,
    pitchType: PitchType
  ): { contact: boolean; contactQuality: number } {
    // Check timing window
    const timingQuality = this.evaluateTimingQuality(Math.abs(swingTiming));

    if (timingQuality === 0) {
      return { contact: false, contactQuality: 0 }; // Swing and miss
    }

    // Check pitch location (is it in batter's reach?)
    const zone = this.determinePitchZone(ballPosition);
    const zoneRating = this.evaluateZone(zone);

    // Pitch type difficulty (breaking balls are harder to hit)
    const pitchDifficulty = this.getPitchDifficulty(pitchType);

    // Base contact probability
    const baseContactRate = 0.3; // 30% base contact rate
    const accuracyBonus = this.batter.battingAccuracy * 0.05; // Up to +50%
    const confidenceBonus = (this.confidence - 50) / 100 * 0.1; // ±10%

    const contactProbability = Math.min(0.95,
      baseContactRate + accuracyBonus + confidenceBonus +
      zoneRating * 0.2 - pitchDifficulty * 0.15
    );

    const madeContact = Math.random() < contactProbability;

    if (!madeContact) {
      return { contact: false, contactQuality: 0 };
    }

    // Calculate contact quality (0-1)
    const contactQuality = (timingQuality + zoneRating) / 2;

    return { contact: true, contactQuality };
  }

  /**
   * Evaluate swing timing quality
   */
  private evaluateTimingQuality(timingError: number): number {
    if (timingError <= this.swingWindow.perfectEnd) {
      return 1.0; // Perfect timing
    } else if (timingError <= this.swingWindow.goodEnd) {
      // Good timing (0.7-0.99)
      const goodRange = this.swingWindow.goodEnd - this.swingWindow.perfectEnd;
      const position = timingError - this.swingWindow.perfectEnd;
      return 1.0 - (position / goodRange) * 0.3;
    } else if (timingError <= this.swingWindow.maxWindow) {
      // Okay timing (0.3-0.69)
      const okayRange = this.swingWindow.maxWindow - this.swingWindow.goodEnd;
      const position = timingError - this.swingWindow.goodEnd;
      return 0.7 - (position / okayRange) * 0.4;
    } else {
      return 0; // Missed
    }
  }

  /**
   * Determine which zone the pitch is in
   */
  private determinePitchZone(ballPosition: Vector3): string {
    const x = ballPosition.x;
    const y = ballPosition.y;

    let vertical: string;
    if (y < 1.0) vertical = "low";
    else if (y < 1.5) vertical = "middle";
    else vertical = "high";

    let horizontal: string;
    if (x < -0.3) horizontal = "inside";
    else if (x < 0.3) horizontal = "middle";
    else horizontal = "outside";

    return `${vertical}-${horizontal}`;
  }

  /**
   * Evaluate zone rating (-1 to 1)
   */
  private evaluateZone(zone: string): number {
    // Check hot zones
    const hotZone = this.hotZones.find(hz => hz.zone === zone);
    if (hotZone) {
      return hotZone.contactRate + (hotZone.powerMultiplier - 1) * 0.2;
    }

    // Check cold zones
    const coldZone = this.coldZones.find(cz => cz.zone === zone);
    if (coldZone) {
      return -(1 - coldZone.contactRate);
    }

    // Neutral zone
    return 0;
  }

  /**
   * Get pitch difficulty modifier
   */
  private getPitchDifficulty(pitchType: PitchType): number {
    switch (pitchType) {
      case PitchType.FASTBALL:
        return 0.0; // Easiest to hit
      case PitchType.CHANGEUP:
        return 0.2;
      case PitchType.SLIDER:
        return 0.3;
      case PitchType.CURVEBALL:
        return 0.4;
      case PitchType.KNUCKLEBALL:
        return 0.5; // Hardest to hit
      default:
        return 0.2;
    }
  }

  /**
   * Generate hit parameters based on contact quality and game situation
   */
  public generateHitParameters(
    contactQuality: number,
    pitchSpeed: number,
    situation: GameSituation,
    intentionalLaunchAngle?: number
  ): HitParameters {
    // Calculate exit velocity
    const exitVelocity = BallPhysics.calculateExitVelocity(
      pitchSpeed,
      this.batSpeed,
      contactQuality
    );

    // Launch angle
    let launchAngle: number;
    if (intentionalLaunchAngle !== undefined) {
      launchAngle = intentionalLaunchAngle;
    } else {
      // Situational hitting
      if (situation.outs === 0 && situation.runnersOn[2]) {
        // Runner on third, no outs - sacrifice fly
        launchAngle = 35 + Math.random() * 10;
      } else if (situation.outs === 1 && situation.runnersOn[1]) {
        // Runner on second, ground ball to right side
        launchAngle = 5 + Math.random() * 10;
      } else {
        // Optimal launch angle based on contact quality
        launchAngle = BallPhysics.getOptimalLaunchAngle(contactQuality);
      }
    }

    // Calculate spray angle (pull vs. opposite field)
    const timing = (Math.random() - 0.5) * 2; // -1 to 1
    const sprayAngle = BallPhysics.calculateSprayAngle(timing, this.batter.battingAccuracy);

    // Adjust swing speed based on situation
    let effectiveSwingSpeed = this.batSpeed;
    if (situation.outs === 2 && situation.inning >= 9) {
      // Late in game, swing harder
      effectiveSwingSpeed *= 1.1;
    }

    return {
      contactQuality,
      swingSpeed: effectiveSwingSpeed,
      launchAngle,
      sprayAngle,
      exitVelocity
    };
  }

  /**
   * Update confidence based on result
   */
  public updateConfidence(result: "hit" | "out" | "strikeout" | "walk"): void {
    switch (result) {
      case "hit":
        this.confidence = Math.min(100, this.confidence + 5);
        break;
      case "out":
        this.confidence = Math.max(0, this.confidence - 2);
        break;
      case "strikeout":
        this.confidence = Math.max(0, this.confidence - 5);
        break;
      case "walk":
        this.confidence = Math.min(100, this.confidence + 2);
        break;
    }
  }

  /**
   * Increment plate appearance counter
   */
  public plateAppearance(): void {
    this.plateAppearances++;
  }

  /**
   * Get current confidence
   */
  public getConfidence(): number {
    return this.confidence;
  }

  /**
   * Get bat speed
   */
  public getBatSpeed(): number {
    return this.batSpeed;
  }

  /**
   * Get swing window for UI display
   */
  public getSwingWindow(): SwingWindow {
    return this.swingWindow;
  }

  /**
   * Get hot zones for scouting display
   */
  public getHotZones(): HitZone[] {
    return this.hotZones;
  }

  /**
   * Get cold zones for scouting display
   */
  public getColdZones(): HitZone[] {
    return this.coldZones;
  }

  /**
   * Evaluate swing result (simplified)
   */
  public evaluateSwing(batter: any, pitchType: string, zone: number, distance: number) {
    const contact = distance < 3;
    const contactQuality = contact ? Math.max(0, 1 - (distance / 3)) : 0;

    return {
      contact,
      contactQuality,
      timing: contact ? "perfect" : "miss"
    };
  }
}
