/**
 * Tests for NBA Data Adapter
 */

import { NBAAdapter } from '../nba';
import * as shared from '@bsi/shared';

// Mock the shared utilities
jest.mock('@bsi/shared', () => ({
  ...jest.requireActual('@bsi/shared'),
  validateApiKey: jest.fn((key: string | undefined) => key || 'mock-api-key'),
  fetchWithTimeout: jest.fn(),
  retryWithBackoff: jest.fn((fn) => fn()),
  getChicagoTimestamp: jest.fn(() => '2025-01-13T12:00:00-06:00'),
}));

// Mock global fetch
global.fetch = jest.fn();

describe('NBAAdapter', () => {
  let adapter: NBAAdapter;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    adapter = new NBAAdapter('test-api-key');
  });

  describe('getTeams', () => {
    it('should fetch and transform teams successfully', async () => {
      const mockResponse = [
        {
          TeamID: 1,
          Name: 'Los Angeles Lakers',
          Key: 'LAL',
          City: 'Los Angeles',
          WikipediaLogoUrl: 'https://example.com/lakers.png',
          Conference: 'Western',
          Division: 'Pacific',
        },
        {
          TeamID: 2,
          Name: 'Boston Celtics',
          Key: 'BOS',
          City: 'Boston',
          WikipediaLogoUrl: 'https://example.com/celtics.png',
          Conference: 'Eastern',
          Division: 'Atlantic',
        },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await adapter.getTeams();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.sportsdata.io/v3/nba/scores/json/Teams',
        {
          headers: {
            'Ocp-Apim-Subscription-Key': 'test-api-key',
          },
        }
      );

      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual({
        id: '1',
        name: 'Los Angeles Lakers',
        abbreviation: 'LAL',
        city: 'Los Angeles',
        logo: 'https://example.com/lakers.png',
        conference: 'Western',
        division: 'Pacific',
      });

      expect(result.source.provider).toBe('SportsDataIO');
      expect(result.source.confidence).toBe(1.0);
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Unauthorized',
      } as Response);

      await expect(adapter.getTeams()).rejects.toThrow('NBA API error: Unauthorized');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(adapter.getTeams()).rejects.toThrow('Network error');
    });

    it('should handle empty team list', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [],
      } as Response);

      const result = await adapter.getTeams();

      expect(result.data).toHaveLength(0);
      expect(result.source.provider).toBe('SportsDataIO');
    });
  });

  describe('getStandings', () => {
    const mockStandingsResponse = [
      {
        TeamID: 1,
        Name: 'Los Angeles Lakers',
        Key: 'LAL',
        City: 'Los Angeles',
        Conference: 'Western',
        Division: 'Pacific',
        Wins: 30,
        Losses: 15,
        Percentage: 0.667,
        ConferenceRank: 1,
        GamesBack: '0',
        Streak: 3,
      },
      {
        TeamID: 2,
        Name: 'Phoenix Suns',
        Key: 'PHX',
        City: 'Phoenix',
        Conference: 'Western',
        Division: 'Pacific',
        Wins: 28,
        Losses: 17,
        Percentage: 0.622,
        ConferenceRank: 2,
        GamesBack: '2.0',
        Streak: -1,
      },
    ];

    it('should fetch and transform standings for current season', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockStandingsResponse,
      } as Response);

      const result = await adapter.getStandings();

      expect(mockFetch).toHaveBeenCalled();
      const fetchUrl = (mockFetch.mock.calls[0][0] as string);
      expect(fetchUrl).toMatch(/https:\/\/api\.sportsdata\.io\/v3\/nba\/scores\/json\/Standings\/\d{4}/);

      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual({
        team: {
          id: '1',
          name: 'Los Angeles Lakers',
          abbreviation: 'LAL',
          city: 'Los Angeles',
          conference: 'Western',
          division: 'Pacific',
        },
        wins: 30,
        losses: 15,
        winPercentage: 0.667,
        gamesBack: 0, // First place has 0 games back
        streak: 3,
      });

      expect(result.data[1].gamesBack).toBe(2.0);
      expect(result.source.provider).toBe('SportsDataIO');

      consoleSpy.mockRestore();
    });

    it('should fetch standings for specific season', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockStandingsResponse,
      } as Response);

      await adapter.getStandings('2024');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.sportsdata.io/v3/nba/scores/json/Standings/2024',
        {
          headers: {
            'Ocp-Apim-Subscription-Key': 'test-api-key',
          },
        }
      );

      consoleSpy.mockRestore();
    });

    it('should handle API errors', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error',
      } as Response);

      await expect(adapter.getStandings()).rejects.toThrow('NBA API error: Internal Server Error');

      consoleSpy.mockRestore();
    });

    it('should handle missing GamesBack data', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const mockData = [
        {
          ...mockStandingsResponse[0],
          GamesBack: null,
        },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await adapter.getStandings();

      expect(result.data[0].gamesBack).toBe(0);

      consoleSpy.mockRestore();
    });
  });

  describe('getGames', () => {
    const mockGamesResponse = [
      {
        GameID: 12345,
        DateTime: '2025-01-13T19:00:00',
        Status: 'Scheduled',
        HomeTeamID: 1,
        HomeTeam: 'LAL',
        HomeTeamScore: null,
        AwayTeamID: 2,
        AwayTeam: 'BOS',
        AwayTeamScore: null,
        Quarter: null,
        StadiumDetails: {
          Name: 'Crypto.com Arena',
        },
      },
      {
        GameID: 12346,
        DateTime: '2025-01-13T20:00:00',
        Status: 'InProgress',
        HomeTeamID: 3,
        HomeTeam: 'GSW',
        HomeTeamScore: 65,
        AwayTeamID: 4,
        AwayTeam: 'DEN',
        AwayTeamScore: 62,
        Quarter: 3,
        StadiumDetails: {
          Name: 'Chase Center',
        },
      },
      {
        GameID: 12347,
        DateTime: '2025-01-13T18:00:00',
        Status: 'Final',
        HomeTeamID: 5,
        HomeTeam: 'MIA',
        HomeTeamScore: 110,
        AwayTeamID: 6,
        AwayTeam: 'NYK',
        AwayTeamScore: 105,
        Quarter: 4,
        StadiumDetails: {
          Name: 'Miami Arena',
        },
      },
    ];

    it('should fetch and transform games for specific date', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockGamesResponse,
      } as Response);

      const result = await adapter.getGames('2025-01-13');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.sportsdata.io/v3/nba/scores/json/GamesByDate/2025-01-13',
        {
          headers: {
            'Ocp-Apim-Subscription-Key': 'test-api-key',
          },
        }
      );

      expect(result.data).toHaveLength(3);

      // Scheduled game
      expect(result.data[0]).toEqual({
        id: '12345',
        sport: 'NBA',
        date: '2025-01-13T19:00:00',
        status: 'scheduled',
        homeTeam: {
          id: '1',
          name: 'LAL',
          abbreviation: 'LAL',
          city: '',
        },
        awayTeam: {
          id: '2',
          name: 'BOS',
          abbreviation: 'BOS',
          city: '',
        },
        homeScore: 0,
        awayScore: 0,
        period: undefined,
        venue: 'Crypto.com Arena',
      });

      // Live game
      expect(result.data[1].status).toBe('live');
      expect(result.data[1].period).toBe('Q3');
      expect(result.data[1].homeScore).toBe(65);
      expect(result.data[1].awayScore).toBe(62);

      // Final game
      expect(result.data[2].status).toBe('final');
      expect(result.data[2].homeScore).toBe(110);

      expect(result.source.provider).toBe('SportsDataIO');
    });

    it('should fetch games for current date when no date provided', async () => {
      const today = new Date().toISOString().split('T')[0];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [],
      } as Response);

      await adapter.getGames();

      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.sportsdata.io/v3/nba/scores/json/GamesByDate/${today}`,
        {
          headers: {
            'Ocp-Apim-Subscription-Key': 'test-api-key',
          },
        }
      );
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Not Found',
      } as Response);

      await expect(adapter.getGames('2025-01-13')).rejects.toThrow('NBA API error: Not Found');
    });

    it('should handle empty games list', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [],
      } as Response);

      const result = await adapter.getGames('2025-01-13');

      expect(result.data).toHaveLength(0);
      expect(result.source.provider).toBe('SportsDataIO');
    });

    it('should handle missing team IDs gracefully', async () => {
      const mockData = [
        {
          GameID: 99999,
          DateTime: '2025-01-13T19:00:00',
          Status: 'Scheduled',
          HomeTeamID: null,
          HomeTeam: 'LAL',
          HomeTeamScore: null,
          AwayTeamID: null,
          AwayTeam: 'BOS',
          AwayTeamScore: null,
          Quarter: null,
          StadiumDetails: null,
        },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await adapter.getGames('2025-01-13');

      expect(result.data[0].homeTeam.id).toBe('');
      expect(result.data[0].awayTeam.id).toBe('');
      expect(result.data[0].venue).toBeUndefined();
    });
  });

  describe('mapGameStatus', () => {
    it('should map various game statuses correctly', async () => {
      const statusTests = [
        { input: 'Final', expected: 'final' },
        { input: 'F/OT', expected: 'final' },
        { input: 'InProgress', expected: 'live' },
        { input: 'Halftime', expected: 'live' },
        { input: 'Scheduled', expected: 'scheduled' },
        { input: 'Postponed', expected: 'postponed' },
        { input: 'Canceled', expected: 'cancelled' },
        { input: 'Unknown', expected: 'scheduled' },
      ];

      for (const test of statusTests) {
        const mockData = [
          {
            GameID: 1,
            DateTime: '2025-01-13T19:00:00',
            Status: test.input,
            HomeTeamID: 1,
            HomeTeam: 'LAL',
            HomeTeamScore: 0,
            AwayTeamID: 2,
            AwayTeam: 'BOS',
            AwayTeamScore: 0,
            Quarter: null,
            StadiumDetails: null,
          },
        ];

        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => mockData,
        } as Response);

        const result = await adapter.getGames('2025-01-13');
        expect(result.data[0].status).toBe(test.expected);
      }
    });
  });

  describe('season calculation', () => {
    it('should calculate current season correctly', async () => {
      // This test validates the season logic indirectly through standings
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [],
      } as Response);

      await adapter.getStandings();

      // Check that the URL contains a 4-digit year
      const fetchUrl = (mockFetch.mock.calls[0][0] as string);
      expect(fetchUrl).toMatch(/\/Standings\/\d{4}$/);

      consoleSpy.mockRestore();
    });
  });

  describe('API key validation', () => {
    it('should use provided API key', () => {
      const adapterWithKey = new NBAAdapter('custom-key');
      expect(shared.validateApiKey).toHaveBeenCalledWith('custom-key', 'SportsDataIO (NBA)');
    });

    it('should use environment variable if no key provided', () => {
      process.env.SPORTSDATAIO_API_KEY = 'env-key';
      new NBAAdapter();
      expect(shared.validateApiKey).toHaveBeenCalledWith('env-key', 'SportsDataIO (NBA)');
    });
  });
});
