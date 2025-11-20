# R2 Storage Implementation Guide

**Priority:** HIGH
**Status:** 🔴 NOT CONFIGURED
**Impact:** Required for media/file asset storage

## Overview

This guide covers the implementation of Cloudflare R2 storage for BlazeSportsIntel.com to enable media asset storage (images, videos, PDFs, user uploads).

## Current State

- R2 storage is **DISABLED** in production
- No bucket configuration exists
- Workers attempting to access media will fail
- Frontend cannot serve user-uploaded content

## Implementation Steps

### 1. Create R2 Bucket

```bash
# Using Wrangler CLI
wrangler r2 bucket create blazesports-media-production

# Verify creation
wrangler r2 bucket list
```

**Bucket Configuration:**
- **Name:** `blazesports-media-production`
- **Region:** Auto (Cloudflare distributed)
- **Versioning:** Enabled (for backup/recovery)

### 2. Configure CORS for Frontend Access

Create `r2-cors.json`:

```json
{
  "AllowedOrigins": [
    "https://blazesportsintel.com",
    "https://blazesportsintel.netlify.app",
    "https://*.blazesportsintel.com"
  ],
  "AllowedMethods": [
    "GET",
    "PUT",
    "POST",
    "DELETE",
    "HEAD"
  ],
  "AllowedHeaders": [
    "Content-Type",
    "Content-Length",
    "Authorization",
    "X-Requested-With"
  ],
  "ExposeHeaders": [
    "ETag",
    "Content-Length"
  ],
  "MaxAgeSeconds": 3600
}
```

Apply CORS configuration:

```bash
wrangler r2 bucket cors put blazesports-media-production --cors-config r2-cors.json
```

### 3. Update Worker Bindings

Update `wrangler.toml` for workers that need R2 access:

```toml
# Example: blaze-storage worker
name = "blaze-storage"
main = "src/index.ts"
compatibility_date = "2025-01-01"

# R2 Bucket Binding
[[r2_buckets]]
binding = "MEDIA_BUCKET"
bucket_name = "blazesports-media-production"
preview_bucket_name = "blazesports-media-staging"

# Existing D1 binding
[[d1_databases]]
binding = "DB"
database_name = "blaze-db"
database_id = "<database-id>"

# Existing KV bindings
[[kv_namespaces]]
binding = "BLAZE_KV"
id = "<kv-namespace-id>"
```

### 4. Worker Code Implementation

#### Upload Media Worker

Create `src/workers/media-upload.ts`:

```typescript
interface Env {
  MEDIA_BUCKET: R2Bucket;
  DB: D1Database;
  BLAZE_KV: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle upload
    if (request.method === 'POST' && url.pathname === '/upload') {
      return handleUpload(request, env);
    }

    // Handle retrieval
    if (request.method === 'GET' && url.pathname.startsWith('/media/')) {
      return handleGet(request, env);
    }

    // Handle deletion
    if (request.method === 'DELETE' && url.pathname.startsWith('/media/')) {
      return handleDelete(request, env);
    }

    return new Response('Not Found', { status: 404 });
  },
};

async function handleUpload(request: Request, env: Env): Promise<Response> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response('No file provided', { status: 400 });
    }

    // Generate unique key
    const timestamp = Date.now();
    const randomId = crypto.randomUUID();
    const extension = file.name.split('.').pop();
    const key = `uploads/${timestamp}-${randomId}.${extension}`;

    // Upload to R2
    await env.MEDIA_BUCKET.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        size: file.size.toString(),
      },
    });

    // Store metadata in D1
    await env.DB.prepare(
      'INSERT INTO media_files (key, original_name, content_type, size, uploaded_at) VALUES (?, ?, ?, ?, ?)'
    )
      .bind(key, file.name, file.type, file.size, new Date().toISOString())
      .run();

    // Cache metadata in KV
    await env.BLAZE_KV.put(
      `media:${key}`,
      JSON.stringify({
        key,
        originalName: file.name,
        contentType: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      }),
      { expirationTtl: 86400 } // 24 hours
    );

    return new Response(
      JSON.stringify({
        success: true,
        key,
        url: `/media/${key}`,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return new Response('Upload failed', { status: 500 });
  }
}

async function handleGet(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const key = url.pathname.replace('/media/', '');

  try {
    // Check KV cache first
    const cached = await env.BLAZE_KV.get(`media:${key}`, 'json');

    // Get from R2
    const object = await env.MEDIA_BUCKET.get(key);

    if (!object) {
      return new Response('Not Found', { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('cache-control', 'public, max-age=31536000, immutable');

    // Add CORS headers
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');

    return new Response(object.body, { headers });
  } catch (error) {
    console.error('Get error:', error);
    return new Response('Failed to retrieve file', { status: 500 });
  }
}

async function handleDelete(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const key = url.pathname.replace('/media/', '');

  try {
    // Delete from R2
    await env.MEDIA_BUCKET.delete(key);

    // Delete from D1
    await env.DB.prepare('DELETE FROM media_files WHERE key = ?')
      .bind(key)
      .run();

    // Delete from KV cache
    await env.BLAZE_KV.delete(`media:${key}`);

    return new Response(
      JSON.stringify({ success: true, deleted: key }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Delete error:', error);
    return new Response('Delete failed', { status: 500 });
  }
}
```

