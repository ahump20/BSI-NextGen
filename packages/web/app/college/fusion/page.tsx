import { Metadata } from 'next';
import './fusion.css';

export const metadata: Metadata = {
  title: 'NCAA Fusion Dashboard | Blaze Sports Intel',
  description: 'Team intelligence board merging season analytics with live scoreboard state'
};

type TeamInfo = {
  id: string;
  uid: string;
  displayName: string;
  abbreviation: string;
  location: string;
  name: string;
  logos: { href: string }[];
};

type StandingsRow = {
  team: string;
  scope: string;
  summary: string | null;
  wins: number;
  losses: number;
  ties: number;
  pct: string | null;
  gamesPlayed: number;
};

type Analytics = {
  pythagorean: {
    expectedWins: number | null;
    winPercentage: string | null;
    inputs: {
      pointsFor: number | null;
      pointsAgainst: number | null;
      exponent: number;
    };
  } | null;
  efficiency: {
    averageFor: number | null;
    averageAgainst: number | null;
    differential: number | null;
  } | null;
  momentum: {
    streak: string | null;
    streakValue: number | null;
  } | null;
  dataSource: string;
};

type NcaaGame = {
  gameState?: string;
  startTime?: string;
  startTimeEpoch?: number;
  home?: {
    names?: { char6?: string; short?: string; seo?: string };
    description?: string;
    rank?: number;
  };
  away?: {
    names?: { char6?: string; short?: string; seo?: string };
    description?: string;
    rank?: number;
  };
  url?: string;
};

type FusionPayload =
  | {
      success: true;
      sport: string;
      team: TeamInfo;
      standings: StandingsRow[];
      analytics: Analytics;
      dataSource: string;
      timestamp: string;
      cached?: boolean;
      scoreboard?: any;
      upcomingGame?: NcaaGame | null;
    }
  | {
      success: false;
      error: string;
    };

function getAppOrigin(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.WEB_APP_ORIGIN) return process.env.WEB_APP_ORIGIN;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

async function fetchFusion(params: {
  sport?: string;
  teamId?: string;
  year?: string;
  week?: string;
}): Promise<FusionPayload> {
  const origin = getAppOrigin();
  const url = new URL('/api/edge/ncaa/fusion', origin);

  if (params.sport) url.searchParams.set('sport', params.sport);
  if (params.teamId) url.searchParams.set('teamId', params.teamId);
  if (params.year) url.searchParams.set('year', params.year);
  if (params.week) url.searchParams.set('week', params.week);

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
    next: { revalidate: 25 }
  });

  if (!res.ok) {
    throw new Error(`Fusion API returned ${res.status}`);
  }

  return (await res.json()) as FusionPayload;
}

function formatDiff(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  const rounded = Math.round(value * 10) / 10;
  return `${rounded > 0 ? '+' : ''}${rounded}`;
}

function winDelta(actualWins: number, expectedWins: number | null): string {
  if (expectedWins === null || expectedWins === undefined) return '—';
  const diff = actualWins - expectedWins;
  const rounded = Math.round(diff * 10) / 10;
  return `${rounded > 0 ? '+' : ''}${rounded}`;
}

function recordFromStandings(standings: StandingsRow[]): string {
  if (!standings || !standings.length) return '';
  const overall =
    standings.find((s) => s.scope.toLowerCase().includes('overall')) ??
    standings[0];
  return `${overall.wins}-${overall.losses}${
    overall.ties ? `-${overall.ties}` : ''
  }`;
}

function momentumLabel(momentum: {
  streak: string | null;
  streakValue: number | null;
} | null): string {
  if (!momentum) return 'Neutral';
  if (!momentum.streak && !momentum.streakValue) return 'Neutral';
  return momentum.streak ?? `Streak: ${momentum.streakValue}`;
}

