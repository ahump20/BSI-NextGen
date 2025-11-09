# SportsData.io MCP Server

Production Model Context Protocol (MCP) server for SportsData.io integration with the BSI-NextGen platform.

## Overview

This MCP server provides structured access to SportsData.io APIs for all major sports, with priority on college baseball data to fill ESPN's coverage gaps. The server is designed to run as a Cloudflare Worker and integrates seamlessly with the Blaze Sports Intel platform.

## Features

- **8 Specialized Tools** for sports data retrieval
- **Priority #1: College Baseball** - Complete coverage including box scores, rosters, standings
- **Multi-Sport Support** - MLB, NFL, NCAA Football, NCAA Basketball
- **Real-Time Data** - Live game updates and play-by-play feeds
- **Historical Statistics** - Career stats, season trends, multi-year data
- **Mobile-Optimized** - Designed for Blaze Sports Intel mobile experience

## Tools

### 1. `fetch_college_baseball_data`
**Priority #1** - Addresses ESPN's college baseball coverage gaps.

**Examples:**
- "Get today's D1 baseball scores"
- "Fetch Texas Longhorns roster"
- "Show SEC standings"
- "Get player stats for [name]"
- "Live scores for top 25 games"

### 2. `fetch_mlb_data`
MLB games, scores, player stats, team info, standings.

**Examples:**
- "Get Cardinals game score"
- "Fetch current MLB standings"
- "Player stats for [name]"
- "Today's MLB schedule"

### 3. `fetch_nfl_data`
NFL games, scores, player stats, team info, standings, injury reports.

**Examples:**
- "Get Titans game score"
- "Current NFL standings"
- "Player stats for [name]"
- "Injury report for [team]"

### 4. `fetch_college_football_data`
College football games, scores, rankings. Priority on FCS and Group-of-Five programs.

**Examples:**
- "Get FCS playoff scores"
- "Texas Longhorns schedule"
- "Top 25 rankings"
- "Conference standings"

### 5. `fetch_ncaa_basketball_data`
NCAA basketball games, scores, tournament data, bracketology.

**Examples:**
- "Get today's games"
- "March Madness bracket"
- "Team stats for [school]"
- "Conference standings"

### 6. `stream_live_game_data`
Real-time play-by-play updates for live games. Optimized for mobile push notifications.

**Examples:**
- "Stream Cardinals game updates"
- "Live play-by-play for Texas vs Oklahoma"
- "Real-time college baseball scores"

### 7. `fetch_historical_stats`
Historical season stats, career stats, multi-year trends.

**Examples:**
- "College baseball stats 2020-2024"
- "Cardinals franchise history"
- "Player career stats"
- "Season-by-season team performance"

### 8. `fetch_odds_and_projections`
Betting lines, odds, statistical projections. For analysis only.

**Examples:**
- "Get spread for [game]"
- "Win probability model inputs"
- "Over/under trends"
- "Projection data for simulations"

## Installation

### Local Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Build TypeScript
pnpm build
```

### Environment Variables

Create a `.env` file in this package directory:

```bash
SPORTSDATA_CFB_KEY=your_cfb_key_here
SPORTSDATA_MLB_KEY=your_mlb_key_here
SPORTSDATA_NFL_KEY=your_nfl_key_here
SPORTSDATA_NCAABB_KEY=your_ncaabb_key_here
```

## Deployment

### Cloudflare Workers

1. **Install Wrangler CLI:**
   ```bash
   npm install -g wrangler
   ```

2. **Authenticate:**
   ```bash
   wrangler login
   ```

3. **Set Production Secrets:**
   ```bash
   wrangler secret put SPORTSDATA_CFB_KEY --env production
   wrangler secret put SPORTSDATA_MLB_KEY --env production
   wrangler secret put SPORTSDATA_NFL_KEY --env production
   wrangler secret put SPORTSDATA_NCAABB_KEY --env production
   ```

4. **Deploy:**
   ```bash
   pnpm deploy
   ```

5. **Health Check:**
   ```bash
   curl https://sportsdata-io-mcp.your-subdomain.workers.dev/health
   ```

## Usage

### MCP Client Configuration

Add to your MCP client config (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "sportsdata-io": {
      "command": "node",
      "args": ["path/to/BSI-NextGen/packages/mcp-sportsdata-io/dist/sportsdata-io-mcp-server.js"],
      "env": {
        "SPORTSDATA_CFB_KEY": "your_cfb_key",
        "SPORTSDATA_MLB_KEY": "your_mlb_key",
        "SPORTSDATA_NFL_KEY": "your_nfl_key",
        "SPORTSDATA_NCAABB_KEY": "your_ncaabb_key"
      }
    }
  }
}
```

