import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@lib': path.resolve(__dirname, './lib'),
      '@functions': path.resolve(__dirname, './functions'),
      '@types': path.resolve(__dirname, './types'),
      '@utils': path.resolve(__dirname, './lib/utils'),
      '@api': path.resolve(__dirname, './lib/api'),
      '@adapters': path.resolve(__dirname, './lib/adapters'),
      '@db': path.resolve(__dirname, './lib/db'),
      '@auth': path.resolve(__dirname, './lib/auth'),
    },
  },

  optimizeDeps: {
    include: ['@babylonjs/core', '@babylonjs/loaders', 'react', 'react-dom'],
    exclude: ['@babylonjs/havok'], // WASM files need special handling
  },

  server: {
    port: 5173,
    strictPort: true,
    host: true, // Allow external access (mobile testing)
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    proxy: {
      // Proxy API requests to Wrangler dev server
      '/api': {
        target: 'http://localhost:8788',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          babylon: ['@babylonjs/core', '@babylonjs/loaders', '@babylonjs/materials'],
          'react-vendor': ['react', 'react-dom'],
        },
      },
    },
  },

  // Environment variables available to client-side code
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
  },

  // Test configuration (moved to vitest.config.ts but kept for compatibility)
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
  },
});
