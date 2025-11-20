'use client';

import { useState, useRef } from 'react';

interface MediaUploadProps {
  onUploadSuccess?: (url: string, metadata: UploadedFile) => void;
  onUploadError?: (error: string) => void;
  acceptedTypes?: string[];
  maxSizeMB?: number;
  buttonText?: string;
  className?: string;
  showPreview?: boolean;
}

interface UploadedFile {
  key: string;
  url: string;
  size: number;
  contentType: string;
}

export function MediaUpload({
  onUploadSuccess,
  onUploadError,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'application/pdf'],
  maxSizeMB = 10,
  buttonText = 'Upload File',
  className = '',
  showPreview = true,
}: MediaUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setPreview(null);
    setUploadedUrl(null);
    setUploadedFile(null);

    // Validate file type
    if (!acceptedTypes.includes(file.type)) {
      const errorMsg = `Invalid file type. Allowed types: ${acceptedTypes.join(', ')}`;
      setError(errorMsg);
      if (onUploadError) onUploadError(errorMsg);
      return;
    }

    // Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      const errorMsg = `File too large. Maximum size: ${maxSizeMB}MB`;
      setError(errorMsg);
      if (onUploadError) onUploadError(errorMsg);
      return;
    }

    // Show preview for images
    if (showPreview && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }

    // Upload file
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Simulate progress (actual R2 upload doesn't provide progress)
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Upload to worker endpoint
      // In production, this would be https://media.blazesportsintel.com/upload
      const uploadUrl = process.env.NEXT_PUBLIC_STORAGE_URL || 'http://localhost:8787/upload';

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        // Add auth header if available
        // headers: {
        //   'Authorization': `Bearer ${getToken()}`
        // }
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errorData.error || `Upload failed with status ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const uploadedFileData: UploadedFile = {
          key: data.key,
          url: data.url,
          size: data.size,
          contentType: data.contentType,
        };

        setUploadedUrl(data.url);
        setUploadedFile(uploadedFileData);

        if (onUploadSuccess) {
          onUploadSuccess(data.url, uploadedFileData);
        }
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMsg);
      if (onUploadError) onUploadError(errorMsg);
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleClear = () => {
    setUploadedUrl(null);
    setUploadedFile(null);
    setPreview(null);
    setError(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`media-upload ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        accept={acceptedTypes.join(',')}
        className="hidden"
        disabled={uploading}
      />

      {!uploadedUrl && (
        <button
          onClick={handleButtonClick}
          disabled={uploading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? 'Uploading...' : buttonText}
        </button>
      )}

      {uploading && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">{progress}% uploaded</p>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {preview && showPreview && !uploadedUrl && (
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">Preview:</p>
          <img
            src={preview}
            alt="Preview"
            className="max-w-full max-h-64 rounded-lg border border-gray-200"
          />
        </div>
      )}

      {uploadedUrl && uploadedFile && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-green-700 font-medium mb-2">✓ Upload successful!</p>

              {showPreview && uploadedFile.contentType.startsWith('image/') && (
                <img
                  src={uploadedUrl}
                  alt="Uploaded"
                  className="max-w-full max-h-64 rounded-lg border border-gray-200 mb-3"
                />
              )}

              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <span className="font-medium">Size:</span> {formatFileSize(uploadedFile.size)}
                </p>
                <p>
                  <span className="font-medium">Type:</span> {uploadedFile.contentType}
                </p>
                <p className="break-all">
                  <span className="font-medium">URL:</span>{' '}
                  <a
                    href={uploadedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {uploadedUrl}
                  </a>
                </p>
              </div>
            </div>

            <button
              onClick={handleClear}
              className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
              title="Clear"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
