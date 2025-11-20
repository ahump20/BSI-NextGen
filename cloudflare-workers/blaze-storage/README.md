# Blaze Storage - R2 Media Management Worker

Cloudflare Worker for managing media uploads, downloads, and deletion using R2 object storage.

## Features

- **File Upload**: Secure file upload with validation (size, type)
- **File Download**: Fast file retrieval with CDN caching and range request support
- **File Deletion**: Authenticated file deletion with metadata cleanup
- **Rate Limiting**: Prevent abuse with configurable rate limits
- **Authentication**: Optional JWT-based authentication
- **Video Streaming**: Support for range requests for video playback
- **Metadata Tracking**: Store file metadata in D1 database with KV caching

## Architecture

```
┌─────────────┐
│   Frontend  │
│  (Next.js)  │
└──────┬──────┘
       │
       │ HTTP
       ▼
┌─────────────┐
│   Blaze     │
│   Storage   │
│   Worker    │
└──────┬──────┘
       │
       ├──────► R2 Bucket (File Storage)
       ├──────► D1 Database (Metadata)
       └──────► KV Store (Cache)
```

## Quick Start

### Prerequisites

- Node.js 18+
- Wrangler CLI
- Cloudflare account with Workers and R2 enabled

### Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run automated setup**:
   ```bash
   npm run setup
   ```

   This script will:
   - Authenticate with Cloudflare
   - Create R2 buckets (production and staging)
   - Configure CORS
   - Create D1 database and apply schema
   - Create KV namespaces
   - Update wrangler.toml with resource IDs

3. **Set secrets** (optional):
   ```bash
   npm run secret:jwt
   # Enter your JWT secret when prompted
   ```

4. **Test locally**:
   ```bash
   npm run dev
   # Worker will be available at http://localhost:8787
   ```

5. **Test health check**:
   ```bash
   curl http://localhost:8787/health
   ```

## API Endpoints

### Health Check

```bash
GET /health
```

**Response**:
```json
{
  "status": "ok",
  "service": "blaze-storage",
  "timestamp": "2025-11-20T12:00:00.000Z"
}
```

### Upload File

```bash
POST /upload
Content-Type: multipart/form-data
Authorization: Bearer <token> (optional)

Body:
  file: <file>
```

**Response**:
```json
{
  "success": true,
  "key": "uploads/1732104000000-abc123.jpg",
  "url": "/media/uploads/1732104000000-abc123.jpg",
  "size": 1024000,
  "contentType": "image/jpeg"
}
```

**Rate Limit**: 10 uploads per minute per IP

**File Restrictions**:
- Max size: 10MB
- Allowed types: JPEG, PNG, GIF, WebP, MP4, WebM, PDF

### Get File

```bash
GET /media/<key>
Range: bytes=0-1024 (optional, for video streaming)
```

**Response**: File contents with appropriate headers

**Headers**:
- `Content-Type`: File MIME type
- `ETag`: File hash
- `Cache-Control`: `public, max-age=31536000, immutable`
- `Content-Range`: For range requests (video streaming)

### Delete File

```bash
DELETE /media/<key>
Authorization: Bearer <token> (required)
```

**Response**:
```json
{
  "success": true,
  "deleted": "uploads/1732104000000-abc123.jpg"
}
```

### List Files

```bash
GET /files?limit=50&offset=0
```

**Response**:
```json
{
  "files": [
    {
      "key": "uploads/1732104000000-abc123.jpg",
      "original_name": "photo.jpg",
      "content_type": "image/jpeg",
      "size": 1024000,
      "uploaded_at": "2025-11-20T12:00:00.000Z",
      "uploaded_by": "user-123"
    }
  ],
  "count": 1,
  "limit": 50,
  "offset": 0
}
```

## Configuration

### Environment Variables

Set via `wrangler secret put`:

- `JWT_SECRET`: Secret for JWT authentication (optional)
- `AUTH0_DOMAIN`: Auth0 domain for authentication (optional)

### File Upload Limits

