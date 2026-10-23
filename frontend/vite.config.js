import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: {
    host: '0.0.0.0',      // listen on all network interfaces
    port: 5173,           // optional: fix the port
    strictPort: true,     // optional: fail if port is taken instead of switching
    proxy: {
      '/api':     { target: 'http://localhost:5000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:5000', changeOrigin: true }
    }
  }
})