/**
 * PitcherSystem.ts
 * Complete pitching mechanics with:
 * - Multiple pitch types with unique trajectories
 * - Pitch sequencing AI
 * - Fatigue system
 * - Control/location targeting
 * - Hot/cold zones
 */

import { Vector3 } from "@babylonjs/core";
import { PitchType, PitchParameters, BallPhysics } from "../physics/BallPhysics";
import { Player } from "../core/GameEngine";

export interface PitchRepertoire {
  pitchType: PitchType;
  velocity: number; // base velocity in mph
  controlRating: number; // 1-10
  usage: number; // percentage of time used
}

export interface PitchSequenceContext {
  currentCount: { balls: number; strikes: number };
  previousPitch: PitchType | null;
  batterTendencies: {
    pullHitter: boolean;
    chaseSlider: boolean;
    weakVsOffspeed: boolean;
  };
}

export class PitcherSystem {
  private pitcher: Player;
  private repertoire: PitchRepertoire[];
  private fatigue: number = 0; // 0-100
  private pitchCount: number = 0;
  private confidenceZones: Map<string, number> = new Map(); // Zone → confidence

  constructor(pitcher: Player) {
    this.pitcher = pitcher;
    this.repertoire = this.generateRepertoire(pitcher);
    this.initializeConfidenceZones();
  }

  /**
   * Generate pitch repertoire based on pitcher stats
   */
  private generateRepertoire(pitcher: Player): PitchRepertoire[] {
    const repertoire: PitchRepertoire[] = [];

    // All pitchers have a fastball
    repertoire.push({
      pitchType: PitchType.FASTBALL,
      velocity: 60 + pitcher.pitchSpeed * 4, // 64-100 mph
      controlRating: pitcher.pitchControl,
      usage: 0.5 // 50% fastballs
    });

    // Add secondary pitches based on skill level
    if (pitcher.pitchSpeed >= 6) {
      // Good pitchers get a curveball
      repertoire.push({
        pitchType: PitchType.CURVEBALL,
        velocity: 50 + pitcher.pitchSpeed * 3,
        controlRating: Math.max(1, pitcher.pitchControl - 2),
        usage: 0.25
      });
    }

    if (pitcher.pitchControl >= 7) {
      // Control pitchers get a slider
      repertoire.push({
        pitchType: PitchType.SLIDER,
        velocity: 55 + pitcher.pitchSpeed * 3.5,
        controlRating: pitcher.pitchControl,
        usage: 0.15
      });
    }

    if (pitcher.pitchSpeed <= 6 && pitcher.pitchControl >= 6) {
      // Crafty pitchers get a changeup
      repertoire.push({
        pitchType: PitchType.CHANGEUP,
        velocity: 50 + pitcher.pitchSpeed * 2.5,
        controlRating: pitcher.pitchControl,
        usage: 0.1
      });
    }

    // Normalize usage percentages
    const totalUsage = repertoire.reduce((sum, p) => sum + p.usage, 0);
    repertoire.forEach(p => p.usage = p.usage / totalUsage);

    return repertoire;
  }

  /**
   * Initialize confidence zones (strike zone divided into 9 zones)
   */
  private initializeConfidenceZones(): void {
    const zones = [
      "top-left", "top-center", "top-right",
      "middle-left", "middle-center", "middle-right",
      "bottom-left", "bottom-center", "bottom-right"
    ];

    zones.forEach(zone => {
      // Higher control = higher confidence in all zones
      const baseConfidence = this.pitcher.pitchControl * 10; // 10-100%
      const variance = (Math.random() - 0.5) * 20;
      this.confidenceZones.set(zone, Math.max(20, Math.min(95, baseConfidence + variance)));
    });
  }

  /**
   * Select next pitch based on game context
   */
  public selectPitch(context: PitchSequenceContext): PitchType {
    const { currentCount, previousPitch, batterTendencies } = context;

    // Fastball counts (0-0, 1-0, 2-0, 3-0, 3-1)
    if (
      (currentCount.balls === 0 && currentCount.strikes === 0) ||
      currentCount.balls >= 2
    ) {
      if (Math.random() < 0.8) return PitchType.FASTBALL;
    }

    // Strikeout pitch (0-2, 1-2, 2-2)
    if (currentCount.strikes === 2) {
      // Avoid fastball, go with best off-speed
      const offspeed = this.repertoire.filter(p => p.pitchType !== PitchType.FASTBALL);
      if (offspeed.length > 0) {
        const bestOffspeed = offspeed.sort((a, b) => b.controlRating - a.controlRating)[0];
        return bestOffspeed.pitchType;
      }
    }

    // Exploit batter tendencies
    if (batterTendencies.chaseSlider) {
      const slider = this.repertoire.find(p => p.pitchType === PitchType.SLIDER);
      if (slider && Math.random() < 0.6) return slider.pitchType;
    }

    if (batterTendencies.weakVsOffspeed) {
      const changeup = this.repertoire.find(p => p.pitchType === PitchType.CHANGEUP);
      if (changeup && Math.random() < 0.5) return changeup.pitchType;
    }

    // Avoid repeating same pitch twice in a row
    const available = this.repertoire.filter(p => p.pitchType !== previousPitch);

    // Weighted random selection
    const totalWeight = available.reduce((sum, p) => sum + p.usage, 0);
    let random = Math.random() * totalWeight;

    for (const pitch of available) {
      random -= pitch.usage;
      if (random <= 0) return pitch.pitchType;
    }

    return PitchType.FASTBALL; // Fallback
  }