Edit `src/index.ts`:

```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
  'application/pdf'
];
```

### Rate Limiting

Edit `src/index.ts`:

```typescript
const RATE_LIMIT = 10; // uploads per minute
const RATE_WINDOW = 60; // seconds
```

## Database Schema

The worker uses D1 database for metadata tracking:

```sql
CREATE TABLE media_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  original_name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  uploaded_at TEXT NOT NULL,
  uploaded_by TEXT,
  tags TEXT,
  metadata TEXT,
  last_accessed_at TEXT,
  access_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Deployment

### Staging Deployment

```bash
npm run deploy
```

### Production Deployment

```bash
npm run deploy:production
```

### Custom Domain Setup

1. Go to Cloudflare Dashboard → Workers & Pages
2. Select `blaze-storage` worker
3. Go to Settings → Triggers → Custom Domains
4. Add domain: `media.blazesportsintel.com`

Update CORS configuration in `r2-cors.json` to include your custom domain.

## Monitoring

### View Logs

```bash
npm run tail
```

### Check Storage Usage

```bash
wrangler r2 bucket list
```

### Query Database

```bash
wrangler d1 execute blaze-storage-db --command "SELECT COUNT(*) FROM media_files"
```

## Testing

### Upload Test

```bash
curl -X POST http://localhost:8787/upload \
  -F "file=@test-image.jpg"
```

### Download Test

```bash
curl http://localhost:8787/media/<key> --output downloaded-file.jpg
```

### Delete Test

```bash
curl -X DELETE http://localhost:8787/media/<key> \
  -H "Authorization: Bearer <token>"
```

## Integration with Next.js Frontend

See `../../packages/web/components/MediaUpload.tsx` for React component example.

### Example Usage

```typescript
import { MediaUpload } from '@/components/MediaUpload';

export default function Page() {
  return (
    <div>
      <h1>Upload Media</h1>
      <MediaUpload
        onUploadSuccess={(url) => console.log('Uploaded:', url)}
        onUploadError={(error) => console.error('Error:', error)}
      />
    </div>
  );
}
```

## Security

### Authentication

The worker supports optional JWT authentication. To enable:

1. Set JWT secret:
   ```bash
   npm run secret:jwt
   ```

2. Include `Authorization` header in requests:
   ```bash
   Authorization: Bearer <your-jwt-token>
   ```

### CORS

CORS is configured in `r2-cors.json`. Update allowed origins as needed:

```json
{
  "AllowedOrigins": [
    "https://blazesportsintel.com",
    "http://localhost:3000"
  ]
}
```

### Rate Limiting

Rate limiting is enforced per IP address:
- 10 uploads per minute (configurable)
- Cached in KV store with automatic expiration

## Troubleshooting

### Upload fails with "Rate limit exceeded"

Wait 1 minute or adjust rate limit in `src/index.ts`.

### CORS errors

1. Verify `r2-cors.json` includes your domain
2. Re-apply CORS: `npm run r2:cors`

### File not found after upload

1. Check bucket binding in `wrangler.toml`
2. Verify bucket exists: `npm run r2:list`
3. Check worker logs: `npm run tail`

### Authentication errors

1. Verify JWT secret is set: `wrangler secret list`
2. Check token is valid and not expired
3. Ensure `Authorization` header format: `Bearer <token>`

## Cost Estimation

**Cloudflare R2 Pricing**:
- Storage: $0.015 per GB/month
- Class A operations (writes): $4.50 per million
- Class B operations (reads): $0.36 per million
- Egress: **FREE**

**Example Monthly Cost**:
- 100 GB storage: $1.50
- 1M uploads: $4.50
- 10M downloads: $3.60
- **Total: ~$10/month**

## Resources

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [Workers API Reference](https://developers.cloudflare.com/workers/)
- [D1 Database Docs](https://developers.cloudflare.com/d1/)

## License

MIT

---

**Last Updated**: November 20, 2025
**Maintainer**: BlazeSportsIntel Team
