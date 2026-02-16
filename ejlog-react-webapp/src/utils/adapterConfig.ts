// ============================================================================
// EJLOG WMS - Adapter Configuration Helpers
// Centralized storage for adapter mode and base URL resolution.
// ============================================================================

export type AdapterMode = 'integrated' | 'dotnet' | 'auto' | 'disabled';

const STORAGE_MODE_KEY = 'ejlog_adapter_mode';
const STORAGE_BASE_URL_KEY = 'ejlog_adapter_base_url';
const STORAGE_LAST_HEALTHY_KEY = 'ejlog_adapter_last_healthy_base';

const DEFAULT_MODE =
  (import.meta.env.VITE_EJLOG_ADAPTER_MODE as AdapterMode) || 'auto';

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, '');

const isBrowser = () => typeof window !== 'undefined';

export const getAdapterMode = (): AdapterMode => {
  if (!isBrowser()) {
    return DEFAULT_MODE;
  }
  const stored = (localStorage.getItem(STORAGE_MODE_KEY) || '').trim() as AdapterMode;
  if (stored === 'integrated' || stored === 'dotnet' || stored === 'auto' || stored === 'disabled') {
    return stored;
  }
  return DEFAULT_MODE;
};

export const setAdapterMode = (mode: AdapterMode) => {
  if (!isBrowser()) {
    return;
  }
  localStorage.setItem(STORAGE_MODE_KEY, mode);
};

export const getAdapterLastHealthyBase = (): string => {
  if (!isBrowser()) {
    return '';
  }
  return (localStorage.getItem(STORAGE_LAST_HEALTHY_KEY) || '').trim();
};

export const setAdapterLastHealthyBase = (value: string) => {
  if (!isBrowser()) {
    return;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    localStorage.removeItem(STORAGE_LAST_HEALTHY_KEY);
    return;
  }
  localStorage.setItem(STORAGE_LAST_HEALTHY_KEY, normalizeBaseUrl(trimmed));
};

export const getAdapterCustomBaseUrl = (): string => {
  if (!isBrowser()) {
    return '';
  }
  return (localStorage.getItem(STORAGE_BASE_URL_KEY) || '').trim();
};

export const setAdapterCustomBaseUrl = (value: string) => {
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

export const getAdapterBaseUrl = (): string | null => {
  const mode = getAdapterMode();
  if (mode === 'disabled') {
    return null;
  }

  if (mode === 'auto') {
    const lastHealthy = getAdapterLastHealthyBase();
    if (lastHealthy) {
      return normalizeBaseUrl(lastHealthy);
    }
  }

  const custom = getAdapterCustomBaseUrl();
  if (custom) {
    return normalizeBaseUrl(custom);
  }

  if (mode === 'dotnet') {
    return normalizeBaseUrl(
      import.meta.env.VITE_EJLOG_DOTNET_API_BASE_URL || '/api/ejlog-adapter/api'
    );
  }

  return normalizeBaseUrl(
    import.meta.env.VITE_EJLOG_ADAPTER_API_BASE_URL || '/api/adapter'
  );
};

export const isAdapterEnabled = (): boolean => getAdapterMode() !== 'disabled';

export const getAdapterBaseUrlCandidates = (): { primary: string | null; fallback: string | null } => {
  const mode = getAdapterMode();
  if (mode === 'disabled') {
    return { primary: null, fallback: null };
  }

  const integratedBase = normalizeBaseUrl(
    import.meta.env.VITE_EJLOG_ADAPTER_API_BASE_URL || '/api/adapter'
  );
  const dotnetBase = normalizeBaseUrl(
    import.meta.env.VITE_EJLOG_DOTNET_API_BASE_URL || '/api/ejlog-adapter/api'
  );

  const custom = getAdapterCustomBaseUrl();
  if (custom) {
    const primary = normalizeBaseUrl(custom);
    const fallback = mode === 'dotnet' ? integratedBase : dotnetBase;
    return { primary, fallback };
  }

  if (mode === 'dotnet') {
    return { primary: dotnetBase, fallback: integratedBase };
  }

  return { primary: integratedBase, fallback: dotnetBase };
};

export const isAdapterRequest = (url: string): boolean => {
  const { primary, fallback } = getAdapterBaseUrlCandidates();
  const normalized = normalizeBaseUrl(url);
  if (primary && normalized.startsWith(primary)) return true;
  if (fallback && normalized.startsWith(fallback)) return true;
  return false;
};

export const replaceAdapterBase = (
  url: string,
  fromBase: string,
  toBase: string
): string => {
  const normalizedFrom = normalizeBaseUrl(fromBase);
  const normalizedTo = normalizeBaseUrl(toBase);
  if (!url.startsWith(normalizedFrom)) {
    return url;
  }
  return normalizedTo + url.slice(normalizedFrom.length);
};
