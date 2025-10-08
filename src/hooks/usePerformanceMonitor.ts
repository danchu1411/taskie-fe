import { useEffect, useRef } from 'react';

// interface PerformanceMetrics {
//   renderTime: number;
//   componentName: string;
//   timestamp: number;
// }

/**
 * Hook để monitor performance của components
 */
export function usePerformanceMonitor(componentName: string) {
  const renderStartTime = useRef<number>(0);
  const renderCount = useRef<number>(0);

  useEffect(() => {
    renderStartTime.current = performance.now();
    renderCount.current += 1;

    return () => {
      const renderTime = performance.now() - renderStartTime.current;
      
      // Log performance metrics trong development
      if (import.meta.env.DEV) {
        console.log(`[Performance] ${componentName}:`, {
          renderTime: `${renderTime.toFixed(2)}ms`,
          renderCount: renderCount.current,
          timestamp: new Date().toISOString(),
        });

        // Warning nếu render time quá lâu
        if (renderTime > 16) { // 60fps = 16.67ms per frame
          console.warn(`[Performance Warning] ${componentName} took ${renderTime.toFixed(2)}ms to render`);
        }
      }
    };
  });
}

/**
 * Hook để measure API call performance
 */
export function useApiPerformanceMonitor() {
  const measureApiCall = (apiName: string, startTime: number) => {
    const endTime = performance.now();
    const duration = endTime - startTime;

    if (import.meta.env.DEV) {
      console.log(`[API Performance] ${apiName}:`, {
        duration: `${duration.toFixed(2)}ms`,
        timestamp: new Date().toISOString(),
      });

      // Warning nếu API call quá lâu
      if (duration > 1000) { // 1 second
        console.warn(`[API Performance Warning] ${apiName} took ${duration.toFixed(2)}ms`);
      }
    }
  };

  return { measureApiCall };
}

/**
 * Hook để monitor memory usage
 */
export function useMemoryMonitor() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const checkMemory = () => {
        const memory = (performance as any).memory;
        const used = memory.usedJSHeapSize / 1024 / 1024; // MB
        const total = memory.totalJSHeapSize / 1024 / 1024; // MB
        const limit = memory.jsHeapSizeLimit / 1024 / 1024; // MB

        if (import.meta.env.DEV) {
          console.log('[Memory Usage]', {
            used: `${used.toFixed(2)}MB`,
            total: `${total.toFixed(2)}MB`,
            limit: `${limit.toFixed(2)}MB`,
            usage: `${((used / limit) * 100).toFixed(1)}%`,
          });

          // Warning nếu memory usage quá cao
          if (used / limit > 0.8) {
            console.warn(`[Memory Warning] High memory usage: ${((used / limit) * 100).toFixed(1)}%`);
          }
        }
      };

      // Check memory every 30 seconds
      const interval = setInterval(checkMemory, 30000);
      return () => clearInterval(interval);
    }
  }, []);
}

/**
 * Hook để monitor bundle size và loading performance
 */
export function useBundleMonitor() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Monitor page load time
      window.addEventListener('load', () => {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        
        if (import.meta.env.DEV) {
          console.log('[Bundle Performance]', {
            loadTime: `${loadTime}ms`,
            domContentLoaded: `${performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart}ms`,
            firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 'N/A',
            firstContentfulPaint: performance.getEntriesByType('paint')[1]?.startTime || 'N/A',
          });
        }
      });

      // Monitor resource loading
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (import.meta.env.DEV) {
            console.log('[Resource Performance]', {
              name: entry.name,
              duration: `${entry.duration.toFixed(2)}ms`,
              size: (entry as any).transferSize ? `${((entry as any).transferSize / 1024).toFixed(2)}KB` : 'N/A',
            });
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });

      return () => observer.disconnect();
    }
  }, []);
}