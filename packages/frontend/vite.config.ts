import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  optimizeDeps: {
    include: ['separador-silabas'],
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'exsurge.min.js',
          dest: ''
        },
        {
          src: 'exsurge.min.js.map',
          dest: ''
        }
      ]
    })
  ]
});