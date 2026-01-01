// Shared TypeScript types for the frontend

export interface User {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
}

export interface Permission {
  id: string;
  key: string;
  description: string;
}

export interface Document {
  id: string;
  title: string;
  currentVersion: number;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    timestamp?: string;
  };
}

export interface ApiError {
  statusCode: number;
  message: string;
  errors?: string[];
  timestamp?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}
