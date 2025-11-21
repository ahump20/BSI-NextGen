/**
 * Tests for NCAA Football Data Adapter
 * Uses ESPN API for college football data
 */

import { NCAAFootballAdapter } from '../ncaaFootball';
import * as shared from '@bsi/shared';

// Mock the shared utilities
jest.mock('@bsi/shared', () => ({
  ...jest.requireActual('@bsi/shared'),
  retryWithBackoff: jest.fn((fn) => fn()),
  getChicagoTimestamp: jest.fn(() => '2025-01-13T12:00:00-06:00'),
}));

// Mock global fetch
global.fetch = jest.fn();

describe('NCAAFootballAdapter', () => {
  let adapter: NCAAFootballAdapter;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    adapter = new NCAAFootballAdapter();
  });

  describe('getTeams', () => {
    const mockTeamsResponse = {
      sports: [
        {
          leagues: [
            {
              teams: [
                {
                  team: {
                    id: '333',
                    displayName: 'Alabama Crimson Tide',
                    abbreviation: 'ALA',
                    location: 'Alabama',
                    logos: [{ href: 'https://example.com/alabama.png' }],
                    groups: [{ name: 'SEC' }],
                  },
                },
                {
                  team: {
                    id: '2305',
                    displayName: 'Texas Longhorns',
                    abbreviation: 'TEX',
                    location: 'Texas',
                    logos: [{ href: 'https://example.com/texas.png' }],
                    groups: [{ name: 'SEC' }],
                  },
                },
              ],
            },
          ],
        },
      ],
    };

    it('should fetch FBS teams by default', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockTeamsResponse,
      } as Response);

      const result = await adapter.getTeams();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams?group=80',
        {
          headers: {
            'User-Agent': 'BlazeSportsIntel/1.0',
            'Accept': 'application/json',
          },
        }
      );

      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual({
        id: '333',
        name: 'Alabama Crimson Tide',
        abbreviation: 'ALA',
        city: 'Alabama',
        logo: 'https://example.com/alabama.png',
        conference: 'SEC',
      });

      expect(result.source.provider).toBe('ESPN API');
      expect(result.source.confidence).toBe(1.0);
    });

    it('should fetch teams for specific group', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockTeamsResponse,
      } as Response);

      await adapter.getTeams('81'); // FCS

      expect(mockFetch).toHaveBeenCalledWith(
        'https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams?group=81',
        expect.any(Object)
      );
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Service Unavailable',
      } as Response);

      await expect(adapter.getTeams()).rejects.toThrow('ESPN API error: Service Unavailable');
    });

    it('should handle empty team list', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ sports: [{ leagues: [{ teams: [] }] }] }),
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

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(adapter.getTeams()).rejects.toThrow('Network error');
    });
  });

  describe('getStandings', () => {
    const mockStandingsResponse = {
      children: [
        {
          name: 'SEC',
          standings: {
            entries: [
              {
                team: {
                  id: '333',
                  displayName: 'Alabama',
                  abbreviation: 'ALA',
                  location: 'Alabama',
                  logos: [{ href: 'https://example.com/alabama.png' }],
                },
                stats: [
                  { name: 'wins', value: '11' },
                  { name: 'losses', value: '2' },
                  { name: 'winPercent', value: '0.846' },
                  { name: 'streak', displayValue: 'W3' },
                ],
              },
              {
                team: {
                  id: '2305',
                  displayName: 'Texas',
                  abbreviation: 'TEX',
                  location: 'Texas',
                  logos: [{ href: 'https://example.com/texas.png' }],
                },
                stats: [
                  { name: 'wins', value: '10' },
                  { name: 'losses', value: '3' },
                  { name: 'winPercent', value: '0.769' },
                  { name: 'streak', displayValue: 'L1' },
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
        'https://site.api.espn.com/apis/site/v2/sports/football/college-football/standings',
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
          id: '333',
          name: 'Alabama',
          abbreviation: 'ALA',
          city: 'Alabama',
          logo: 'https://example.com/alabama.png',
          conference: 'SEC',
        },
        wins: 11,
        losses: 2,
        winPercentage: 0.846,
        streak: 'W3',
      });

      expect(result.source.provider).toBe('ESPN API');
      expect(result.source.confidence).toBe(1.0);
    });

    it('should filter standings by conference', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockStandingsResponse,
      } as Response);

      await adapter.getStandings('SEC');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://site.api.espn.com/apis/site/v2/sports/football/college-football/standings?group=SEC',
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
        json: async () => ({ children: [] }),
      } as Response);

      const result = await adapter.getStandings();

      expect(result.data).toHaveLength(0);
    });

    it('should handle missing stats gracefully', async () => {
      const mockData = {
        children: [
          {
            name: 'SEC',
            standings: {
              entries: [
                {
                  team: {
                    id: '333',
                    displayName: 'Alabama',
                    abbreviation: 'ALA',
                    location: 'Alabama',
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

  describe('getGames', () => {
    const mockGamesResponse = {
      events: [
        {
          id: '401520001',
          date: '2025-09-07T19:00:00Z',
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
                    id: '333',
                    displayName: 'Alabama',
                    abbreviation: 'ALA',
                    location: 'Alabama',
                    logo: 'https://example.com/alabama.png',
                  },
                  score: '0',
                },
                {
                  homeAway: 'away',
                  team: {
                    id: '2305',
                    displayName: 'Texas',
                    abbreviation: 'TEX',
                    location: 'Texas',
                    logo: 'https://example.com/texas.png',
                  },
                  score: '0',
                },
              ],
              venue: {
                fullName: 'Bryant-Denny Stadium',
              },
            },
          ],
        },
      ],
    };

    it('should fetch games for current season when no params', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockGamesResponse,
      } as Response);

      const result = await adapter.getGames();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard',
        expect.any(Object)
      );

      expect(result.data).toHaveLength(1);
    });

    it('should fetch games for specific week (object params)', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockGamesResponse,
      } as Response);

      const result = await adapter.getGames({ week: 5 });

      const fetchUrl = (mockFetch.mock.calls[0][0] as string);
      expect(fetchUrl).toContain('week=5');
      expect(fetchUrl).toContain('seasontype=2');
      expect(fetchUrl).toMatch(/year=\d{4}/);
    });

    it('should fetch games for specific week and season', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockGamesResponse,
      } as Response);

      await adapter.getGames({ week: 5, season: 2024 });

      const fetchUrl = (mockFetch.mock.calls[0][0] as string);
      expect(fetchUrl).toContain('week=5');
      expect(fetchUrl).toContain('year=2024');
    });

    it('should support legacy number parameter for week', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockGamesResponse,
      } as Response);

      await adapter.getGames(5);

      const fetchUrl = (mockFetch.mock.calls[0][0] as string);
      expect(fetchUrl).toContain('week=5');
    });

    it('should transform games correctly', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockGamesResponse,
      } as Response);

      const result = await adapter.getGames({ week: 1 });

      expect(result.data[0]).toEqual({
        id: '401520001',
        sport: 'NCAA_FOOTBALL',
        date: '2025-09-07T19:00:00Z',
        status: 'scheduled',
        homeTeam: {
          id: '333',
          name: 'Alabama',
          abbreviation: 'ALA',
          city: 'Alabama',
          logo: 'https://example.com/alabama.png',
        },
        awayTeam: {
          id: '2305',
          name: 'Texas',
          abbreviation: 'TEX',
          city: 'Texas',
          logo: 'https://example.com/texas.png',
        },
        homeScore: 0,
        awayScore: 0,
        period: undefined,
        venue: 'Bryant-Denny Stadium',
      });

      expect(result.source.provider).toBe('ESPN API');
    });

    it('should handle live games with scores and periods', async () => {
      const liveGame = {
        events: [
          {
            id: '401520002',
            date: '2025-09-07T19:00:00Z',
            status: {
              type: { name: 'STATUS.TYPE.INPROGRESS' },
              period: 3,
            },
            competitions: [
              {
                competitors: [
                  {
                    homeAway: 'home',
                    team: { id: '1', displayName: 'Team A', abbreviation: 'A', location: 'City A', logo: '' },
                    score: '21',
                  },
                  {
                    homeAway: 'away',
                    team: { id: '2', displayName: 'Team B', abbreviation: 'B', location: 'City B', logo: '' },
                    score: '17',
                  },
                ],
                venue: { fullName: 'Test Stadium' },
              },
            ],
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => liveGame,
      } as Response);

      const result = await adapter.getGames({ week: 1 });

      expect(result.data[0].status).toBe('live');
      expect(result.data[0].homeScore).toBe(21);
      expect(result.data[0].awayScore).toBe(17);
      expect(result.data[0].period).toBe('Q3');
    });

    it('should handle final games', async () => {
      const finalGame = {
        events: [
          {
            id: '401520003',
            date: '2025-09-07T19:00:00Z',
            status: {
              type: { name: 'STATUS.TYPE.FINAL' },
              period: 4,
            },
            competitions: [
              {
                competitors: [
                  {
                    homeAway: 'home',
                    team: { id: '1', displayName: 'Team A', abbreviation: 'A', location: 'City A', logo: '' },
                    score: '35',
                  },
                  {
                    homeAway: 'away',
                    team: { id: '2', displayName: 'Team B', abbreviation: 'B', location: 'City B', logo: '' },
                    score: '28',
                  },
                ],
                venue: { fullName: 'Test Stadium' },
              },
            ],
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => finalGame,
      } as Response);

      const result = await adapter.getGames({ week: 1 });

      expect(result.data[0].status).toBe('final');
      expect(result.data[0].homeScore).toBe(35);
      expect(result.data[0].awayScore).toBe(28);
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Not Found',
      } as Response);

      await expect(adapter.getGames({ week: 1 })).rejects.toThrow('ESPN API error: Not Found');
    });

    it('should handle empty games list', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ events: [] }),
      } as Response);

      const result = await adapter.getGames({ week: 1 });

      expect(result.data).toHaveLength(0);
    });

    it('should handle missing venue', async () => {
      const gameWithoutVenue = {
        events: [
          {
            id: '1',
            date: '2025-09-07T19:00:00Z',
            status: { type: { name: 'STATUS.TYPE.SCHEDULED' }, period: null },
            competitions: [
              {
                competitors: [
                  { homeAway: 'home', team: { id: '1', displayName: 'A', abbreviation: 'A', location: '', logo: '' }, score: '0' },
                  { homeAway: 'away', team: { id: '2', displayName: 'B', abbreviation: 'B', location: '', logo: '' }, score: '0' },
                ],
                venue: null,
              },
            ],
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => gameWithoutVenue,
      } as Response);

      const result = await adapter.getGames({ week: 1 });

      expect(result.data[0].venue).toBeUndefined();
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
        { input: 'UNKNOWN_STATUS', expected: 'scheduled' },
      ];

      for (const test of statusTests) {
        const mockData = {
          events: [
            {
              id: '1',
              date: '2025-09-07T19:00:00Z',
              status: { type: { name: test.input }, period: null },
              competitions: [
                {
                  competitors: [
                    { homeAway: 'home', team: { id: '1', displayName: 'A', abbreviation: 'A', location: '', logo: '' }, score: '0' },
                    { homeAway: 'away', team: { id: '2', displayName: 'B', abbreviation: 'B', location: '', logo: '' }, score: '0' },
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

        const result = await adapter.getGames({ week: 1 });
        expect(result.data[0].status).toBe(test.expected);
      }
    });
  });

  describe('getCurrentSeason', () => {
    it('should calculate season correctly for different months', async () => {
      // Mock date to test season calculation
      const realDate = Date;

      // Test August (start of season) - should use current year
      global.Date = jest.fn(() => new realDate('2025-08-01')) as any;
      global.Date.now = realDate.now;

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ events: [] }),
      } as Response);

      await adapter.getGames({ week: 1 });
      let fetchUrl = (mockFetch.mock.calls[0][0] as string);
      expect(fetchUrl).toContain('year=2025');

      // Test January (end of season) - should use previous year
      global.Date = jest.fn(() => new realDate('2025-01-15')) as any;
      global.Date.now = realDate.now;

      jest.clearAllMocks();
      await adapter.getGames({ week: 1 });
      fetchUrl = (mockFetch.mock.calls[0][0] as string);
      expect(fetchUrl).toContain('year=2024');

      // Restore original Date
      global.Date = realDate;
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing team data gracefully', async () => {
      const incompleteGame = {
        events: [
          {
            id: '1',
            date: '2025-09-07T19:00:00Z',
            status: { type: { name: 'STATUS.TYPE.SCHEDULED' }, period: null },
            competitions: [
              {
                competitors: [
                  { homeAway: 'home', team: {}, score: '0' },
                  { homeAway: 'away', team: {}, score: '0' },
                ],
                venue: null,
              },
            ],
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => incompleteGame,
      } as Response);

      const result = await adapter.getGames({ week: 1 });

      expect(result.data[0].homeTeam.id).toBe('');
      expect(result.data[0].awayTeam.id).toBe('');
    });

    it('should handle high scores', async () => {
      const highScoreGame = {
        events: [
          {
            id: '1',
            date: '2025-09-07T19:00:00Z',
            status: { type: { name: 'STATUS.TYPE.FINAL' }, period: 4 },
            competitions: [
              {
                competitors: [
                  { homeAway: 'home', team: { id: '1', displayName: 'A', abbreviation: 'A', location: '', logo: '' }, score: '77' },
                  { homeAway: 'away', team: { id: '2', displayName: 'B', abbreviation: 'B', location: '', logo: '' }, score: '70' },
                ],
                venue: null,
              },
            ],
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => highScoreGame,
      } as Response);

      const result = await adapter.getGames({ week: 1 });

      expect(result.data[0].homeScore).toBe(77);
      expect(result.data[0].awayScore).toBe(70);
    });
  });
});
