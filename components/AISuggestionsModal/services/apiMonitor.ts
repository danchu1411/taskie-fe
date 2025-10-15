// API Monitoring Service for AI Suggestions
export interface APIMetric {
  endpoint: string;
  method: string;
  status: number;
  duration: number;
  timestamp: number;
  error?: string;
  retryCount?: number;
}

export interface APIMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  errorRate: number;
  lastRequestTime: number;
  requestsByEndpoint: Record<string, number>;
  errorsByStatus: Record<number, number>;
}

export interface APIMonitor {
  logRequest(metric: APIMetric): void;
  getMetrics(): APIMetrics;
  getMetricsForEndpoint(endpoint: string): APIMetrics;
  clearMetrics(): void;
  exportMetrics(): string;
}

// Default API Monitor Implementation
export class DefaultAPIMonitor implements APIMonitor {
  private metrics: APIMetric[] = [];
  private readonly MAX_METRICS = 1000; // Keep last 1000 requests

  logRequest(metric: APIMetric): void {
    this.metrics.push({
      ...metric,
      timestamp: Date.now()
    });

    // Keep only the most recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('API Request:', {
        endpoint: metric.endpoint,
        method: metric.method,
        status: metric.status,
        duration: `${metric.duration}ms`,
        error: metric.error
      });
    }
  }

  getMetrics(): APIMetrics {
    if (this.metrics.length === 0) {
      return this.getEmptyMetrics();
    }

    const totalRequests = this.metrics.length;
    const successfulRequests = this.metrics.filter(m => m.status >= 200 && m.status < 300).length;
    const failedRequests = totalRequests - successfulRequests;
    const averageResponseTime = this.metrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests;
    const errorRate = (failedRequests / totalRequests) * 100;
    const lastRequestTime = Math.max(...this.metrics.map(m => m.timestamp));

    // Group by endpoint
    const requestsByEndpoint: Record<string, number> = {};
    this.metrics.forEach(m => {
      requestsByEndpoint[m.endpoint] = (requestsByEndpoint[m.endpoint] || 0) + 1;
    });

    // Group errors by status
    const errorsByStatus: Record<number, number> = {};
    this.metrics.filter(m => m.status >= 400).forEach(m => {
      errorsByStatus[m.status] = (errorsByStatus[m.status] || 0) + 1;
    });

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime: Math.round(averageResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      lastRequestTime,
      requestsByEndpoint,
      errorsByStatus
    };
  }

  getMetricsForEndpoint(endpoint: string): APIMetrics {
    const endpointMetrics = this.metrics.filter(m => m.endpoint === endpoint);
    
    if (endpointMetrics.length === 0) {
      return this.getEmptyMetrics();
    }

    const totalRequests = endpointMetrics.length;
    const successfulRequests = endpointMetrics.filter(m => m.status >= 200 && m.status < 300).length;
    const failedRequests = totalRequests - successfulRequests;
    const averageResponseTime = endpointMetrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests;
    const errorRate = (failedRequests / totalRequests) * 100;
    const lastRequestTime = Math.max(...endpointMetrics.map(m => m.timestamp));

    // Group by endpoint (will be just this endpoint)
    const requestsByEndpoint: Record<string, number> = {};
    requestsByEndpoint[endpoint] = totalRequests;

    // Group errors by status
    const errorsByStatus: Record<number, number> = {};
    endpointMetrics.filter(m => m.status >= 400).forEach(m => {
      errorsByStatus[m.status] = (errorsByStatus[m.status] || 0) + 1;
    });

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime: Math.round(averageResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      lastRequestTime,
      requestsByEndpoint,
      errorsByStatus
    };
  }

  clearMetrics(): void {
    this.metrics = [];
  }

  exportMetrics(): string {
    const metrics = this.getMetrics();
    return JSON.stringify(metrics, null, 2);
  }

  private getEmptyMetrics(): APIMetrics {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      errorRate: 0,
      lastRequestTime: 0,
      requestsByEndpoint: {},
      errorsByStatus: {}
    };
  }
}

// Mock API Monitor for Development
export class MockAPIMonitor implements APIMonitor {
  logRequest(metric: APIMetric): void {
    // Mock implementation - just log to console
    console.log('Mock API Request:', metric);
  }

  getMetrics(): APIMetrics {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      errorRate: 0,
      lastRequestTime: 0,
      requestsByEndpoint: {},
      errorsByStatus: {}
    };
  }

  getMetricsForEndpoint(endpoint: string): APIMetrics {
    return this.getMetrics();
  }

  clearMetrics(): void {
    // Mock implementation
  }

  exportMetrics(): string {
    return JSON.stringify(this.getMetrics(), null, 2);
  }
}

// API Monitor Manager
export class APIMonitorManager {
  private monitor: APIMonitor;

  constructor(monitor?: APIMonitor) {
    this.monitor = monitor || this.createDefaultMonitor();
  }

  private createDefaultMonitor(): APIMonitor {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const useMockMonitor = process.env.REACT_APP_USE_MOCK_MONITOR === 'true';
    
    if (isDevelopment && useMockMonitor) {
      return new MockAPIMonitor();
    }
    
    return new DefaultAPIMonitor();
  }

  getMonitor(): APIMonitor {
    return this.monitor;
  }

  setMonitor(monitor: APIMonitor): void {
    this.monitor = monitor;
  }

  // Convenience methods
  logRequest(metric: APIMetric): void {
    this.monitor.logRequest(metric);
  }

  getMetrics(): APIMetrics {
    return this.monitor.getMetrics();
  }

  getMetricsForEndpoint(endpoint: string): APIMetrics {
    return this.monitor.getMetricsForEndpoint(endpoint);
  }

  clearMetrics(): void {
    this.monitor.clearMetrics();
  }

  exportMetrics(): string {
    return this.monitor.exportMetrics();
  }
}

// Singleton instance
export const apiMonitorManager = new APIMonitorManager();

// Export default monitor
export const apiMonitor = apiMonitorManager.getMonitor();

export default apiMonitorManager;
