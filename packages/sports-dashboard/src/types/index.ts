export interface GameData {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  gameTime: string;
}

export interface OddsData {
  id: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  bookmakers: Bookmaker[];
}

export interface Bookmaker {
  name: string;
  homeOdds: string;
  awayOdds: string;
}
