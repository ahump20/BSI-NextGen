/**
 * Global Middleware for Cloudflare Pages Functions
 * Adds security headers to all API responses
 */

export const onRequest: PagesFunction = async (context) => {
  // Execute the next handler in the chain
  const response = await context.next();

  // Clone the response so we can modify headers
  const modifiedResponse = new Response(response.body, response);

  // Add security headers
  modifiedResponse.headers.set('X-Content-Type-Options', 'nosniff');
  modifiedResponse.headers.set('X-Frame-Options', 'DENY');
  modifiedResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  modifiedResponse.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=()'
  );

  // Content Security Policy - Allow Babylon.js, THREE.js, and required CDNs
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.babylonjs.com https://cdn.jsdelivr.net https://unpkg.com",
    "style-src 'self' 'unsafe-inline' https://cdn.babylonjs.com https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://*",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://eaec3ea6.sandlot-sluggers.pages.dev https://5e1ebbdb.sandlot-sluggers.pages.dev https://blazesportsintel.com",
    "worker-src 'self' blob:",
    "frame-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ');

  modifiedResponse.headers.set('Content-Security-Policy', csp);

  // Add X-Powered-By header for debugging (remove in production)
  modifiedResponse.headers.set('X-Powered-By', 'Cloudflare Pages + D1');

  return modifiedResponse;
};
