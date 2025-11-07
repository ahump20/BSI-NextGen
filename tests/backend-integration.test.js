/**
 * Comprehensive Backend Integration Tests
 * Tests all API endpoints against production deployment
 */

const PRODUCTION_URL = 'https://blazesportsintel.com'; // Latest deployment to custom domain
const ALLOWED_ORIGINS = [
  'https://blazesportsintel.com',
  'https://eaec3ea6.sandlot-sluggers.pages.dev',
];

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: [],
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function assert(condition, testName, details = '') {
  if (condition) {
    results.passed++;
    results.tests.push({ name: testName, status: 'PASS', details });
    log(`✅ PASS: ${testName}`, 'green');
    if (details) log(`   ${details}`, 'cyan');
  } else {
    results.failed++;
    results.tests.push({ name: testName, status: 'FAIL', details });
    log(`❌ FAIL: ${testName}`, 'red');
    if (details) log(`   ${details}`, 'yellow');
  }
}

function warn(message) {
  results.warnings++;
  log(`⚠️  WARNING: ${message}`, 'yellow');
}

async function testHealthEndpoint() {
  log('\n=== Testing Health Endpoint ===', 'blue');

  try {
    const start = Date.now();
    const response = await fetch(`${PRODUCTION_URL}/api/health`);
    const latency = Date.now() - start;

    assert(response.ok, 'Health endpoint returns 200 OK', `Status: ${response.status}`);

    const data = await response.json();

    assert(data.status, 'Health response has status field', `Status: ${data.status}`);
    assert(data.checks, 'Health response has checks field');
    assert(data.checks.database, 'Health check includes database status');
    assert(data.checks.kv, 'Health check includes KV status');

    if (data.checks.database.status === 'healthy') {
      log(`   D1 latency: ${data.checks.database.latency}ms`, 'cyan');
    } else {
      warn(`Database unhealthy: ${data.checks.database.error}`);
    }

    if (data.checks.kv.status === 'healthy') {
      log(`   KV latency: ${data.checks.kv.latency}ms`, 'cyan');
    } else {
      warn(`KV unhealthy: ${data.checks.kv.error}`);
    }

    assert(latency < 2000, 'Health endpoint responds within 2s', `Latency: ${latency}ms`);

    // Test CORS headers
    const corsHeaders = response.headers.get('access-control-allow-origin');
    assert(corsHeaders !== '*', 'Health endpoint does not use wildcard CORS', `CORS: ${corsHeaders || 'none'}`);

    // Test security headers
    const xFrameOptions = response.headers.get('x-frame-options');
    assert(xFrameOptions === 'DENY', 'X-Frame-Options header is DENY', `Value: ${xFrameOptions}`);

    const xContentType = response.headers.get('x-content-type-options');
    assert(xContentType === 'nosniff', 'X-Content-Type-Options is nosniff', `Value: ${xContentType}`);

    const csp = response.headers.get('content-security-policy');
    assert(csp && csp.includes('default-src'), 'CSP header is present', 'CSP configured');

  } catch (error) {
    assert(false, 'Health endpoint is reachable', `Error: ${error.message}`);
  }
}

