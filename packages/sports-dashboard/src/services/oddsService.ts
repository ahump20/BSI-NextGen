import type { OddsData } from '../types';

const THEODDSAPI_KEY = import.meta.env.VITE_THEODDSAPI_KEY;

export async function fetchOddsData(sport: string): Promise<OddsData[]> {
  // Return mock data if no API key is configured
  if (!THEODDSAPI_KEY) {
    return getMockOdds(sport);
  }

  // Implement actual API calls here when key is available
  try {
    // Example using TheOddsAPI
    // const response = await fetch(
    //   `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${THEODDSAPI_KEY}&regions=us&markets=h2h`
    // );
    // const data = await response.json();
    // return parseOddsData(data);

    // For now, return mock data
    return getMockOdds(sport);
  } catch (error) {
    console.error('Failed to fetch odds data:', error);
    throw new Error('Unable to load odds data. Please check your API configuration.');
  }
}

function getMockOdds(sport: string): OddsData[] {
  const now = new Date();
  const commenceTime = new Date(now.getTime() + 2 * 60 * 60 * 1000).toLocaleString();

  const odds: Record<string, OddsData[]> = {
    americanfootball_nfl: [
      {
        id: 'odds-1',
        homeTeam: 'Kansas City Chiefs',
        awayTeam: 'Buffalo Bills',
        commenceTime,
        bookmakers: [
          { name: 'DraftKings', homeOdds: '-125', awayOdds: '+105' },
          { name: 'FanDuel', homeOdds: '-120', awayOdds: '+100' },
          { name: 'BetMGM', homeOdds: '-130', awayOdds: '+110' },
        ],
      },
      {
        id: 'odds-2',
        homeTeam: 'Dallas Cowboys',
        awayTeam: 'Philadelphia Eagles',
        commenceTime,
        bookmakers: [
          { name: 'DraftKings', homeOdds: '+150', awayOdds: '-180' },
          { name: 'FanDuel', homeOdds: '+155', awayOdds: '-175' },
          { name: 'BetMGM', homeOdds: '+145', awayOdds: '-185' },
        ],
      },
    ],
    basketball_nba: [
      {
        id: 'odds-3',
        homeTeam: 'Los Angeles Lakers',
        awayTeam: 'Boston Celtics',
        commenceTime,
        bookmakers: [
          { name: 'DraftKings', homeOdds: '-110', awayOdds: '-110' },
          { name: 'FanDuel', homeOdds: '-108', awayOdds: '-112' },
        ],
      },
    ],
    baseball_mlb: [
      {
        id: 'odds-4',
        homeTeam: 'New York Yankees',
        awayTeam: 'Boston Red Sox',
        commenceTime,
        bookmakers: [
          { name: 'DraftKings', homeOdds: '-145', awayOdds: '+125' },
          { name: 'FanDuel', homeOdds: '-140', awayOdds: '+120' },
        ],
      },
    ],
    icehockey_nhl: [
      {
        id: 'odds-5',
        homeTeam: 'Toronto Maple Leafs',
        awayTeam: 'Montreal Canadiens',
        commenceTime,
        bookmakers: [
          { name: 'DraftKings', homeOdds: '-135', awayOdds: '+115' },
          { name: 'FanDuel', homeOdds: '-130', awayOdds: '+110' },
        ],
      },
    ],
  };

  return odds[sport] || [];
}
