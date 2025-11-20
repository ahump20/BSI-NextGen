import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GameMMIResponse, isMMIError } from '@bsi/shared';

/**
 * MMI Service URL from environment
 * Default to localhost for development
 */
const MMI_SERVICE_URL = process.env.MMI_SERVICE_URL || 'http://localhost:8001';

/**
 * Request parameter validation schema
 */
const GameMMIParamsSchema = z.object({
  gameId: z.string().regex(/^\d+$/, 'Game ID must be numeric'),
  role: z.enum(['pitcher', 'batter']).optional().default('pitcher'),
  season: z.coerce.number().min(2020).max(2030).optional(),
});

/**
 * GET /api/sports/mlb/mmi/games/[gameId]
 *
 * Fetches MMI (Moment Mentality Index) data for a specific MLB game.
 *
 * Query Parameters:
 * - role: 'pitcher' | 'batter' (default: 'pitcher')
 * - season: number (optional, defaults to year from game date)
 *
 * Response: GameMMIResponse
 * - game_id: MLB game ID
 * - pitches: Array of pitch-level MMI data
 * - player_summaries: Aggregated player statistics
 * - meta: Data source and timestamp metadata
 *
 * Example:
 * GET /api/sports/mlb/mmi/games/663471?role=pitcher
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  try {
    // Parse and validate request parameters
    const searchParams = request.nextUrl.searchParams;
    const validated = GameMMIParamsSchema.parse({
      gameId: params.gameId,
      role: searchParams.get('role') || 'pitcher',
      season: searchParams.get('season') || undefined,
    });

    // Build URL for MMI service
    const url = new URL(`${MMI_SERVICE_URL}/games/${validated.gameId}/mmi`);
    url.searchParams.set('role', validated.role);
    if (validated.season) {
      url.searchParams.set('season', validated.season.toString());
    }

    console.log('[MMI API] Fetching game MMI:', {
      gameId: validated.gameId,
      role: validated.role,
      season: validated.season,
      url: url.toString(),
    });

    // Call MMI Python service with timeout
    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'BSI-NextGen/1.0',
      },
      signal: AbortSignal.timeout(30000), // 30s timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[MMI API] Service error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });

      return NextResponse.json(
        {
          error: `MMI service error: ${response.statusText}`,
          details: errorText,
          timestamp: new Date().toISOString(),
        },
        { status: response.status }
      );
    }

    const data = await response.json() as GameMMIResponse;

    // Check if response is an error
    if (isMMIError(data)) {
      console.error('[MMI API] Service returned error:', data);
      return NextResponse.json(data, { status: 500 });
    }

    // Enrich metadata with BSI information
    const enrichedData: GameMMIResponse = {
      ...data,
      meta: {
        ...data.meta,
        dataSource: 'MMI Package v0.1.0 via BSI API',
        apiVersion: 'v1',
        timezone: 'America/Chicago',
      },
    };

    console.log('[MMI API] Success:', {
      gameId: validated.gameId,
      pitchCount: enrichedData.pitches.length,
      playerCount: enrichedData.player_summaries.length,
    });

    // Determine cache strategy based on game status
    // TODO: Check if game is completed for longer cache
    const cacheControl = 'public, max-age=300, s-maxage=600'; // 5min browser, 10min CDN

    return NextResponse.json(enrichedData, {
      headers: {
        'Cache-Control': cacheControl,
        'X-Data-Source': 'MMI-Python-Service',
        'X-Game-ID': validated.gameId,
      },
    });
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      console.error('[MMI API] Validation error:', error.errors);
      return NextResponse.json(
        {
          error: 'Invalid request parameters',
          details: error.errors,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Handle fetch errors (timeout, network, etc.)
    if (error instanceof Error) {
      console.error('[MMI API] Fetch error:', {
        message: error.message,
        name: error.name,
      });

      // Check for timeout
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        return NextResponse.json(
          {
            error: 'MMI service timeout',
            message: 'Request took longer than 30 seconds',
            timestamp: new Date().toISOString(),
          },
          { status: 504 }
        );
      }

      // Check for connection error
      if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
        return NextResponse.json(
          {
            error: 'MMI service unavailable',
            message: 'Could not connect to MMI service. Please ensure it is running.',
            serviceUrl: MMI_SERVICE_URL,
            timestamp: new Date().toISOString(),
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        {
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    // Unknown error
    console.error('[MMI API] Unknown error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
