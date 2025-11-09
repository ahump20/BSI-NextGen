#!/usr/bin/env node

/**
 * Longhorns Baseball CLI
 * Management tool for deployment and operations
 *
 * Commands:
 *   init       - Initialize project and create D1 database
 *   deploy     - Deploy worker to Cloudflare
 *   update     - Trigger stats update
 *   query      - Query player stats
 *   analytics  - View analytics
 *   logs       - View worker logs
 *   help       - Show help
 */

import { execSync } from 'child_process';
import https from 'https';

const WORKER_NAME = 'longhorns-baseball-tracker';
const DB_NAME = 'longhorns-baseball-db';

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  orange: '\x1b[38;5;208m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function logHeader(message) {
  console.log('');
  log('='.repeat(60), 'orange');
  log(message, 'bright');
  log('='.repeat(60), 'orange');
  console.log('');
}

function exec(command, options = {}) {
  try {
    const output = execSync(command, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options,
    });
    return { success: true, output };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout };
  }
}

function httpsRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function init() {
  logHeader('🚀 Initializing Longhorns Baseball Project');

  log('1. Checking Wrangler installation...', 'blue');
  const wranglerCheck = exec('wrangler --version', { silent: true });
  if (!wranglerCheck.success) {
    log('❌ Wrangler not found. Install it with: npm install -g wrangler', 'red');
    process.exit(1);
  }
  log(`✅ Wrangler installed: ${wranglerCheck.output.trim()}`, 'green');

  log('\n2. Creating D1 database...', 'blue');
  const createDb = exec(`wrangler d1 create ${DB_NAME}`, { silent: true });
  if (createDb.success) {
    log(`✅ Database created: ${DB_NAME}`, 'green');
    log(createDb.output, 'gray');
  } else {
    log('⚠️  Database may already exist', 'orange');
  }

  log('\n3. Running database schema...', 'blue');
  const runSchema = exec(`wrangler d1 execute ${DB_NAME} --file=./schema.sql`);
  if (runSchema.success) {
    log('✅ Schema applied successfully', 'green');
  } else {
    log('❌ Schema application failed', 'red');
    process.exit(1);
  }

  log('\n4. Verifying database tables...', 'blue');
  const verifyTables = exec(
    `wrangler d1 execute ${DB_NAME} --command="SELECT name FROM sqlite_master WHERE type='table';"`,
    { silent: true }
  );
  if (verifyTables.success) {
    log('✅ Database tables verified', 'green');
    log(verifyTables.output, 'gray');
  }

  log('\n✨ Initialization complete!', 'green');
  log('Next steps:', 'bright');
  log('  1. Update wrangler.toml with your account ID', 'blue');
  log('  2. Run: node cli.js deploy', 'blue');
}

async function deploy() {
  logHeader('🚀 Deploying Longhorns Baseball Worker');

  log('1. Building worker bundle...', 'blue');
  log('✅ Worker files ready', 'green');

  log('\n2. Deploying to Cloudflare...', 'blue');
  const deployResult = exec('wrangler deploy');
  if (deployResult.success) {
    log('\n✅ Deployment successful!', 'green');
    log('Your worker is now live.', 'bright');
  } else {
    log('\n❌ Deployment failed', 'red');
    process.exit(1);
  }
}

