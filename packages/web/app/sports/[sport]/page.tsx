import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { Game, Standing } from '@bsi/shared';
import { SportsDataService } from '@bsi/api';

import { SportPageShell } from '../_components/SportPageShell';
import { LiveScoreGrid } from '../_components/LiveScoreGrid';
import { StandingsPanel } from '../_components/StandingsPanel';
import { LeadersPanel, type LeaderHighlight } from '../_components/LeadersPanel';
import { NarrativePanel, type Narrative } from '../_components/NarrativePanel';
import { resolveSportConfig, type SportSlug } from '../sport-config';

const dataService = new SportsDataService();

export const revalidate = 60;

interface SportPageProps {
  params: { sport: string };
}

export async function generateMetadata({ params }: SportPageProps): Promise<Metadata> {
  const config = resolveSportConfig(params.sport);
  if (!config) {
    return { title: 'Sport not found' };
  }

  return {
    title: `${config.name} | Blaze Sports Intel`,
    description: `${config.name} dashboards with live scores, standings, leaders, and narratives refreshed every minute.`,
  };
}

export default async function SportPage({ params }: SportPageProps) {
  const config = resolveSportConfig(params.sport);

  if (!config) {
    notFound();
  }

  const { games, standings, leaders, narratives, updatedAt } = await loadDashboard(config.slug);

  return (
    <SportPageShell config={config} updatedAt={updatedAt}>
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-border/80 bg-surface shadow-sm">
            <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
              <div>
                <h2 className="text-base font-semibold text-data-primary">Live scores</h2>
                <p className="text-sm text-muted-foreground">Ball-in-play visuals tuned for {config.name}.</p>
              </div>
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${config.pill}`}>
                Data-first
              </span>
            </div>
            <div className="px-4 py-4">
              <LiveScoreGrid games={games} accent={config.accent} sportName={config.name} />
            </div>
          </div>

          <NarrativePanel narratives={narratives} />
        </div>

        <div className="space-y-4">
          <StandingsPanel standings={standings} accent={config.pill} />
          <LeadersPanel leaders={leaders} />
        </div>
      </section>
    </SportPageShell>
  );
}

async function loadDashboard(sport: SportSlug) {
  try {
    const [gamesRes, standingsRes] = await Promise.all([
      dataService.getGames(mapToServiceSport(sport)),
      dataService.getStandings(mapToServiceSport(sport)),
    ]);

    const leaders = deriveLeaders(gamesRes.data, standingsRes.data);
    const narratives = buildNarratives(gamesRes.data, standingsRes.data);

    return {
      games: prioritizeLive(gamesRes.data),
      standings: standingsRes.data,
      leaders,
      narratives,
      updatedAt: gamesRes.source.timestamp || standingsRes.source.timestamp,
    };
  } catch (error) {
    console.error('Failed to load sport dashboard', error);
    return {
      games: [] as Game[],
      standings: [] as Standing[],
      leaders: [] as LeaderHighlight[],
      narratives: [
        {
          title: 'We hit a timeout',
          body: 'Dashboards are retrying the feed. Data adapters are still wired; refresh to check the latest.',
          tone: 'warning',
        },
      ] satisfies Narrative[],
      updatedAt: new Date().toISOString(),
    };
  }
}

function prioritizeLive(games: Game[]) {
  const sorted = [...games].sort((a, b) => {
    if (a.status === b.status) return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (a.status === 'live') return -1;
    if (b.status === 'live') return 1;
    if (a.status === 'scheduled') return -1;
    if (b.status === 'scheduled') return 1;
    return 0;
  });
  return sorted;
}

function deriveLeaders(games: Game[], standings: Standing[]): LeaderHighlight[] {
  const leaders: LeaderHighlight[] = [];

  games.forEach(game => {
    if (game.probablePitchers?.away?.name) {
      leaders.push({
        name: game.probablePitchers.away.name,
        role: `${game.awayTeam.name} starter`,
        metric: `${game.probablePitchers.away.era ? `${game.probablePitchers.away.era} ERA • ` : ''}${game.awayTeam.abbreviation}`,
        badge: 'Projected',
      });
    }
    if (game.probablePitchers?.home?.name) {
      leaders.push({
        name: game.probablePitchers.home.name,
        role: `${game.homeTeam.name} starter`,
        metric: `${game.probablePitchers.home.era ? `${game.probablePitchers.home.era} ERA • ` : ''}${game.homeTeam.abbreviation}`,
        badge: 'Projected',
      });
    }
  });

  const topTeams = [...standings]
    .sort((a, b) => b.winPercentage - a.winPercentage)
    .slice(0, 3)
    .map(team => ({
      name: team.team.name,
      role: `${team.team.abbreviation} momentum`,
      metric: `${(team.winPercentage * 100).toFixed(1)}% win rate • ${team.streak || 'steady'}`,
      badge: 'Club form',
    }));

  return leaders.concat(topTeams).slice(0, 6);
}

function buildNarratives(games: Game[], standings: Standing[]): Narrative[] {
  const narratives: Narrative[] = [];

  const liveGames = games.filter(game => game.status === 'live');
  if (liveGames.length) {
    const headliner = liveGames[0];
    narratives.push({
      title: `${headliner.awayTeam.abbreviation} @ ${headliner.homeTeam.abbreviation}`,
      body: `Live now: ${headliner.awayScore} - ${headliner.homeScore} with ${headliner.period || 'in-progress action'}.`,
      tone: 'positive',
    });
  }

  if (standings.length) {
    const top = [...standings].sort((a, b) => b.winPercentage - a.winPercentage)[0];
    narratives.push({
      title: `${top.team.name} trending`,
      body: `${top.team.city} sitting at ${(top.winPercentage * 100).toFixed(1)}% with streak ${top.streak || 'steady form'}.`,
      tone: 'neutral',
    });
  }

  if (!narratives.length && games.length) {
    narratives.push({
      title: 'Upcoming slate',
      body: `${games.length} games scheduled. We will flip to live visuals once the first whistle hits.`,
      tone: 'neutral',
    });
  }

  return narratives;
}

function mapToServiceSport(slug: SportSlug) {
  const mapping: Record<SportSlug, Game['sport']> = {
    mlb: 'MLB',
    nfl: 'NFL',
    nba: 'NBA',
    'ncaa-football': 'NCAA_FOOTBALL',
    'college-baseball': 'COLLEGE_BASEBALL',
  };

  return mapping[slug];
}
