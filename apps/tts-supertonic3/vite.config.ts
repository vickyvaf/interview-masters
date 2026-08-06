import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api-tts': {
        target: 'http://127.0.0.1:7788',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-tts/, '')
      }
    }
  }
})