async function testGlobalStatsEndpoint() {
  log('\n=== Testing Global Stats Endpoint ===', 'blue');

  try {
    const start = Date.now();
    const response = await fetch(`${PRODUCTION_URL}/api/stats/global`, {
      headers: { 'Origin': ALLOWED_ORIGINS[0] }
    });
    const latency = Date.now() - start;

    assert(response.ok, 'Global stats endpoint returns 200 OK', `Status: ${response.status}`);

    const data = await response.json();

    assert(typeof data.activePlayers === 'number', 'Global stats has activePlayers', `Value: ${data.activePlayers}`);
    assert(typeof data.gamesToday === 'number', 'Global stats has gamesToday', `Value: ${data.gamesToday}`);
    assert(typeof data.gamesTotal === 'number', 'Global stats has gamesTotal', `Value: ${data.gamesTotal}`);
    assert(data.topPlayer, 'Global stats has topPlayer object');
    assert(data.mostPopularStadium, 'Global stats has mostPopularStadium');
    assert(data.mostPopularCharacter, 'Global stats has mostPopularCharacter');
    assert(data.timezone === 'America/Chicago', 'Timezone is America/Chicago', `TZ: ${data.timezone}`);

    // Test cache headers
    const xCache = response.headers.get('x-cache');
    if (xCache) {
      log(`   Cache status: ${xCache}`, 'cyan');
    }

    assert(latency < 5000, 'Global stats responds within 5s', `Latency: ${latency}ms`);

    // Test CORS
    const corsOrigin = response.headers.get('access-control-allow-origin');
    assert(corsOrigin && corsOrigin !== '*', 'CORS header uses allowlist', `Origin: ${corsOrigin}`);

  } catch (error) {
    assert(false, 'Global stats endpoint is reachable', `Error: ${error.message}`);
  }
}

async function testCharactersEndpoint() {
  log('\n=== Testing Characters Endpoint ===', 'blue');

  try {
    // Test all characters
    const start1 = Date.now();
    const response1 = await fetch(`${PRODUCTION_URL}/api/stats/characters`, {
      headers: { 'Origin': ALLOWED_ORIGINS[0] }
    });
    const latency1 = Date.now() - start1;

    assert(response1.ok, 'Characters endpoint returns 200 OK', `Status: ${response1.status}`);

    const data1 = await response1.json();

    assert(Array.isArray(data1.characters), 'Characters response has array', `Length: ${data1.characters?.length || 0}`);
    assert(data1.metadata, 'Characters response has metadata');
    assert(data1.metadata.timezone === 'America/Chicago', 'Characters uses America/Chicago timezone');

    assert(latency1 < 5000, 'Characters endpoint responds within 5s', `Latency: ${latency1}ms`);

    // Test specific character
    const start2 = Date.now();
    const response2 = await fetch(`${PRODUCTION_URL}/api/stats/characters?characterId=rocket_rivera`, {
      headers: { 'Origin': ALLOWED_ORIGINS[0] }
    });
    const latency2 = Date.now() - start2;

    if (response2.ok) {
      const data2 = await response2.json();
      assert(data2.characterId === 'rocket_rivera', 'Specific character query works', 'Character found');
      assert(typeof data2.gamesPlayed === 'number', 'Character has gamesPlayed stat');
      log(`   Latency for specific character: ${latency2}ms`, 'cyan');
    } else if (response2.status === 404) {
      log('   No data for rocket_rivera (expected if DB empty)', 'yellow');
    }

  } catch (error) {
    assert(false, 'Characters endpoint is reachable', `Error: ${error.message}`);
  }
}

async function testStadiumsEndpoint() {
  log('\n=== Testing Stadiums Endpoint ===', 'blue');

  try {
    const start = Date.now();
    const response = await fetch(`${PRODUCTION_URL}/api/stats/stadiums`, {
      headers: { 'Origin': ALLOWED_ORIGINS[0] }
    });
    const latency = Date.now() - start;

    assert(response.ok, 'Stadiums endpoint returns 200 OK', `Status: ${response.status}`);

    const data = await response.json();

    assert(Array.isArray(data.stadiums), 'Stadiums response has array', `Length: ${data.stadiums?.length || 0}`);
    assert(data.metadata, 'Stadiums response has metadata');
    assert(data.metadata.timezone === 'America/Chicago', 'Stadiums uses America/Chicago timezone');

    assert(latency < 5000, 'Stadiums endpoint responds within 5s', `Latency: ${latency}ms`);

  } catch (error) {
    assert(false, 'Stadiums endpoint is reachable', `Error: ${error.message}`);
  }
}

