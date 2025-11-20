import { Metadata } from 'next';
import { MMIDashboard } from '@/components/sports/mlb/MMIDashboard';

// Configure for Cloudflare Edge Runtime
export const runtime = 'edge';

interface PageProps {
  params: {
    gameId: string;
  };
  searchParams: {
    role?: 'pitcher' | 'batter';
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: `Game ${params.gameId} - Mental Demand Analysis | Blaze Sports Intel`,
    description: `Comprehensive mental demand analytics (MMI) for MLB game ${params.gameId}. Analyze pitcher and batter stress, high-leverage moments, and fatigue metrics.`,
  };
}

/**
 * MLB Game MMI Analysis Page
 *
 * Displays comprehensive mental demand analytics for a specific MLB game.
 *
 * Features:
 * - Dual perspective (pitcher and batter MMI)
 * - Top 5 highest-MMI moments
 * - Player summaries
 * - Component breakdowns
 *
 * URL: /sports/mlb/games/[gameId]/mmi
 * Query Params: ?role=pitcher|batter
 */
export default function GameMMIPage({ params, searchParams }: PageProps) {
  const role = searchParams.role || 'pitcher';

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <a href="/sports/mlb" className="hover:text-blue-600">
            MLB
          </a>
          <span>/</span>
          <a href="/sports/mlb/games" className="hover:text-blue-600">
            Games
          </a>
          <span>/</span>
          <span className="text-gray-900 font-medium">Game {params.gameId}</span>
          <span>/</span>
          <span className="text-gray-900 font-medium">MMI Analysis</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Mental Demand Analysis
        </h1>

        <p className="text-gray-600 max-w-3xl">
          Comprehensive analysis of psychological stress and mental demand throughout the game.
          The Moment Mentality Index (MMI) quantifies mental load across five key components:
          leverage, pressure, fatigue, execution difficulty, and bio-proxies.
        </p>
      </header>

      {/* Role Toggle */}
      <div className="mb-6">
        <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-white">
          <a
            href={`/sports/mlb/games/${params.gameId}/mmi?role=pitcher`}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              role === 'pitcher'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Pitcher Perspective
          </a>
          <a
            href={`/sports/mlb/games/${params.gameId}/mmi?role=batter`}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              role === 'batter'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Batter Perspective
          </a>
        </div>
      </div>

      {/* MMI Dashboard */}
      <MMIDashboard gameId={params.gameId} role={role} />

      {/* Educational Section */}
      <section className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-blue-900 mb-4">Understanding MMI</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h3 className="font-semibold text-blue-800 mb-2">What is MMI?</h3>
            <p className="text-blue-700">
              The Moment Mentality Index quantifies the mental demand placed on players during
              each pitch. Unlike traditional statistics that focus on outcomes, MMI measures the
              psychological stress of the situation itself.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-blue-800 mb-2">How is it calculated?</h3>
            <p className="text-blue-700">
              MMI combines five z-normalized components with weighted importance: Leverage Index
              (35%), Pressure Score (20%), Fatigue (20%), Execution Difficulty (15%), and
              Bio-Proxies (10%). Values typically range from 0-5, with 2+ indicating high mental
              demand.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-blue-800 mb-2">Why does it matter?</h3>
            <p className="text-blue-700">
              Mental demand affects performance, injury risk, and long-term player development.
              Teams can use MMI to manage workload, identify clutch performers, and optimize
              bullpen usage.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-blue-800 mb-2">What's unique about BSI?</h3>
            <p className="text-blue-700">
              ESPN and other platforms don't quantify mental demand across these dimensions. BSI's
              MMI analytics provide insights no one else offers, filling a genuine gap in baseball
              coverage.
            </p>
          </div>
        </div>
      </section>

      {/* Related Links */}
      <footer className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3">Related Analytics</h3>
        <div className="flex flex-wrap gap-3">
          <a
            href={`/sports/mlb/games/${params.gameId}`}
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
          >
            ← Back to Game Details
          </a>
          <a
            href="/sports/mlb/mmi/high-leverage"
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
          >
            High-Leverage Moments Across MLB
          </a>
          <a
            href="/sports/mlb/analytics"
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
          >
            More MLB Analytics
          </a>
        </div>
      </footer>
    </div>
  );
}
