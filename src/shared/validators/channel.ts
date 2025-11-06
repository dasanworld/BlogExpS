export const canonicalizeUrl = (raw: string): string => {
  try {
    const url = new URL(raw);
    url.hash = '';
    // Remove common tracking query params while preserving semantics
    url.searchParams.delete('utm_source');
    url.searchParams.delete('utm_medium');
    url.searchParams.delete('utm_campaign');
    // Sort remaining params to stabilize
    const entries = Array.from(url.searchParams.entries()).sort(([a], [b]) => a.localeCompare(b));
    url.search = entries.length ? '?' + entries.map(([k, v]) => `${k}=${v}`).join('&') : '';
    // Normalize hostname case and trailing slash
    const normalized = url.toString().replace(/\/$/, '');
    return normalized.toLowerCase();
  } catch {
    return raw.trim();
  }
};

export const isValidPlatformUrl = (_platform: string, rawUrl: string): boolean => {
  try {
    const url = new URL(rawUrl);
    return Boolean(url.protocol && url.hostname);
  } catch {
    return false;
  }
};

export const makeChannelDedupKey = (platform: string, canonicalUrl: string): string => {
  return `${platform.toLowerCase()}::${canonicalizeUrl(canonicalUrl)}`;
};
