export type AlertSeverity = 'warning' | 'critical';

export interface AlertContext {
  dataFreshnessSeconds?: number;
  authFailures?: number;
  upstreamErrorRate?: number;
}

export interface AlertRule {
  id: string;
  description: string;
  severity: AlertSeverity;
  evaluate: (ctx: AlertContext) => boolean;
  remediation: string;
}

export interface ObservabilityAlert {
  id: string;
  severity: AlertSeverity;
  description: string;
  remediation: string;
  triggeredAt: string;
}

export const DEFAULT_ALERT_RULES: AlertRule[] = [
  {
    id: 'data-freshness',
    severity: 'critical',
    description: 'Live game feed is older than 90 seconds',
    remediation: 'Check upstream schedule feeds and worker cron execution. Redeploy worker if stale.',
    evaluate: (ctx) => (ctx.dataFreshnessSeconds ?? 0) > 90,
  },
  {
    id: 'auth-failure-rate',
    severity: 'warning',
    description: 'Authentication failures detected in API responses',
    remediation: 'Inspect OAuth/JWT validity, rotate secrets in Cloudflare KV, and validate client tokens.',
    evaluate: (ctx) => (ctx.authFailures ?? 0) > 0,
  },
  {
    id: 'upstream-error-rate',
    severity: 'critical',
    description: 'Upstream provider errors above threshold',
    remediation: 'Fail over to cached responses, throttle retries, and open provider status page.',
    evaluate: (ctx) => (ctx.upstreamErrorRate ?? 0) >= 0.1,
  },
];

export function evaluateAlerts(
  context: AlertContext,
  rules: AlertRule[] = DEFAULT_ALERT_RULES
): ObservabilityAlert[] {
  return rules
    .filter((rule) => rule.evaluate(context))
    .map((rule) => ({
      id: rule.id,
      severity: rule.severity,
      description: rule.description,
      remediation: rule.remediation,
      triggeredAt: new Date().toISOString(),
    }));
}
