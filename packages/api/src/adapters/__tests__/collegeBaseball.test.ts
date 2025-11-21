/**
 * Tests for College Baseball Data Adapter
 * PRIORITY: #1 Feature - Fill ESPN gap with full box scores
 */

import { CollegeBaseballAdapter } from '../collegeBaseball';

// Mock the shared utilities
jest.mock('@bsi/shared', () => ({
  ...jest.requireActual('@bsi/shared'),
  validateApiKey: jest.fn((key: string | undefined) => key || 'mock-api-key'),
  retryWithBackoff: jest.fn((fn) => fn()),
  getChicagoTimestamp: jest.fn(() => '2025-01-13T12:00:00-06:00'),
}));

// Mock global fetch
global.fetch = jest.fn();

describe('CollegeBaseballAdapter', () => {
  let adapter: CollegeBaseballAdapter;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    adapter = new CollegeBaseballAdapter();
  });

  describe('getTeams', () => {
    it('should fetch and transform teams successfully', async () => {
      const mockResponse = {
        sports: [
          {
            leagues: [
              {
                teams: [
                  {
                    team: {
                      id: '2305',
                      displayName: 'Texas Longhorns',
                      abbreviation: 'TEX',
                      location: 'Texas',
                      logos: [{ href: 'https://example.com/texas.png' }],
                      groups: [{ name: 'Big 12' }],
                    },
                  },
                  {
                    team: {
                      id: '57',
                      displayName: 'Florida Gators',
                      abbreviation: 'FLA',
                      location: 'Florida',
                      logos: [{ href: 'https://example.com/florida.png' }],
                      groups: [{ name: 'SEC' }],
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await adapter.getTeams();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams',
        {
          headers: {
            'User-Agent': 'BlazeSportsIntel/1.0',
            'Accept': 'application/json',
          },
        }
      );

      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual({
        id: '2305',
        name: 'Texas Longhorns',
        abbreviation: 'TEX',
        city: 'Texas',
        logo: 'https://example.com/texas.png',
        conference: 'Big 12',
      });

      expect(result.source.provider).toBe('ESPN API');
      expect(result.source.confidence).toBe(0.95);
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Service Unavailable',
      } as Response);

      await expect(adapter.getTeams()).rejects.toThrow('ESPN API error: Service Unavailable');
    });

    it('should handle empty team list', async () => {
      const mockResponse = {
        sports: [{ leagues: [{ teams: [] }] }],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await adapter.getTeams();

      expect(result.data).toHaveLength(0);
    });

    it('should handle missing nested data gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ sports: [] }),
      } as Response);

      const result = await adapter.getTeams();

      expect(result.data).toHaveLength(0);
    });
  });

  describe('getGames', () => {
    const mockScoreboardResponse = {
      events: [
        {
          id: '401520001',
          date: '2025-01-13T14:00:00Z',
          status: {
            type: { name: 'STATUS.TYPE.SCHEDULED' },
            period: null,
          },
          competitions: [
            {
              competitors: [
                {
                  homeAway: 'home',
                  team: {
                    id: '2305',
                    displayName: 'Texas Longhorns',
                    abbreviation: 'TEX',
                    location: 'Texas',
                    logo: 'https://example.com/texas.png',
                  },
                  score: '0',
                },
                {
                  homeAway: 'away',
                  team: {
                    id: '57',
                    displayName: 'Florida Gators',
                    abbreviation: 'FLA',
                    location: 'Florida',
                    logo: 'https://example.com/florida.png',
                  },
                  score: '0',
                },
              ],
              venue: {
                fullName: 'UFCU Disch-Falk Field',
              },
            },
          ],
        },
      ],
    };

    it('should fetch and transform games successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockScoreboardResponse,
      } as Response);

      const result = await adapter.getGames({ date: '2025-01-13' });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard?dates=20250113',
        {
          headers: {
            'User-Agent': 'BlazeSportsIntel/1.0',
            'Accept': 'application/json',
          },
        }
      );

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({
        id: '401520001',
        sport: 'COLLEGE_BASEBALL',
        date: '2025-01-13T14:00:00Z',
        status: 'scheduled',
        homeTeam: {
          id: '2305',
          name: 'Texas Longhorns',
          abbreviation: 'TEX',
          city: 'Texas',
          logo: 'https://example.com/texas.png',
        },
        awayTeam: {
          id: '57',
          name: 'Florida Gators',
          abbreviation: 'FLA',
          city: 'Florida',
          logo: 'https://example.com/florida.png',
        },
        homeScore: 0,
        awayScore: 0,
        period: undefined,
        venue: 'UFCU Disch-Falk Field',
      });

      expect(result.source.provider).toBe('ESPN API + Blaze Box Score Enhancement');
      expect(result.source.confidence).toBe(0.95);
    });

    it('should fetch box scores for final games', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const mockFinalGame = {
        events: [
          {
            id: '401520002',
            date: '2025-01-13T14:00:00Z',
            status: {
              type: { name: 'STATUS.TYPE.FINAL' },
              period: 9,
            },
            competitions: [
              {
                competitors: [
                  {
                    homeAway: 'home',
                    team: {
                      id: '2305',
                      displayName: 'Texas',
                      abbreviation: 'TEX',
                      location: 'Texas',
                      logo: '',
                    },
                    score: '5',
                  },
                  {
                    homeAway: 'away',
                    team: {
                      id: '57',
                      displayName: 'Florida',
                      abbreviation: 'FLA',
                      location: 'Florida',
                      logo: '',
                    },
                    score: '3',
                  },
                ],
                venue: { fullName: 'Test Field' },
              },
            ],
          },
        ],
      };

      const mockBoxScore = {
        boxscore: {
          players: [
            {
              statistics: [
                {
                  name: 'Batting',
                  athletes: [
                    {
                      athlete: {
                        displayName: 'John Doe',
                        position: { abbreviation: 'SS' },
                      },
                      stats: ['4', '2', '3', '2', '0', '1'],
                    },
                  ],
                },
                {
                  name: 'Pitching',
                  athletes: [
                    {
                      athlete: {
                        displayName: 'Jane Smith',
                        displayValue: 'W',
                      },
                      stats: ['7.0', '3', '2', '1', '1', '8'],
                    },
                  ],
                },
              ],
            },
          ],
        },
      };

      // First call for scoreboard
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFinalGame,
      } as Response);

      // Second call for box score
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBoxScore,
      } as Response);

      const result = await adapter.getGames({ date: '2025-01-13' });

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].status).toBe('final');

      // Box score should be attached to game
      const gameWithBoxScore = result.data[0] as any;
      expect(gameWithBoxScore.boxScore).toBeDefined();
      expect(gameWithBoxScore.boxScore.battingLines).toHaveLength(1);
      expect(gameWithBoxScore.boxScore.battingLines[0]).toEqual({
        name: 'John Doe',
        position: 'SS',
        atBats: 4,
        runs: 2,
        hits: 3,
        rbi: 2,
        walks: 0,
        strikeouts: 1,
        avg: '0.750',
      });

      expect(gameWithBoxScore.boxScore.pitchingLines).toHaveLength(1);
      expect(gameWithBoxScore.boxScore.pitchingLines[0]).toEqual({
        name: 'Jane Smith',
        decision: 'W',
        inningsPitched: 7.0,
        hits: 3,
        runs: 2,
        earnedRuns: 1,
        walks: 1,
        strikeouts: 8,
        era: '1.29',
      });

      consoleSpy.mockRestore();
    });

    it('should fetch box scores for live games', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const mockLiveGame = {
        events: [
          {
            id: '401520003',
            date: '2025-01-13T14:00:00Z',
            status: {
              type: { name: 'STATUS.TYPE.INPROGRESS' },
              period: 5,
            },
            competitions: [
              {
                competitors: [
                  {
                    homeAway: 'home',
                    team: {
                      id: '2305',
                      displayName: 'Texas',
                      abbreviation: 'TEX',
                      location: 'Texas',
                      logo: '',
                    },
                    score: '3',
                  },
                  {
                    homeAway: 'away',
                    team: {
                      id: '57',
                      displayName: 'Florida',
                      abbreviation: 'FLA',
                      location: 'Florida',
                      logo: '',
                    },
                    score: '2',
                  },
                ],
                venue: { fullName: 'Test Field' },
              },
            ],
          },
        ],
      };

      // First call for scoreboard
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLiveGame,
      } as Response);

      // Second call for box score
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ boxscore: { players: [] } }),
      } as Response);

      const result = await adapter.getGames({ date: '2025-01-13' });

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.data[0].status).toBe('live');
      expect(result.data[0].period).toBe('Inning 5');

      consoleSpy.mockRestore();
    });

    it('should handle box score fetch errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const mockFinalGame = {
        events: [
          {
            id: '401520004',
            date: '2025-01-13T14:00:00Z',
            status: {
              type: { name: 'STATUS.TYPE.FINAL' },
              period: 9,
            },
            competitions: [
              {
                competitors: [
                  {
                    homeAway: 'home',
                    team: { id: '1', displayName: 'Team A', abbreviation: 'A', location: 'City A', logo: '' },
                    score: '5',
                  },
                  {
                    homeAway: 'away',
                    team: { id: '2', displayName: 'Team B', abbreviation: 'B', location: 'City B', logo: '' },
                    score: '3',
                  },
                ],
                venue: { fullName: 'Test Field' },
              },
            ],
          },
        ],
      };

      // Scoreboard succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFinalGame,
      } as Response);

      // Box score fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      } as Response);

      const result = await adapter.getGames({ date: '2025-01-13' });

      expect(result.data).toHaveLength(1);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should use current date when no date provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ events: [] }),
      } as Response);

      await adapter.getGames();

      const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`dates=${today}`),
        expect.any(Object)
      );
    });

    it('should handle empty games list', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ events: [] }),
      } as Response);

      const result = await adapter.getGames({ date: '2025-01-13' });

      expect(result.data).toHaveLength(0);
    });
  });

  describe('getStandings', () => {
    const mockStandingsResponse = {
      standings: [
        {
          name: 'Big 12',
          standings: {
            entries: [
              {
                team: {
                  id: '2305',
                  displayName: 'Texas Longhorns',
                  abbreviation: 'TEX',
                  location: 'Texas',
                  logos: [{ href: 'https://example.com/texas.png' }],
                },
                stats: [
                  { name: 'wins', value: 35 },
                  { name: 'losses', value: 10 },
                  { name: 'gamesBehind', value: 0 },
                  { name: 'streak', displayValue: 'W5' },
                  { name: 'L10', displayValue: '8-2' },
                ],
              },
              {
                team: {
                  id: '197',
                  displayName: 'Oklahoma Sooners',
                  abbreviation: 'OU',
                  location: 'Oklahoma',
                  logos: [{ href: 'https://example.com/oklahoma.png' }],
                },
                stats: [
                  { name: 'wins', value: 32 },
                  { name: 'losses', value: 13 },
                  { name: 'gamesBehind', value: 3 },
                  { name: 'streak', displayValue: 'L2' },
                  { name: 'L10', displayValue: '6-4' },
                ],
              },
            ],
          },
        },
      ],
    };

    it('should fetch and transform standings successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockStandingsResponse,
      } as Response);

      const result = await adapter.getStandings();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/standings',
        {
          headers: {
            'User-Agent': 'BlazeSportsIntel/1.0',
            'Accept': 'application/json',
          },
        }
      );

      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual({
        team: {
          id: '2305',
          name: 'Texas Longhorns',
          abbreviation: 'TEX',
          city: 'Texas',
          logo: 'https://example.com/texas.png',
          conference: 'Big 12',
        },
        wins: 35,
        losses: 10,
        winPercentage: 35 / 45,
        gamesBack: 0,
        streak: 'W5',
        lastTen: '8-2',
      });

      expect(result.source.provider).toBe('ESPN API');
      expect(result.source.confidence).toBe(0.9);
    });

    it('should filter by conference', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockStandingsResponse,
      } as Response);

      await adapter.getStandings('SEC');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/standings?group=SEC',
        expect.any(Object)
      );
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error',
      } as Response);

      await expect(adapter.getStandings()).rejects.toThrow('ESPN API error: Internal Server Error');
    });

    it('should handle empty standings', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ standings: [] }),
      } as Response);

      const result = await adapter.getStandings();

      expect(result.data).toHaveLength(0);
    });

    it('should handle missing stats gracefully', async () => {
      const mockData = {
        standings: [
          {
            name: 'Big 12',
            standings: {
              entries: [
                {
                  team: {
                    id: '1',
                    displayName: 'Team A',
                    abbreviation: 'A',
                    location: 'City A',
                    logos: [],
                  },
                  stats: [],
                },
              ],
            },
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await adapter.getStandings();

      expect(result.data).toHaveLength(1);
      expect(result.data[0].wins).toBe(0);
      expect(result.data[0].losses).toBe(0);
      expect(result.data[0].winPercentage).toBe(0);
    });
  });

  describe('mapGameStatus', () => {
    it('should map various game statuses correctly', async () => {
      const statusTests = [
        { input: 'STATUS.TYPE.FINAL', expected: 'final' },
        { input: 'STATUS.TYPE.INPROGRESS', expected: 'live' },
        { input: 'STATUS.TYPE.SCHEDULED', expected: 'scheduled' },
        { input: 'STATUS.TYPE.PRE', expected: 'scheduled' },
        { input: 'STATUS.TYPE.POSTPONED', expected: 'postponed' },
        { input: 'STATUS.TYPE.CANCELED', expected: 'cancelled' },
        { input: 'UNKNOWN', expected: 'scheduled' },
      ];

      for (const test of statusTests) {
        const mockData = {
          events: [
            {
              id: '1',
              date: '2025-01-13T14:00:00Z',
              status: { type: { name: test.input }, period: null },
              competitions: [
                {
                  competitors: [
                    {
                      homeAway: 'home',
                      team: { id: '1', displayName: 'A', abbreviation: 'A', location: '', logo: '' },
                      score: '0',
                    },
                    {
                      homeAway: 'away',
                      team: { id: '2', displayName: 'B', abbreviation: 'B', location: '', logo: '' },
                      score: '0',
                    },
                  ],
                  venue: null,
                },
              ],
            },
          ],
        };

        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => mockData,
        } as Response);

        const result = await adapter.getGames({ date: '2025-01-13' });
        expect(result.data[0].status).toBe(test.expected);
      }
    });
  });

  describe('box score calculations', () => {
    it('should calculate batting average correctly', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const mockGame = {
        events: [
          {
            id: '1',
            date: '2025-01-13T14:00:00Z',
            status: { type: { name: 'STATUS.TYPE.FINAL' }, period: 9 },
            competitions: [
              {
                competitors: [
                  { homeAway: 'home', team: { id: '1', displayName: 'A', abbreviation: 'A', location: '', logo: '' }, score: '5' },
                  { homeAway: 'away', team: { id: '2', displayName: 'B', abbreviation: 'B', location: '', logo: '' }, score: '3' },
                ],
                venue: null,
              },
            ],
          },
        ],
      };

      const mockBoxScore = {
        boxscore: {
          players: [
            {
              statistics: [
                {
                  name: 'Batting',
                  athletes: [
                    {
                      athlete: { displayName: 'Player A', position: { abbreviation: '1B' } },
                      stats: ['0', '0', '0', '0', '0', '0'], // 0 AB
                    },
                  ],
                },
              ],
            },
          ],
        },
      };

      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockGame } as Response);
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockBoxScore } as Response);

      const result = await adapter.getGames({ date: '2025-01-13' });
      const gameWithBoxScore = result.data[0] as any;

      expect(gameWithBoxScore.boxScore.battingLines[0].avg).toBe('.000');

      consoleSpy.mockRestore();
    });

    it('should calculate ERA correctly', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const mockGame = {
        events: [
          {
            id: '1',
            date: '2025-01-13T14:00:00Z',
            status: { type: { name: 'STATUS.TYPE.FINAL' }, period: 9 },
            competitions: [
              {
                competitors: [
                  { homeAway: 'home', team: { id: '1', displayName: 'A', abbreviation: 'A', location: '', logo: '' }, score: '5' },
                  { homeAway: 'away', team: { id: '2', displayName: 'B', abbreviation: 'B', location: '', logo: '' }, score: '3' },
                ],
                venue: null,
              },
            ],
          },
        ],
      };

      const mockBoxScore = {
        boxscore: {
          players: [
            {
              statistics: [
                {
                  name: 'Pitching',
                  athletes: [
                    {
                      athlete: { displayName: 'Pitcher A', displayValue: 'W' },
                      stats: ['0', '0', '0', '0', '0', '0'], // 0 IP
                    },
                  ],
                },
              ],
            },
          ],
        },
      };

      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockGame } as Response);
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockBoxScore } as Response);

      const result = await adapter.getGames({ date: '2025-01-13' });
      const gameWithBoxScore = result.data[0] as any;

      expect(gameWithBoxScore.boxScore.pitchingLines[0].era).toBe('0.00');

      consoleSpy.mockRestore();
    });
  });
});
