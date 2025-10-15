// Environment Configuration for AI Suggestions API
export interface APIConfig {
  baseURL: string;
  endpoints: {
    generateSuggestions: string;
    acceptSuggestion: string;
    getSuggestionHistory: string;
    getAnalytics: string;
  };
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

// Default configuration
const defaultConfig: APIConfig = {
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000',
  endpoints: {
    generateSuggestions: '/api/ai-suggestions/generate',
    acceptSuggestion: '/api/ai-suggestions',
    getSuggestionHistory: '/api/ai-suggestions/history',
    getAnalytics: '/api/ai-suggestions/analytics'
  },
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000 // 1 second
};

// Environment-specific configurations
const configs: Record<string, APIConfig> = {
  development: {
    ...defaultConfig,
    baseURL: 'http://localhost:3000',
    timeout: 30000
  },
  staging: {
    ...defaultConfig,
    baseURL: process.env.REACT_APP_STAGING_API_URL || 'https://staging-api.taskie.com',
    timeout: 45000
  },
  production: {
    ...defaultConfig,
    baseURL: process.env.REACT_APP_PRODUCTION_API_URL || 'https://api.taskie.com',
    timeout: 60000
  }
};

// Get current environment configuration
export const getAPIConfig = (): APIConfig => {
  const env = process.env.NODE_ENV || 'development';
  return configs[env] || defaultConfig;
};

// API Configuration Manager
export class APIConfigManager {
  private config: APIConfig;

  constructor(config?: APIConfig) {
    this.config = config || getAPIConfig();
  }

  getConfig(): APIConfig {
    return this.config;
  }

  updateConfig(newConfig: Partial<APIConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getBaseURL(): string {
    return this.config.baseURL;
  }

  getEndpoint(endpoint: keyof APIConfig['endpoints']): string {
    return `${this.config.baseURL}${this.config.endpoints[endpoint]}`;
  }

  getTimeout(): number {
    return this.config.timeout;
  }

  getRetryConfig(): { attempts: number; delay: number } {
    return {
      attempts: this.config.retryAttempts,
      delay: this.config.retryDelay
    };
  }
}

// Singleton instance
export const apiConfigManager = new APIConfigManager();

// Utility functions
export const getFullURL = (endpoint: keyof APIConfig['endpoints']): string => {
  return apiConfigManager.getEndpoint(endpoint);
};

export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production';
};

export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development';
};

export const isStaging = (): boolean => {
  return process.env.NODE_ENV === 'staging';
};

// Environment validation
export const validateEnvironment = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const config = getAPIConfig();

  if (!config.baseURL) {
    errors.push('API base URL is not configured');
  }

  if (!config.endpoints.generateSuggestions) {
    errors.push('Generate suggestions endpoint is not configured');
  }

  if (!config.endpoints.acceptSuggestion) {
    errors.push('Accept suggestion endpoint is not configured');
  }

  if (config.timeout <= 0) {
    errors.push('API timeout must be greater than 0');
  }

  if (config.retryAttempts < 0) {
    errors.push('Retry attempts must be non-negative');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export default apiConfigManager;