### Example Tool Call

```javascript
{
  "name": "fetch_college_baseball_data",
  "arguments": {
    "instruction": "Get today's SEC baseball scores with box scores"
  }
}
```

### Response Format

All responses follow this structure:

```json
{
  "sport": "college_baseball",
  "instruction": "Get today's SEC baseball scores",
  "timestamp": "Nov 9, 2024 12:30 PM CST",
  "data": [...],
  "source": "SportsData.io College Baseball API"
}
```

## API Rate Limits

SportsData.io enforces rate limits based on subscription tier:

- **Trial:** 1 call/second, 1000 calls/month
- **Basic:** 2 calls/second, 10,000 calls/month
- **Pro:** 5 calls/second, 100,000 calls/month

The MCP server implements intelligent caching and batching to minimize API calls.

## Integration with BSI-NextGen

This MCP server integrates with:

- **@bsi/api** - Sports data adapters
- **@bsi/web** - Next.js web application
- **Cloudflare Workers** - Serverless deployment
- **Blaze Sports Intel** - Mobile-first platform

## Data Flow

```
User → Claude → MCP Server → SportsData.io API → Response
                    ↓
            Cloudflare Workers
                    ↓
            BSI-NextGen Platform
```

## Timezone

All timestamps use **America/Chicago** timezone to match the BSI-NextGen platform standard.

## Error Handling

The server implements robust error handling:

- API errors return descriptive messages
- Failed requests include the original instruction
- Partial failures return successful results only
- Rate limit errors trigger exponential backoff

## Monitoring

### Health Endpoint

```bash
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "sportsdata-io-mcp"
}
```

### Cloudflare Workers Logs

View logs in Cloudflare Dashboard:
1. Navigate to Workers & Pages
2. Select `sportsdata-io-mcp`
3. Click on "Logs" tab

## Testing

### Local Testing

```bash
# Run the server
pnpm dev

# In another terminal, test with MCP client
echo '{"method":"tools/list"}' | node dist/sportsdata-io-mcp-server.js
```

### Integration Testing

Integration tests are located in the main BSI-NextGen test suite:

```bash
# From root directory
pnpm test:integration
```

## Contributing

When adding new sports or endpoints:

1. Add new tool definition in `getTools()`
2. Implement handler method (e.g., `executeSportQuery()`)
3. Add intent parsing method (e.g., `parseSportIntent()`)
4. Update this README with examples
5. Add tests in main test suite

## License

Part of BSI-NextGen platform. See root LICENSE file.

## Support

For issues or questions:
- GitHub Issues: [BSI-NextGen Issues](https://github.com/ahump20/BSI-NextGen/issues)
- Documentation: See `CLAUDE.md` in root directory
- API Docs: [SportsData.io Documentation](https://sportsdata.io/developers)

## Roadmap

- [ ] WebSocket support for live streaming
- [ ] Enhanced caching with Cloudflare KV
- [ ] Durable Objects for persistent connections
- [ ] Additional sports (Hockey, Soccer)
- [ ] Advanced analytics endpoints
- [ ] Player comparison tools
- [ ] Game prediction models
