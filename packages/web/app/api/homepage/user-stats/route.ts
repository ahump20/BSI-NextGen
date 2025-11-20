import { NextRequest, NextResponse } from 'next/server';
import type { UserStatsResponse, UserStats, Achievement } from '@bsi/shared';

/**
 * GET /api/homepage/user-stats
 *
 * Fetches gamification stats for the authenticated user
 * - Experience points and level
 * - Daily streak
 * - Achievements
 * - Rank/tier
 *
 * Query params:
 * - userId: string (optional) - User ID to fetch stats for (defaults to current user)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId') || 'guest';

    // TODO: Integrate with auth system to get actual user ID
    // For now, return mock data with realistic progression

    // Calculate rank based on XP
    const xp = 1250;
    const rank = getRank(xp);
    const nextLevel = getNextLevelXP(xp);
    const level = getLevel(xp);

    const achievements: Achievement[] = [
      {
        id: 'ach-1',
        name: 'First Login',
        description: 'Welcome to Blaze Sports Intel!',
        icon: '🎯',
        unlockedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        rarity: 'common',
      },
      {
        id: 'ach-2',
        name: 'Diamond Eyes',
        description: 'Viewed 100 college baseball games',
        icon: '⚾',
        unlockedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        rarity: 'rare',
      },
      {
        id: 'ach-3',
        name: 'Streak Master',
        description: 'Maintained a 7-day login streak',
        icon: '🔥',
        unlockedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        rarity: 'epic',
      },
    ];

    const stats: UserStats = {
      userId,
      rank,
      xp,
      nextLevel,
      streak: 4,
      achievements,
      level,
    };

    const response: UserStatsResponse = {
      stats,
      cached: false,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'private, max-age=300', // Cache for 5 minutes
      },
    });
  } catch (error) {
    console.error('[User Stats API] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch user stats',
        stats: null,
        cached: false,
        lastUpdated: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * Helper functions for gamification
 */

function getLevel(xp: number): number {
  // Every 500 XP = 1 level
  return Math.floor(xp / 500) + 1;
}

function getRank(xp: number): string {
  if (xp < 500) return 'Rookie Scout';
  if (xp < 1000) return 'Junior Analyst';
  if (xp < 2000) return 'Varsity Scout';
  if (xp < 3500) return 'Senior Analyst';
  if (xp < 5000) return 'All-American';
  if (xp < 7500) return 'Elite Scout';
  if (xp < 10000) return 'Pro Analyst';
  return 'Hall of Famer';
}

function getNextLevelXP(xp: number): number {
  const currentLevel = getLevel(xp);
  return currentLevel * 500;
}

/**
 * POST /api/homepage/user-stats
 *
 * Updates user stats (e.g., increment XP, update streak)
 *
 * Body:
 * - action: 'increment_xp' | 'update_streak' | 'unlock_achievement'
 * - value: number | string (depends on action)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, value } = body;

    // TODO: Implement actual database updates
    // For now, return success response

    return NextResponse.json({
      success: true,
      message: `Action ${action} completed successfully`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[User Stats API] POST Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update user stats',
      },
      { status: 500 }
    );
  }
}