export default async function CollegeFusionPage({
  searchParams
}: {
  searchParams?: {
    sport?: string;
    teamId?: string;
    year?: string;
    week?: string;
  };
}) {
  const params = {
    sport: searchParams?.sport ?? 'basketball',
    teamId: searchParams?.teamId,
    year: searchParams?.year,
    week: searchParams?.week
  };

  let payload: FusionPayload;

  try {
    payload = await fetchFusion(params);
  } catch (error) {
    return (
      <main className="di-page">
        <section className="di-section fusion-section">
          <span className="di-kicker">NCAA Fusion · Error</span>
          <h1 className="di-page-title">NCAA Fusion Dashboard</h1>
          <div className="fusion-error">
            <strong>Fetch failed.</strong>
            <p>{error instanceof Error ? error.message : 'Unknown error'}</p>
          </div>
        </section>
      </main>
    );
  }

  if (!payload.success) {
    return (
      <main className="di-page">
        <section className="di-section fusion-section">
          <span className="di-kicker">NCAA Fusion · Error</span>
          <h1 className="di-page-title">NCAA Fusion Dashboard</h1>
          <div className="fusion-error">
            <strong>Fusion failed.</strong>
            <p>{payload.error}</p>
          </div>
        </section>
      </main>
    );
  }

  const { sport, team, standings, analytics, upcomingGame } = payload;
  const overallRecord = recordFromStandings(standings);
  const pyth = analytics.pythagorean;
  const eff = analytics.efficiency;
  const momentum = analytics.momentum;

  const overall = standings.find((s) =>
    s.scope.toLowerCase().includes('overall')
  );
  const actualWins = overall?.wins ?? 0;
  const expectedWins = pyth?.expectedWins ?? null;
  const winDeltaLabel = winDelta(actualWins, expectedWins);

  return (
    <main className="di-page">
      <section className="di-section fusion-header">
        <span className="di-kicker">NCAA Fusion · {sport}</span>
        <h1 className="di-page-title">Team Intelligence Board</h1>
        <p className="di-page-subtitle">
          Season-long efficiency, Pythagorean truth, and live scoreboard state
          in one NCAA-ready surface for fast calls.
        </p>
      </section>

      <section className="di-section fusion-grid">
        {/* Team Card */}
        <article className="fusion-card fusion-team">
          <div className="fusion-team-header">
            {team.logos?.[0]?.href ? (
              <img
                src={team.logos[0].href}
                alt={`${team.displayName} logo`}
                className="fusion-team-logo"
              />
            ) : null}
            <div className="fusion-team-meta">
              <h2>{team.displayName}</h2>
              <span className="fusion-team-location">
                {team.location} · {team.abbreviation}
              </span>
              {overallRecord && (
                <span className="fusion-team-record">{overallRecord}</span>
              )}
            </div>
          </div>
          <dl className="fusion-team-stats">
            <div>
              <dt>Momentum</dt>
              <dd>{momentumLabel(momentum)}</dd>
            </div>
            <div>
              <dt>Data source</dt>
              <dd>{analytics.dataSource}</dd>
            </div>
            <div>
              <dt>Last sync</dt>
              <dd>
                {new Date(payload.timestamp).toLocaleString('en-US', {
                  timeZone: 'America/Chicago'
                })}
              </dd>
            </div>
          </dl>
        </article>

        {/* Pythagorean & Efficiency */}
        <article className="fusion-card fusion-analytics">
          <h2>Pythagorean Reality Check</h2>
          <div className="fusion-metrics-row">
            <div className="fusion-metric">
              <span className="fusion-metric-label">Actual wins</span>
              <span className="fusion-metric-value">{actualWins}</span>
            </div>
            <div className="fusion-metric">
              <span className="fusion-metric-label">Expected wins</span>
              <span className="fusion-metric-value">
                {pyth?.expectedWins?.toFixed(1) ?? '—'}
              </span>
              <span className="fusion-metric-sub">
                Exponent {pyth?.inputs.exponent ?? '—'}
              </span>
            </div>
            <div className="fusion-metric">
              <span className="fusion-metric-label">Over / under</span>
              <span
                className={`fusion-metric-value fusion-metric-chip ${
                  winDeltaLabel.startsWith('+')
                    ? 'is-positive'
                    : winDeltaLabel.startsWith('-')
                    ? 'is-negative'
                    : ''
                }`}
              >
                {winDeltaLabel}
              </span>
              <span className="fusion-metric-sub">
                Positive = outperforming expectation
              </span>
            </div>
          </div>

          <div className="fusion-metrics-row">
            <div className="fusion-metric">
              <span className="fusion-metric-label">Avg points for</span>
              <span className="fusion-metric-value">
                {eff?.averageFor?.toFixed(1) ?? '—'}
              </span>
            </div>
            <div className="fusion-metric">
              <span className="fusion-metric-label">Avg points against</span>
              <span className="fusion-metric-value">
                {eff?.averageAgainst?.toFixed(1) ?? '—'}
              </span>
            </div>
            <div className="fusion-metric">
              <span className="fusion-metric-label">Differential</span>
              <span
                className={`fusion-metric-value fusion-metric-chip ${
                  eff && (eff.differential ?? 0) > 0
                    ? 'is-positive'
                    : eff && (eff.differential ?? 0) < 0
                    ? 'is-negative'
                    : ''
                }`}
              >
                {formatDiff(eff?.differential ?? null)}
              </span>
            </div>
          </div>
        </article>

        {/* Upcoming / Today Game */}
        <article className="fusion-card fusion-upcoming">
          <h2>
            {upcomingGame ? 'Next leverage spot' : 'No live game detected'}
          </h2>
          {!upcomingGame ? (
            <p>
              No game for this team in the current scoreboard window. Adjust{' '}
              <code>year</code> / <code>week</code> in the query string to jump
              to another slate.
            </p>
          ) : (
            <div className="fusion-upcoming-body">
              <div className="fusion-upcoming-teams">
                <div>
                  <span className="fusion-upcoming-label">Away</span>
                  <strong>
                    {upcomingGame.away?.names?.short ?? 'TBA'}
                  </strong>
                  <span className="fusion-upcoming-meta">
                    {upcomingGame.away?.description ?? ''}
                  </span>
                </div>
                <div>
                  <span className="fusion-upcoming-label">Home</span>
                  <strong>
                    {upcomingGame.home?.names?.short ?? 'TBA'}
                  </strong>
                  <span className="fusion-upcoming-meta">
                    {upcomingGame.home?.description ?? ''}
                  </span>
                </div>
              </div>
              <dl className="fusion-upcoming-details">
                <div>
                  <dt>Game state</dt>
                  <dd>{upcomingGame.gameState ?? 'TBA'}</dd>
                </div>
                <div>
                  <dt>Start time</dt>
                  <dd>{upcomingGame.startTime ?? 'TBA'}</dd>
                </div>
                <div>
                  <dt>Rankings</dt>
                  <dd>
                    {upcomingGame.away?.rank || upcomingGame.home?.rank
                      ? `#${upcomingGame.away?.rank ?? '—'} @ #${
                          upcomingGame.home?.rank ?? '—'
                        }`
                      : 'Unranked matchup'}
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </article>

        {/* Standings snapshot */}
        <article className="fusion-card fusion-standings">
          <h2>Standings snapshot</h2>
          {!standings.length ? (
            <p>No standings data returned for this team.</p>
          ) : (
            <div className="fusion-table-wrapper">
              <table className="fusion-table">
                <thead>
                  <tr>
                    <th>Scope</th>
                    <th>W</th>
                    <th>L</th>
                    <th>T</th>
                    <th>Pct</th>
                    <th>GP</th>
                    <th>Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row) => (
                    <tr key={row.scope}>
                      <td>{row.scope}</td>
                      <td>{row.wins}</td>
                      <td>{row.losses}</td>
                      <td>{row.ties}</td>
                      <td>{row.pct ?? '—'}</td>
                      <td>{row.gamesPlayed}</td>
                      <td>{row.summary ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>

      <section className="di-section fusion-footer">
        <p className="fusion-footer-note">
          Scoreboard data powered by ncaa-api; season analytics from Blaze's
          real NCAA orchestrator. Tune <code>sport</code>, <code>teamId</code>,{' '}
          <code>year</code>, and <code>week</code> via URL query for different
          teams/slates.
        </p>
      </section>
    </main>
  );
}
