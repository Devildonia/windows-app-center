import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: 'hidden',  // Sprint 1 bonus: source maps sin exponerlos públicamente
    rollupOptions: {
      input: {
        main: 'index.html'
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  test: {
    exclude: ['test/e2e/**', 'node_modules/**'],
  }
});
