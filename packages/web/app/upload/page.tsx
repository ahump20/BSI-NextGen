'use client';

import { MediaUpload } from '@/components/MediaUpload';
import { useState } from 'react';
import type { UploadedFile } from '@/types/storage';

export default function UploadPage() {
  const [uploads, setUploads] = useState<UploadedFile[]>([]);

  const handleUploadSuccess = (url: string, metadata: UploadedFile) => {
    console.log('File uploaded successfully:', url, metadata);
    setUploads((prev) => [metadata, ...prev]);
  };

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
    alert(`Upload failed: ${error}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Media Upload</h1>
          <p className="text-gray-600 mb-8">
            Upload images, videos, or PDFs to Blaze Storage (R2)
          </p>

          <div className="mb-8">
            <MediaUpload
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
              showPreview={true}
              buttonText="Choose File to Upload"
              className="w-full"
            />
          </div>

          {uploads.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Uploads</h2>
              <div className="space-y-4">
                {uploads.map((file) => (
                  <div
                    key={file.key}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {file.contentType.startsWith('image/') && (
                          <img
                            src={file.url}
                            alt="Uploaded file"
                            className="w-32 h-32 object-cover rounded-lg mb-3"
                          />
                        )}
                        <p className="font-medium text-gray-900 mb-2">{file.key}</p>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>
                            <span className="font-medium">Type:</span> {file.contentType}
                          </p>
                          <p>
                            <span className="font-medium">Size:</span>{' '}
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline inline-block mt-2"
                          >
                            View file →
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 bg-white shadow-lg rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Usage Instructions</h2>
          <div className="prose prose-sm max-w-none">
            <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">Supported Files</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Images: JPEG, PNG, GIF, WebP</li>
              <li>Videos: MP4, WebM</li>
              <li>Documents: PDF</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-2">Limits</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Maximum file size: 10MB</li>
              <li>Rate limit: 10 uploads per minute</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-2">
              Environment Setup
            </h3>
            <p className="text-gray-600 mb-2">
              Add to your <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code>:
            </p>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              NEXT_PUBLIC_STORAGE_URL=https://media.blazesportsintel.com/upload
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
