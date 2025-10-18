import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Ensure React is properly configured for production
      jsxRuntime: 'automatic',
      jsxImportSource: 'react',
    })
  ],
  build: {
    // Tối ưu hóa bundle size
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
        // Remove React DevTools references
        global_defs: {
          '__REACT_DEVTOOLS_GLOBAL_HOOK__': 'undefined',
        },
      },
    },
    rollupOptions: {
      external: () => {
        // Don't externalize React in browser builds
        return false;
      },
      output: {
        manualChunks: (id) => {
          // Vendor libraries - Keep React ecosystem together
          if (id.includes('node_modules')) {
            // Keep React core together - this is critical
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react-core';
            }
            // Keep React router separate but stable
            if (id.includes('react-router')) {
              return 'vendor-react-router';
            }
            // Keep React ecosystem together
            if (id.includes('@tanstack/react-query') || id.includes('@dnd-kit')) {
              return 'vendor-react-ecosystem';
            }
            // Calendar and charts
            if (id.includes('@fullcalendar') || id.includes('recharts')) {
              return 'vendor-charts';
            }
            // Utils
            if (id.includes('axios') || id.includes('framer-motion')) {
              return 'vendor-utils';
            }
            // Everything else
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
      'framer-motion',
    ],
  },
  // Ensure proper module resolution
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      // Ensure single React instance
      'react': 'react',
      'react-dom': 'react-dom',
    },
  },
  // Define global variables for production
  define: {
    __DEV__: false,
    'process.env.NODE_ENV': '"production"',
    'process.env.REACT_APP_ENV': '"production"',
    // Disable React DevTools in production
    '__REACT_DEVTOOLS_GLOBAL_HOOK__': 'undefined',
    'window.__REACT_DEVTOOLS_GLOBAL_HOOK__': 'undefined',
  },
})
