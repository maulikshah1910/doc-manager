import apiClient, { setAccessToken, getAccessToken } from './api-client';
import { User } from './types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  data: {
    accessToken: string;
    user: User;
  };
}

/**
 * Initialize auth session from refresh token cookie.
 * Called on app mount to restore session after page reload.
 * Returns user data if session is restored, null otherwise.
 */
export const initializeAuth = async (): Promise<User | null> => {
  try {
    // Call refresh endpoint — the httpOnly refresh token cookie is sent automatically
    const refreshResponse = await apiClient.post<{ data: { accessToken: string } }>(
      '/api/v1/auth/refresh',
      {}
    );

    const { accessToken } = refreshResponse.data.data;
    setAccessToken(accessToken);

    // Fetch user data with the fresh access token
    const meResponse = await apiClient.get<{ data: User }>('/api/v1/auth/me');
    return meResponse.data.data;
  } catch {
    // No valid refresh token — user needs to login
    setAccessToken(null);
    return null;
  }
};

/**
 * Login user with email and password
 */
export const login = async (credentials: LoginCredentials): Promise<User> => {
  try {
    const response = await apiClient.post<LoginResponse>(
      '/api/v1/auth/login',
      credentials
    );

    const { accessToken, user } = response.data.data;

    // Store access token in memory
    setAccessToken(accessToken);

    // Return user with all data from backend
    return user;
  } catch (error) {
    console.error('Login error:', error);
    throw new Error('Invalid email or password');
  }
};

/**
 * Logout user — clears access token and calls backend to clear cookie.
 * Does NOT handle redirect — callers (AuthProvider/components) manage navigation.
 */
export const logout = async (): Promise<void> => {
  try {
    await apiClient.post('/api/v1/auth/logout');
  } catch (error) {
    // Ignore errors on logout
    console.error('Logout error:', error);
  } finally {
    // Clear access token
    setAccessToken(null);
  }
};

/**
 * Check if user is authenticated (in-memory check)
 */
export const isAuthenticated = (): boolean => {
  return getAccessToken() !== null;
};
