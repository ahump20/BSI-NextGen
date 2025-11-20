import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { HighMMISearchResponse, isMMIError } from '@bsi/shared';

// Configure for Cloudflare Edge Runtime
export const runtime = 'edge';

const MMI_SERVICE_URL = process.env.MMI_SERVICE_URL || 'http://localhost:8001';

/**
 * Request parameter validation schema
 */
const HighMMISearchSchema = z.object({
  threshold: z.coerce.number().min(0).max(10).optional().default(2.0),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  teamId: z.string().regex(/^\d+$/).optional(),
  playerId: z.string().regex(/^\d+$/).optional(),
  season: z.coerce.number().min(2020).max(2030).optional(),
});

/**
 * GET /api/sports/mlb/mmi/high-leverage
 *
 * Search for high-MMI moments across games.
 *
 * Query Parameters:
 * - threshold: number (default: 2.0) - Minimum MMI value
 * - limit: number (default: 50, max: 100) - Maximum results to return
 * - startDate: string (YYYY-MM-DD) - Filter by start date
 * - endDate: string (YYYY-MM-DD) - Filter by end date
 * - teamId: string - Filter by MLB team ID
 * - playerId: string - Filter by MLB player ID
 * - season: number - Filter by season year
 *
 * Response: HighMMISearchResponse
 * - moments: Array of high-MMI pitch events with context
 * - params: Search parameters used
 * - meta: Data source and timestamp metadata
 *
 * Examples:
 * GET /api/sports/mlb/mmi/high-leverage?threshold=3.0&limit=10
 * GET /api/sports/mlb/mmi/high-leverage?teamId=138&season=2024
 * GET /api/sports/mlb/mmi/high-leverage?playerId=592332&threshold=2.5
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse and validate query parameters
    const validated = HighMMISearchSchema.parse({
      threshold: searchParams.get('threshold') || 2.0,
      limit: searchParams.get('limit') || 50,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      teamId: searchParams.get('teamId') || undefined,
      playerId: searchParams.get('playerId') || undefined,
      season: searchParams.get('season') || undefined,
    });

    // Build URL for MMI service
    const url = new URL(`${MMI_SERVICE_URL}/search/high-mmi`);

    // Add all validated parameters to query string
    Object.entries(validated).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, value.toString());
      }
    });

    console.log('[MMI High-Leverage API] Search parameters:', {
      threshold: validated.threshold,
      limit: validated.limit,
      filters: {
        dateRange: validated.startDate && validated.endDate
          ? `${validated.startDate} to ${validated.endDate}`
          : 'All dates',
        teamId: validated.teamId || 'All teams',
        playerId: validated.playerId || 'All players',
        season: validated.season || 'All seasons',
      },
      url: url.toString(),
    });

    // Call MMI Python service
    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'BSI-NextGen/1.0',
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[MMI High-Leverage API] Service error:', {
        status: response.status,
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

    const data = await response.json() as HighMMISearchResponse;

    if (isMMIError(data)) {
      console.error('[MMI High-Leverage API] Service returned error:', data);
      return NextResponse.json(data, { status: 500 });
    }

    console.log('[MMI High-Leverage API] Success:', {
      momentCount: data.moments.length,
      threshold: validated.threshold,
      filters: validated,
    });

    // Shorter cache for search results (data changes frequently)
    const cacheControl = 'public, max-age=60, s-maxage=120'; // 1min browser, 2min CDN

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': cacheControl,
        'X-Data-Source': 'MMI-Python-Service',
        'X-Search-Threshold': validated.threshold.toString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[MMI High-Leverage API] Validation error:', error.issues);
      return NextResponse.json(
        {
          error: 'Invalid search parameters',
          details: error.issues,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      console.error('[MMI High-Leverage API] Error:', {
        message: error.message,
        name: error.name,
      });

      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        return NextResponse.json(
          {
            error: 'Search timeout',
            message: 'Search took longer than 30 seconds',
            timestamp: new Date().toISOString(),
          },
          { status: 504 }
        );
      }

      if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
        return NextResponse.json(
          {
            error: 'MMI service unavailable',
            message: 'Could not connect to MMI service',
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

    console.error('[MMI High-Leverage API] Unknown error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
