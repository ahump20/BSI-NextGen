#!/usr/bin/env node

/**
 * Phase 13 API Endpoint Testing Script
 *
 * Tests all newly created API endpoints from Phase 13 migration:
 * - Youth Sports APIs (Texas HS Football, Perfect Game)
 * - NCAA Football team data
 * - NCAA Basketball team data
 *
 * Usage: node test-phase-13-endpoints.js [base-url]
 * Example: node test-phase-13-endpoints.js http://localhost:3000
 */

const BASE_URL = process.argv[2] || 'http://localhost:3000';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'blue');
  console.log('='.repeat(70));
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'gray');
}

async function testEndpoint(name, url, expectedFields = []) {
  try {
    logInfo(`Testing: ${url}`);

    const startTime = Date.now();
    const response = await fetch(url);
    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      logError(`${name} - HTTP ${response.status}: ${response.statusText}`);
      const text = await response.text();
      console.log('Response body:', text.substring(0, 200));
      return false;
    }

    const data = await response.json();

    // Check for expected fields
    const missingFields = expectedFields.filter(field => {
      const parts = field.split('.');
      let current = data;
      for (const part of parts) {
        if (!current || !(part in current)) return true;
        current = current[part];
      }
      return false;
    });

    if (missingFields.length > 0) {
      logWarning(`${name} - Missing fields: ${missingFields.join(', ')}`);
    } else {
      logSuccess(`${name} - OK (${responseTime}ms)`);
    }

    // Log meta information if available
    if (data.meta) {
      logInfo(`  Data source: ${data.meta.dataSource || 'Unknown'}`);
      logInfo(`  Last updated: ${data.meta.lastUpdated || 'Unknown'}`);
    }

    return true;
  } catch (error) {
    logError(`${name} - ${error.message}`);
    return false;
  }
}

async function runTests() {
  log('\n🏈 Phase 13 API Endpoint Testing', 'blue');
  log(`Base URL: ${BASE_URL}`, 'gray');
  log(`Started: ${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })} CST\n`, 'gray');

  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };

  // ============================================================================
  // Youth Sports APIs
  // ============================================================================

  logSection('Youth Sports APIs');

  // Texas HS Football - Standings
  results.total++;
  const txhsfbStandings = await testEndpoint(
    'Texas HS Football - Standings',
    `${BASE_URL}/api/sports/youth-sports/texas-hs-football/standings?classification=6A`,
    ['success', 'data.district', 'data.teams', 'meta.dataSource']
  );
  if (txhsfbStandings) results.passed++; else results.failed++;

  // Texas HS Football - Scores
  results.total++;
  const txhsfbScores = await testEndpoint(
    'Texas HS Football - Scores',
    `${BASE_URL}/api/sports/youth-sports/texas-hs-football/scores?classification=6A`,
    ['success', 'data.games', 'meta.dataSource']
  );
  if (txhsfbScores) results.passed++; else results.failed++;

  // Perfect Game - Tournaments
  results.total++;
  const perfectGame = await testEndpoint(
    'Perfect Game - Tournaments',
    `${BASE_URL}/api/sports/youth-sports/perfect-game/tournaments?ageGroup=14U&state=TX`,
    ['success', 'data.tournaments', 'meta.dataSource']
  );
  if (perfectGame) results.passed++; else results.failed++;

  // ============================================================================
  // NCAA Football API
  // ============================================================================

  logSection('NCAA Football API');

  // Texas Longhorns (Team ID: 251)
  results.total++;
  const ncaaFootballTexas = await testEndpoint(
    'NCAA Football - Texas Longhorns',
    `${BASE_URL}/api/ncaa/football/251`,
    ['team.displayName', 'standings', 'analytics.pythagorean']
  );
  if (ncaaFootballTexas) results.passed++; else results.failed++;

  // Alabama (Team ID: 333)
  results.total++;
  const ncaaFootballAlabama = await testEndpoint(
    'NCAA Football - Alabama',
    `${BASE_URL}/api/ncaa/football/333`,
    ['team.displayName', 'standings', 'analytics.pythagorean']
  );
  if (ncaaFootballAlabama) results.passed++; else results.failed++;

  // ============================================================================
  // NCAA Basketball API
  // ============================================================================

  logSection('NCAA Basketball API');

  // Texas Longhorns (Team ID: 251)
  results.total++;
  const ncaaBballTexas = await testEndpoint(
    'NCAA Basketball - Texas Longhorns',
    `${BASE_URL}/api/ncaa/basketball/251`,
    ['team.displayName', 'standings', 'analytics.pythagorean']
  );
  if (ncaaBballTexas) results.passed++; else results.failed++;

  // Kansas (Team ID: 96)
  results.total++;
  const ncaaBballKansas = await testEndpoint(
    'NCAA Basketball - Kansas',
    `${BASE_URL}/api/ncaa/basketball/96`,
    ['team.displayName', 'standings', 'analytics.pythagorean']
  );
  if (ncaaBballKansas) results.passed++; else results.failed++;

  // ============================================================================
  // Summary
  // ============================================================================

  logSection('Test Results Summary');

  const passRate = ((results.passed / results.total) * 100).toFixed(1);

  log(`Total Tests: ${results.total}`, 'blue');
  logSuccess(`Passed: ${results.passed}`);
  if (results.failed > 0) {
    logError(`Failed: ${results.failed}`);
  }
  log(`Pass Rate: ${passRate}%`, passRate === '100.0' ? 'green' : 'yellow');

  log('\n' + '='.repeat(70));

  if (results.failed === 0) {
    logSuccess('All Phase 13 endpoints are working correctly! 🎉');
  } else {
    logWarning('Some endpoints failed. Review errors above.');
  }

  console.log(''); // Empty line for clean output

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
