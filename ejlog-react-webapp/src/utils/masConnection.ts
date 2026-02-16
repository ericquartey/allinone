import { PPC_AUTOMATION_API_BASE_URL } from '../config/api';

const MAS_HOST_STORAGE_KEY = 'ppc_mas_remote_host';
const MAS_ENABLED_STORAGE_KEY = 'ppc_mas_remote_enabled';

const normalizeUrl = (value: string) => value.replace(/\/+$/, '');

const getDefaultBaseUrl = () => normalizeUrl(PPC_AUTOMATION_API_BASE_URL);

export const getMasRemoteHost = (): string => {
  if (typeof window === 'undefined') {
    return '';
  }
  return (localStorage.getItem(MAS_HOST_STORAGE_KEY) ?? '').trim();
};

export const isMasRemoteEnabled = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  const stored = localStorage.getItem(MAS_ENABLED_STORAGE_KEY);
  if (stored === null) {
    return false;
  }
  return stored === 'true';
};

export const setMasRemoteHost = (value: string) => {
  if (typeof window === 'undefined') {
    return;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    localStorage.removeItem(MAS_HOST_STORAGE_KEY);
    return;
  }
  localStorage.setItem(MAS_HOST_STORAGE_KEY, trimmed);
};

export const setMasRemoteEnabled = (value: boolean) => {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(MAS_ENABLED_STORAGE_KEY, value ? 'true' : 'false');
};

export const getMasRemoteEffectiveBaseUrl = (): string => {
  const host = getMasRemoteHost();
  const enabled = isMasRemoteEnabled();
  if (enabled && host) {
    return normalizeUrl(host);
  }
  return getDefaultBaseUrl();
};

export const getMasRemoteStatusLabel = () => {
  const enabled = isMasRemoteEnabled();
  return enabled ? 'Collegamento remoto attivo' : 'Collegamento remoto disabilitato';
};