async function testGameResultEndpoint() {
  log('\n=== Testing Game Result Endpoint ===', 'blue');

  try {
    // Test POST with valid data
    const testData = {
      playerId: 'test_player_' + Date.now(),
      won: true,
      runsScored: 5,
      hitsRecorded: 8,
      homeRunsHit: 2
    };

    const start = Date.now();
    const response = await fetch(`${PRODUCTION_URL}/api/game-result`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': ALLOWED_ORIGINS[0]
      },
      body: JSON.stringify(testData)
    });
    const latency = Date.now() - start;

    assert(response.ok, 'Game result POST returns 200 OK', `Status: ${response.status}`);

    if (response.ok) {
      const data = await response.json();
      assert(data.player_id === testData.playerId, 'Game result returns correct player ID');
      assert(typeof data.xp_gained === 'number', 'Game result calculates XP', `XP: ${data.xp_gained}`);
      assert(typeof data.leveled_up === 'boolean', 'Game result includes level up flag');
    }

    assert(latency < 5000, 'Game result endpoint responds within 5s', `Latency: ${latency}ms`);

    // Test CORS headers (critical security fix)
    const corsOrigin = response.headers.get('access-control-allow-origin');
    assert(corsOrigin !== '*', 'Game result does NOT use wildcard CORS', `Origin: ${corsOrigin || 'none'}`);
    assert(corsOrigin === ALLOWED_ORIGINS[0] || corsOrigin === null, 'CORS uses allowlist', `Allowed: ${corsOrigin}`);

    // Test OPTIONS (preflight)
    const optionsResponse = await fetch(`${PRODUCTION_URL}/api/game-result`, {
      method: 'OPTIONS',
      headers: { 'Origin': ALLOWED_ORIGINS[0] }
    });

    assert(optionsResponse.status === 204, 'OPTIONS returns 204 No Content', `Status: ${optionsResponse.status}`);

    const optionsCors = optionsResponse.headers.get('access-control-allow-origin');
    assert(optionsCors !== '*', 'OPTIONS does NOT use wildcard CORS', `Origin: ${optionsCors || 'none'}`);

  } catch (error) {
    assert(false, 'Game result endpoint is reachable', `Error: ${error.message}`);
  }
}

async function testPlayerProgressEndpoint() {
  log('\n=== Testing Player Progress Endpoint ===', 'blue');

  try {
    const testPlayerId = 'test_player_' + Date.now();

    // Test GET for non-existent player
    const start1 = Date.now();
    const response1 = await fetch(`${PRODUCTION_URL}/api/progress/${testPlayerId}`, {
      headers: { 'Origin': ALLOWED_ORIGINS[0] }
    });
    const latency1 = Date.now() - start1;

    assert(response1.ok, 'Player progress GET returns 200 OK', `Status: ${response1.status}`);

    if (response1.ok) {
      const data1 = await response1.json();
      assert(data1.playerId === testPlayerId, 'Returns correct player ID');
      assert(data1.gamesPlayed === 0, 'New player has 0 games played');
      assert(data1.currentLevel === 1, 'New player starts at level 1');
    }

    assert(latency1 < 5000, 'Player progress GET responds within 5s', `Latency: ${latency1}ms`);

    // Test CORS headers (critical - was missing)
    const corsOrigin = response1.headers.get('access-control-allow-origin');
    assert(corsOrigin !== '*' && corsOrigin !== undefined, 'Player progress has CORS headers', `Origin: ${corsOrigin || 'MISSING'}`);

    // Test OPTIONS handler (critical - was missing)
    const optionsResponse = await fetch(`${PRODUCTION_URL}/api/progress/${testPlayerId}`, {
      method: 'OPTIONS',
      headers: { 'Origin': ALLOWED_ORIGINS[0] }
    });

    assert(optionsResponse.status === 204, 'Player progress OPTIONS handler exists', `Status: ${optionsResponse.status}`);

  } catch (error) {
    assert(false, 'Player progress endpoint is reachable', `Error: ${error.message}`);
  }
}

