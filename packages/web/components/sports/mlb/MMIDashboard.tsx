'use client';

import React, { useState, useEffect } from 'react';
import {
  GameMMIResponse,
  PitchMMI,
  PlayerMMISummary,
  getMMICategory,
  getMMICategoryColor,
  formatCount,
  formatInning,
} from '@bsi/shared';

interface MMIDashboardProps {
  gameId: string;
  role?: 'pitcher' | 'batter';
  className?: string;
}

/**
 * Comprehensive MMI Dashboard Component
 *
 * Displays mental demand analytics for an MLB game including:
 * - Summary statistics
 * - Top 5 highest-MMI moments
 * - Player summaries
 * - Component breakdown
 *
 * @param gameId - MLB game ID
 * @param role - Analysis perspective ('pitcher' or 'batter')
 */
export function MMIDashboard({
  gameId,
  role = 'pitcher',
  className = '',
}: MMIDashboardProps) {
  const [data, setData] = useState<GameMMIResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMMI() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/sports/mlb/mmi/games/${gameId}?role=${role}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Failed to fetch MMI data: ${response.statusText}`
          );
        }

        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        console.error('[MMI Dashboard] Error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchMMI();
  }, [gameId, role]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
          <p className="text-gray-600">Loading MMI data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-red-800">Error Loading MMI Data</h3>
            <p className="mt-2 text-sm text-red-600">{error}</p>
            <p className="mt-2 text-xs text-red-500">
              Ensure the MMI service is running and accessible.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.pitches.length) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-8 text-center ${className}`}>
        <svg
          className="mx-auto h-12 w-12 text-gray-400 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <p className="text-gray-600 font-medium">No MMI data available for this game</p>
        <p className="text-sm text-gray-500 mt-2">Game ID: {gameId}</p>
      </div>
    );
  }

  // Calculate game-level statistics
  const avgMMI = data.pitches.reduce((sum, p) => sum + p.mmi, 0) / data.pitches.length;
  const maxMMI = Math.max(...data.pitches.map((p) => p.mmi));
  const minMMI = Math.min(...data.pitches.map((p) => p.mmi));
  const highMMICount = data.pitches.filter((p) => p.mmi > 2.0).length;

  // Find top 5 highest MMI moments
  const topMoments = [...data.pitches].sort((a, b) => b.mmi - a.mmi).slice(0, 5);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Statistics */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {role === 'pitcher' ? 'Pitcher' : 'Batter'} Mental Demand Summary
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Average MMI"
            value={avgMMI.toFixed(2)}
            description="Mean mental demand across all pitches"
            category={getMMICategory(avgMMI)}
          />
          <StatCard
            label="Peak MMI"
            value={maxMMI.toFixed(2)}
            description="Highest mental demand moment"
            category={getMMICategory(maxMMI)}
          />
          <StatCard
            label="High-Leverage Pitches"
            value={highMMICount.toString()}
            description="Pitches with MMI > 2.0"
          />
          <StatCard
            label="Total Pitches"
            value={data.pitches.length.toString()}
            description="Events analyzed"
          />
        </div>
      </div>

      {/* Top 5 Moments */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Top 5 Most Mentally Demanding Moments
        </h3>
        <div className="space-y-3">
          {topMoments.map((pitch, idx) => (
            <MomentCard
              key={`${pitch.inning}-${pitch.outs}-${idx}`}
              pitch={pitch}
              rank={idx + 1}
            />
          ))}
        </div>
      </div>

      {/* Player Summaries */}
      {data.player_summaries && data.player_summaries.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {role === 'pitcher' ? 'Pitcher' : 'Batter'} MMI Summary
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Player
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pitches
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg MMI
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    P90 MMI
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Max MMI
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    High-Leverage
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.player_summaries.map((player) => (
                  <PlayerRow key={player.player_id} player={player} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="text-xs text-gray-500 border-t pt-4">
        <p>
          <span className="font-medium">Data Source:</span> {data.meta.dataSource}
        </p>
        <p className="mt-1">
          <span className="font-medium">Last Updated:</span>{' '}
          {new Date(data.meta.lastUpdated).toLocaleString('en-US', {
            timeZone: 'America/Chicago',
            dateStyle: 'short',
            timeStyle: 'short',
          })}{' '}
          CST
        </p>
      </div>
    </div>
  );
}

/**
 * Summary Statistic Card
 */
function StatCard({
  label,
  value,
  description,
  category,
}: {
  label: string;
  value: string;
  description: string;
  category?: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {category && (
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-700">
            {category}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-1">{description}</p>
    </div>
  );
}

/**
 * High-MMI Moment Card
 */
function MomentCard({ pitch, rank }: { pitch: PitchMMI; rank: number }) {
  const colorClass = getMMICategoryColor(pitch.mmi);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0">
            {rank}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">
              {formatInning(pitch.inning, pitch.is_top_inning)}, {pitch.outs} out
              {pitch.outs !== 1 ? 's' : ''}
            </p>
            <p className="text-sm text-gray-600 truncate">
              {pitch.pitcher_name} vs {pitch.batter_name}
            </p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-2xl font-bold text-blue-600">{pitch.mmi.toFixed(2)}</p>
          <p className={`text-xs font-medium px-2 py-0.5 rounded-full inline-block ${colorClass}`}>
            {getMMICategory(pitch.mmi)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs text-gray-600 pt-3 border-t border-gray-100">
        <DetailItem label="Count" value={formatCount(pitch.balls, pitch.strikes)} />
        <DetailItem label="Bases" value={pitch.base_state} />
        <DetailItem
          label="Score"
          value={pitch.score_diff > 0 ? `+${pitch.score_diff}` : pitch.score_diff.toString()}
        />
        <DetailItem label="LI" value={pitch.leverage_index.toFixed(2)} />
        <DetailItem
          label="Velocity"
          value={pitch.pitch_velocity ? `${pitch.pitch_velocity.toFixed(1)} mph` : 'N/A'}
        />
      </div>
    </div>
  );
}

/**
 * Detail Item (for moment cards)
 */
function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-gray-500 text-xs">{label}</p>
      <p className="font-medium text-gray-900">{value}</p>
    </div>
  );
}

/**
 * Player Summary Row
 */
function PlayerRow({ player }: { player: PlayerMMISummary }) {
  const avgColorClass = getMMICategoryColor(player.mean_mmi);

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{player.player_name}</div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-right">
        <div className="text-sm text-gray-600">{player.count}</div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-right">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${avgColorClass}`}>
          {player.mean_mmi.toFixed(2)}
        </span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-right">
        <div className="text-sm text-gray-900">{player.p90_mmi.toFixed(2)}</div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-right">
        <div className="text-sm font-semibold text-blue-600">{player.max_mmi.toFixed(2)}</div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-right">
        <div className="text-sm text-gray-600">{player.high_mmi_count}</div>
      </td>
    </tr>
  );
}
