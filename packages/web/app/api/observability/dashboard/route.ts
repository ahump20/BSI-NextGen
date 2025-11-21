import { NextResponse } from 'next/server';
import { getDashboardSnapshot, withApiObservability } from '../../../lib/observability';

export const runtime = 'edge';

export const GET = withApiObservability(async () => {
  const snapshot = getDashboardSnapshot();

  return {
    response: NextResponse.json({
      cache: snapshot.cache,
      latency: snapshot.latency,
      errorBudget: snapshot.errorBudget,
      coreWebVitals: snapshot.coreWebVitals,
    }),
    cacheStatus: 'bypass',
  };
}, { feature: 'observability-dashboard' });
