import type { Game } from '@bsi/shared';
import clsx from 'clsx';

interface LiveScoreGridProps {
  games: Game[];
  accent: string;
  sportName: string;
}

const statusCopy: Record<Game['status'], string> = {
  live: 'Live',
  scheduled: 'Scheduled',
  final: 'Final',
  postponed: 'Postponed',
  cancelled: 'Cancelled',
};

export function LiveScoreGrid({ games, accent, sportName }: LiveScoreGridProps) {
  if (!games.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border/70 bg-surface p-6 text-center">
        <p className="text-sm font-medium text-muted-foreground">No {sportName} games available right now. Feeds refresh automatically.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" role="list">
      {games.map(game => (
        <article
          key={game.id}
          className="group rounded-2xl border border-border/80 bg-surface shadow-sm transition hover:-translate-y-0.5 hover:border-border hover:shadow-md focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-data-blue"
          role="listitem"
          tabIndex={-1}
        >
          <header className="flex items-center justify-between border-b border-border/70 px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              <span className={clsx('h-2 w-2 rounded-full', accent)} aria-hidden />
              <span>{statusCopy[game.status]}</span>
            </div>
            <p className="text-xs text-muted-foreground" aria-label="Game time">
              {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(game.date))}
            </p>
          </header>

          <div className="px-4 py-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <TeamCell name={game.awayTeam.name} abbreviation={game.awayTeam.abbreviation} city={game.awayTeam.city} />
              <ScoreCell score={game.awayScore} emphasize={game.awayScore > game.homeScore} accent={accent} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <TeamCell name={game.homeTeam.name} abbreviation={game.homeTeam.abbreviation} city={game.homeTeam.city} />
              <ScoreCell score={game.homeScore} emphasize={game.homeScore > game.awayScore} accent={accent} />
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {game.period && (
                <span className="inline-flex items-center gap-1 rounded-full bg-surface-strong px-2.5 py-1 font-semibold text-data-primary">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden />
                  {game.period}
                </span>
              )}
              {game.venue && <span className="truncate" aria-label="Venue">{game.venue}</span>}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function TeamCell({ name, abbreviation, city }: { name: string; abbreviation: string; city: string }) {
  return (
    <div className="min-w-0">
      <p className="text-sm font-semibold text-data-primary leading-tight truncate" title={name}>
        {name}
      </p>
      <p className="text-xs text-muted-foreground leading-tight" aria-label={`${abbreviation} from ${city}`}>
        {abbreviation} • {city}
      </p>
    </div>
  );
}

function ScoreCell({ score, emphasize, accent }: { score: number; emphasize: boolean; accent: string }) {
  return (
    <div
      className={clsx(
        'min-w-[3.5rem] rounded-lg border px-3 py-2 text-center text-lg font-bold',
        emphasize ? accent : 'border-border bg-surface-strong text-data-primary'
      )}
    >
      {score}
    </div>
  );
}
