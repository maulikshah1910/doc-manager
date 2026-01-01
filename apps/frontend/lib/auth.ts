import apiClient, { setAccessToken, getAccessToken } from './api-client';
import { mockLogin, mockLogout } from './mock-auth';

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

// Check if we should use mock authentication
const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true';

/**
 * Login user with email and password
 */
export const login = async (credentials: LoginCredentials): Promise<User> => {
  // Use mock authentication if enabled
  if (USE_MOCK_AUTH) {
    console.log('🔧 Using MOCK authentication (backend not available)');
    const mockResponse = await mockLogin(credentials);

    // Store access token in memory
    setAccessToken(mockResponse.accessToken);

    return mockResponse.user;
  }

  // Real API authentication
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
  // Use mock logout if enabled
  if (USE_MOCK_AUTH) {
    console.log('🔧 Using MOCK logout');
    await mockLogout();
    setAccessToken(null);

    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
    return;
  }

  // Real API logout
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
