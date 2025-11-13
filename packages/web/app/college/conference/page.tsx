// packages/web/app/college/conference/page.tsx
import './styles.css';

/**
 * Conference Dashboard - Multi-Team Comparison View
 *
 * Shows key metrics for multiple teams in a conference-style leaderboard.
 * Pass team IDs as comma-separated query param.
 *
 * Example: /college/conference?sport=basketball&teams=150,153,228&conference=ACC
 */

interface ConferenceTeam {
  teamId: string;
  name: string;
  record: string;
  actualWins: number;
  expectedWins: number | null;
  pythDiff: number | null;
  effDiff: number | null;
  streak: string | null;
}

function getAppOrigin() {
  const direct = process.env.NEXT_PUBLIC_APP_URL ?? process.env.WEB_APP_ORIGIN;
  if (direct) return direct;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://127.0.0.1:3000';
}

async function fetchTeamData(teamId: string, sport: string) {
  const origin = getAppOrigin();
  const url = new URL('/api/edge/ncaa/fusion', origin);
  url.searchParams.set('sport', sport);
  url.searchParams.set('teamId', teamId);

  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 }
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (!data.success) return null;

    const overall = data.standings.find((s: any) =>
      s.scope.toLowerCase().includes('overall')
    );

    const pythDiff =
      data.analytics.pythagorean?.expectedWins !== null
        ? overall.wins - data.analytics.pythagorean.expectedWins
        : null;

    return {
      teamId,
      name: data.team.displayName,
      record: `${overall.wins}-${overall.losses}${
        overall.ties ? `-${overall.ties}` : ''
      }`,
      actualWins: overall.wins,
      expectedWins: data.analytics.pythagorean?.expectedWins ?? null,
      pythDiff,
      effDiff: data.analytics.efficiency?.differential ?? null,
      streak: data.analytics.momentum?.streak ?? null
    };
  } catch {
    return null;
  }
}

export default async function ConferenceDashboard({
  searchParams
}: {
  searchParams?: {
    sport?: string;
    teams?: string;
    conference?: string;
  };
}) {
  const sport = searchParams?.sport ?? 'basketball';
  const teamsParam = searchParams?.teams ?? '';
  const conferenceName = searchParams?.conference ?? 'Conference';

  const teamIds = teamsParam
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  if (teamIds.length === 0) {
    return (
      <main className="di-page">
        <section className="di-section conference-section">
          <span className="di-kicker">NCAA Conference · {sport}</span>
          <h1 className="di-page-title">Conference Dashboard</h1>
          <div className="conference-error">
            <strong>No teams specified</strong>
            <p>
              Add teams to compare using the <code>teams</code> query parameter.
            </p>
            <p>
              Example:{' '}
              <code>
                /college/conference?sport=basketball&teams=150,153,228&conference=ACC
              </code>
            </p>
          </div>
        </section>
      </main>
    );
  }

  // Fetch data for all teams in parallel
  const teamsData = await Promise.all(
    teamIds.map((id) => fetchTeamData(id, sport))
  );

  const teams: ConferenceTeam[] = teamsData.filter(
    (t): t is ConferenceTeam => t !== null
  );

  // Sort by Pythagorean differential (best overperformers first)
  teams.sort((a, b) => {
    const aDiff = a.pythDiff ?? 0;
    const bDiff = b.pythDiff ?? 0;
    return bDiff - aDiff;
  });

  return (
    <main className="di-page">
      <section className="di-section conference-header">
        <span className="di-kicker">
          NCAA Conference · {sport} · {conferenceName}
        </span>
        <h1 className="di-page-title">Conference Intelligence Board</h1>
        <p className="di-page-subtitle">
          Multi-team comparison showing Pythagorean differentials, efficiency
          metrics, and current momentum across {teams.length} teams.
        </p>
      </section>

      <section className="di-section conference-content">
        {teams.length === 0 ? (
          <div className="conference-empty">
            <p>No team data available. Check team IDs and try again.</p>
          </div>
        ) : (
          <div className="conference-table-wrapper">
            <table className="conference-table">
              <thead>
                <tr>
                  <th className="conference-table-rank">#</th>
                  <th className="conference-table-team">Team</th>
                  <th className="conference-table-stat">Record</th>
                  <th className="conference-table-stat">Actual W</th>
                  <th className="conference-table-stat">Expected W</th>
                  <th className="conference-table-stat">Pyth Diff</th>
                  <th className="conference-table-stat">Eff Diff</th>
                  <th className="conference-table-streak">Momentum</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team, idx) => {
                  const pythDiff = team.pythDiff ?? 0;
                  const effDiff = team.effDiff ?? 0;

                  return (
                    <tr key={team.teamId} className="conference-table-row">
                      <td className="conference-table-rank">{idx + 1}</td>
                      <td className="conference-table-team">
                        <a
                          href={`/college/fusion?sport=${sport}&teamId=${team.teamId}`}
                          className="conference-team-link"
                        >
                          {team.name}
                        </a>
                      </td>
                      <td className="conference-table-stat">{team.record}</td>
                      <td className="conference-table-stat">
                        {team.actualWins}
                      </td>
                      <td className="conference-table-stat">
                        {team.expectedWins !== null
                          ? team.expectedWins.toFixed(1)
                          : '—'}
                      </td>
                      <td className="conference-table-stat">
                        <span
                          className={`conference-diff-badge ${
                            pythDiff > 0
                              ? 'is-positive'
                              : pythDiff < 0
                              ? 'is-negative'
                              : ''
                          }`}
                        >
                          {pythDiff > 0 ? '+' : ''}
                          {pythDiff !== 0 ? pythDiff.toFixed(1) : '—'}
                        </span>
                      </td>
                      <td className="conference-table-stat">
                        <span
                          className={`conference-diff-badge ${
                            effDiff > 0
                              ? 'is-positive'
                              : effDiff < 0
                              ? 'is-negative'
                              : ''
                          }`}
                        >
                          {effDiff > 0 ? '+' : ''}
                          {effDiff !== 0 ? effDiff.toFixed(1) : '—'}
                        </span>
                      </td>
                      <td className="conference-table-streak">
                        {team.streak ?? 'Neutral'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="conference-legend">
          <h3>Legend</h3>
          <dl>
            <div>
              <dt>Pyth Diff</dt>
              <dd>
                Actual wins minus Pythagorean expected wins. Positive =
                overperforming, Negative = underperforming.
              </dd>
            </div>
            <div>
              <dt>Eff Diff</dt>
              <dd>
                Points for minus points against per game. Higher is better.
              </dd>
            </div>
            <div>
              <dt>Momentum</dt>
              <dd>Current win/loss streak or overall trend.</dd>
            </div>
          </dl>
        </div>

        <div className="conference-footer-note">
          <p>
            Click any team name to view full intelligence board. Data refreshes
            every 60 seconds.
          </p>
        </div>
      </section>
    </main>
  );
}
