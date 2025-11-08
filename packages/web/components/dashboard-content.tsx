'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LiveGameCard } from '@/components/live-game-card';
import { NarrativeFeed } from '@/components/narrative-feed';
import { PlayerSpotlightGrid } from '@/components/player-spotlight';
import { TeamMetricCard } from '@/components/team-metric-card';
import { DashboardPayload, fetchDashboardData } from '@/lib/api';

function useLiveDashboard(initial: DashboardPayload) {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
    initialData: initial,
    refetchInterval: 10_000,
    staleTime: 5_000
  });
}

export default function DashboardContent({ data }: { data: DashboardPayload }) {
  const { data: queryData } = useLiveDashboard(data);
  const games = queryData?.games ?? [];
  const [primaryGame, ...otherGames] = useMemo(() => games, [games]);

  return (
    <div className="space-y-10">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          {primaryGame && <LiveGameCard game={primaryGame} />}
          <div className="grid gap-4 sm:grid-cols-2">
            {queryData?.teams.map((team) => (
              <TeamMetricCard key={team.id} team={team} />
            ))}
          </div>
        </div>
        <div className="space-y-6">
          {otherGames.map((game) => (
            <LiveGameCard key={game.id} game={game} />
          ))}
          {queryData && <NarrativeFeed items={queryData.narratives} />}
        </div>
      </div>
      {queryData && <PlayerSpotlightGrid players={queryData.spotlights} />}
    </div>
  );
}
