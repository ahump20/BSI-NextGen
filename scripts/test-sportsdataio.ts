#!/usr/bin/env tsx

/**
 * SportsDataIO Integration Test Script
 *
 * This script verifies that the SportsDataIO API integration is working correctly
 * for both NFL and NBA adapters.
 *
 * Usage:
 *   pnpm tsx scripts/test-sportsdataio.ts
 *
 * Requirements:
 *   - SPORTSDATAIO_API_KEY environment variable must be set in .env file
 *   - Valid SportsDataIO API key with access to NFL and NBA data
 */

import 'dotenv/config';
import { NFLAdapter, NBAAdapter } from '@bsi/api';

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = COLORS.reset) {
  console.log(`${color}${message}${COLORS.reset}`);
}

async function testNFLAdapter() {
  log('\n📊 Testing NFL Adapter...', COLORS.cyan);

  try {
    const apiKey = process.env.SPORTSDATAIO_API_KEY;

    if (!apiKey || apiKey === 'your_sportsdataio_api_key_here') {
      log('❌ SPORTSDATAIO_API_KEY not configured in .env file', COLORS.red);
      log('   Please add your API key to .env and try again', COLORS.yellow);
      return false;
    }

    const adapter = new NFLAdapter(apiKey);

    // Test 1: Get Teams
    log('  → Fetching NFL teams...', COLORS.blue);
    const teamsResponse = await adapter.getTeams();
    log(`  ✓ Fetched ${teamsResponse.data.length} teams`, COLORS.green);
    log(`    Sample: ${teamsResponse.data[0].name} (${teamsResponse.data[0].abbreviation})`, COLORS.reset);

    // Test 2: Get Standings
    log('  → Fetching NFL standings (2025 season)...', COLORS.blue);
    const standingsResponse = await adapter.getStandings(2025);
    log(`  ✓ Fetched ${standingsResponse.data.length} team standings`, COLORS.green);
    log(`    Sample: ${standingsResponse.data[0].team.name} - ${standingsResponse.data[0].wins}W ${standingsResponse.data[0].losses}L`, COLORS.reset);

    // Test 3: Get Games
    log('  → Fetching NFL games (2025, Week 1)...', COLORS.blue);
    const gamesResponse = await adapter.getGames({ season: 2025, week: 1 });
    log(`  ✓ Fetched ${gamesResponse.data.length} games`, COLORS.green);
    if (gamesResponse.data.length > 0) {
      const game = gamesResponse.data[0];
      log(`    Sample: ${game.awayTeam.abbreviation} @ ${game.homeTeam.abbreviation} - ${game.status}`, COLORS.reset);
    }

    log('✅ NFL Adapter: All tests passed!', COLORS.green);
    return true;
  } catch (error) {
    log(`❌ NFL Adapter Error: ${error instanceof Error ? error.message : 'Unknown error'}`, COLORS.red);
    return false;
  }
}

async function testNBAAdapter() {
  log('\n🏀 Testing NBA Adapter...', COLORS.cyan);

  try {
    const apiKey = process.env.SPORTSDATAIO_API_KEY;

    if (!apiKey || apiKey === 'your_sportsdataio_api_key_here') {
      log('❌ SPORTSDATAIO_API_KEY not configured in .env file', COLORS.red);
      log('   Please add your API key to .env and try again', COLORS.yellow);
      return false;
    }

    const adapter = new NBAAdapter(apiKey);

    // Test 1: Get Teams
    log('  → Fetching NBA teams...', COLORS.blue);
    const teamsResponse = await adapter.getTeams();
    log(`  ✓ Fetched ${teamsResponse.data.length} teams`, COLORS.green);
    log(`    Sample: ${teamsResponse.data[0].name} (${teamsResponse.data[0].abbreviation})`, COLORS.reset);

    // Test 2: Get Standings
    log('  → Fetching NBA standings (2025 season)...', COLORS.blue);
    const standingsResponse = await adapter.getStandings('2025');
    log(`  ✓ Fetched ${standingsResponse.data.length} team standings`, COLORS.green);
    log(`    Sample: ${standingsResponse.data[0].team.name} - ${standingsResponse.data[0].wins}W ${standingsResponse.data[0].losses}L`, COLORS.reset);

    // Test 3: Get Games
    log('  → Fetching NBA games (today)...', COLORS.blue);
    const today = new Date().toISOString().split('T')[0];
    const gamesResponse = await adapter.getGames(today);
    log(`  ✓ Fetched ${gamesResponse.data.length} games for ${today}`, COLORS.green);
    if (gamesResponse.data.length > 0) {
      const game = gamesResponse.data[0];
      log(`    Sample: ${game.awayTeam.abbreviation} @ ${game.homeTeam.abbreviation} - ${game.status}`, COLORS.reset);
    } else {
      log(`    Note: No games scheduled for ${today}`, COLORS.yellow);
    }

    log('✅ NBA Adapter: All tests passed!', COLORS.green);
    return true;
  } catch (error) {
    log(`❌ NBA Adapter Error: ${error instanceof Error ? error.message : 'Unknown error'}`, COLORS.red);
    return false;
  }
}

async function main() {
  log('╔═══════════════════════════════════════════════════════════╗', COLORS.cyan);
  log('║      SportsDataIO Integration Test Suite                  ║', COLORS.cyan);
  log('╚═══════════════════════════════════════════════════════════╝', COLORS.cyan);

  const nflSuccess = await testNFLAdapter();
  const nbaSuccess = await testNBAAdapter();

  log('\n' + '═'.repeat(60), COLORS.cyan);
  log('Test Summary:', COLORS.cyan);
  log(`  NFL Adapter: ${nflSuccess ? '✅ PASSED' : '❌ FAILED'}`, nflSuccess ? COLORS.green : COLORS.red);
  log(`  NBA Adapter: ${nbaSuccess ? '✅ PASSED' : '❌ FAILED'}`, nbaSuccess ? COLORS.green : COLORS.red);

  if (nflSuccess && nbaSuccess) {
    log('\n🎉 All tests passed! SportsDataIO integration is working correctly.', COLORS.green);
    log('   You can now use live sports data in your application.', COLORS.green);
    process.exit(0);
  } else {
    log('\n⚠️  Some tests failed. Please check your API key and try again.', COLORS.yellow);
    log('   Make sure your API key is valid and has access to NFL and NBA data.', COLORS.yellow);
    process.exit(1);
  }
}

main().catch((error) => {
  log(`\n❌ Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`, COLORS.red);
  process.exit(1);
});
