import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    // Proxy는 개발 환경에서만 사용
    proxy: process.env.NODE_ENV === 'development' ? {
      '/api': {
        target: 'https://minjcho.site',
        changeOrigin: true,
        secure: false
      }
    } : undefined
  }
})
