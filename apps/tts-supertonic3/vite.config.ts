import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ponytail: 100% in-browser Web Worker execution; proxy to local Python server removed
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174
  }
})
