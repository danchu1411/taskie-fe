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
          // Vendor libraries - Bundle everything together to avoid conflicts
          if (id.includes('node_modules')) {
            // Bundle ALL vendor packages together to avoid React conflicts
            return 'vendor-all';
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
  // Additional optimizations
  esbuild: {
    // Remove console logs in production
    drop: ['console', 'debugger'],
  },
  // Define global variables for production
  define: {
    __DEV__: false,
    'process.env.NODE_ENV': '"production"',
    'process.env.REACT_APP_ENV': '"production"',
    // Disable React DevTools in production
    '__REACT_DEVTOOLS_GLOBAL_HOOK__': 'undefined',
    'window.__REACT_DEVTOOLS_GLOBAL_HOOK__': 'undefined',
    // Additional React production flags
    '__REACT_DEVTOOLS_GLOBAL_HOOK__.inject': 'undefined',
    '__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot': 'undefined',
    '__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberUnmount': 'undefined',
  },
})
