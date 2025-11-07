/**
 * UnlockSystem.ts
 * Defines unlock conditions and manages progression rewards
 */

import { PlayerProgress } from "../api/progression";
import { UNLOCKABLE_CHARACTERS } from "../data/characters";
import { STADIUMS } from "../data/stadiums";

export interface UnlockCondition {
  type: "level" | "games" | "wins" | "homeRuns" | "totalRuns";
  threshold: number;
  description: string;
}

export interface UnlockReward {
  id: string;
  name: string;
  type: "character" | "stadium";
  conditions: UnlockCondition[];
  rarity: "common" | "rare" | "epic" | "legendary";
}

/**
 * Character unlock definitions
 */
export const CHARACTER_UNLOCKS: UnlockReward[] = [
  {
    id: "char_secret_001",
    name: "Comet Carter",
    type: "character",
    rarity: "legendary",
    conditions: [
      { type: "level", threshold: 50, description: "Reach Level 50" },
      { type: "wins", threshold: 100, description: "Win 100 games" }
    ]
  },
  {
    id: "char_secret_002",
    name: "Blaze (Dog)",
    type: "character",
    rarity: "epic",
    conditions: [
      { type: "level", threshold: 25, description: "Reach Level 25" },
      { type: "homeRuns", threshold: 50, description: "Hit 50 home runs" }
    ]
  }
];

/**
 * Stadium unlock definitions
 */
export const STADIUM_UNLOCKS: UnlockReward[] = [
  {
    id: "stadium_002",
    name: "Frostbite Field",
    type: "stadium",
    rarity: "rare",
    conditions: [
      { type: "level", threshold: 10, description: "Reach Level 10" }
    ]
  },
  {
    id: "stadium_003",
    name: "Treehouse Park",
    type: "stadium",
    rarity: "rare",
    conditions: [
      { type: "games", threshold: 25, description: "Play 25 games" }
    ]
  },
  {
    id: "stadium_004",
    name: "Rooftop Rally",
    type: "stadium",
    rarity: "epic",
    conditions: [
      { type: "wins", threshold: 50, description: "Win 50 games" }
    ]
  },
  {
    id: "stadium_005",
    name: "Beach Bash",
    type: "stadium",
    rarity: "legendary",
    conditions: [
      { type: "level", threshold: 40, description: "Reach Level 40" },
      { type: "totalRuns", threshold: 500, description: "Score 500 total runs" }
    ]
  }
];

/**
 * Check if all conditions for an unlock are met
 */
export function checkUnlockConditions(
  unlock: UnlockReward,
  progress: PlayerProgress
): boolean {
  return unlock.conditions.every(condition => {
    switch (condition.type) {
      case "level":
        return progress.currentLevel >= condition.threshold;
      case "games":
        return progress.gamesPlayed >= condition.threshold;
      case "wins":
        return progress.wins >= condition.threshold;
      case "homeRuns":
        return progress.totalHomeRuns >= condition.threshold;
      case "totalRuns":
        return progress.totalRuns >= condition.threshold;
      default:
        return false;
    }
  });
}

/**
 * Get all newly unlocked rewards based on player progress
 */
export function getNewUnlocks(progress: PlayerProgress): {
  characters: UnlockReward[];
  stadiums: UnlockReward[];
} {
  const unlockedCharacterIds = progress.unlockedCharacters || [];
  const unlockedStadiumIds = progress.unlockedStadiums || [];

  // Check for new character unlocks
  const newCharacters = CHARACTER_UNLOCKS.filter(
    unlock =>
      !unlockedCharacterIds.includes(unlock.id) &&
      checkUnlockConditions(unlock, progress)
  );

  // Check for new stadium unlocks
  const newStadiums = STADIUM_UNLOCKS.filter(
    unlock =>
      !unlockedStadiumIds.includes(unlock.id) &&
      checkUnlockConditions(unlock, progress)
  );

  return {
    characters: newCharacters,
    stadiums: newStadiums
  };
}

/**
 * Get progress towards a specific unlock
 */
export function getUnlockProgress(
  unlock: UnlockReward,
  progress: PlayerProgress
): Array<{ condition: UnlockCondition; current: number; percentage: number }> {
  return unlock.conditions.map(condition => {
    let current = 0;

    switch (condition.type) {
      case "level":
        current = progress.currentLevel;
        break;
      case "games":
        current = progress.gamesPlayed;
        break;
      case "wins":
        current = progress.wins;
        break;
      case "homeRuns":
        current = progress.totalHomeRuns;
        break;
      case "totalRuns":
        current = progress.totalRuns;
        break;
    }

    const percentage = Math.min(100, (current / condition.threshold) * 100);

    return { condition, current, percentage };
  });
}

/**
 * Get next achievable unlock for the player
 */
export function getNextUnlock(
  progress: PlayerProgress
): UnlockReward | null {
  const unlockedCharacterIds = progress.unlockedCharacters || [];
  const unlockedStadiumIds = progress.unlockedStadiums || [];

  const allUnlocks = [...CHARACTER_UNLOCKS, ...STADIUM_UNLOCKS];

  // Filter out already unlocked items
  const availableUnlocks = allUnlocks.filter(unlock => {
    if (unlock.type === "character") {
      return !unlockedCharacterIds.includes(unlock.id);
    } else {
      return !unlockedStadiumIds.includes(unlock.id);
    }
  });

  if (availableUnlocks.length === 0) return null;

  // Sort by closest to completion
  const sorted = availableUnlocks
    .map(unlock => {
      const progressArray = getUnlockProgress(unlock, progress);
      const avgPercentage =
        progressArray.reduce((sum, p) => sum + p.percentage, 0) /
        progressArray.length;
      return { unlock, avgPercentage };
    })
    .sort((a, b) => b.avgPercentage - a.avgPercentage);

  return sorted[0].unlock;
}

/**
 * Calculate XP required for next level
 */
export function getXPForLevel(level: number): number {
  // XP curve: 100 * level^1.5
  return Math.floor(100 * Math.pow(level, 1.5));
}

/**
 * Calculate total XP required to reach a level
 */
export function getTotalXPForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += getXPForLevel(i);
  }
  return total;
}

/**
 * Get current level from total XP
 */
export function getLevelFromXP(xp: number): number {
  let level = 1;
  let requiredXP = 0;

  while (xp >= requiredXP) {
    requiredXP += getXPForLevel(level);
    if (xp >= requiredXP) {
      level++;
    }
  }

  return level;
}

/**
 * Get XP reward for a game result
 */
export function calculateGameXP(result: {
  won: boolean;
  runsScored: number;
  hitsRecorded: number;
  homeRunsHit: number;
}): number {
  let xp = 50; // Base XP for completing a game

  // Win bonus
  if (result.won) {
    xp += 100;
  } else {
    xp += 25; // Participation XP for loss
  }

  // Performance bonuses
  xp += result.runsScored * 5;
  xp += result.hitsRecorded * 3;
  xp += result.homeRunsHit * 10;

  return xp;
}

/**
 * Format rarity for display
 */
export function getRarityColor(rarity: UnlockReward["rarity"]): string {
  switch (rarity) {
    case "legendary":
      return "#fbbf24"; // Gold
    case "epic":
      return "#a855f7"; // Purple
    case "rare":
      return "#3b82f6"; // Blue
    case "common":
      return "#6b7280"; // Gray
  }
}
