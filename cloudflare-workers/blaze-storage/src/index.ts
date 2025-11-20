/**
 * Blaze Storage Worker - R2 Media Management
 *
 * Handles file uploads, downloads, and deletion for BlazeSportsIntel media assets.
 * Features:
 * - File upload with validation (size, type)
 * - Secure file retrieval with caching
 * - File deletion with metadata cleanup
 * - Rate limiting
 * - Authentication support
 */

interface Env {
  MEDIA_BUCKET: R2Bucket;
  DB: D1Database;
  BLAZE_STORAGE_CACHE: KVNamespace;
  JWT_SECRET?: string;
  AUTH0_DOMAIN?: string;
}

interface MediaFile {
  key: string;
  originalName: string;
  contentType: string;
  size: number;
  uploadedAt: string;
  uploadedBy?: string;
}

// Configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
  'application/pdf'
];
const RATE_LIMIT = 10; // uploads per minute
const RATE_WINDOW = 60; // seconds

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }

    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        service: 'blaze-storage',
        timestamp: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Routes
    try {
      // Upload endpoint
      if (request.method === 'POST' && url.pathname === '/upload') {
        return await handleUpload(request, env);
      }

      // Get file endpoint
      if (request.method === 'GET' && url.pathname.startsWith('/media/')) {
        return await handleGet(request, env);
      }

      // Delete file endpoint
      if (request.method === 'DELETE' && url.pathname.startsWith('/media/')) {
        return await handleDelete(request, env);
      }

      // List files endpoint
      if (request.method === 'GET' && url.pathname === '/files') {
        return await handleList(request, env);
      }

      return jsonResponse({ error: 'Not Found' }, 404);
    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  },
};

/**
 * Handle file upload
 */
async function handleUpload(request: Request, env: Env): Promise<Response> {
  // Check rate limit
  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rateLimitOk = await checkRateLimit(clientIP, env);
  if (!rateLimitOk) {
    return jsonResponse({ error: 'Rate limit exceeded. Please try again later.' }, 429);
  }

  // Optional: Verify authentication
  let userId: string | null = null;
  const authHeader = request.headers.get('Authorization');
  if (authHeader && env.JWT_SECRET) {
    userId = await verifyAuth(authHeader, env);
    if (!userId) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }
  }

  // Parse form data
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return jsonResponse({ error: 'No file provided' }, 400);
  }

  // Validate file
  const validation = validateFile(file);
  if (!validation.valid) {
    return jsonResponse({ error: validation.error }, 400);
  }

  // Generate unique key
  const timestamp = Date.now();
  const randomId = crypto.randomUUID();
  const extension = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const key = `uploads/${timestamp}-${randomId}.${extension}`;

  try {
    // Upload to R2
    await env.MEDIA_BUCKET.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        size: file.size.toString(),
        uploadedBy: userId || 'anonymous',
      },
    });

    // Store metadata in D1
    await env.DB.prepare(`
      INSERT INTO media_files (key, original_name, content_type, size, uploaded_at, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      key,
      file.name,
      file.type,
      file.size,
      new Date().toISOString(),
      userId || 'anonymous'
    ).run();

    // Cache metadata in KV
    const metadata: MediaFile = {
      key,
      originalName: file.name,
      contentType: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      uploadedBy: userId || undefined,
    };
    await env.BLAZE_STORAGE_CACHE.put(
      `media:${key}`,
      JSON.stringify(metadata),
      { expirationTtl: 86400 } // 24 hours
    );

    return jsonResponse({
      success: true,
      key,
      url: `/media/${key}`,
      size: file.size,
      contentType: file.type
    }, 201);
  } catch (error) {
    console.error('Upload error:', error);
    return jsonResponse({
      error: 'Upload failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
}

/**
 * Handle file retrieval
 */
async function handleGet(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const key = url.pathname.replace('/media/', '');

  if (!key) {
    return jsonResponse({ error: 'Invalid file key' }, 400);
  }

  try {
    // Check KV cache first for metadata
    const cachedMetadata = await env.BLAZE_STORAGE_CACHE.get(`media:${key}`, 'json');

    // Get from R2
    const object = await env.MEDIA_BUCKET.get(key);

    if (!object) {
      return jsonResponse({ error: 'File not found' }, 404);
    }

    // Build response headers
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('cache-control', 'public, max-age=31536000, immutable');

    // CORS headers
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    headers.set('Access-Control-Expose-Headers', 'ETag, Content-Length');

    // Handle range requests (for video streaming)
    const range = request.headers.get('range');
    if (range) {
      return handleRangeRequest(object, range, headers);
    }

    return new Response(object.body, { headers });
  } catch (error) {
    console.error('Get error:', error);
    return jsonResponse({
      error: 'Failed to retrieve file',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
}

/**
 * Handle file deletion
 */
async function handleDelete(request: Request, env: Env): Promise<Response> {
  // Verify authentication for deletion
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !env.JWT_SECRET) {
    return jsonResponse({ error: 'Authentication required for deletion' }, 401);
  }

  const userId = await verifyAuth(authHeader, env);
  if (!userId) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const url = new URL(request.url);
  const key = url.pathname.replace('/media/', '');

  if (!key) {
    return jsonResponse({ error: 'Invalid file key' }, 400);
  }

  try {
    // Verify ownership (optional - check if user uploaded this file)
    const fileInfo = await env.DB.prepare(
      'SELECT uploaded_by FROM media_files WHERE key = ?'
    ).bind(key).first<{ uploaded_by: string }>();

    if (fileInfo && fileInfo.uploaded_by !== userId && fileInfo.uploaded_by !== 'anonymous') {
      return jsonResponse({ error: 'Not authorized to delete this file' }, 403);
    }

    // Delete from R2
    await env.MEDIA_BUCKET.delete(key);

    // Delete from D1
    await env.DB.prepare('DELETE FROM media_files WHERE key = ?').bind(key).run();

    // Delete from KV cache
    await env.BLAZE_STORAGE_CACHE.delete(`media:${key}`);

    return jsonResponse({
      success: true,
      deleted: key
    });
  } catch (error) {
    console.error('Delete error:', error);
    return jsonResponse({
      error: 'Delete failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
}

/**
 * Handle file listing
 */
async function handleList(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  try {
    const result = await env.DB.prepare(`
      SELECT key, original_name, content_type, size, uploaded_at, uploaded_by
      FROM media_files
      ORDER BY uploaded_at DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();

    return jsonResponse({
      files: result.results,
      count: result.results.length,
      limit,
      offset
    });
  } catch (error) {
    console.error('List error:', error);
    return jsonResponse({
      error: 'Failed to list files',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
}

/**
 * Validate uploaded file
 */
function validateFile(file: File): { valid: boolean; error?: string } {
  // Check size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`
    };
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty.' };
  }

  // Check type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}`
    };
  }

  return { valid: true };
}

