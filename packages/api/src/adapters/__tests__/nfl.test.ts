/**
 * Tests for NFL Data Adapter
 */

import { NFLAdapter } from '../nfl';
import * as shared from '@bsi/shared';

// Mock the shared utilities
jest.mock('@bsi/shared', () => ({
  ...jest.requireActual('@bsi/shared'),
  validateApiKey: jest.fn((key: string | undefined) => key || 'mock-nfl-key'),
  fetchWithTimeout: jest.fn(),
  retryWithBackoff: jest.fn((fn) => fn()),
  getChicagoTimestamp: jest.fn(() => '2025-01-13T12:00:00-06:00'),
}));

describe('NFLAdapter', () => {
  let adapter: NFLAdapter;
  let mockFetch: jest.MockedFunction<typeof shared.fetchWithTimeout>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch = shared.fetchWithTimeout as jest.MockedFunction<typeof shared.fetchWithTimeout>;
    adapter = new NFLAdapter('test-api-key');
  });

  describe('getTeams', () => {
    const mockTeamsResponse = [
      {
        TeamID: 1,
        Name: 'Chiefs',
        Key: 'KC',
        City: 'Kansas City',
        WikipediaLogoUrl: 'https://example.com/chiefs.svg',
        Division: 'AFC West',
        Conference: 'AFC',
      },
      {
        TeamID: 2,
        Name: 'Cowboys',
        Key: 'DAL',
        City: 'Dallas',
        WikipediaLogoUrl: 'https://example.com/cowboys.svg',
        Division: 'NFC East',
        Conference: 'NFC',
      },
    ];

    it('should fetch and transform teams successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockTeamsResponse,
      } as Response);

      const result = await adapter.getTeams();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.sportsdata.io/v3/nfl/scores/json/Teams',
        {
          headers: {
            'Ocp-Apim-Subscription-Key': 'test-api-key',
          },
        },
        10000
      );

      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual({
        id: '1',
        name: 'Chiefs',
        abbreviation: 'KC',
        city: 'Kansas City',
        logo: 'https://example.com/chiefs.svg',
        division: 'AFC West',
        conference: 'AFC',
      });

      expect(result.source.provider).toBe('SportsDataIO');
      expect(result.source.confidence).toBe(1.0);
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Unauthorized',
      } as Response);

      await expect(adapter.getTeams()).rejects.toThrow('NFL API error: Unauthorized');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Connection timeout'));

      await expect(adapter.getTeams()).rejects.toThrow('Connection timeout');
    });
  });

  describe('getStandings', () => {
    const mockStandingsResponse = [
      {
        TeamID: 1,
        Name: 'Chiefs',
        Team: 'KC',
        City: 'Kansas City',
        Division: 'AFC West',
        Conference: 'AFC',
        Wins: 13,
        Losses: 4,
        Percentage: 0.765,
        Streak: 3,
      },
      {
        TeamID: 2,
        Name: 'Cowboys',
        Team: 'DAL',
        City: 'Dallas',
        Division: 'NFC East',
        Conference: 'NFC',
        Wins: 10,
        Losses: 7,
        Percentage: 0.588,
        Streak: -2,
      },
    ];

    it('should fetch standings with default season', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockStandingsResponse,
      } as Response);

      const result = await adapter.getStandings();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.sportsdata.io/v3/nfl/scores/json/Standings/2025',
        {
          headers: {
            'Ocp-Apim-Subscription-Key': 'test-api-key',
          },
        },
        10000
      );

      expect(result.data).toHaveLength(2);
    });

    it('should fetch standings for specific season', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockStandingsResponse,
      } as Response);

      const result = await adapter.getStandings(2024);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.sportsdata.io/v3/nfl/scores/json/Standings/2024',
        {
          headers: {
            'Ocp-Apim-Subscription-Key': 'test-api-key',
          },
        },
        10000
      );

      expect(result.data).toHaveLength(2);
    });

    it('should transform standings data correctly', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockStandingsResponse,
      } as Response);

      const result = await adapter.getStandings();

      expect(result.data[0]).toMatchObject({
        team: {
          id: '1',
          name: 'Chiefs',
          abbreviation: 'KC',
          city: 'Kansas City',
          division: 'AFC West',
          conference: 'AFC',
        },
        wins: 13,
        losses: 4,
        winPercentage: 0.765,
        streak: 'W3',
      });

      expect(result.data[1]).toMatchObject({
        team: {
          id: '2',
          name: 'Cowboys',
          abbreviation: 'DAL',
          city: 'Dallas',
          division: 'NFC East',
          conference: 'NFC',
        },
        wins: 10,
        losses: 7,
        winPercentage: 0.588,
        streak: 'L2',
      });
    });

    it('should handle empty standings', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [],
      } as Response);

      const result = await adapter.getStandings();

      expect(result.data).toEqual([]);
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Service Unavailable',
      } as Response);

      await expect(adapter.getStandings()).rejects.toThrow('NFL API error: Service Unavailable');
    });
  });

  describe('getGames', () => {
    const mockGamesResponse = [
      {
        GameKey: '202501130',
        DateTime: '2025-01-13T18:00:00',
        Status: 'Scheduled',
        HomeTeamID: 1,
        HomeTeam: 'KC',
        HomeScore: 0,
        AwayTeamID: 2,
        AwayTeam: 'DAL',
        AwayScore: 0,
        Quarter: null,
        StadiumDetails: {
          Name: 'Arrowhead Stadium',
        },
      },
      {
        GameKey: '202501131',
        DateTime: '2025-01-13T20:30:00',
        Status: 'InProgress',
        HomeTeamID: 3,
        HomeTeam: 'SF',
        HomeScore: 21,
        AwayTeamID: 4,
        AwayTeam: 'GB',
        AwayScore: 14,
        Quarter: 3,
        StadiumDetails: {
          Name: "Levi's Stadium",
        },
      },
    ];

    it('should fetch games with default parameters', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockGamesResponse,
      } as Response);

      const result = await adapter.getGames();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.sportsdata.io/v3/nfl/scores/json/ScoresByWeek/2025/1',
        {
          headers: {
            'Ocp-Apim-Subscription-Key': 'test-api-key',
          },
        },
        10000
      );

      expect(result.data).toHaveLength(2);
    });

    it('should fetch games with object parameters', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockGamesResponse,
      } as Response);

      const result = await adapter.getGames({ season: 2024, week: 10 });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.sportsdata.io/v3/nfl/scores/json/ScoresByWeek/2024/10',
        {
          headers: {
            'Ocp-Apim-Subscription-Key': 'test-api-key',
          },
        },
        10000
      );

      expect(result.data).toHaveLength(2);
    });

    it('should support legacy number parameter for season', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockGamesResponse,
      } as Response);

      const result = await adapter.getGames(2024);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.sportsdata.io/v3/nfl/scores/json/ScoresByWeek/2024/1',
        {
          headers: {
            'Ocp-Apim-Subscription-Key': 'test-api-key',
          },
        },
        10000
      );

      expect(result.data).toHaveLength(2);
    });

    it('should transform game data correctly', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockGamesResponse,
      } as Response);

      const result = await adapter.getGames({ season: 2025, week: 1 });

      expect(result.data[0]).toMatchObject({
        id: '202501130',
        sport: 'NFL',
        date: '2025-01-13T18:00:00',
        status: 'scheduled',
        homeTeam: {
          id: '1',
          name: 'KC',
          abbreviation: 'KC',
          city: '',
        },
        awayTeam: {
          id: '2',
          name: 'DAL',
          abbreviation: 'DAL',
          city: '',
        },
        homeScore: 0,
        awayScore: 0,
        period: undefined,
        venue: 'Arrowhead Stadium',
      });

      expect(result.data[1]).toMatchObject({
        id: '202501131',
        sport: 'NFL',
        status: 'live',
        homeScore: 21,
        awayScore: 14,
        period: 'Q3',
        venue: "Levi's Stadium",
      });
    });

    it('should map different game statuses correctly', async () => {
      const statuses = [
        { status: 'Final', expected: 'final' },
        { status: 'F/OT', expected: 'final' },
        { status: 'InProgress', expected: 'live' },
        { status: 'Halftime', expected: 'live' },
        { status: 'Scheduled', expected: 'scheduled' },
        { status: 'Postponed', expected: 'postponed' },
        { status: 'Canceled', expected: 'cancelled' },
        { status: 'Unknown', expected: 'scheduled' },
      ];

      for (const { status, expected } of statuses) {
        const response = [
          {
            ...mockGamesResponse[0],
            Status: status,
          },
        ];

        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => response,
        } as Response);

        const result = await adapter.getGames({ season: 2025, week: 1 });

        expect(result.data[0].status).toBe(expected);
      }
    });

    it('should handle games without quarter information', async () => {
      const response = [
        {
          ...mockGamesResponse[0],
          Quarter: null,
        },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => response,
      } as Response);

      const result = await adapter.getGames();

      expect(result.data[0].period).toBeUndefined();
    });

    it('should handle games without stadium details', async () => {
      const response = [
        {
          ...mockGamesResponse[0],
          StadiumDetails: null,
        },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => response,
      } as Response);

      const result = await adapter.getGames();

      expect(result.data[0].venue).toBeUndefined();
    });

    it('should handle empty games list', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [],
      } as Response);

      const result = await adapter.getGames();

      expect(result.data).toEqual([]);
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Bad Request',
      } as Response);

      await expect(adapter.getGames()).rejects.toThrow('NFL API error: Bad Request');
    });
  });

  describe('API key handling', () => {
    it('should use provided API key in constructor', async () => {
      const customAdapter = new NFLAdapter('custom-api-key');

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [],
      } as Response);

      await customAdapter.getTeams();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            'Ocp-Apim-Subscription-Key': 'custom-api-key',
          },
        }),
        expect.any(Number)
      );
    });

    it('should include correct source information in all responses', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [],
      } as Response);

      const result = await adapter.getTeams();

      expect(result.source).toEqual({
        provider: 'SportsDataIO',
        timestamp: '2025-01-13T12:00:00-06:00',
        confidence: 1.0,
      });
    });
  });

  describe('streak formatting', () => {
    it('should format positive streaks as wins', async () => {
      const response = [
        {
          TeamID: 1,
          Name: 'Chiefs',
          Team: 'KC',
          City: 'Kansas City',
          Division: 'AFC West',
          Conference: 'AFC',
          Wins: 10,
          Losses: 2,
          Percentage: 0.833,
          Streak: 5,
        },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => response,
      } as Response);

      const result = await adapter.getStandings();

      expect(result.data[0].streak).toBe('W5');
    });

    it('should format negative streaks as losses', async () => {
      const response = [
        {
          TeamID: 1,
          Name: 'Cowboys',
          Team: 'DAL',
          City: 'Dallas',
          Division: 'NFC East',
          Conference: 'NFC',
          Wins: 5,
          Losses: 7,
          Percentage: 0.417,
          Streak: -3,
        },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => response,
      } as Response);

      const result = await adapter.getStandings();

      expect(result.data[0].streak).toBe('L3');
    });

    it('should handle zero streak', async () => {
      const response = [
        {
          TeamID: 1,
          Name: 'Team',
          Team: 'TM',
          City: 'City',
          Division: 'Division',
          Conference: 'Conference',
          Wins: 8,
          Losses: 8,
          Percentage: 0.5,
          Streak: 0,
        },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => response,
      } as Response);

      const result = await adapter.getStandings();

      expect(result.data[0].streak).toBe('L0');
    });
  });
});
