/**
 * Tests for MLB Data Adapter
 */

import { MLBAdapter } from '../mlb';
import * as shared from '@bsi/shared';

// Mock the shared utilities
jest.mock('@bsi/shared', () => ({
  ...jest.requireActual('@bsi/shared'),
  validateApiKey: jest.fn((key: string | undefined) => key || 'mock-api-key'),
  fetchWithTimeout: jest.fn(),
  retryWithBackoff: jest.fn((fn) => fn()),
  withProviderResilience: jest.fn((_, fn) => fn()),
  getChicagoTimestamp: jest.fn(() => '2025-01-13T12:00:00-06:00'),
}));

describe('MLBAdapter', () => {
  let adapter: MLBAdapter;
  let mockFetch: jest.MockedFunction<typeof shared.fetchWithTimeout>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch = shared.fetchWithTimeout as jest.MockedFunction<typeof shared.fetchWithTimeout>;
    adapter = new MLBAdapter();
  });

  describe('getTeams', () => {
    it('should fetch and transform teams successfully', async () => {
      const mockResponse = {
        teams: [
          {
            id: 147,
            name: 'New York Yankees',
            abbreviation: 'NYY',
            locationName: 'New York',
            division: { name: 'American League East' },
            league: { name: 'American League' },
          },
          {
            id: 119,
            name: 'Los Angeles Dodgers',
            abbreviation: 'LAD',
            locationName: 'Los Angeles',
            division: { name: 'National League West' },
            league: { name: 'National League' },
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await adapter.getTeams();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://statsapi.mlb.com/api/v1/teams?sportId=1',
        {},
        10000
      );

      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual({
        id: '147',
        name: 'New York Yankees',
        abbreviation: 'NYY',
        city: 'New York',
        logo: 'https://www.mlbstatic.com/team-logos/147.svg',
        division: 'American League East',
        conference: 'American League',
      });

      expect(result.source.provider).toBe('MLB Stats API');
      expect(result.source.confidence).toBe(1.0);
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error',
      } as Response);

      await expect(adapter.getTeams()).rejects.toThrow('MLB API error: Internal Server Error');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(adapter.getTeams()).rejects.toThrow('Network error');
    });
  });

  describe('getStandings', () => {
    const mockStandingsResponse = {
      records: [
        {
          teamRecords: [
            {
              team: {
                id: 147,
                name: 'New York Yankees',
                abbreviation: 'NYY',
                locationName: 'New York',
              },
              wins: 95,
              losses: 67,
              winningPercentage: '0.586',
              gamesBack: '0',
              streak: { streakCode: 'W3' },
              records: {
                splitRecords: [
                  { type: 'lastTen', record: '7-3' },
                ],
              },
            },
            {
              team: {
                id: 110,
                name: 'Baltimore Orioles',
                abbreviation: 'BAL',
                locationName: 'Baltimore',
              },
              wins: 90,
              losses: 72,
              winningPercentage: '0.556',
              gamesBack: '5',
              streak: { streakCode: 'L1' },
              records: {
                splitRecords: [
                  { type: 'lastTen', record: '5-5' },
                ],
              },
            },
          ],
        },
      ],
    };

    const currentSeason = (() => {
      const now = new Date();
      const month = now.getMonth();
      return month >= 10 ? now.getFullYear() + 1 : now.getFullYear();
    })();

    it('should fetch all standings without divisionId', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockStandingsResponse,
      } as Response);

      const result = await adapter.getStandings();

      expect(mockFetch).toHaveBeenCalledWith(
        `https://statsapi.mlb.com/api/v1/standings?leagueId=103,104&season=${currentSeason}&standingsTypes=regularSeason`,
        {},
        10000
      );

      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toMatchObject({
        team: {
          id: '147',
          name: 'New York Yankees',
          abbreviation: 'NYY',
          city: 'New York',
        },
        wins: 95,
        losses: 67,
        winPercentage: 0.586,
        gamesBack: 0,
        streak: 'W3',
        lastTen: '7-3',
      });
    });

    it('should fetch standings for specific division', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockStandingsResponse,
      } as Response);

      const result = await adapter.getStandings('201');

      expect(mockFetch).toHaveBeenCalledWith(
        `https://statsapi.mlb.com/api/v1/standings?leagueId=103,104&season=${currentSeason}&standingsTypes=regularSeason&divisionId=201`,
        {},
        10000
      );

      expect(result.data).toHaveLength(2);
    });

    it('should handle empty standings', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ records: [] }),
      } as Response);

      const result = await adapter.getStandings();

      expect(result.data).toEqual([]);
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Service Unavailable',
      } as Response);

      await expect(adapter.getStandings()).rejects.toThrow('MLB API error: Service Unavailable');
    });
  });

  describe('getGames', () => {
    const mockGamesResponse = {
      dates: [
        {
          games: [
            {
              gamePk: 746801,
              gameDate: '2025-01-13T18:10:00Z',
              status: { statusCode: 'P' },
              teams: {
                home: {
                  team: {
                    id: 147,
                    name: 'New York Yankees',
                    abbreviation: 'NYY',
                    locationName: 'New York',
                  },
                  score: 0,
                },
                away: {
                  team: {
                    id: 117,
                    name: 'Houston Astros',
                    abbreviation: 'HOU',
                    locationName: 'Houston',
                  },
                  score: 0,
                },
              },
              venue: { name: 'Yankee Stadium' },
              broadcasts: [{ name: 'YES Network' }, { name: 'ESPN' }],
              probablePitchers: {
                home: {
                  id: 543243,
                  firstName: 'Gerrit',
                  lastName: 'Cole',
                  pitchHand: { code: 'R', description: 'Right' },
                  stats: {
                    pitching: {
                      wins: 15,
                      losses: 8,
                      era: 3.20,
                    },
                  },
                },
                away: {
                  id: 621121,
                  firstName: 'Framber',
                  lastName: 'Valdez',
                  pitchHand: { code: 'L', description: 'Left' },
                  stats: {
                    pitching: {
                      wins: 12,
                      losses: 10,
                      era: 3.45,
                    },
                  },
                },
              },
              linescore: {
                currentInning: 5,
                inningState: 'Top',
                inningHalf: 'Top',
                innings: [
                  { num: 1, home: { runs: 0 }, away: { runs: 1 } },
                  { num: 2, home: { runs: 2 }, away: { runs: 0 } },
                ],
                teams: {
                  home: { runs: 2, hits: 5, errors: 0 },
                  away: { runs: 1, hits: 3, errors: 1 },
                },
              },
            },
          ],
        },
      ],
    };

    it('should fetch games for today by default', async () => {
      const today = new Date().toISOString().split('T')[0];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockGamesResponse,
      } as Response);

      const result = await adapter.getGames();

      expect(mockFetch).toHaveBeenCalledWith(
        `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today}`,
        {},
        10000
      );

      expect(result.data).toHaveLength(1);
    });

    it('should fetch games for specific date', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockGamesResponse,
      } as Response);

      const result = await adapter.getGames('2025-01-13');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=2025-01-13',
        {},
        10000
      );

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        id: '746801',
        sport: 'MLB',
        date: '2025-01-13T18:10:00Z',
        status: 'scheduled',
        homeTeam: {
          id: '147',
          name: 'New York Yankees',
          abbreviation: 'NYY',
          city: 'New York',
        },
        awayTeam: {
          id: '117',
          name: 'Houston Astros',
          abbreviation: 'HOU',
          city: 'Houston',
        },
        homeScore: 0,
        awayScore: 0,
        venue: 'Yankee Stadium',
      });
    });

    it('should transform game data correctly', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockGamesResponse,
      } as Response);

      const result = await adapter.getGames('2025-01-13');
      const game = result.data[0];

      expect(game.broadcasters).toEqual(['YES Network', 'ESPN']);
      expect(game.probablePitchers).toMatchObject({
        home: {
          name: 'Gerrit Cole',
          throws: 'Right',
          wins: 15,
          losses: 8,
          era: 3.20,
        },
        away: {
          name: 'Framber Valdez',
          throws: 'Left',
          wins: 12,
          losses: 10,
          era: 3.45,
        },
      });
      expect(game.linescore).toMatchObject({
        currentInning: 5,
        inningState: 'Top',
        innings: [
          { number: 1, home: 0, away: 1 },
          { number: 2, home: 2, away: 0 },
        ],
        totals: {
          home: { runs: 2, hits: 5, errors: 0 },
          away: { runs: 1, hits: 3, errors: 1 },
        },
      });
    });

    it('should handle games without probable pitchers', async () => {
      const responseWithoutPitchers = {
        dates: [
          {
            games: [
              {
                ...mockGamesResponse.dates[0].games[0],
                probablePitchers: {},
              },
            ],
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => responseWithoutPitchers,
      } as Response);

      const result = await adapter.getGames('2025-01-13');

      expect(result.data[0].probablePitchers).toBeUndefined();
    });

    it('should handle games without linescore', async () => {
      const responseWithoutLinescore = {
        dates: [
          {
            games: [
              {
                ...mockGamesResponse.dates[0].games[0],
                linescore: undefined,
              },
            ],
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => responseWithoutLinescore,
      } as Response);

      const result = await adapter.getGames('2025-01-13');

      expect(result.data[0].linescore).toBeUndefined();
    });

    it('should handle empty game schedule', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ dates: [] }),
      } as Response);

      const result = await adapter.getGames('2025-01-13');

      expect(result.data).toEqual([]);
    });

    it('should map different game statuses correctly', async () => {
      const statuses = [
        { code: 'F', expected: 'final' },
        { code: 'FT', expected: 'final' },
        { code: 'FR', expected: 'final' },
        { code: 'I', expected: 'live' },
        { code: 'IR', expected: 'live' },
        { code: 'IA', expected: 'live' },
        { code: 'P', expected: 'scheduled' },
        { code: 'S', expected: 'scheduled' },
        { code: 'PR', expected: 'scheduled' },
        { code: 'PP', expected: 'postponed' },
        { code: 'PO', expected: 'postponed' },
        { code: 'C', expected: 'cancelled' },
        { code: 'UNKNOWN', expected: 'scheduled' },
      ];

      for (const { code, expected } of statuses) {
        const response = {
          dates: [
            {
              games: [
                {
                  ...mockGamesResponse.dates[0].games[0],
                  status: { statusCode: code },
                },
              ],
            },
          ],
        };

        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => response,
        } as Response);

        const result = await adapter.getGames('2025-01-13');

        expect(result.data[0].status).toBe(expected);
      }
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Bad Request',
      } as Response);

      await expect(adapter.getGames('2025-01-13')).rejects.toThrow('MLB API error: Bad Request');
    });
  });

  describe('getBoxScore', () => {
    const mockLinescoreResponse = {
      gameDate: '2025-01-13T18:10:00Z',
      currentInning: 7,
      inningHalf: 'Top',
      game: { status: { statusCode: 'I' } },
      teams: {
        home: {
          runs: 2,
          hits: 5,
          errors: 0,
          team: {
            id: 147,
            name: 'New York Yankees',
            abbreviation: 'NYY',
            locationName: 'New York',
            teamCode: 'NYY',
          },
        },
        away: {
          runs: 3,
          hits: 6,
          errors: 1,
          team: {
            id: 117,
            name: 'Houston Astros',
            abbreviation: 'HOU',
            locationName: 'Houston',
            teamCode: 'HOU',
          },
        },
      },
      innings: [
        { num: 1, home: { runs: 0 }, away: { runs: 1 } },
        { num: 2, home: { runs: 1 }, away: { runs: 0 } },
      ],
    };

    it('should normalize box score linescore and teams', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockLinescoreResponse,
      } as Response);

      const result = await adapter.getBoxScore('746801');

      expect(result.data).toMatchObject({
        id: '746801',
        sport: 'MLB',
        status: 'live',
        homeTeam: expect.objectContaining({ abbreviation: 'NYY' }),
        awayTeam: expect.objectContaining({ abbreviation: 'HOU' }),
        homeScore: 2,
        awayScore: 3,
      });

      expect(result.data.linescore?.totals.home.runs).toBe(2);
      expect(result.data.linescore?.innings).toHaveLength(2);
    });
  });

  describe('pitcher info transformation', () => {
    it('should handle pitchers with missing names', async () => {
      const responseWithIncompletePitcher = {
        dates: [
          {
            games: [
              {
                gamePk: 746801,
                gameDate: '2025-01-13T18:10:00Z',
                status: { statusCode: 'P' },
                teams: {
                  home: {
                    team: { id: 147, name: 'Yankees', abbreviation: 'NYY', locationName: 'New York' },
                    score: 0,
                  },
                  away: {
                    team: { id: 117, name: 'Astros', abbreviation: 'HOU', locationName: 'Houston' },
                    score: 0,
                  },
                },
                probablePitchers: {
                  home: {
                    id: 543243,
                    // Missing firstName and lastName
                    pitchHand: { code: 'R' },
                  },
                  away: null,
                },
              },
            ],
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => responseWithIncompletePitcher,
      } as Response);

      const result = await adapter.getGames('2025-01-13');

      expect(result.data[0].probablePitchers).toBeUndefined();
    });

    it('should handle pitchers with only partial stats', async () => {
      const responseWithPartialStats = {
        dates: [
          {
            games: [
              {
                gamePk: 746801,
                gameDate: '2025-01-13T18:10:00Z',
                status: { statusCode: 'P' },
                teams: {
                  home: {
                    team: { id: 147, name: 'Yankees', abbreviation: 'NYY', locationName: 'New York' },
                    score: 0,
                  },
                  away: {
                    team: { id: 117, name: 'Astros', abbreviation: 'HOU', locationName: 'Houston' },
                    score: 0,
                  },
                },
                probablePitchers: {
                  home: {
                    id: 543243,
                    firstName: 'Gerrit',
                    lastName: 'Cole',
                    pitchHand: { code: 'R' },
                    stats: {
                      pitching: {
                        wins: null,
                        losses: undefined,
                        era: '3.20',
                      },
                    },
                  },
                },
              },
            ],
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => responseWithPartialStats,
      } as Response);

      const result = await adapter.getGames('2025-01-13');

      expect(result.data[0].probablePitchers?.home).toMatchObject({
        name: 'Gerrit Cole',
        throws: 'R',
        wins: undefined,
        losses: undefined,
        era: 3.20,
      });
    });
  });

  describe('source metadata', () => {
    it('should include correct source information in all responses', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ teams: [] }),
      } as Response);

      const result = await adapter.getTeams();

      expect(result.source).toEqual({
        provider: 'MLB Stats API',
        timestamp: '2025-01-13T12:00:00-06:00',
        confidence: 1.0,
      });
    });
  });
});
