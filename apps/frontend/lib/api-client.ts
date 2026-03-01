import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// API Client Configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // For httpOnly cookies (refresh token)
});

// Access token management (in-memory)
let accessToken: string | null = null;

export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};

export const getAccessToken = (): string | null => {
  return accessToken;
};

// Request Interceptor: Add access token to headers
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle 401 and refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Don't attempt token refresh for login or refresh endpoints
    const isLoginEndpoint = originalRequest.url?.includes('/auth/login');
    const isRefreshEndpoint = originalRequest.url?.includes('/auth/refresh');

    // Handle 401 Unauthorized (but not for login/refresh endpoints)
    if (error.response?.status === 401 && !originalRequest._retry && !isLoginEndpoint && !isRefreshEndpoint) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh token
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/refresh`,
          {},
          { withCredentials: true }
        );

        // Update access token
        setAccessToken(data.data.accessToken);

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        }

        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        setAccessToken(null);

        // Redirect to login (client-side)
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
