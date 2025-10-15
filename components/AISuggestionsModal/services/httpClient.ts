// HTTP Client for AI Suggestions API
import { apiConfigManager, APIConfig } from '../config/apiConfig';
import { authServiceManager } from './authService';
import { apiMonitorManager, APIMetric } from './apiMonitor';

export interface HTTPRequest {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

export interface HTTPResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export interface HTTPError extends Error {
  status?: number;
  statusText?: string;
  response?: Response;
  isNetworkError?: boolean;
  isTimeoutError?: boolean;
  isAuthError?: boolean;
}

export interface RetryConfig {
  attempts: number;
  delay: number;
  backoffMultiplier: number;
  maxDelay: number;
}

export class HTTPClient {
  private config: APIConfig;
  private retryConfig: RetryConfig;

  constructor(config?: APIConfig) {
    this.config = config || apiConfigManager.getConfig();
    this.retryConfig = {
      attempts: this.config.retryAttempts,
      delay: this.config.retryDelay,
      backoffMultiplier: 2,
      maxDelay: 10000 // 10 seconds
    };
  }

  async request<T = any>(request: HTTPRequest): Promise<HTTPResponse<T>> {
    const { attempts, delay } = this.retryConfig;
    let lastError: HTTPError | null = null;

    for (let attempt = 0; attempt < attempts; attempt++) {
      try {
        const response = await this.makeRequest<T>(request);
        return response;
      } catch (error) {
        lastError = error as HTTPError;
        
        // Don't retry for certain error types
        if (this.shouldNotRetry(error as HTTPError)) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === attempts - 1) {
          throw error;
        }

        // Calculate delay with exponential backoff
        const retryDelay = Math.min(
          delay * Math.pow(this.retryConfig.backoffMultiplier, attempt),
          this.retryConfig.maxDelay
        );

        console.warn(`Request failed (attempt ${attempt + 1}/${attempts}), retrying in ${retryDelay}ms:`, error);
        await this.sleep(retryDelay);
      }
    }

    throw lastError;
  }

  private async makeRequest<T>(request: HTTPRequest): Promise<HTTPResponse<T>> {
    const { url, method, headers = {}, body, timeout } = request;
    const startTime = Date.now();
    
    // Add authentication header
    const authToken = await authServiceManager.getToken();
    if (authToken) {
      headers['Authorization'] = authToken;
    }

    // Set default headers
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    headers['Accept'] = headers['Accept'] || 'application/json';

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout || this.config.timeout);

    let metric: APIMetric = {
      endpoint: this.extractEndpoint(url),
      method,
      status: 0,
      duration: 0,
      timestamp: Date.now()
    };

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;

      // Parse response headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Update metric
      metric.status = response.status;
      metric.duration = duration;

      // Handle different response types
      if (!response.ok) {
        const error = await this.createHTTPError(response);
        metric.error = error.message;
        apiMonitorManager.logRequest(metric);
        throw error;
      }

      // Parse response body
      let data: T;
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else if (contentType?.includes('text/')) {
        data = await response.text() as T;
      } else {
        data = await response.blob() as T;
      }

      // Log successful request
      apiMonitorManager.logRequest(metric);

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders
      };

    } catch (error) {
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;
      
      // Update metric with error
      metric.duration = duration;
      metric.error = error.message;
      
      if (error.name === 'AbortError') {
        metric.status = 408; // Timeout
        const timeoutError = new Error('Request timeout') as HTTPError;
        timeoutError.isTimeoutError = true;
        apiMonitorManager.logRequest(metric);
        throw timeoutError;
      }

      if (error instanceof TypeError && error.message.includes('fetch')) {
        metric.status = 0; // Network error
        const networkError = new Error('Network error') as HTTPError;
        networkError.isNetworkError = true;
        apiMonitorManager.logRequest(metric);
        throw networkError;
      }

      // Log error request
      apiMonitorManager.logRequest(metric);
      throw error;
    }
  }

  private extractEndpoint(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname;
    } catch {
      return url;
    }
  }

  private async createHTTPError(response: Response): Promise<HTTPError> {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    let errorData: any = null;

    try {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } else {
        errorMessage = await response.text() || errorMessage;
      }
    } catch {
      // Ignore parsing errors
    }

    const error = new Error(errorMessage) as HTTPError;
    error.status = response.status;
    error.statusText = response.statusText;
    error.response = response;
    error.isAuthError = response.status === 401 || response.status === 403;

    return error;
  }

  private shouldNotRetry(error: HTTPError): boolean {
    // Don't retry authentication errors
    if (error.isAuthError) {
      return true;
    }

    // Don't retry client errors (4xx) except 408, 429
    if (error.status && error.status >= 400 && error.status < 500) {
      return error.status !== 408 && error.status !== 429;
    }

    // Don't retry server errors (5xx) except 502, 503, 504
    if (error.status && error.status >= 500) {
      return error.status !== 502 && error.status !== 503 && error.status !== 504;
    }

    return false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Convenience methods
  async get<T>(url: string, headers?: Record<string, string>): Promise<HTTPResponse<T>> {
    return this.request<T>({ url, method: 'GET', headers });
  }

  async post<T>(url: string, body?: any, headers?: Record<string, string>): Promise<HTTPResponse<T>> {
    return this.request<T>({ url, method: 'POST', body, headers });
  }

  async put<T>(url: string, body?: any, headers?: Record<string, string>): Promise<HTTPResponse<T>> {
    return this.request<T>({ url, method: 'PUT', body, headers });
  }

  async patch<T>(url: string, body?: any, headers?: Record<string, string>): Promise<HTTPResponse<T>> {
    return this.request<T>({ url, method: 'PATCH', body, headers });
  }

  async delete<T>(url: string, headers?: Record<string, string>): Promise<HTTPResponse<T>> {
    return this.request<T>({ url, method: 'DELETE', headers });
  }
}

// Singleton instance
export const httpClient = new HTTPClient();

// Export default client
export default httpClient;
