// Performance Optimization for Phase 2
import { useCallback, useRef, useEffect } from 'react';

// Performance monitoring utilities
export const performanceMonitor = {
  startTime: (label: string) => {
    performance.mark(`${label}-start`);
  },
  
  endTime: (label: string) => {
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);
    const measure = performance.getEntriesByName(label)[0];
    console.log(`⏱️ ${label}: ${measure.duration.toFixed(2)}ms`);
    return measure.duration;
  },
  
  measureAsync: async <T>(label: string, fn: () => Promise<T>): Promise<T> => {
    performanceMonitor.startTime(label);
    try {
      const result = await fn();
      performanceMonitor.endTime(label);
      return result;
    } catch (error) {
      performanceMonitor.endTime(label);
      throw error;
    }
  }
};

// Optimized history hook with memoization
export const useOptimizedHistory = () => {
  const cacheRef = useRef<Map<string, any>>(new Map());
  
  const getCachedData = useCallback((key: string) => {
    return cacheRef.current.get(key);
  }, []);
  
  const setCachedData = useCallback((key: string, data: any) => {
    cacheRef.current.set(key, {
      data,
      timestamp: Date.now()
    });
  }, []);
  
  const isCacheValid = useCallback((key: string, maxAge: number = 300000) => { // 5 minutes
    const cached = cacheRef.current.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < maxAge;
  }, []);
  
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);
  
  return {
    getCachedData,
    setCachedData,
    isCacheValid,
    clearCache
  };
};

// Optimized analytics hook with batching
export const useOptimizedAnalytics = () => {
  const batchRef = useRef<any[]>([]);
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const flushBatch = useCallback(async () => {
    if (batchRef.current.length === 0) return;
    
    const events = [...batchRef.current];
    batchRef.current = [];
    
    try {
      // Send batch events
      console.log(`📊 Flushing ${events.length} analytics events`);
      // await analyticsService.trackBatch(events);
    } catch (error) {
      console.error('Analytics batch flush error:', error);
    }
  }, []);
  
  const trackEvent = useCallback((event: any) => {
    batchRef.current.push(event);
    
    // Flush batch after 1 second or 10 events
    if (batchRef.current.length >= 10) {
      flushBatch();
    } else if (!batchTimeoutRef.current) {
      batchTimeoutRef.current = setTimeout(flushBatch, 1000);
    }
  }, [flushBatch]);
  
  useEffect(() => {
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
      flushBatch();
    };
  }, [flushBatch]);
  
  return {
    trackEvent,
    flushBatch
  };
};

// Optimized component rendering
export const useOptimizedRendering = () => {
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(Date.now());
  
  const shouldRender = useCallback((_dependencies: any[]) => {
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTimeRef.current;
    
    // Throttle renders to max 60fps
    if (timeSinceLastRender < 16) {
      return false;
    }
    
    lastRenderTimeRef.current = now;
    renderCountRef.current++;
    
    return true;
  }, []);
  
  const getRenderStats = useCallback(() => {
    return {
      renderCount: renderCountRef.current,
      lastRenderTime: lastRenderTimeRef.current
    };
  }, []);
  
  return {
    shouldRender,
    getRenderStats
  };
};

// Memory optimization utilities
export const memoryOptimizer = {
  // Debounce function calls
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },
  
  // Throttle function calls
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },
  
  // Memoize expensive calculations
  memoize: <T extends (...args: any[]) => any>(fn: T): T => {
    const cache = new Map();
    return ((...args: Parameters<T>) => {
      const key = JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = fn(...args);
      cache.set(key, result);
      return result;
    }) as T;
  }
};

// Performance metrics collection
export const performanceMetrics = {
  metrics: new Map<string, number[]>(),
  
  recordMetric: (name: string, value: number) => {
    if (!performanceMetrics.metrics.has(name)) {
      performanceMetrics.metrics.set(name, []);
    }
    performanceMetrics.metrics.get(name)!.push(value);
  },
  
  getAverageMetric: (name: string): number => {
    const values = performanceMetrics.metrics.get(name);
    if (!values || values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  },
  
  getMaxMetric: (name: string): number => {
    const values = performanceMetrics.metrics.get(name);
    if (!values || values.length === 0) return 0;
    return Math.max(...values);
  },
  
  getMinMetric: (name: string): number => {
    const values = performanceMetrics.metrics.get(name);
    if (!values || values.length === 0) return 0;
    return Math.min(...values);
  },
  
  getMetricsReport: () => {
    const report: Record<string, any> = {};
    performanceMetrics.metrics.forEach((values, name) => {
      report[name] = {
        average: performanceMetrics.getAverageMetric(name),
        max: performanceMetrics.getMaxMetric(name),
        min: performanceMetrics.getMinMetric(name),
        count: values.length
      };
    });
    return report;
  },
  
  clearMetrics: () => {
    performanceMetrics.metrics.clear();
  }
};

// Component performance monitoring
export const usePerformanceMonitoring = (componentName: string) => {
  const mountTimeRef = useRef(Date.now());
  const renderCountRef = useRef(0);
  
  useEffect(() => {
    const mountTime = Date.now() - mountTimeRef.current;
    performanceMetrics.recordMetric(`${componentName}-mount-time`, mountTime);
    
    return () => {
      const totalTime = Date.now() - mountTimeRef.current;
      performanceMetrics.recordMetric(`${componentName}-total-time`, totalTime);
    };
  }, [componentName]);
  
  const recordRender = useCallback(() => {
    renderCountRef.current++;
    performanceMetrics.recordMetric(`${componentName}-render-count`, renderCountRef.current);
  }, [componentName]);
  
  return {
    recordRender,
    getRenderCount: () => renderCountRef.current
  };
};

// Export all performance utilities
export default {
  performanceMonitor,
  useOptimizedHistory,
  useOptimizedAnalytics,
  useOptimizedRendering,
  memoryOptimizer,
  performanceMetrics,
  usePerformanceMonitoring
};
