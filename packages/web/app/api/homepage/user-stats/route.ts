import { NextRequest, NextResponse } from 'next/server';
import type { UserStatsResponse, UserStats, Achievement } from '@bsi/shared';
import { verifyJWT } from '@bsi/api';

/**
 * GET /api/homepage/user-stats
 *
 * Fetches gamification stats for the AUTHENTICATED user
 * - Checks JWT session cookie
 * - Returns personalized stats for logged-in users
 * - Falls back to guest stats if not authenticated
 *
 * Query params:
 * - userId: string (optional) - User ID to fetch stats for (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const requestedUserId = searchParams.get('userId');

    // Try to get authenticated user from session cookie
    let userId = 'guest';
    let isAuthenticated = false;

    const sessionToken = request.cookies.get('bsi_session')?.value;

    if (sessionToken) {
      try {
        const user = await verifyJWT(sessionToken, {
          secret: process.env.JWT_SECRET || 'dev-secret-key',
          issuer: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          audience: 'bsi-web',
        });

        if (user) {
          userId = user.id || user.sub || 'guest';
          isAuthenticated = true;
        }
      } catch (error) {
        console.warn('[User Stats] Invalid session token:', error);
        // Continue as guest user
      }
    }

    // If userId is explicitly requested and doesn't match auth user, deny (unless admin)
    if (requestedUserId && requestedUserId !== userId) {
      // In production, check for admin role here
      // For now, deny access
      return NextResponse.json(
        { error: 'Unauthorized - can only access own stats' },
        { status: 403 }
      );
    }

    // Fetch or calculate user stats
    // In production, this would query a database like Supabase or Cloudflare D1
    const xp = isAuthenticated ? getUserXP(userId) : 0;
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

function getUserXP(userId: string): number {
  // In production, fetch from database
  // For now, generate consistent XP based on userId hash
  if (userId === 'guest') return 0;

  // Simple hash to generate consistent XP for demo
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash = hash & hash;
  }

  // Return XP between 0 and 10000
  return Math.abs(hash % 10000) + 250;
}

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
 * Updates user stats (REQUIRES AUTHENTICATION)
 * - increment_xp: Add XP points
 * - update_streak: Update daily login streak
 * - unlock_achievement: Grant achievement
 *
 * Body:
 * - action: 'increment_xp' | 'update_streak' | 'unlock_achievement'
 * - value: number | string (depends on action)
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication for POST operations
    const sessionToken = request.cookies.get('bsi_session')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    let userId: string;
    try {
      const user = await verifyJWT(sessionToken, {
        secret: process.env.JWT_SECRET || 'dev-secret-key',
        issuer: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        audience: 'bsi-web',
      });

      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Invalid session' },
          { status: 401 }
        );
      }

      userId = user.userId || user.sub || '';
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid session token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, value } = body;

    // Validate input
    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action is required' },
        { status: 400 }
      );
    }

    // In production, update database here (Cloudflare D1, Supabase, etc.)
    // For now, return success response
    console.log(`[User Stats] ${userId} - ${action}:`, value);

    return NextResponse.json({
      success: true,
      message: `Action ${action} completed successfully`,
      userId,
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