### 5. Database Schema for Media Metadata

Add to your D1 database:

```sql
-- Media files tracking table
CREATE TABLE IF NOT EXISTS media_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  original_name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  uploaded_at TEXT NOT NULL,
  uploaded_by TEXT,
  tags TEXT,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast lookups
CREATE INDEX idx_media_key ON media_files(key);
CREATE INDEX idx_media_uploaded_at ON media_files(uploaded_at);
CREATE INDEX idx_media_content_type ON media_files(content_type);

-- Trigger to update updated_at
CREATE TRIGGER update_media_timestamp
AFTER UPDATE ON media_files
BEGIN
  UPDATE media_files SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
```

Apply schema:

```bash
wrangler d1 execute blaze-db --file=schema/media_files.sql
```

### 6. Configure CDN & Custom Domain (Optional)

For better performance, configure R2 public access with custom domain:

```bash
# Create public bucket for static assets
wrangler r2 bucket create blazesports-public-assets

# Configure custom domain
# Navigate to: Cloudflare Dashboard → R2 → Buckets → blazesports-public-assets
# Add custom domain: assets.blazesportsintel.com
```

Update DNS:
```
CNAME assets.blazesportsintel.com → <r2-public-url>
```

### 7. Frontend Integration

Example React component for file upload:

```typescript
// components/MediaUpload.tsx
import { useState } from 'react';

export function MediaUpload() {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setUploadedUrl(data.url);
        console.log('File uploaded:', data.key);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={handleUpload}
        disabled={uploading}
        accept="image/*,video/*,.pdf"
      />
      {uploading && <p>Uploading...</p>}
      {uploadedUrl && (
        <div>
          <p>Upload successful!</p>
          <img src={uploadedUrl} alt="Uploaded" />
        </div>
      )}
    </div>
  );
}
```

### 8. Security Configuration

#### Rate Limiting

```typescript
// Add to media upload worker
const RATE_LIMIT = 10; // uploads per minute
const RATE_WINDOW = 60; // seconds

async function checkRateLimit(ip: string, env: Env): Promise<boolean> {
  const key = `ratelimit:upload:${ip}`;
  const count = await env.BLAZE_KV.get(key);

  if (count && parseInt(count) >= RATE_LIMIT) {
    return false;
  }

  const newCount = count ? parseInt(count) + 1 : 1;
  await env.BLAZE_KV.put(key, newCount.toString(), { expirationTtl: RATE_WINDOW });

  return true;
}
```

#### File Size Limits

```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

async function validateFile(file: File): Promise<{ valid: boolean; error?: string }> {
  // Check size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File too large. Maximum size is 10MB.' };
  }

  // Check type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type.' };
  }

  return { valid: true };
}
```

#### Authentication

