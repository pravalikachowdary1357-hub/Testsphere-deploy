import axios, { type AxiosRequestConfig } from 'axios';
import { clearAuth, loadAuth, updateTokens } from '../auth/tokenStorage';
import type { AuthTokens } from '../auth/types';

interface RetryableConfig extends AxiosRequestConfig {
  _retried?: boolean;
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const auth = loadAuth();
  if (auth?.accessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${auth.accessToken}`;
  }
  return config;
});

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const auth = loadAuth();
  if (!auth?.refreshToken) {
    return null;
  }
  try {
    const { data } = await axios.post<AuthTokens>(
      `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
      { refreshToken: auth.refreshToken },
    );
    updateTokens(data);
    return data.accessToken;
  } catch {
    clearAuth();
    return null;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config as RetryableConfig | undefined;
    const status = error.response?.status;
    const isAuthEndpoint = config?.url === '/auth/login' || config?.url === '/auth/refresh';

    if (status === 401 && config && !config._retried && !isAuthEndpoint) {
      config._retried = true;
      refreshInFlight ??= refreshAccessToken();
      const newAccessToken = await refreshInFlight;
      refreshInFlight = null;

      if (newAccessToken) {
        config.headers = { ...config.headers, Authorization: `Bearer ${newAccessToken}` };
        return apiClient(config);
      }
    }

    return Promise.reject(error);
  },
);

export function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) {
      return message.join(', ');
    }
    if (typeof message === 'string') {
      return message;
    }
  }
  return fallback;
}

// A cold-starting free-tier API/proxy (no response at all, or a 502/503/504
// gateway error) is worth retrying — unlike a real 401/400 from our own
// backend, which already carries a proper JSON message and won't fix itself.
export function isTransientError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return false;
  }
  return !error.response || error.response.status >= 500;
}
