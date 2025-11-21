import { NextRequest, NextResponse } from 'next/server';
import { recordWebVitalMetric, withApiObservability } from '../../../lib/observability';

export const runtime = 'edge';

interface VitalPayload {
  metric: string;
  value: number;
  rating?: string;
  path?: string;
  id?: string;
  timestamp?: number;
}

export const POST = withApiObservability(async (request: NextRequest) => {
  const body = await request.json();
  const payloads: VitalPayload[] = Array.isArray(body) ? body : [body];

  payloads.forEach((payload) => {
    if (payload?.metric && typeof payload.value === 'number') {
      recordWebVitalMetric(payload.metric, payload.value);
    }
  });

  return {
    response: NextResponse.json({ received: payloads.length }),
    cacheStatus: 'bypass',
    alertContext: {
      upstreamErrorRate: 0,
    },
  };
}, { feature: 'web-vitals-ingest' });

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
