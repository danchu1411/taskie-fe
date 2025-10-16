import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Tối ưu hóa bundle size
    target: 'esnext',
    minify: 'terser',
    // terserOptions: {
    //   compress: {
    //     drop_console: true,
    //     drop_debugger: true,
    //   },
    // },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor libraries
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('react-router')) {
              return 'vendor-router';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'vendor-query';
            }
            if (id.includes('@dnd-kit')) {
              return 'vendor-dnd';
            }
            if (id.includes('@fullcalendar')) {
              return 'vendor-calendar';
            }
            if (id.includes('axios')) {
              return 'vendor-utils';
            }
            if (id.includes('recharts')) {
              return 'vendor-charts';
            }
            return 'vendor-other';
          }
          
          // Application chunks
          if (id.includes('src/features/schedule')) {
            return 'schedule';
          }
          if (id.includes('src/features/tasks')) {
            return 'tasks';
          }
          if (id.includes('src/features/stats')) {
            return 'stats';
          }
          if (id.includes('src/features/auth')) {
            return 'auth';
          }
          if (id.includes('src/components/ui')) {
            return 'ui-components';
          }
          if (id.includes('src/lib')) {
            return 'lib';
          }
        },
      },
    },
    // Tối ưu hóa assets
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 1000,
  },
  // Tối ưu hóa dev server
  server: {
    hmr: {
      overlay: false,
    },
  },
  // Tối ưu hóa dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'axios',
    ],
  },
})