```typescript
async function verifyAuth(request: Request, env: Env): Promise<string | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return null;

  const token = authHeader.replace('Bearer ', '');

  // Verify JWT token
  // (Implementation depends on your auth system)
  const userId = await verifyJWT(token, env);

  return userId;
}
```

## Deployment Checklist

- [ ] Create R2 bucket: `blazesports-media-production`
- [ ] Configure CORS for frontend domains
- [ ] Create staging bucket: `blazesports-media-staging`
- [ ] Update worker `wrangler.toml` with R2 bindings
- [ ] Deploy database schema for media metadata
- [ ] Deploy media upload worker
- [ ] Test upload functionality
- [ ] Test retrieval functionality
- [ ] Test deletion functionality
- [ ] Configure rate limiting
- [ ] Set up monitoring for storage usage
- [ ] Document API endpoints
- [ ] Update frontend with upload component
- [ ] Set up automated backups (optional)
- [ ] Configure custom domain for public assets (optional)

## Monitoring & Maintenance

### Storage Usage Monitoring

```typescript
// Worker to check R2 storage usage
export default {
  async scheduled(event: ScheduledEvent, env: Env) {
    const objects = await env.MEDIA_BUCKET.list();
    const count = objects.objects.length;

    // Calculate total size
    let totalSize = 0;
    for (const obj of objects.objects) {
      totalSize += obj.size;
    }

    // Log metrics
    console.log({
      timestamp: new Date().toISOString(),
      fileCount: count,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
    });

    // Alert if usage exceeds threshold
    const THRESHOLD_GB = 50;
    if (totalSize > THRESHOLD_GB * 1024 * 1024 * 1024) {
      // Send alert via notifications worker
      await sendAlert(env, {
        severity: 'warning',
        message: `R2 storage usage exceeds ${THRESHOLD_GB}GB`,
        details: {
          fileCount: count,
          totalSizeGB: (totalSize / 1024 / 1024 / 1024).toFixed(2),
        },
      });
    }
  },
};
```

Add to `wrangler.toml`:

```toml
[triggers]
crons = ["0 0 * * *"]  # Daily at midnight
```

### Cleanup Old Files

```typescript
// Worker to cleanup old unused files
async function cleanupOldFiles(env: Env) {
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

  // Find files not accessed in 30 days
  const oldFiles = await env.DB.prepare(
    'SELECT key FROM media_files WHERE uploaded_at < ? AND last_accessed_at IS NULL'
  )
    .bind(new Date(thirtyDaysAgo).toISOString())
    .all();

  for (const file of oldFiles.results) {
    await env.MEDIA_BUCKET.delete(file.key as string);
    await env.DB.prepare('DELETE FROM media_files WHERE key = ?')
      .bind(file.key)
      .run();
  }

  return oldFiles.results.length;
}
```

## Cost Estimation

**R2 Pricing (as of 2024):**
- Storage: $0.015 per GB per month
- Class A Operations (writes): $4.50 per million requests
- Class B Operations (reads): $0.36 per million requests
- Egress: **FREE** (no data transfer fees)

**Example Monthly Cost:**
- 100 GB storage: $1.50
- 1M uploads: $4.50
- 10M downloads: $3.60
- **Total: ~$10/month**

## Troubleshooting

### Upload Fails with CORS Error

**Solution:** Verify CORS configuration includes your frontend domain:

```bash
wrangler r2 bucket cors get blazesports-media-production
```

### File Not Found After Upload

**Solution:** Check bucket binding in `wrangler.toml` matches worker code:

```bash
wrangler r2 bucket list
```

### Slow Upload/Download

**Solution:**
1. Enable R2 custom domain for CDN benefits
2. Implement multipart uploads for large files
3. Add KV caching for frequently accessed files

## Next Steps

1. **Immediate:** Create R2 buckets and configure CORS
2. **Short-term:** Deploy media upload worker and test
3. **Long-term:** Implement image optimization pipeline, CDN integration

## Additional Resources

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [R2 API Reference](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/)
- [R2 Pricing](https://developers.cloudflare.com/r2/pricing/)

---

**Last Updated:** November 8, 2025
**Status:** Implementation Guide
**Owner:** Infrastructure Team