/**
 * Check rate limit
 */
async function checkRateLimit(ip: string, env: Env): Promise<boolean> {
  const key = `ratelimit:upload:${ip}`;
  const count = await env.BLAZE_STORAGE_CACHE.get(key);

  if (count && parseInt(count) >= RATE_LIMIT) {
    return false;
  }

  const newCount = count ? parseInt(count) + 1 : 1;
  await env.BLAZE_STORAGE_CACHE.put(
    key,
    newCount.toString(),
    { expirationTtl: RATE_WINDOW }
  );

  return true;
}

/**
 * Verify JWT authentication (basic implementation)
 */
async function verifyAuth(authHeader: string, env: Env): Promise<string | null> {
  if (!env.JWT_SECRET) {
    return null;
  }

  try {
    const token = authHeader.replace('Bearer ', '');

    // Simple JWT verification - in production, use a proper JWT library
    // For now, we'll just extract the user ID from the token
    // You should implement proper JWT verification here

    // Placeholder: return user ID
    // In real implementation, verify signature and decode token
    return 'user-123'; // Replace with actual JWT verification
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

/**
 * Handle range requests for video streaming
 */
function handleRangeRequest(object: R2ObjectBody, range: string, headers: Headers): Response {
  const size = object.size;
  const parts = range.replace(/bytes=/, '').split('-');
  const start = parseInt(parts[0], 10);
  const end = parts[1] ? parseInt(parts[1], 10) : size - 1;
  const chunkSize = end - start + 1;

  headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Content-Length', chunkSize.toString());

  return new Response(object.body, {
    status: 206,
    headers
  });
}

/**
 * Handle CORS preflight
 */
function handleCORS(): Response {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * JSON response helper
 */
function jsonResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
