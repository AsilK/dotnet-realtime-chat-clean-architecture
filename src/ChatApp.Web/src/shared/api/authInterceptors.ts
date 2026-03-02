import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { apiClient } from './client';
import type { ApiResult, AuthResponseDto } from './contracts';
import type { TokenPair } from '../../features/auth/api/tokenStorage';

type PendingRequest = {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
};

type InterceptorConfig = {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  onTokensRefreshed: (tokens: TokenPair) => void;
  onAuthFailure: () => void;
};

const refreshClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000',
  timeout: 10_000,
});

const ignoredAuthPaths = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh'];

function isIgnoredPath(url: string | undefined): boolean {
  if (!url) {
    return false;
  }

  return ignoredAuthPaths.some((path) => url.includes(path));
}

export function setupAuthInterceptors(config: InterceptorConfig): () => void {
  let isRefreshing = false;
  let pendingRequests: PendingRequest[] = [];

  const flushPendingRequests = (error: unknown, accessToken: string | null): void => {
    pendingRequests.forEach((request) => {
      if (error || !accessToken) {
        request.reject(error ?? new Error('Unable to refresh token.'));
      } else {
        request.resolve(accessToken);
      }
    });

    pendingRequests = [];
  };

  const requestInterceptorId = apiClient.interceptors.request.use((request) => {
    const accessToken = config.getAccessToken();
    if (accessToken) {
      request.headers.Authorization = `Bearer ${accessToken}`;
    }

    return request;
  });

  const responseInterceptorId = apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError): Promise<never> => {
      const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
      const responseStatus = error.response?.status;

      if (!originalRequest || responseStatus !== 401 || originalRequest._retry || isIgnoredPath(originalRequest.url)) {
        return Promise.reject(error);
      }

      const refreshToken = config.getRefreshToken();
      if (!refreshToken) {
        config.onAuthFailure();
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (isRefreshing) {
        try {
          const newAccessToken = await new Promise<string>((resolve, reject) => {
            pendingRequests.push({ resolve, reject });
          });

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient.request(originalRequest) as never;
        } catch (queuedError) {
          return Promise.reject(queuedError);
        }
      }

      isRefreshing = true;

      try {
        const refreshResponse = await refreshClient.post<ApiResult<AuthResponseDto>>('/api/auth/refresh', {
          refreshToken,
        });

        if (!refreshResponse.data.isSuccess || !refreshResponse.data.value) {
          throw new Error(refreshResponse.data.error ?? 'Token refresh failed.');
        }

        const tokens: TokenPair = {
          accessToken: refreshResponse.data.value.accessToken,
          refreshToken: refreshResponse.data.value.refreshToken,
        };

        config.onTokensRefreshed(tokens);
        flushPendingRequests(null, tokens.accessToken);

        originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
        return apiClient.request(originalRequest) as never;
      } catch (refreshError) {
        flushPendingRequests(refreshError, null);
        config.onAuthFailure();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    },
  );

  return () => {
    apiClient.interceptors.request.eject(requestInterceptorId);
    apiClient.interceptors.response.eject(responseInterceptorId);
  };
}
