const r2Base = process.env.NEXT_PUBLIC_R2_ASSET_BASE_URL?.replace(/\/$/, '') || '';

export function getAssetUrl(path: string, fallback?: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (r2Base) {
    return `${r2Base}${normalizedPath}`;
  }
  return fallback || normalizedPath;
}
