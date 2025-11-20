/**
 * Storage API client for Blaze Storage (R2)
 */

import type {
  UploadResponse,
  ListFilesResponse,
  DeleteResponse,
  StorageError,
} from '@/types/storage';

const STORAGE_URL =
  process.env.NEXT_PUBLIC_STORAGE_URL || 'http://localhost:8787';

/**
 * Upload a file to R2 storage
 */
export async function uploadFile(
  file: File,
  options?: {
    authToken?: string;
    onProgress?: (progress: number) => void;
  }
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const headers: HeadersInit = {};
  if (options?.authToken) {
    headers['Authorization'] = `Bearer ${options.authToken}`;
  }

  const response = await fetch(`${STORAGE_URL}/upload`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const error: StorageError = await response.json().catch(() => ({
      error: `Upload failed with status ${response.status}`,
    }));
    throw new Error(error.error);
  }

  return response.json();
}

/**
 * Get file URL from storage
 */
export function getFileUrl(key: string): string {
  return `${STORAGE_URL}/media/${key}`;
}

/**
 * List files from storage
 */
export async function listFiles(options?: {
  limit?: number;
  offset?: number;
}): Promise<ListFilesResponse> {
  const params = new URLSearchParams();
  if (options?.limit) params.set('limit', options.limit.toString());
  if (options?.offset) params.set('offset', options.offset.toString());

  const response = await fetch(`${STORAGE_URL}/files?${params}`);

  if (!response.ok) {
    const error: StorageError = await response.json().catch(() => ({
      error: `Failed to list files with status ${response.status}`,
    }));
    throw new Error(error.error);
  }

  return response.json();
}

/**
 * Delete a file from storage
 */
export async function deleteFile(
  key: string,
  authToken: string
): Promise<DeleteResponse> {
  const response = await fetch(`${STORAGE_URL}/media/${key}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    const error: StorageError = await response.json().catch(() => ({
      error: `Delete failed with status ${response.status}`,
    }));
    throw new Error(error.error);
  }

  return response.json();
}

/**
 * Check if storage service is healthy
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${STORAGE_URL}/health`);
    const data = await response.json();
    return data.status === 'ok';
  } catch {
    return false;
  }
}