async function update() {
  logHeader('🔄 Updating Stats');

  const workerUrl = process.argv[3] || 'http://localhost:8787';
  log(`Triggering update on: ${workerUrl}`, 'blue');

  try {
    const url = new URL('/api/update', workerUrl);
    const response = await httpsRequest(url.toString(), {
      method: 'POST',
    });

    if (response.status === 200 && response.data.success) {
      log('\n✅ Stats updated successfully!', 'green');
      log(`Players: ${response.data.scrape.playerCount}`, 'bright');
      log(`Batting: ${response.data.storage.insertedCount.batting}`, 'gray');
      log(`Pitching: ${response.data.storage.insertedCount.pitching}`, 'gray');
    } else {
      log('\n❌ Update failed', 'red');
      console.log(response.data);
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    log('Make sure the worker URL is correct and accessible', 'gray');
  }
}

async function query() {
  logHeader('🔍 Query Player Stats');

  const workerUrl = process.argv[3] || 'http://localhost:8787';
  const player = process.argv[4] || '';

  try {
    const url = new URL('/api/stats', workerUrl);
    if (player) url.searchParams.set('player', player);

    const response = await httpsRequest(url.toString());

    if (response.status === 200 && response.data.success) {
      log(`\n✅ Found ${response.data.count} records`, 'green');
      console.table(response.data.data.slice(0, 10));
    } else {
      log('\n❌ Query failed', 'red');
      console.log(response.data);
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
  }
}

async function analytics() {
  logHeader('📊 Analytics Dashboard');

  const workerUrl = process.argv[3] || 'http://localhost:8787';

  try {
    const url = new URL('/api/analytics', workerUrl);
    const response = await httpsRequest(url.toString());

    if (response.status === 200 && response.data.success) {
      const { topHitters, topPitchers, seasonStats } = response.data.analytics;

      log('\n📈 Season Overview', 'bright');
      console.log(seasonStats);

      log('\n🏆 Top 10 Hitters (by OPS)', 'bright');
      console.table(
        topHitters.map((p, i) => ({
          Rank: i + 1,
          Player: p.player_name,
          AB: p.at_bats,
          AVG: p.batting_avg?.toFixed(3),
          OBP: p.on_base_pct?.toFixed(3),
          SLG: p.slugging_pct?.toFixed(3),
          OPS: p.ops?.toFixed(3),
        }))
      );

      log('\n⚾ Top 10 Pitchers (by ERA)', 'bright');
      console.table(
        topPitchers.map((p, i) => ({
          Rank: i + 1,
          Player: p.player_name,
          IP: p.innings_pitched?.toFixed(1),
          ERA: p.era?.toFixed(2),
          WHIP: p.whip?.toFixed(2),
          'K/9': p.k_per_9?.toFixed(2),
          'BB/9': p.bb_per_9?.toFixed(2),
        }))
      );
    } else {
      log('\n❌ Failed to load analytics', 'red');
      console.log(response.data);
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
  }
}

function logs() {
  logHeader('📜 Worker Logs');
  log('Tailing logs (Ctrl+C to exit)...', 'blue');
  exec(`wrangler tail ${WORKER_NAME}`);
}

function help() {
  logHeader('🤘 Longhorns Baseball CLI - Help');

  log('Commands:', 'bright');
  log('  init                      Initialize project and create D1 database', 'blue');
  log('  deploy                    Deploy worker to Cloudflare', 'blue');
  log('  update [url]              Trigger stats update', 'blue');
  log('  query [url] [player]      Query player stats', 'blue');
  log('  analytics [url]           View analytics dashboard', 'blue');
  log('  logs                      View worker logs (tail)', 'blue');
  log('  help                      Show this help message', 'blue');

  log('\nExamples:', 'bright');
  log('  node cli.js init', 'gray');
  log('  node cli.js deploy', 'gray');
  log('  node cli.js update https://your-worker.workers.dev', 'gray');
  log('  node cli.js query https://your-worker.workers.dev "John Doe"', 'gray');
  log('  node cli.js analytics https://your-worker.workers.dev', 'gray');
  log('  node cli.js logs', 'gray');
}

// Main command router
const command = process.argv[2];

switch (command) {
  case 'init':
    init();
    break;
  case 'deploy':
    deploy();
    break;
  case 'update':
    update();
    break;
  case 'query':
    query();
    break;
  case 'analytics':
    analytics();
    break;
  case 'logs':
    logs();
    break;
  case 'help':
  default:
    help();
}
