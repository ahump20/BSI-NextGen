import type { Game } from '@bsi/shared';

interface GameCardProps {
  game: Game;
}

export function GameCard({ game }: GameCardProps) {
  const isLive = game.status === 'live';
  const isFinal = game.status === 'final';

  return (
    <div className="game-card">
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

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-sm font-medium">{game.awayTeam.abbreviation || game.awayTeam.name}</span>
          </div>
          <span className={`text-xl font-bold ${game.awayScore > game.homeScore && isFinal ? 'text-green-400' : ''}`}>
            {game.awayScore}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-sm font-medium">{game.homeTeam.abbreviation || game.homeTeam.name}</span>
          </div>
          <span className={`text-xl font-bold ${game.homeScore > game.awayScore && isFinal ? 'text-green-400' : ''}`}>
            {game.homeScore}
          </span>
        </div>
      </div>

      {game.venue && (
        <div className="mt-2 text-xs text-gray-500">
          {game.venue}
        </div>
      )}
    </div>
  );
}
