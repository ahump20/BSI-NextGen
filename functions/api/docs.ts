/**
 * Swagger UI Documentation Endpoint
 * GET /api/docs
 *
 * Provides interactive API documentation using Swagger UI
 */

const SWAGGER_UI_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sandlot Sluggers API Documentation</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.10.5/swagger-ui.css">
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #1a1a1a;
    }

    .topbar {
      display: none;
    }

    .swagger-ui .info .title {
      color: #ff6b00;
      font-size: 2.5em;
    }

    .swagger-ui .info .description {
      color: #e0e0e0;
    }

    .swagger-ui .scheme-container {
      background: #2a2a2a;
      padding: 20px;
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>

  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.10.5/swagger-ui-bundle.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.10.5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      // Get OpenAPI spec from same origin
      const specUrl = window.location.origin + '/openapi.yaml';

      const ui = SwaggerUIBundle({
        url: specUrl,
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 1,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true,
        requestInterceptor: (request) => {
          // Add CORS origin header for testing
          request.headers['Origin'] = window.location.origin;
          return request;
        }
      });

      window.ui = ui;
    };
  </script>
</body>
</html>`;

export const onRequestGet: PagesFunction = async () => {
  return new Response(SWAGGER_UI_HTML, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
