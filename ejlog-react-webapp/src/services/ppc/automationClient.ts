import axios, { AxiosInstance } from 'axios';
import {
  API_TIMEOUT,
  PPC_AUTOMATION_API_BASE_URL,
  PPC_BAY_NUMBER,
  PPC_LANGUAGE,
} from '../../config/api';

const getBayNumber = () => {
  const stored = localStorage.getItem('ppcBayNumber');
  const parsed = stored ? Number(stored) : Number.NaN;
  if (!Number.isFinite(parsed) || parsed < 1) {
    return PPC_BAY_NUMBER;
  }
  return parsed;
};

const getLanguage = () => localStorage.getItem('ppcLanguage') || PPC_LANGUAGE;

export const ppcAutomationClient: AxiosInstance = axios.create({
  baseURL: PPC_AUTOMATION_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: API_TIMEOUT,
});

ppcAutomationClient.interceptors.request.use(
  (config) => {
    if (!config.headers) {
      config.headers = {};
    }

    config.headers['Bay-Number'] = `${getBayNumber()}`;
    config.headers['Accept-Language'] = getLanguage();

    if (import.meta.env.DEV) {
      console.log('[PPC MAS] Request:', config.method?.toUpperCase(), config.url);
    }

    return config;
  },
  (error) => {
    console.error('[PPC MAS] Request error:', error);
    return Promise.reject(error);
  }
);

ppcAutomationClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('[PPC MAS] Response error:', {
        status: error.response.status,
        url: error.config?.url,
        data: error.response.data,
      });
    } else {
      console.error('[PPC MAS] No response received:', error.message);
    }
    return Promise.reject(error);
  }
);

export default ppcAutomationClient;
