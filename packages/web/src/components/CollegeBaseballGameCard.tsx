'use client';

import type { CollegeBaseballGame } from '@bsi/shared';
import { useState } from 'react';
import { BaseballBoxScore } from './BaseballBoxScore';

interface CollegeBaseballGameCardProps {
  game: CollegeBaseballGame;
}

export function CollegeBaseballGameCard({ game }: CollegeBaseballGameCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isLive = game.status === 'live';
  const isFinal = game.status === 'final';
  const hasBoxScore = game.boxScore && (game.boxScore.battingLines.length > 0 || game.boxScore.pitchingLines.length > 0);

  return (
    <div className="game-card">
      {/* Game Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isLive && <span className="live-indicator"></span>}
          <span className={`text-xs font-semibold ${isLive ? 'text-red-500' : isFinal ? 'text-gray-400' : 'text-blue-400'}`}>
            {isLive ? 'LIVE' : isFinal ? 'FINAL' : 'SCHEDULED'}
          </span>
          {game.period && (
            <span className="text-xs text-gray-400">
              {game.period}
            </span>
          )}
          {game.conference !== 'No' && (
            <span className="text-xs text-blaze-orange font-medium">
              CONF
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500">
          {new Date(game.date).toLocaleString('en-US', {
            timeZone: 'America/Chicago',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          })}
        </span>
      </div>

      {/* Teams and Scores */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {game.awayTeam.logo && (
              <img
                src={game.awayTeam.logo}
                alt={game.awayTeam.name}
                className="w-8 h-8 object-contain"
              />
            )}
            <div className="flex flex-col">
              <span className="text-sm font-medium">{game.awayTeam.abbreviation || game.awayTeam.name}</span>
              <span className="text-xs text-gray-500">{game.awayTeam.city}</span>
            </div>
          </div>
          <span className={`text-xl font-bold ${game.awayScore > game.homeScore && isFinal ? 'text-green-400' : ''}`}>
            {game.awayScore}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {game.homeTeam.logo && (
              <img
                src={game.homeTeam.logo}
                alt={game.homeTeam.name}
                className="w-8 h-8 object-contain"
              />
            )}
            <div className="flex flex-col">
              <span className="text-sm font-medium">{game.homeTeam.abbreviation || game.homeTeam.name}</span>
              <span className="text-xs text-gray-500">{game.homeTeam.city}</span>
            </div>
          </div>
          <span className={`text-xl font-bold ${game.homeScore > game.awayScore && isFinal ? 'text-green-400' : ''}`}>
            {game.homeScore}
          </span>
        </div>
      </div>

      {/* Venue */}
      {game.venue && (
        <div className="mt-2 text-xs text-gray-500">
          {game.venue}
        </div>
      )}

      {/* Expand Button */}
      {hasBoxScore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 w-full py-2 px-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium text-blaze-orange transition-colors flex items-center justify-center gap-2"
        >
          {expanded ? (
            <>
              <span>Hide Box Score</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </>
          ) : (
            <>
              <span>View Full Box Score</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </>
          )}
        </button>
      )}

      {/* Expanded Box Score */}
      {expanded && hasBoxScore && (
        <BaseballBoxScore game={game} />
      )}
    </div>
  );
}
