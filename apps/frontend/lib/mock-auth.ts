/**
 * Mock Authentication Service
 *
 * This is a TEMPORARY mock service for testing login functionality
 * before the backend is ready.
 *
 * IMPORTANT: This will be replaced with real API calls when backend is available.
 * DO NOT use this in production!
 */

import { User } from './types';

// Mock user database (parsed from credentials.csv)
const MOCK_USERS = [
  { email: 'admin@example.com', password: 'Admin123', roles: ['admin'], permissions: ['*'] },
  { email: 'maulik@example.com', password: 'maulik123', roles: ['admin'], permissions: ['*'] },
  { email: 'manager@example.com', password: 'Manager123', roles: ['manager'], permissions: ['document.*', 'user.view', 'log.view'] },
  { email: 'employee@example.com', password: 'Employee123', roles: ['employee'], permissions: ['document.view', 'document.upload'] },
  { email: 'john.doe@example.com', password: 'John1234', roles: ['employee'], permissions: ['document.view', 'document.upload'] },
  { email: 'jane.smith@example.com', password: 'Jane5678', roles: ['employee'], permissions: ['document.view', 'document.upload'] },
  { email: 'test@example.com', password: 'Test1234', roles: ['employee'], permissions: ['document.view'] },
];

export interface MockLoginCredentials {
  email: string;
  password: string;
}

export interface MockLoginResponse {
  accessToken: string;
  user: User;
}

/**
 * Mock login function
 * Simulates API call with 1 second delay
 */
export const mockLogin = async (credentials: MockLoginCredentials): Promise<MockLoginResponse> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const { email, password } = credentials;

  // Find user by email
  const user = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());

  // Check if user exists and password matches
  if (!user || user.password !== password) {
    throw new Error('Invalid email or password');
  }

  // Generate mock JWT token (not a real JWT, just a placeholder)
  const mockToken = `mock-jwt-token-${Date.now()}-${user.email}`;

  // Return mock response
  return {
    accessToken: mockToken,
    user: {
      id: `user-${Date.now()}`,
      email: user.email,
      roles: user.roles,
      permissions: user.permissions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
};

/**
 * Mock logout function
 */
export const mockLogout = async (): Promise<void> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // In mock mode, just resolve successfully
  return Promise.resolve();
};

/**
 * Get available mock users (for development/testing reference)
 */
export const getMockUsers = () => {
  return MOCK_USERS.map(({ password, ...user }) => user);
};
