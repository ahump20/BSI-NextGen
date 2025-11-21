const targets = [
  { name: 'NFL dashboard', url: '/sports/nfl' },
  { name: 'MLB dashboard', url: '/sports/mlb' },
  { name: 'NCAA football dashboard', url: '/sports/ncaa-football' },
  { name: 'Pitch tunnel simulator', url: '/pitch-tunnel-simulator' },
  { name: 'NFL games API', url: '/api/sports/nfl/games?week=1' },
];

const baseUrl = process.env.SYNTHETIC_BASE_URL || 'http://localhost:3000';

async function runChecks() {
  const results = [] as Array<{ name: string; status: number; duration: number; ok: boolean }>;

  for (const target of targets) {
    const start = performance.now();
    try {
      const res = await fetch(`${baseUrl}${target.url}`, { method: 'GET', cache: 'no-store' });
      const duration = performance.now() - start;
      results.push({ name: target.name, status: res.status, duration, ok: res.ok });
    } catch (error) {
      const duration = performance.now() - start;
      results.push({ name: target.name, status: 0, duration, ok: false });
      console.error(`Synthetic check failed for ${target.name}:`, error);
    }
  }

  const failures = results.filter((r) => !r.ok);
  const reportLines = results.map(
    (r) => `${r.name.padEnd(28)} | status: ${String(r.status).padEnd(3)} | ${r.duration.toFixed(0)} ms`,
  );

  console.log('Synthetic coverage report (critical sports routes)');
  console.log(reportLines.join('\n'));

  if (failures.length > 0) {
    console.error(`Synthetic checks detected ${failures.length} failures.`);
    process.exitCode = 1;
  }
}

runChecks();
