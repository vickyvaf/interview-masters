import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  envDir: path.resolve(__dirname, '../../'),
  server: {
    proxy: {
      '/api-tts': {
        target: 'http://127.0.0.1:7788',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-tts/, '')
      }
    }
  }
})
