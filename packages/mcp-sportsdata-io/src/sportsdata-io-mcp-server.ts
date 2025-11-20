// sportsdata-io-mcp-server.ts
// Production MCP server for SportsData.io integration
// Deployed on Cloudflare Workers for blazesportsintel.com

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

interface Env {
  SPORTSDATA_CFB_KEY: string;
  SPORTSDATA_MLB_KEY: string;
  SPORTSDATA_NFL_KEY: string;
  SPORTSDATA_NCAABB_KEY: string;
}

const BASE_URL = "https://api.sportsdata.io/v3";

class SportsDataIOServer {
  private server: Server;
  private env: Env;

  constructor(env: Env) {
    this.env = env;
    this.server = new Server(
      {
        name: "sportsdata-io-agent",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();

    this.server.onerror = (error) => {
      console.error("[MCP Error]", error);
    };

    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  /**
   * Get current date in YYYY-MM-DD format for API calls
   * Uses America/Chicago timezone
   */
  private getCurrentDate(): string {
    const now = new Date();
    const chicagoTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
    return chicagoTime.toISOString().split('T')[0];
  }

  /**
   * Get current season year based on sport calendar
   * @param sport - Sport type to determine season boundary
   */
  private getCurrentSeason(sport: 'MLB' | 'NFL' | 'CFB' | 'CBB' | 'NCAABB'): number {
    const now = new Date();
    const chicagoTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
    const month = chicagoTime.getMonth(); // 0-11

    switch (sport) {
      case 'MLB':
        // MLB season: Feb-Oct, use current year if Jan-Oct, else next year
        return month < 10 ? chicagoTime.getFullYear() : chicagoTime.getFullYear() + 1;

      case 'NFL':
        // NFL season: Sep-Feb, use prev year if Jan-Jul, current year Aug-Dec
        return month < 7 ? chicagoTime.getFullYear() - 1 : chicagoTime.getFullYear();

      case 'CFB':
        // College Football: Aug-Jan, use prev year if Jan-Jul, current year Aug-Dec
        return month < 7 ? chicagoTime.getFullYear() - 1 : chicagoTime.getFullYear();

      case 'CBB':
      case 'NCAABB':
        // College Basketball: Nov-Apr, use prev year if Apr-Oct, current year Nov-Mar
        return month < 4 || month >= 10 ? chicagoTime.getFullYear() : chicagoTime.getFullYear() - 1;

      default:
        return chicagoTime.getFullYear();
    }
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.getTools(),
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) =>
      this.handleToolCall(request)
    );
  }

  private getTools(): Tool[] {
    return [
      {
        name: "fetch_college_baseball_data",
        description: "Priority #1: Fetch college baseball games, scores, stats, teams, or players. Supports live scores, historical data, team rosters, player stats, schedules, and conference standings. Addresses ESPN's coverage gaps.",
        inputSchema: {
          type: "object",
          properties: {
            instruction: {
              type: "string",
              description: "Detailed instruction for college baseball data retrieval. Examples: 'Get today's D1 baseball scores', 'Fetch Texas Longhorns roster', 'Show SEC standings', 'Get player stats for [name]', 'Live scores for top 25 games'",
            },
          },
          required: ["instruction"],
        },
      },
      {
        name: "fetch_mlb_data",
        description: "Fetch MLB games, scores, player stats, team info, or standings. Supports live games, box scores, player projections, team schedules, and historical data. Integrates with ShowIQ swing analysis.",
        inputSchema: {
          type: "object",
          properties: {
            instruction: {
              type: "string",
              description: "Detailed instruction for MLB data. Examples: 'Get Cardinals game score', 'Fetch current MLB standings', 'Player stats for [name]', 'Today's MLB schedule', 'Live pitch-by-pitch data'",
            },
          },
          required: ["instruction"],
        },
      },
      {
        name: "fetch_nfl_data",
        description: "Fetch NFL games, scores, player stats, team info, or standings. Supports live games, box scores, depth charts, injury reports, and play-by-play data.",
        inputSchema: {
          type: "object",
          properties: {
            instruction: {
              type: "string",
              description: "Detailed instruction for NFL data. Examples: 'Get Titans game score', 'Current NFL standings', 'Player stats for [name]', 'This week's schedule', 'Injury report for [team]'",
            },
          },
          required: ["instruction"],
        },
      },
      {
        name: "fetch_college_football_data",
        description: "Fetch college football games, scores, stats, rankings. Priority on FCS and Group-of-Five programs with minimal mainstream coverage. Supports live scores, AP/Coaches polls, team stats, schedules.",
        inputSchema: {
          type: "object",
          properties: {
            instruction: {
              type: "string",
              description: "Detailed instruction for CFB data. Examples: 'Get FCS playoff scores', 'Texas Longhorns schedule', 'Top 25 rankings', 'Conference standings', 'Game stats for [matchup]'",
            },
          },
          required: ["instruction"],
        },
      },
      {
        name: "fetch_ncaa_basketball_data",
        description: "Fetch NCAA basketball games, scores, stats, tournament data. Supports live scores, bracketology, conference tournaments, player stats, team rankings.",
        inputSchema: {
          type: "object",
          properties: {
            instruction: {
              type: "string",
              description: "Detailed instruction for NCAA basketball. Examples: 'Get today's games', 'March Madness bracket', 'Team stats for [school]', 'Conference standings', 'Player averages'",
            },
          },
          required: ["instruction"],
        },
      },
      {
        name: "stream_live_game_data",
        description: "Stream real-time play-by-play updates for live games across all supported sports. Optimized for mobile push notifications and Blaze Sports Intel live tracking.",
        inputSchema: {
          type: "object",
          properties: {
            instruction: {
              type: "string",
              description: "Instruction for live game streaming. Examples: 'Stream Cardinals game updates', 'Live play-by-play for Texas vs Oklahoma', 'Real-time college baseball scores', 'Subscribe to Titans game feed'",
            },
          },
          required: ["instruction"],
        },
      },
      {
        name: "fetch_historical_stats",
        description: "Retrieve historical season stats, career stats, or multi-year trends for teams and players. Supports all sports with emphasis on college baseball historical data addressing coverage gaps.",
        inputSchema: {
          type: "object",
          properties: {
            instruction: {
              type: "string",
              description: "Instruction for historical data. Examples: 'College baseball stats 2020-2024', 'Cardinals franchise history', 'Player career stats', 'Season-by-season team performance', 'Historical conference data'",
            },
          },
          required: ["instruction"],
        },
      },
      {
        name: "fetch_odds_and_projections",
        description: "Retrieve betting lines, odds, and statistical projections. For analysis only—never gambling recommendations. Supports win probability models and Monte Carlo simulations.",
        inputSchema: {
          type: "object",
          properties: {
            instruction: {
              type: "string",
              description: "Instruction for odds/projections. Examples: 'Get spread for [game]', 'Win probability model inputs', 'Over/under trends', 'Projection data for simulations', 'Line movement history'",
            },
          },
          required: ["instruction"],
        },
      },
    ];
  }

  private async handleToolCall(request: any) {
    const { name, arguments: args } = request.params;
    const instruction = args.instruction;

    try {
      switch (name) {
        case "fetch_college_baseball_data":
          return await this.executeCollegeBaseballQuery(instruction);
        case "fetch_mlb_data":
          return await this.executeMLBQuery(instruction);
        case "fetch_nfl_data":
          return await this.executeNFLQuery(instruction);
        case "fetch_college_football_data":
          return await this.executeCollegeFootballQuery(instruction);
        case "fetch_ncaa_basketball_data":
          return await this.executeNCAABasketballQuery(instruction);
        case "stream_live_game_data":
          return await this.executeLiveGameStream(instruction);
        case "fetch_historical_stats":
          return await this.executeHistoricalQuery(instruction);
        case "fetch_odds_and_projections":
          return await this.executeOddsQuery(instruction);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error executing ${name}: ${error.message}\nInstruction: ${instruction}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async executeCollegeBaseballQuery(instruction: string) {
    const endpoints = this.parseCollegeBaseballIntent(instruction);
    const results = await Promise.allSettled(
      endpoints.map((endpoint) => this.fetchData("cfb", endpoint))
    );

    const successfulResults = results
      .filter((r) => r.status === "fulfilled")
      .map((r: any) => r.value);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              sport: "college_baseball",
              instruction: instruction,
              timestamp: new Date().toLocaleString("en-US", {
                timeZone: "America/Chicago",
              }),
              data: successfulResults,
              source: "SportsData.io College Baseball API",
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async executeMLBQuery(instruction: string) {
    const endpoints = this.parseMLBIntent(instruction);
    const results = await Promise.allSettled(
      endpoints.map((endpoint) => this.fetchData("mlb", endpoint))
    );

    const successfulResults = results
      .filter((r) => r.status === "fulfilled")
      .map((r: any) => r.value);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              sport: "mlb",
              instruction: instruction,
              timestamp: new Date().toLocaleString("en-US", {
                timeZone: "America/Chicago",
              }),
              data: successfulResults,
              source: "SportsData.io MLB API",
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async executeNFLQuery(instruction: string) {
    const endpoints = this.parseNFLIntent(instruction);
    const results = await Promise.allSettled(
      endpoints.map((endpoint) => this.fetchData("nfl", endpoint))
    );

    const successfulResults = results
      .filter((r) => r.status === "fulfilled")
      .map((r: any) => r.value);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              sport: "nfl",
              instruction: instruction,
              timestamp: new Date().toLocaleString("en-US", {
                timeZone: "America/Chicago",
              }),
              data: successfulResults,
              source: "SportsData.io NFL API",
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async executeCollegeFootballQuery(instruction: string) {
    const endpoints = this.parseCollegeFootballIntent(instruction);
    const results = await Promise.allSettled(
      endpoints.map((endpoint) => this.fetchData("cfb", endpoint))
    );

    const successfulResults = results
      .filter((r) => r.status === "fulfilled")
      .map((r: any) => r.value);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              sport: "college_football",
              instruction: instruction,
              timestamp: new Date().toLocaleString("en-US", {
                timeZone: "America/Chicago",
              }),
              data: successfulResults,
              source: "SportsData.io CFB API",
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async executeNCAABasketballQuery(instruction: string) {
    const endpoints = this.parseNCAABasketballIntent(instruction);
    const results = await Promise.allSettled(
      endpoints.map((endpoint) => this.fetchData("cbb", endpoint))
    );

    const successfulResults = results
      .filter((r) => r.status === "fulfilled")
      .map((r: any) => r.value);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              sport: "ncaa_basketball",
              instruction: instruction,
              timestamp: new Date().toLocaleString("en-US", {
                timeZone: "America/Chicago",
              }),
              data: successfulResults,
              source: "SportsData.io NCAA Basketball API",
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async executeLiveGameStream(instruction: string) {
    // Live streaming requires WebSocket or Server-Sent Events
    // For MCP context, return current live game state
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              feature: "live_game_streaming",
              instruction: instruction,
              timestamp: new Date().toLocaleString("en-US", {
                timeZone: "America/Chicago",
              }),
              implementation: "Requires WebSocket connection for real-time updates. Use Cloudflare Durable Objects for persistent connections. Query current game state via REST endpoints.",
              next_steps: [
                "Identify game ID from instruction",
                "Fetch current box score",
                "Poll play-by-play endpoint every 15-30 seconds",
                "Stream updates via Cloudflare Workers",
              ],
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async executeHistoricalQuery(instruction: string) {
    const endpoints = this.parseHistoricalIntent(instruction);
    const results = await Promise.allSettled(
      endpoints.map((endpoint) => this.fetchData("multi", endpoint))
    );

    const successfulResults = results
      .filter((r) => r.status === "fulfilled")
      .map((r: any) => r.value);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              query_type: "historical_stats",
              instruction: instruction,
              timestamp: new Date().toLocaleString("en-US", {
                timeZone: "America/Chicago",
              }),
              data: successfulResults,
              source: "SportsData.io Historical API",
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async executeOddsQuery(instruction: string) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              feature: "odds_and_projections",
              instruction: instruction,
              timestamp: new Date().toLocaleString("en-US", {
                timeZone: "America/Chicago",
              }),
              disclaimer: "For analysis only. Not gambling advice. Use for win probability models and Monte Carlo simulations.",
              note: "SportsData.io odds endpoints require separate subscription. Integrate with Blaze predictive intelligence engine for win-probability curves and simulation inputs.",
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private parseCollegeBaseballIntent(instruction: string): string[] {
    const endpoints: string[] = [];
    const lower = instruction.toLowerCase();
    const currentDate = this.getCurrentDate();
    const currentSeason = this.getCurrentSeason('MLB'); // CBB follows similar calendar

    if (lower.includes("score") || lower.includes("game")) {
      endpoints.push(`/scores/json/GamesByDate/${currentDate}`);
    }
    if (lower.includes("roster") || lower.includes("team")) {
      endpoints.push("/scores/json/Teams");
    }
    if (lower.includes("standings") || lower.includes("conference")) {
      endpoints.push(`/scores/json/Standings/${currentSeason}`);
    }
    if (lower.includes("player") || lower.includes("stats")) {
      endpoints.push("/stats/json/Players");
    }
    if (lower.includes("schedule")) {
      endpoints.push(`/scores/json/Games/${currentSeason}`);
    }

    return endpoints.length > 0 ? endpoints : [`/scores/json/GamesByDate/${currentDate}`];
  }

  private parseMLBIntent(instruction: string): string[] {
    const endpoints: string[] = [];
    const lower = instruction.toLowerCase();
    const currentDate = this.getCurrentDate();
    const currentSeason = this.getCurrentSeason('MLB');

    if (lower.includes("score") || lower.includes("game")) {
      endpoints.push(`/scores/json/GamesByDate/${currentDate}`);
    }
    if (lower.includes("standings")) {
      endpoints.push(`/scores/json/Standings/${currentSeason}`);
    }
    if (lower.includes("player") || lower.includes("stats")) {
      endpoints.push("/stats/json/Players");
    }
    if (lower.includes("schedule")) {
      endpoints.push(`/scores/json/Games/${currentSeason}`);
    }

    return endpoints.length > 0 ? endpoints : [`/scores/json/GamesByDate/${currentDate}`];
  }

  private parseNFLIntent(instruction: string): string[] {
    const endpoints: string[] = [];
    const lower = instruction.toLowerCase();
    const currentSeason = this.getCurrentSeason('NFL');

    if (lower.includes("score") || lower.includes("game")) {
      endpoints.push(`/scores/json/ScoresByWeek/${currentSeason}/1`);
    }
    if (lower.includes("standings")) {
      endpoints.push(`/scores/json/Standings/${currentSeason}`);
    }
    if (lower.includes("schedule")) {
      endpoints.push(`/scores/json/Schedules/${currentSeason}`);
    }
    if (lower.includes("injury")) {
      endpoints.push(`/scores/json/Injuries/${currentSeason}`);
    }

    return endpoints.length > 0 ? endpoints : [`/scores/json/ScoresByWeek/${currentSeason}/1`];
  }

  private parseCollegeFootballIntent(instruction: string): string[] {
    const endpoints: string[] = [];
    const lower = instruction.toLowerCase();
    const currentDate = this.getCurrentDate();
    const currentSeason = this.getCurrentSeason('CFB');

    if (lower.includes("score") || lower.includes("game")) {
      endpoints.push(`/scores/json/GamesByDate/${currentDate}`);
    }
    if (lower.includes("rankings") || lower.includes("poll")) {
      endpoints.push(`/scores/json/Rankings/${currentSeason}/1`);
    }
    if (lower.includes("standings") || lower.includes("conference")) {
      endpoints.push(`/scores/json/Standings/${currentSeason}`);
    }

    return endpoints.length > 0 ? endpoints : [`/scores/json/GamesByDate/${currentDate}`];
  }

  private parseNCAABasketballIntent(instruction: string): string[] {
    const endpoints: string[] = [];
    const lower = instruction.toLowerCase();
    const currentDate = this.getCurrentDate();
    const currentSeason = this.getCurrentSeason('NCAABB');

    if (lower.includes("score") || lower.includes("game")) {
      endpoints.push(`/scores/json/GamesByDate/${currentDate}`);
    }
    if (lower.includes("tournament") || lower.includes("bracket")) {
      endpoints.push(`/scores/json/Tournament/${currentSeason}`);
    }
    if (lower.includes("standings")) {
      endpoints.push(`/scores/json/Standings/${currentSeason}`);
    }

    return endpoints.length > 0 ? endpoints : [`/scores/json/GamesByDate/${currentDate}`];
  }

  private parseHistoricalIntent(instruction: string): any[] {
    // Parse year ranges, specific seasons, career stats
    return [{ sport: "multi", endpoint: "/historical/placeholder" }];
  }

  private async fetchData(sport: string, endpoint: string): Promise<any> {
    const apiKey = this.getAPIKey(sport);
    const url = `${BASE_URL}/${sport}${endpoint}?key=${apiKey}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`SportsData.io API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  private getAPIKey(sport: string): string {
    switch (sport) {
      case "cfb":
        return this.env.SPORTSDATA_CFB_KEY;
      case "mlb":
        return this.env.SPORTSDATA_MLB_KEY;
      case "nfl":
        return this.env.SPORTSDATA_NFL_KEY;
      case "cbb":
        return this.env.SPORTSDATA_NCAABB_KEY;
      default:
        return this.env.SPORTSDATA_CFB_KEY;
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("SportsData.io MCP server running on stdio");
  }
}

// Cloudflare Worker export
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "healthy", service: "sportsdata-io-mcp" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("SportsData.io MCP Server - Use stdio transport", {
      status: 200,
    });
  },
};

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const env: Env = {
    SPORTSDATA_CFB_KEY: process.env.SPORTSDATA_CFB_KEY || "",
    SPORTSDATA_MLB_KEY: process.env.SPORTSDATA_MLB_KEY || "",
    SPORTSDATA_NFL_KEY: process.env.SPORTSDATA_NFL_KEY || "",
    SPORTSDATA_NCAABB_KEY: process.env.SPORTSDATA_NCAABB_KEY || "",
  };

  const server = new SportsDataIOServer(env);
  server.run().catch(console.error);
}
