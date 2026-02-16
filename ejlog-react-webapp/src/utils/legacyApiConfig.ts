// ============================================================================
// EJLOG WMS - Legacy API Configuration Helpers
// Controls legacy EjLog (EjLogHostVertimag) base URL resolution with fallback.
// ============================================================================

export type LegacyApiMode = 'auto' | 'proxy' | 'direct' | 'disabled';

const STORAGE_MODE_KEY = 'ejlog_legacy_api_mode';
const STORAGE_BASE_URL_KEY = 'ejlog_legacy_api_base_url';

const DEFAULT_MODE =
  (import.meta.env.VITE_EJLOG_LEGACY_API_MODE as LegacyApiMode) || 'auto';

const DEFAULT_PROXY_BASE = '/api/EjLogHostVertimag';
const DEFAULT_DIRECT_BASE =
  import.meta.env.VITE_EJLOG_LEGACY_DIRECT_BASE_URL ||
  'https://localhost:7079/EjLogHostVertimag';

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, '');

const isBrowser = () => typeof window !== 'undefined';

export const getLegacyApiMode = (): LegacyApiMode => {
  if (!isBrowser()) {
    return DEFAULT_MODE;
  }
  const stored = (localStorage.getItem(STORAGE_MODE_KEY) || '').trim() as LegacyApiMode;
  if (stored === 'auto' || stored === 'proxy' || stored === 'direct' || stored === 'disabled') {
    return stored;
  }
  return DEFAULT_MODE;
};

export const setLegacyApiMode = (mode: LegacyApiMode) => {
  if (!isBrowser()) {
    return;
  }
  localStorage.setItem(STORAGE_MODE_KEY, mode);
};

export const getLegacyApiBaseOverride = (): string => {
  if (!isBrowser()) {
    return '';
  }
  return (localStorage.getItem(STORAGE_BASE_URL_KEY) || '').trim();
};

export const setLegacyApiBaseOverride = (value: string) => {
  if (!isBrowser()) {
    return;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    localStorage.removeItem(STORAGE_BASE_URL_KEY);
    return;
  }
  localStorage.setItem(STORAGE_BASE_URL_KEY, trimmed);
};

export const getLegacyBaseUrlCandidates = (): { primary: string | null; fallback: string | null } => {
  const mode = getLegacyApiMode();
  if (mode === 'disabled') {
    return { primary: null, fallback: null };
  }

  const proxyBase = normalizeBaseUrl(DEFAULT_PROXY_BASE);
  const directBase = normalizeBaseUrl(DEFAULT_DIRECT_BASE);
  const override = getLegacyApiBaseOverride();

  if (override) {
    const primary = normalizeBaseUrl(override);
    const fallback = mode === 'direct' ? proxyBase : directBase;
    return { primary, fallback };
  }

  if (mode === 'direct') {
    return { primary: directBase, fallback: proxyBase };
  }

  if (mode === 'proxy') {
    return { primary: proxyBase, fallback: directBase };
  }

  // auto: prefer direct when available, fallback to proxy
  return { primary: directBase, fallback: proxyBase };
};

export const resolveLegacyBaseUrl = (): string | null => {
  const { primary } = getLegacyBaseUrlCandidates();
  return primary;
};

