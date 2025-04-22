import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'ui': path.resolve(__dirname, '../../packages/ui')
    }
  },
  server: {
    port: 3001 // 3001 para admin, 3002 para client
  }
})