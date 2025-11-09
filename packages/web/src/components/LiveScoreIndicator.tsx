'use client';

import { useLiveScores } from '@/hooks/useLiveScores';

interface LiveScoreIndicatorProps {
  sport?: string;
}

export function LiveScoreIndicator({ sport = 'college-baseball' }: LiveScoreIndicatorProps) {
  const { isConnected, liveGames, lastUpdate, error } = useLiveScores(sport);

  if (error) {
    return (
      <div className="fixed bottom-4 right-4 z-40 bg-red-900 border border-red-700 text-white px-4 py-3 rounded-lg shadow-lg max-w-sm">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚠️</span>
          <div>
            <div className="font-medium">Connection Error</div>
            <div className="text-sm text-red-200">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="fixed bottom-4 right-4 z-40 bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-lg shadow-lg">
        <div className="flex items-center gap-2">
          <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent"></div>
          <span className="text-sm">Connecting to live scores...</span>
        </div>
      </div>
    );
  }

  if (liveGames.length === 0) {
    return (
      <div className="fixed bottom-4 right-4 z-40 bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-lg shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm">Live scores connected • No live games</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 bg-gray-900 border-2 border-green-500 text-white rounded-lg shadow-2xl max-w-md">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-2 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="font-bold text-sm">LIVE SCORES</span>
          </div>
          {lastUpdate && (
            <span className="text-xs text-green-100">
              {new Date(lastUpdate).toLocaleTimeString('en-US', {
                timeZone: 'America/Chicago',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
          )}
        </div>
      </div>

      {/* Games */}
      <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
        {liveGames.map((game) => (
          <div
            key={game.gameId}
            className="bg-gray-800 rounded-lg p-3 border border-gray-700 hover:border-green-500 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-green-400 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                LIVE {game.inning ? `- Inning ${game.inning}` : ''}
              </span>
            </div>

            {/* Away Team */}
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">{game.awayTeam}</span>
              <span className="text-lg font-bold">{game.awayScore}</span>
            </div>

            {/* Home Team */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{game.homeTeam}</span>
              <span className="text-lg font-bold">{game.homeScore}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="bg-gray-800 px-4 py-2 rounded-b-lg border-t border-gray-700">
        <p className="text-xs text-gray-400 text-center">
          Updates every 5 seconds • {liveGames.length} live {liveGames.length === 1 ? 'game' : 'games'}
        </p>
      </div>
    </div>
  );
}
