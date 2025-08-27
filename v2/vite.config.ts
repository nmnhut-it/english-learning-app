import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: './',
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        manualChunks: {
          vendor: ['marked'],
          audio: ['./src/services/AudioService'],
          content: ['./src/services/ContentService'],
          components: [
            './src/components/MarkdownViewer/MarkdownViewer',
            './src/components/VocabularyCard/VocabularyCard',
            './src/components/QuizGenerator/QuizGenerator'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 3003,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5002',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@services': resolve(__dirname, 'src/services'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@types': resolve(__dirname, 'src/types'),
      '@styles': resolve(__dirname, 'src/styles'),
      '@pages': resolve(__dirname, 'src/pages')
    }
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
  }
});