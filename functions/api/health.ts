/**
 * Health Check Endpoint
 * GET /api/health
 *
 * Checks connectivity to D1, KV, and returns system status
 */

import { getCorsHeaders } from './stats/_utils';

interface Env {
  DB: D1Database;
  KV: KVNamespace;
}

interface HealthCheck {
  timestamp: number;
  status: "healthy" | "degraded" | "unhealthy";
  checks: {
    database: { status: string; latency: number; error?: string };
    kv: { status: string; latency: number; error?: string };
    frontend: { status: string; latency: number };
  };
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const origin = context.request.headers.get('Origin');

  const checks: HealthCheck = {
    timestamp: Date.now(),
    status: "healthy",
    checks: {
      database: { status: "unknown", latency: 0 },
      kv: { status: "unknown", latency: 0 },
      frontend: { status: "healthy", latency: 0 }
    }
  };

  // Test D1 connection
  try {
    const dbStart = Date.now();
    await context.env.DB.prepare("SELECT 1 as test").first();
    checks.checks.database = {
      status: "healthy",
      latency: Date.now() - dbStart
    };
  } catch (error: any) {
    checks.checks.database = {
      status: "unhealthy",
      latency: 0,
      error: error.message || "Database connection failed"
    };
    checks.status = "degraded";
  }

  // Test KV connection
  try {
    const kvStart = Date.now();
    await context.env.KV.get("health-check-test");
    checks.checks.kv = {
      status: "healthy",
      latency: Date.now() - kvStart
    };
  } catch (error: any) {
    checks.checks.kv = {
      status: "unhealthy",
      latency: 0,
      error: error.message || "KV connection failed"
    };
    checks.status = "degraded";
  }

  // Determine overall status
  if (checks.checks.database.status === "unhealthy" && checks.checks.kv.status === "unhealthy") {
    checks.status = "unhealthy";
  }

  const statusCode = checks.status === "healthy" ? 200 : 503;

  const headers = getCorsHeaders(origin);
  headers["Cache-Control"] = "no-cache, no-store, must-revalidate";

  return new Response(JSON.stringify(checks, null, 2), {
    status: statusCode,
    headers
  });
};

// Handle OPTIONS for CORS
export const onRequestOptions: PagesFunction<Env> = async (context) => {
  const origin = context.request.headers.get('Origin');
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
};
