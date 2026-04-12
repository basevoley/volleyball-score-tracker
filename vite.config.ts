import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  build: {
    outDir: 'build',
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/@mui') || id.includes('node_modules/@emotion')) {
            return 'vendor-mui';
          }
          if (id.includes('node_modules/@react-pdf')) {
            return 'vendor-pdf';
          }
          if (id.includes('node_modules/exceljs')) {
            return 'vendor-excel';
          }
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) {
            return 'vendor-charts';
          }
          if (id.includes('node_modules/@fortawesome')) {
            return 'vendor-icons';
          }
          if (id.includes('node_modules/socket.io')) {
            return 'vendor-socket';
          }
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
  },
})
