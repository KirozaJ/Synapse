import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-db': ['dexie', 'dexie-react-hooks'],
          'vendor-viz': ['react-force-graph-2d'],
          'vendor-markdown': ['react-markdown', 'remark-gfm'],
          'vendor-ui': ['lucide-react']
        }
      }
    }
  }
})
