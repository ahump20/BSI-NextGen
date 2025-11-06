import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    exclude: ['@babylonjs/havok']
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          'babylon': ['@babylonjs/core', '@babylonjs/loaders', '@babylonjs/materials']
        }
      }
    }
  }
});
