import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Allow all requests to pass through
    // You can add custom logic here for protected routes
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Define which paths require authentication
        const protectedPaths = ['/profile', '/favorites', '/settings'];
        const isProtectedPath = protectedPaths.some(path =>
          req.nextUrl.pathname.startsWith(path)
        );

        // If it's a protected path, require a token
        if (isProtectedPath) {
          return !!token;
        }

        // Otherwise, allow access
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
