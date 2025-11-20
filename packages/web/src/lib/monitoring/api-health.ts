/**
 * API Health Monitoring System
 *
 * Monitors the health and performance of all API endpoints
 * - Response time tracking
 * - Error rate monitoring
 * - Data quality verification
 * - Automatic retries with exponential backoff
 */

export interface HealthCheck {
  endpoint: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  lastChecked: string;
  errorRate: number;
  dataQuality: number; // 0-100 score
}

export interface ApiMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  uptime: number; // percentage
}

class ApiHealthMonitor {
  private healthChecks: Map<string, HealthCheck> = new Map();
  private metrics: Map<string, ApiMetrics> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Initialize monitoring for all API endpoints
    this.initializeMonitoring();
  }

  private initializeMonitoring() {
    const endpoints = [
      '/api/sports/mlb/games',
      '/api/sports/mlb/standings',
      '/api/sports/nfl/games',
      '/api/sports/nfl/standings',
      '/api/sports/nba/games',
      '/api/sports/nba/standings',
      '/api/sports/college-baseball/games',
      '/api/sports/college-baseball/standings',
    ];

    endpoints.forEach((endpoint) => {
      this.healthChecks.set(endpoint, {
        endpoint,
        status: 'healthy',
        responseTime: 0,
        lastChecked: new Date().toISOString(),
        errorRate: 0,
        dataQuality: 100,
      });

      this.metrics.set(endpoint, {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        uptime: 100,
      });
    });
  }

  /**
   * Start continuous health monitoring
   * Checks all endpoints every 5 minutes
   */
  startMonitoring() {
    if (this.monitoringInterval) return;

    this.monitoringInterval = setInterval(
      () => {
        this.checkAllEndpoints();
      },
      5 * 60 * 1000
    ); // 5 minutes

    // Initial check
    this.checkAllEndpoints();
  }

  /**
   * Stop health monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Check health of all endpoints
   */
  private async checkAllEndpoints() {
    const promises = Array.from(this.healthChecks.keys()).map((endpoint) =>
      this.checkEndpoint(endpoint)
    );

    await Promise.allSettled(promises);
  }

  /**
   * Check health of a single endpoint
   */
  async checkEndpoint(endpoint: string): Promise<HealthCheck> {
    const startTime = Date.now();
    const currentMetrics = this.metrics.get(endpoint)!;

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'x-health-check': 'true',
        },
      });

      const responseTime = Date.now() - startTime;
      const data = await response.json();

      // Verify data quality
      const dataQuality = this.verifyDataQuality(data, endpoint);

      // Determine status based on response time and data quality
      let status: HealthCheck['status'] = 'healthy';
      if (responseTime > 5000 || dataQuality < 70) {
        status = 'degraded';
      }
      if (!response.ok || dataQuality < 50) {
        status = 'down';
      }

      // Update metrics
      currentMetrics.totalRequests++;
      currentMetrics.successfulRequests++;
      currentMetrics.averageResponseTime =
        (currentMetrics.averageResponseTime * (currentMetrics.totalRequests - 1) + responseTime) /
        currentMetrics.totalRequests;
      currentMetrics.uptime =
        (currentMetrics.successfulRequests / currentMetrics.totalRequests) * 100;

      const errorRate =
        (currentMetrics.failedRequests / currentMetrics.totalRequests) * 100;

      const healthCheck: HealthCheck = {
        endpoint,
        status,
        responseTime,
        lastChecked: new Date().toISOString(),
        errorRate,
        dataQuality,
      };

      this.healthChecks.set(endpoint, healthCheck);
      this.metrics.set(endpoint, currentMetrics);

      return healthCheck;
    } catch (error) {
      // Update metrics for failed request
      currentMetrics.totalRequests++;
      currentMetrics.failedRequests++;
      currentMetrics.uptime =
        (currentMetrics.successfulRequests / currentMetrics.totalRequests) * 100;

      const errorRate =
        (currentMetrics.failedRequests / currentMetrics.totalRequests) * 100;

      const healthCheck: HealthCheck = {
        endpoint,
        status: 'down',
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
        errorRate,
        dataQuality: 0,
      };

      this.healthChecks.set(endpoint, healthCheck);
      this.metrics.set(endpoint, currentMetrics);

      console.error(`[API Health] Endpoint ${endpoint} is down:`, error);

      return healthCheck;
    }
  }

  /**
   * Verify data quality based on expected structure
   */
  private verifyDataQuality(data: any, endpoint: string): number {
    let score = 100;

    try {
      // Check for basic structure
      if (!data) {
        return 0;
      }

      // Games endpoints
      if (endpoint.includes('/games')) {
        if (!Array.isArray(data) && !Array.isArray(data.games)) {
          score -= 30;
        }

        const games = Array.isArray(data) ? data : data.games || [];

        if (games.length === 0) {
          score -= 20; // Not necessarily an error, could be off-season
        }

        // Check first game structure
        if (games.length > 0) {
          const game = games[0];
          if (!game.id) score -= 10;
          if (!game.homeTeam) score -= 10;
          if (!game.awayTeam) score -= 10;
          if (!game.status) score -= 10;
        }
      }

      // Standings endpoints
      if (endpoint.includes('/standings')) {
        if (!Array.isArray(data) && !Array.isArray(data.standings)) {
          score -= 30;
        }

        const standings = Array.isArray(data) ? data : data.standings || [];

        if (standings.length === 0) {
          score -= 20;
        }

        // Check first standing structure
        if (standings.length > 0) {
          const standing = standings[0];
          if (!standing.team) score -= 10;
          if (standing.wins === undefined) score -= 10;
          if (standing.losses === undefined) score -= 10;
        }
      }

      // Check for meta information
      if (data.meta) {
        if (!data.meta.lastUpdated) score -= 5;
        if (!data.meta.timezone) score -= 5;
      }

      return Math.max(0, score);
    } catch (error) {
      console.error(`[API Health] Error verifying data quality for ${endpoint}:`, error);
      return 50; // Return middle score if verification fails
    }
  }

  /**
   * Get health status for a specific endpoint
   */
  getHealth(endpoint: string): HealthCheck | null {
    return this.healthChecks.get(endpoint) || null;
  }

  /**
   * Get metrics for a specific endpoint
   */
  getMetrics(endpoint: string): ApiMetrics | null {
    return this.metrics.get(endpoint) || null;
  }

  /**
   * Get all health checks
   */
  getAllHealthChecks(): HealthCheck[] {
    return Array.from(this.healthChecks.values());
  }

  /**
   * Get overall system health
   */
  getSystemHealth(): {
    status: 'healthy' | 'degraded' | 'down';
    healthyEndpoints: number;
    degradedEndpoints: number;
    downEndpoints: number;
    averageResponseTime: number;
    averageUptime: number;
  } {
    const checks = Array.from(this.healthChecks.values());
    const metrics = Array.from(this.metrics.values());

    const healthyCount = checks.filter((c) => c.status === 'healthy').length;
    const degradedCount = checks.filter((c) => c.status === 'degraded').length;
    const downCount = checks.filter((c) => c.status === 'down').length;

    const avgResponseTime =
      metrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / metrics.length;
    const avgUptime =
      metrics.reduce((sum, m) => sum + m.uptime, 0) / metrics.length;

    let status: 'healthy' | 'degraded' | 'down' = 'healthy';
    if (downCount > 0 || degradedCount > checks.length / 2) {
      status = 'degraded';
    }
    if (downCount > checks.length / 2) {
      status = 'down';
    }

    return {
      status,
      healthyEndpoints: healthyCount,
      degradedEndpoints: degradedCount,
      downEndpoints: downCount,
      averageResponseTime: avgResponseTime,
      averageUptime: avgUptime,
    };
  }
}

// Singleton instance
export const apiHealthMonitor = new ApiHealthMonitor();

/**
 * Fetch with automatic retry and exponential backoff
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // If successful or client error (don't retry 4xx), return
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }

      // Server error, prepare to retry
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      lastError = error as Error;
    }

    // If this wasn't the last attempt, wait before retrying
    if (attempt < maxRetries) {
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`[Fetch Retry] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

/**
 * Enhanced fetch with health monitoring
 */
export async function monitoredFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const startTime = Date.now();

  try {
    const response = await fetchWithRetry(endpoint, options);
    const responseTime = Date.now() - startTime;

    // Log performance
    if (responseTime > 3000) {
      console.warn(`[API Performance] Slow response from ${endpoint}: ${responseTime}ms`);
    }

    return response;
  } catch (error) {
    console.error(`[API Error] Failed to fetch ${endpoint}:`, error);
    throw error;
  }
}
