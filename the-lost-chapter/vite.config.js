import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src',
  publicDir: '../content',

  build: {
    outDir: '../dist',
    emptyOutDir: true,
    target: 'es2020',

    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html')
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  },

  server: {
    port: 3010,
    open: true
  },

  preview: {
    port: 3011
  }
});
