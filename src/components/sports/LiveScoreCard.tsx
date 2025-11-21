import React from 'react';
import Card from '../primitives/Card';

export interface LiveGameData {
  gameId: string;
  status: 'pre' | 'live' | 'final';
  sport: 'baseball' | 'football' | 'basketball';
  homeTeam: {
    name: string;
    shortName: string;
    logo?: string;
    score: number;
    record?: string;
  };
  awayTeam: {
    name: string;
    shortName: string;
    logo?: string;
    score: number;
    record?: string;
  };
  gameInfo: {
    time?: string;
    period?: string;
    venue?: string;
    broadcast?: string;
  };
  baseballSpecific?: {
    inning: number;
    isTop: boolean;
    outs: number;
    balls: number;
    strikes: number;
    basesOccupied: boolean[];
  };
  footballSpecific?: {
    quarter: number;
    clock: string;
    possession?: 'home' | 'away';
    down?: number;
    distance?: number;
    yardLine?: number;
  };
}

export interface LiveScoreCardProps {
  game: LiveGameData;
  onClick?: () => void;
  showDetails?: boolean;
}

const LiveScoreCard: React.FC<LiveScoreCardProps> = ({
  game,
  onClick,
  showDetails = true,
}) => {
  const isLive = game.status === 'live';
  const isFinal = game.status === 'final';

  const renderBaseballDetails = () => {
    if (!game.baseballSpecific) return null;

    const { inning, isTop, outs, balls, strikes, basesOccupied } = game.baseballSpecific;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium">
            {isTop ? 'Top' : 'Bot'} {inning}
          </span>
          <span>{outs} Out{outs !== 1 ? 's' : ''}</span>
          <span>{balls}-{strikes}</span>
        </div>
        {basesOccupied && (
          <div className="flex justify-center gap-1">
            <BaseDiamond basesOccupied={basesOccupied} />
          </div>
        )}
      </div>
    );
  };

  const renderFootballDetails = () => {
    if (!game.footballSpecific) return null;

    const { quarter, clock, down, distance, yardLine } = game.footballSpecific;

    return (
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">Q{quarter} - {clock}</span>
        {down && distance && yardLine && (
          <span>
            {down}{getOrdinalSuffix(down)} & {distance} at {yardLine}
          </span>
        )}
      </div>
    );
  };

  return (
    <Card
      interactive={!!onClick}
      onClick={onClick}
      className="hover:border-blue-400 transition-all"
    >
      {/* Status Bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isLive && (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-red-600 font-semibold text-sm">LIVE</span>
            </>
          )}
          {isFinal && <span className="text-gray-600 font-semibold text-sm">FINAL</span>}
          {game.status === 'pre' && game.gameInfo.time && (
            <span className="text-gray-600 text-sm">{game.gameInfo.time}</span>
          )}
        </div>
        {game.gameInfo.broadcast && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            {game.gameInfo.broadcast}
          </span>
        )}
      </div>

      {/* Teams & Scores */}
      <div className="space-y-3">
        {/* Away Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {game.awayTeam.logo && (
              <img
                src={game.awayTeam.logo}
                alt={game.awayTeam.name}
                className="w-8 h-8 object-contain flex-shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-gray-900 truncate">
                {game.awayTeam.name}
              </div>
              {game.awayTeam.record && (
                <div className="text-xs text-gray-500">{game.awayTeam.record}</div>
              )}
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 ml-4">
            {game.awayTeam.score}
          </div>
        </div>

        {/* Home Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {game.homeTeam.logo && (
              <img
                src={game.homeTeam.logo}
                alt={game.homeTeam.name}
                className="w-8 h-8 object-contain flex-shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-gray-900 truncate">
                {game.homeTeam.name}
              </div>
              {game.homeTeam.record && (
                <div className="text-xs text-gray-500">{game.homeTeam.record}</div>
              )}
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 ml-4">
            {game.homeTeam.score}
          </div>
        </div>
      </div>

      {/* Game Details */}
      {showDetails && isLive && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          {game.sport === 'baseball' && renderBaseballDetails()}
          {game.sport === 'football' && renderFootballDetails()}
        </div>
      )}

      {/* Venue */}
      {game.gameInfo.venue && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          {game.gameInfo.venue}
        </div>
      )}
    </Card>
  );
};

const BaseDiamond: React.FC<{ basesOccupied: boolean[] }> = ({ basesOccupied }) => {
  const baseSize = 12;

  return (
    <svg width="50" height="50" viewBox="0 0 50 50" className="inline-block">
      {/* Second Base */}
      <rect
        x={25 - baseSize / 2}
        y={5}
        width={baseSize}
        height={baseSize}
        fill={basesOccupied[1] ? '#ef4444' : '#d1d5db'}
        transform={`rotate(45 ${25} ${5 + baseSize / 2})`}
      />
      {/* Third Base */}
      <rect
        x={5}
        y={25 - baseSize / 2}
        width={baseSize}
        height={baseSize}
        fill={basesOccupied[2] ? '#ef4444' : '#d1d5db'}
        transform={`rotate(45 ${5 + baseSize / 2} ${25})`}
      />
      {/* First Base */}
      <rect
        x={45 - baseSize}
        y={25 - baseSize / 2}
        width={baseSize}
        height={baseSize}
        fill={basesOccupied[0] ? '#ef4444' : '#d1d5db'}
        transform={`rotate(45 ${45 - baseSize / 2} ${25})`}
      />
      {/* Home Plate */}
      <circle cx={25} cy={42} r={4} fill="#1f2937" />
    </svg>
  );
};

function getOrdinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}

export default LiveScoreCard;