  /**
   * Select target location in strike zone
   */
  public selectTarget(
    pitchType: PitchType,
    count: { balls: number; strikes: number }
  ): Vector3 {
    // Strike zone boundaries (relative to plate)
    const strikeZone = {
      xMin: -0.43, // 17 inches wide (plate width)
      xMax: 0.43,
      yMin: 0.5, // knees
      yMax: 1.8, // chest
      z: 0 // plate depth
    };

    // Pitching strategy based on count
    let targetZone: string;

    if (count.balls >= 2) {
      // Avoid walking, pitch in strike zone
      targetZone = "middle-center";
    } else if (count.strikes === 2) {
      // Strikeout pitch - edges of zone or just outside
      const edgeZones = ["top-left", "top-right", "bottom-left", "bottom-right"];
      targetZone = edgeZones[Math.floor(Math.random() * edgeZones.length)];
    } else {
      // Work the corners
      const zones = Object.keys(this.confidenceZones);
      targetZone = zones[Math.floor(Math.random() * zones.length)];
    }

    // Convert zone to coordinates
    const target = this.zoneToCoordinates(targetZone, strikeZone);

    // Apply control variance
    const pitch = this.repertoire.find(p => p.pitchType === pitchType)!;
    const controlVariance = (11 - pitch.controlRating) * 0.08;
    const fatigueEffect = this.fatigue / 100 * 0.05;

    target.x += (Math.random() - 0.5) * (controlVariance + fatigueEffect);
    target.y += (Math.random() - 0.5) * (controlVariance + fatigueEffect);

    return target;
  }

  /**
   * Convert zone name to 3D coordinates
   */
  private zoneToCoordinates(
    zone: string,
    strikeZone: { xMin: number; xMax: number; yMin: number; yMax: number; z: number }
  ): Vector3 {
    const xRanges = {
      left: [strikeZone.xMin, strikeZone.xMin + (strikeZone.xMax - strikeZone.xMin) / 3],
      center: [strikeZone.xMin + (strikeZone.xMax - strikeZone.xMin) / 3, strikeZone.xMax - (strikeZone.xMax - strikeZone.xMin) / 3],
      right: [strikeZone.xMax - (strikeZone.xMax - strikeZone.xMin) / 3, strikeZone.xMax]
    };

    const yRanges = {
      top: [strikeZone.yMax - (strikeZone.yMax - strikeZone.yMin) / 3, strikeZone.yMax],
      middle: [strikeZone.yMin + (strikeZone.yMax - strikeZone.yMin) / 3, strikeZone.yMax - (strikeZone.yMax - strikeZone.yMin) / 3],
      bottom: [strikeZone.yMin, strikeZone.yMin + (strikeZone.yMax - strikeZone.yMin) / 3]
    };

    const [yPos, xPos] = zone.split("-") as [keyof typeof yRanges, keyof typeof xRanges];

    const xRange = xRanges[xPos];
    const yRange = yRanges[yPos];

    return new Vector3(
      xRange[0] + Math.random() * (xRange[1] - xRange[0]),
      yRange[0] + Math.random() * (yRange[1] - yRange[0]),
      strikeZone.z
    );
  }

  /**
   * Generate pitch parameters
   */
  public generatePitch(
    pitchType: PitchType,
    releasePoint: Vector3,
    targetPoint: Vector3
  ): PitchParameters {
    const pitch = this.repertoire.find(p => p.pitchType === pitchType);
    if (!pitch) throw new Error(`Pitch type ${pitchType} not in repertoire`);

    // Apply fatigue to velocity
    const fatigueMultiplier = 1 - (this.fatigue / 100) * 0.15; // Max 15% reduction
    const velocity = pitch.velocity * fatigueMultiplier;

    // Spin determined by pitch type (handled in BallPhysics)
    const spin = Vector3.Zero(); // Will be overridden by pitch type

    return {
      velocity,
      spin,
      releasePoint,
      targetPoint,
      type: pitchType
    };
  }

  /**
   * Increment pitch count and fatigue
   */
  public throwPitch(): void {
    this.pitchCount++;

    // Fatigue accumulates faster after 60 pitches
    if (this.pitchCount <= 60) {
      this.fatigue += 0.5;
    } else {
      this.fatigue += 1.5;
    }

    this.fatigue = Math.min(100, this.fatigue);
  }

  /**
   * Get current fatigue level
   */
  public getFatigue(): number {
    return this.fatigue;
  }

  /**
   * Get pitch count
   */
  public getPitchCount(): number {
    return this.pitchCount;
  }

  /**
   * Get available pitch types
   */
  public getRepertoire(): PitchRepertoire[] {
    return this.repertoire;
  }
}
