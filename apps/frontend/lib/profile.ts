import apiClient from './api-client';
import { User, ApiResponse } from './types';

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export async function getProfile(): Promise<User> {
  const response = await apiClient.get<ApiResponse<User>>('/api/v1/users/profile');
  return response.data.data;
}

export async function updateProfile(data: UpdateProfileDto): Promise<User> {
  const response = await apiClient.put<ApiResponse<User>>('/api/v1/users/profile', data);
  return response.data.data;
}
