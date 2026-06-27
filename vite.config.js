import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['api'],
  },
  server: {
    fs: {
      allow: ['src', 'public', 'node_modules'],
    },
  },
})
