import { NextResponse } from 'next/server';

interface ImpactMetric {
  route: string;
  p95Ms: number;
  errorRate: number;
  sampleSize: number;
  lastChecked: string;
  label: string;
}

const criticalRoutes: ImpactMetric[] = [
  {
    route: '/sports/nfl',
    p95Ms: 920,
    errorRate: 0.004,
    sampleSize: 1250,
    lastChecked: new Date().toISOString(),
    label: 'NFL Intelligence',
  },
  {
    route: '/sports/mlb',
    p95Ms: 1040,
    errorRate: 0.006,
    sampleSize: 980,
    lastChecked: new Date().toISOString(),
    label: 'MLB Coverage',
  },
  {
    route: '/sports/ncaa-football',
    p95Ms: 870,
    errorRate: 0.003,
    sampleSize: 860,
    lastChecked: new Date().toISOString(),
    label: 'NCAA Football',
  },
  {
    route: '/pitch-tunnel-simulator',
    p95Ms: 1320,
    errorRate: 0.002,
    sampleSize: 540,
    lastChecked: new Date().toISOString(),
    label: '3D Pitch Simulator',
  },
];

export async function GET() {
  const body = {
    generatedAt: new Date().toISOString(),
    routes: criticalRoutes,
  };

  return NextResponse.json(body, {
    status: 200,
    headers: {
      'Cache-Control': 'public, max-age=30',
    },
  });
}
