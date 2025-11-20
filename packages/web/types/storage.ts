/**
 * Storage types for Blaze Storage R2 integration
 */

export interface UploadedFile {
  key: string;
  url: string;
  size: number;
  contentType: string;
}

export interface MediaFile {
  id: number;
  key: string;
  original_name: string;
  content_type: string;
  size: number;
  uploaded_at: string;
  uploaded_by?: string;
  tags?: string;
  metadata?: string;
  last_accessed_at?: string;
  access_count: number;
}

export interface UploadResponse {
  success: boolean;
  key: string;
  url: string;
  size: number;
  contentType: string;
}

export interface ListFilesResponse {
  files: MediaFile[];
  count: number;
  limit: number;
  offset: number;
}

export interface DeleteResponse {
  success: boolean;
  deleted: string;
}

export interface StorageError {
  error: string;
  message?: string;
}
