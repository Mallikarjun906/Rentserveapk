// Centralized API Client with JWT Refresh Interceptor

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { CONFIG } from '../constants/config';
import { Storage } from '../utils/storage';

export const apiClient = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  timeout: 45000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (token) {
      promise.resolve(token);
    } else {
      promise.reject(error);
    }
  });
  failedQueue = [];
};

// Request Interceptor: Attach JWT Access Token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const isPublicAuthRoute =
      config.url?.includes('/auth/register') ||
      config.url?.includes('/auth/login') ||
      config.url?.includes('/auth/forgot-password') ||
      config.url?.includes('/auth/send-otp') ||
      config.url?.includes('/auth/verify-otp');

    const token = await Storage.getToken();
    if (!isPublicAuthRoute && token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Allow the browser or native networking library to supply the multipart boundary for FormData
    if (config.data instanceof FormData || (config.data && typeof (config.data as any).getParts === 'function')) {
      if (config.headers) {
        delete (config.headers as any)['Content-Type'];
        delete (config.headers as any)['content-type'];
        if (typeof (config.headers as any).delete === 'function') {
          (config.headers as any).delete('Content-Type');
          (config.headers as any).delete('content-type');
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Unwrap ApiResponse & Auto-Refresh Token on 401
apiClient.interceptors.response.use(
  (response) => {
    // If backend uses standard envelope { success: true, data: ... }
    if (response.data && response.data.success !== undefined) {
      return response.data;
    }
    return response.data;
  },
  async (error: AxiosError<any>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Check for 401 Unauthorized (and avoid loop on refresh/login endpoints)
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await Storage.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const refreshRes = await axios.post(`${CONFIG.API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const newAccessToken =
          refreshRes.data?.data?.accessToken || refreshRes.data?.accessToken;
        const newRefreshToken =
          refreshRes.data?.data?.refreshToken || refreshRes.data?.refreshToken;

        if (newAccessToken) {
          await Storage.setToken(newAccessToken);
          if (newRefreshToken) {
            await Storage.setRefreshToken(newRefreshToken);
          }
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
          processQueue(null, newAccessToken);
          return apiClient(originalRequest);
        } else {
          throw new Error('Refresh failed');
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        await Storage.clearAuth();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // Extract human-readable error message and classify error type
    const status = error.response?.status;
    let kind: ApiErrorKind = 'UNKNOWN';
    let message = error.response?.data?.message || error.response?.data?.error;

    if (status === 401) {
      kind = 'INVALID_CREDENTIALS';
      message = message || 'Invalid mobile number/email or password. Please verify your credentials.';
    } else if (status === 403) {
      kind = 'ACCESS_DENIED';
      message = message || 'Access denied. Your account may be pending verification or suspended.';
    } else if (status === 404) {
      kind = 'UNKNOWN';
      message = message || 'The requested service was not found on the server.';
    } else if (status === 429) {
      kind = 'RATE_LIMITED';
      message = message || 'Too many attempts. Please wait 15 minutes before trying again.';
    } else if (status && status >= 502 && status <= 504) {
      kind = 'COLD_START_TIMEOUT';
      message = 'Server is currently waking up from idle (cold start). Please tap Retry in a few moments.';
    } else if (status && status >= 500) {
      kind = 'SERVER_ERROR';
      message = message || 'Server encountered an internal error. Please try again shortly.';
    } else if (error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout')) {
      kind = 'COLD_START_TIMEOUT';
      message = 'Connection timed out. The server may be waking up from sleep, please tap Retry in a moment.';
    } else if (error.message === 'Network Error' || (error as any).code === 'ERR_NETWORK' || !error.response) {
      kind = 'NO_INTERNET';
      message = 'No internet connection or network error. Please verify your Wi-Fi or mobile data and tap Retry.';
    } else {
      message = message || error.message || 'An unexpected error occurred. Please try again.';
    }

    return Promise.reject(new AppApiError(message, kind, status));
  }
);

export type ApiErrorKind =
  | 'NO_INTERNET'
  | 'SERVER_UNAVAILABLE'
  | 'COLD_START_TIMEOUT'
  | 'SERVER_ERROR'
  | 'INVALID_CREDENTIALS'
  | 'ACCESS_DENIED'
  | 'RATE_LIMITED'
  | 'UNKNOWN';

export class AppApiError extends Error {
  kind: ApiErrorKind;
  statusCode?: number;

  constructor(message: string, kind: ApiErrorKind, statusCode?: number) {
    super(message);
    this.name = 'AppApiError';
    this.kind = kind;
    this.statusCode = statusCode;
  }
}

export interface HealthCheckResult {
  isReachable: boolean;
  isColdStart: boolean;
  isOffline: boolean;
  statusCode?: number;
  responseTimeMs: number;
  message: string;
}

/**
 * Genuine live connectivity verification for the NUK production backend
 */
export async function checkBackendConnectivity(): Promise<HealthCheckResult> {
  const start = Date.now();
  const baseUrl = CONFIG.API_BASE_URL.replace(/\/api\/v1\/?$/, '');

  try {
    const res = await axios.get(`${baseUrl}/api/v1/health`, {
      timeout: 15000,
      headers: { Accept: 'application/json' },
    });
    const elapsed = Date.now() - start;
    return {
      isReachable: res.status === 200,
      isColdStart: false,
      isOffline: false,
      statusCode: res.status,
      responseTimeMs: elapsed,
      message: 'Server is online and responding normally.',
    };
  } catch (err: any) {
    const elapsed = Date.now() - start;
    const status = err.response?.status;

    if (err.code === 'ECONNABORTED' || err.message?.toLowerCase().includes('timeout')) {
      return {
        isReachable: false,
        isColdStart: true,
        isOffline: false,
        responseTimeMs: elapsed,
        message: 'Server response timed out. The server may be waking up from sleep (cold start).',
      };
    }

    if (status && status >= 502 && status <= 504) {
      return {
        isReachable: false,
        isColdStart: true,
        isOffline: false,
        statusCode: status,
        responseTimeMs: elapsed,
        message: 'Server gateway is booting up (cold start). Please tap Retry in a few seconds.',
      };
    }

    if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
      return {
        isReachable: false,
        isColdStart: false,
        isOffline: true,
        statusCode: status,
        responseTimeMs: elapsed,
        message: 'No internet connection detected. Please verify your mobile data or Wi-Fi.',
      };
    }

    return {
      isReachable: false,
      isColdStart: false,
      isOffline: false,
      statusCode: status,
      responseTimeMs: elapsed,
      message: err.message || 'Unable to connect to NUK server.',
    };
  }
}
