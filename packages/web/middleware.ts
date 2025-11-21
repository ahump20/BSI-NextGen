import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@bsi/api';

async function validateSession(request: NextRequest) {
  const sessionToken = request.cookies.get('bsi_session')?.value;

  if (!sessionToken) {
    return null;
  }

  return verifyJWT(sessionToken, {
    secret: process.env.JWT_SECRET!,
    issuer: process.env.NEXT_PUBLIC_APP_URL!,
    audience: 'bsi-web',
  });
}

export async function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith('/api/user')) {
    return NextResponse.next();
  }

  const user = await validateSession(request);

  if (!user) {
    const response = NextResponse.json(
      { error: 'Authentication required', code: 'SESSION_EXPIRED' },
      { status: 401, headers: { 'x-session-expired': '1' } }
    );
    response.cookies.delete('bsi_session');
    return response;
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-bsi-user-role', user.role);
  if (user.featureFlags?.length) {
    requestHeaders.set('x-bsi-feature-flags', user.featureFlags.join(','));
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/api/user/:path*'],
};
