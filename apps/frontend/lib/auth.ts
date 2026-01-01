import apiClient, { setAccessToken, getAccessToken } from './api-client';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  data: {
    accessToken: string;
    user: {
      id: string;
      email: string;
      roles: string[];
    };
  };
}

export interface User {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
}

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

    // Parse permissions from JWT (if needed)
    // For now, return user with empty permissions
    return {
      ...user,
      permissions: [],
    };
  } catch (error) {
    throw new Error('Invalid email or password');
  }
};

/**
 * Logout user
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

    // Redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return getAccessToken() !== null;
};

/**
 * Get current user from token (simplified version)
 * In production, this should decode JWT or fetch from API
 */
export const getCurrentUser = (): User | null => {
  const token = getAccessToken();
  if (!token) return null;

  // TODO: Decode JWT to get user info
  // For now, return mock data
  return null;
};
