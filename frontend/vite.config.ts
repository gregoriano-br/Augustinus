import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    include: ['separador-silabas'],
  },
  build: {
    assetsInclude: ['**/*.js'],
  },
  publicDir: '../',
});