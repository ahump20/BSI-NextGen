import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { trackEdgeRequest } from './src/lib/observability/tracing';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const trace = trackEdgeRequest(request.nextUrl.pathname, {
    region: request.geo?.region,
    cacheStatus: request.headers.get('cf-cache-status') || undefined,
  });

  response.headers.set('x-bsi-trace-id', trace.traceId);
  response.headers.set('x-bsi-edge-region', trace.region || 'unknown');
  response.headers.set('x-bsi-sampled', trace.sampled ? '1' : '0');
  response.headers.set('x-bsi-user-impact-budget-ms', '2500');

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
