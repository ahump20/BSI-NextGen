import type { AuthUser } from '@bsi/shared';

const ROLE_BASED_FLAGS: Record<AuthUser['role'], string[]> = {
  user: ['core-experience', 'read-only-dashboards'],
  premium: [
    'core-experience',
    'read-only-dashboards',
    'premium-insights',
    'personalization-dashboard',
    'alerts-center',
  ],
  admin: [
    'core-experience',
    'read-only-dashboards',
    'premium-insights',
    'personalization-dashboard',
    'alerts-center',
    'admin-tools',
  ],
};

const ENTITLEMENT_FLAG_MAP: Record<string, string[]> = {
  command_center: ['command-center'],
  personalization: ['personalization-dashboard'],
  alerts: ['alerts-center'],
  watchlists: ['watchlist-builder'],
  favorites: ['favorites-tracker'],
};

export function deriveFeatureFlags(
  role: AuthUser['role'],
  entitlements: string[] = []
): string[] {
  const flags = new Set<string>(ROLE_BASED_FLAGS[role] || []);

  entitlements.forEach((entitlement) => {
    const mapped = ENTITLEMENT_FLAG_MAP[entitlement];
    if (mapped) {
      mapped.forEach((flag) => flags.add(flag));
    }
  });

  return Array.from(flags);
}

export function extractEntitlementsFromClaims(
  claims: Record<string, unknown>,
  keys: string[] = [
    'https://blazesportsintel.com/entitlements',
    'https://bsi.ai/entitlements',
    'https://claims.bsi/entitlements',
  ]
): string[] {
  for (const key of keys) {
    const value = claims[key];
    if (Array.isArray(value)) {
      return value.map((item) => String(item));
    }
    if (typeof value === 'string') {
      return value.split(',').map((item) => item.trim());
    }
  }

  return [];
}

export function extractRoleFromClaims(
  claims: Record<string, unknown>,
  fallback: AuthUser['role'] = 'user'
): AuthUser['role'] {
  const keys = [
    'https://blazesportsintel.com/roles',
    'https://bsi.ai/roles',
    'https://claims.bsi/roles',
    'role',
  ];

  for (const key of keys) {
    const value = claims[key];
    if (Array.isArray(value) && value.length > 0) {
      const role = value[0];
      if (role === 'admin' || role === 'premium' || role === 'user') {
        return role;
      }
    }
    if (typeof value === 'string') {
      if (value === 'admin' || value === 'premium' || value === 'user') {
        return value;
      }
    }
  }

  return fallback;
}
