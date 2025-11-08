'use client';

import type { D1BaseballRanking } from '@bsi/shared';

interface D1BaseballRankingsProps {
  rankings: D1BaseballRanking[];
}

export function D1BaseballRankings({ rankings }: D1BaseballRankingsProps) {
  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-blaze-orange">Top 25 Rankings</h2>
        <span className="text-xs text-gray-500">Updated Live</span>
      </div>

      <div className="space-y-2">
        {rankings.map((ranking) => (
          <div
            key={ranking.rank}
            className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
          >
            <div className="flex items-center gap-4 flex-1">
              {/* Rank */}
              <div className="flex flex-col items-center min-w-[60px]">
                <span className="text-2xl font-bold text-blaze-orange">
                  {ranking.rank}
                </span>
                {ranking.trend && (
                  <div className="flex items-center gap-1 text-xs">
                    {ranking.trend === 'up' && (
                      <span className="text-green-400">↑ {ranking.previousRank}</span>
                    )}
                    {ranking.trend === 'down' && (
                      <span className="text-red-400">↓ {ranking.previousRank}</span>
                    )}
                    {ranking.trend === 'same' && (
                      <span className="text-gray-500">-</span>
                    )}
                  </div>
                )}
              </div>

              {/* Team Info */}
              <div className="flex-1">
                <div className="font-semibold text-white">{ranking.team}</div>
                <div className="text-sm text-gray-400">{ranking.conference}</div>
              </div>

              {/* Record */}
              <div className="text-right min-w-[80px]">
                <div className="font-bold text-white">{ranking.record}</div>
                <div className="text-xs text-gray-500">
                  {ranking.wins}W-{ranking.losses}L
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