async function testResilienceFeatures() {
  log('\n=== Testing Resilience Features ===', 'blue');

  try {
    // Test timeout behavior (this should complete normally)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout for test

    const response = await fetch(`${PRODUCTION_URL}/api/stats/global`, {
      signal: controller.signal,
      headers: { 'Origin': ALLOWED_ORIGINS[0] }
    });

    clearTimeout(timeoutId);

    assert(response.ok, 'Endpoint handles requests without timeout', 'Request completed successfully');

    // Test concurrent requests (circuit breaker won't trip under normal load)
    const concurrentRequests = Array(5).fill(null).map(() =>
      fetch(`${PRODUCTION_URL}/api/health`)
    );

    const start = Date.now();
    const responses = await Promise.all(concurrentRequests);
    const latency = Date.now() - start;

    const allSuccessful = responses.every(r => r.ok);
    assert(allSuccessful, 'Handles concurrent requests', `5 requests in ${latency}ms`);

  } catch (error) {
    if (error.name === 'AbortError') {
      assert(false, 'Request completed before 15s timeout', 'Timed out');
    } else {
      assert(false, 'Resilience features work correctly', `Error: ${error.message}`);
    }
  }
}

async function testSecurityHeaders() {
  log('\n=== Testing Security Headers ===', 'blue');

  try {
    const response = await fetch(`${PRODUCTION_URL}/api/health`);

    const headers = {
      'x-frame-options': response.headers.get('x-frame-options'),
      'x-content-type-options': response.headers.get('x-content-type-options'),
      'referrer-policy': response.headers.get('referrer-policy'),
      'permissions-policy': response.headers.get('permissions-policy'),
      'content-security-policy': response.headers.get('content-security-policy'),
    };

    assert(headers['x-frame-options'] === 'DENY', 'X-Frame-Options header is set', `Value: ${headers['x-frame-options']}`);
    assert(headers['x-content-type-options'] === 'nosniff', 'X-Content-Type-Options header is set', `Value: ${headers['x-content-type-options']}`);
    assert(headers['referrer-policy'], 'Referrer-Policy header is set', `Value: ${headers['referrer-policy']}`);
    assert(headers['permissions-policy'], 'Permissions-Policy header is set', 'Policy configured');
    assert(headers['content-security-policy'], 'Content-Security-Policy header is set', 'CSP configured');

    // Verify CSP allows Babylon.js
    const csp = headers['content-security-policy'];
    assert(csp.includes('cdn.babylonjs.com'), 'CSP allows Babylon.js CDN', 'Babylon.js allowed');
    assert(csp.includes('frame-src \'none\''), 'CSP blocks frames', 'Frames blocked');

  } catch (error) {
    assert(false, 'Security headers are accessible', `Error: ${error.message}`);
  }
}

async function runAllTests() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║   SANDLOT SLUGGERS BACKEND INTEGRATION TEST SUITE         ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  log(`\nTesting against: ${PRODUCTION_URL}`, 'blue');
  log(`Test started: ${new Date().toISOString()}\n`, 'blue');

  await testHealthEndpoint();
  await testGlobalStatsEndpoint();
  await testCharactersEndpoint();
  await testStadiumsEndpoint();
  await testGameResultEndpoint();
  await testPlayerProgressEndpoint();
  await testResilienceFeatures();
  await testSecurityHeaders();

  // Print summary
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║   TEST SUMMARY                                             ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');

  const total = results.passed + results.failed;
  const passRate = ((results.passed / total) * 100).toFixed(1);

  log(`\nTotal Tests: ${total}`, 'blue');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`Warnings: ${results.warnings}`, results.warnings > 0 ? 'yellow' : 'green');
  log(`Pass Rate: ${passRate}%`, passRate >= 80 ? 'green' : 'yellow');

  if (results.failed > 0) {
    log('\nFailed Tests:', 'red');
    results.tests.filter(t => t.status === 'FAIL').forEach(test => {
      log(`  ❌ ${test.name}`, 'red');
      if (test.details) log(`     ${test.details}`, 'yellow');
    });
  }

  log(`\nTest completed: ${new Date().toISOString()}`, 'blue');
  log('\n' + '='.repeat(64) + '\n', 'cyan');

  // Exit with error code if tests failed
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  log(`\n❌ Test suite error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
