import type { GameData } from '../types';

const SPORTSDATAIO_KEY = import.meta.env.VITE_SPORTSDATAIO_API_KEY;
const SPORTSRADAR_KEY = import.meta.env.VITE_SPORTSRADAR_MASTER_API_KEY;

export async function fetchSportsData(sport: string): Promise<GameData[]> {
  // Return mock data if no API key is configured
  if (!SPORTSDATAIO_KEY && !SPORTSRADAR_KEY) {
    return getMockGames(sport);
  }

  // Implement actual API calls here when keys are available
  try {
    // Example using SportsDataIO API structure
    // const response = await fetch(
    //   `https://api.sportsdata.io/v3/${sport.toLowerCase()}/scores/json/ScoresByWeek/2024/1?key=${SPORTSDATAIO_KEY}`
    // );
    // const data = await response.json();
    // return parseGamesData(data);

    // For now, return mock data
    return getMockGames(sport);
  } catch (error) {
    console.error('Failed to fetch sports data:', error);
    throw new Error('Unable to load sports data. Please check your API configuration.');
  }
}

function getMockGames(sport: string): GameData[] {
  const now = new Date();
  const today = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const games: Record<string, GameData[]> = {
    NFL: [
      {
        id: '1',
        homeTeam: 'Kansas City Chiefs',
        awayTeam: 'Buffalo Bills',
        homeScore: 24,
        awayScore: 21,
        status: 'Final',
        gameTime: `${today} 8:20 PM`,
      },
      {
        id: '2',
        homeTeam: 'Dallas Cowboys',
        awayTeam: 'Philadelphia Eagles',
        homeScore: null,
        awayScore: null,
        status: 'Scheduled',
        gameTime: `${today} 4:25 PM`,
      },
      {
        id: '3',
        homeTeam: 'San Francisco 49ers',
        awayTeam: 'Seattle Seahawks',
        homeScore: 14,
        awayScore: 10,
        status: 'Q3 - 8:42',
        gameTime: `${today} 1:00 PM`,
      },
    ],
    NBA: [
      {
        id: '4',
        homeTeam: 'Los Angeles Lakers',
        awayTeam: 'Boston Celtics',
        homeScore: 108,
        awayScore: 112,
        status: 'Final',
        gameTime: `${today} 10:00 PM`,
      },
      {
        id: '5',
        homeTeam: 'Golden State Warriors',
        awayTeam: 'Phoenix Suns',
        homeScore: null,
        awayScore: null,
        status: 'Scheduled',
        gameTime: `${today} 8:30 PM`,
      },
    ],
    MLB: [
      {
        id: '6',
        homeTeam: 'New York Yankees',
        awayTeam: 'Boston Red Sox',
        homeScore: 5,
        awayScore: 3,
        status: 'Final',
        gameTime: `${today} 7:05 PM`,
      },
      {
        id: '7',
        homeTeam: 'Los Angeles Dodgers',
        awayTeam: 'San Francisco Giants',
        homeScore: null,
        awayScore: null,
        status: 'Scheduled',
        gameTime: `${today} 10:10 PM`,
      },
    ],
    NHL: [
      {
        id: '8',
        homeTeam: 'Toronto Maple Leafs',
        awayTeam: 'Montreal Canadiens',
        homeScore: 3,
        awayScore: 2,
        status: 'Final (OT)',
        gameTime: `${today} 7:00 PM`,
      },
      {
        id: '9',
        homeTeam: 'Tampa Bay Lightning',
        awayTeam: 'Florida Panthers',
        homeScore: null,
        awayScore: null,
        status: 'Scheduled',
        gameTime: `${today} 7:30 PM`,
      },
    ],
  };

  return games[sport] || [];
}
