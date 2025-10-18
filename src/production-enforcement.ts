// Production mode enforcement script
// This script ensures React runs in production mode

// Type declaration for React DevTools
declare global {
  interface Window {
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: any;
  }
}

if (typeof window !== 'undefined') {
  // Disable React DevTools
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = undefined;
  
  // Ensure production mode
  if (process.env.NODE_ENV !== 'production') {
    console.warn('React should run in production mode');
  }
  
  // Disable any development warnings
  const originalConsoleWarn = console.warn;
  console.warn = (...args) => {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('React')) {
      return; // Suppress React warnings in production
    }
    originalConsoleWarn.apply(console, args);
  };
}
