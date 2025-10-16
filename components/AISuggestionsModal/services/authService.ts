// Authentication Service for AI Suggestions API
export interface AuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  tokenType: 'Bearer';
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthService {
  getToken(): Promise<string | null>;
  refreshToken(): Promise<string | null>;
  isAuthenticated(): boolean;
  getUser(): AuthUser | null;
  login(email: string, password: string): Promise<AuthToken>;
  logout(): Promise<void>;
  setToken(token: AuthToken): void;
  clearToken(): void;
  syncFromExistingAuth(): Promise<boolean>;
}

// Default Authentication Service Implementation
export class DefaultAuthService implements AuthService {
  private token: AuthToken | null = null;
  private user: AuthUser | null = null;
  private readonly TOKEN_KEY = 'ai_suggestions_auth_token';
  private readonly USER_KEY = 'ai_suggestions_user';

  constructor() {
    this.loadFromStorage();
  }

  async getToken(): Promise<string | null> {
    if (!this.token) {
      return null;
    }

    // Check if token is expired
    if (Date.now() >= this.token.expiresAt) {
      console.log('Token expired, attempting refresh...');
      const refreshedToken = await this.refreshToken();
      return refreshedToken;
    }

    return `${this.token.tokenType} ${this.token.accessToken}`;
  }

  // Auto-sync token from existing auth system
  async syncFromExistingAuth(): Promise<boolean> {
    try {
      // Try to get token from taskie.auth.v1 (primary)
      const taskieAuth = localStorage.getItem('taskie.auth.v1');
      if (taskieAuth) {
        try {
          const authData = JSON.parse(taskieAuth);
          if (authData && authData.tokens && authData.tokens.accessToken) {
            // Parse JWT to get expiration
            const tokenParts = authData.tokens.accessToken.split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              const expiresAt = payload.exp ? payload.exp * 1000 : Date.now() + (15 * 60 * 1000); // Default 15min
              
              this.setToken({
                accessToken: authData.tokens.accessToken,
                expiresAt: expiresAt,
                tokenType: 'Bearer'
              });
              
              console.log('✅ Synced token from taskie.auth.v1');
              return true;
            }
          }
        } catch (error) {
          console.warn('Failed to parse taskie.auth.v1:', error);
        }
      }
      
      // Fallback: Try to get token from localStorage (common auth patterns)
      const existingToken = localStorage.getItem('auth_token') || 
                           localStorage.getItem('access_token') || 
                           localStorage.getItem('token');
      
      if (existingToken) {
        // Try to parse as JWT to get expiration
        const tokenParts = existingToken.split('.');
        if (tokenParts.length === 3) {
          try {
            const payload = JSON.parse(atob(tokenParts[1]));
            const expiresAt = payload.exp ? payload.exp * 1000 : Date.now() + (24 * 60 * 60 * 1000); // Default 24h
            
            this.setToken({
              accessToken: existingToken,
              expiresAt: expiresAt,
              tokenType: 'Bearer'
            });
            
            console.log('✅ Synced token from existing auth system');
            return true;
          } catch (error) {
            console.warn('Failed to parse existing token:', error);
          }
        }
      }
      
      // Try to get from sessionStorage
      const sessionToken = sessionStorage.getItem('auth_token') || 
                          sessionStorage.getItem('access_token') || 
                          sessionStorage.getItem('token');
      
      if (sessionToken) {
        this.setToken({
          accessToken: sessionToken,
          expiresAt: Date.now() + (24 * 60 * 60 * 1000), // Default 24h
          tokenType: 'Bearer'
        });
        
        console.log('✅ Synced token from session storage');
        return true;
      }
      
      console.log('ℹ️ No existing auth token found to sync');
      return false;
    } catch (error) {
      console.error('Failed to sync from existing auth:', error);
      return false;
    }
  }

  async refreshToken(): Promise<string | null> {
    if (!this.token?.refreshToken) {
      console.warn('No refresh token available');
      return null;
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: this.token.refreshToken
        })
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const newToken: AuthToken = await response.json();
      this.setToken(newToken);
      return `${newToken.tokenType} ${newToken.accessToken}`;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearToken();
      return null;
    }
  }

  isAuthenticated(): boolean {
    return this.token !== null && Date.now() < this.token.expiresAt;
  }

  getUser(): AuthUser | null {
    return this.user;
  }

  async login(email: string, password: string): Promise<AuthToken> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const authData = await response.json();
    const token: AuthToken = {
      accessToken: authData.accessToken,
      refreshToken: authData.refreshToken,
      expiresAt: Date.now() + (authData.expiresIn * 1000),
      tokenType: 'Bearer'
    };

    this.setToken(token);
    this.user = authData.user;
    return token;
  }

  async logout(): Promise<void> {
    try {
      if (this.token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': await this.getToken() || '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refreshToken: this.token.refreshToken
          })
        });
      }
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      this.clearToken();
    }
  }

  setToken(token: AuthToken): void {
    this.token = token;
    this.saveToStorage();
  }

  clearToken(): void {
    this.token = null;
    this.user = null;
    this.removeFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const tokenData = localStorage.getItem(this.TOKEN_KEY);
      const userData = localStorage.getItem(this.USER_KEY);

      if (tokenData) {
        this.token = JSON.parse(tokenData);
      }

      if (userData) {
        this.user = JSON.parse(userData);
      }
    } catch (error) {
      console.warn('Failed to load auth data from storage:', error);
      this.clearToken();
    }
  }

  private saveToStorage(): void {
    try {
      if (this.token) {
        localStorage.setItem(this.TOKEN_KEY, JSON.stringify(this.token));
      }
      if (this.user) {
        localStorage.setItem(this.USER_KEY, JSON.stringify(this.user));
      }
    } catch (error) {
      console.warn('Failed to save auth data to storage:', error);
    }
  }

  private removeFromStorage(): void {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    } catch (error) {
      console.warn('Failed to remove auth data from storage:', error);
    }
  }
}

// Mock Authentication Service for Development
export class MockAuthService implements AuthService {
  private token: AuthToken | null = null;
  private user: AuthUser | null = null;

  async getToken(): Promise<string | null> {
    if (!this.token) {
      // Auto-login for development
      await this.login('dev@taskie.com', 'password');
    }
    return this.token ? `${this.token.tokenType} ${this.token.accessToken}` : null;
  }

  async refreshToken(): Promise<string | null> {
    // Mock refresh - just return current token
    return this.getToken();
  }

  isAuthenticated(): boolean {
    return this.token !== null;
  }

  getUser(): AuthUser | null {
    return this.user;
  }

  async login(email: string, password: string): Promise<AuthToken> {
    // Mock login - always succeeds with real-looking token
    this.token = {
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6Ik1vY2sgVXNlciIsImlhdCI6MTUxNjIzOTAyMn0.mock-signature',
      refreshToken: 'mock-refresh-token-' + Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      tokenType: 'Bearer'
    };

    this.user = {
      id: 'mock-user-id',
      email: email,
      name: 'Mock User',
      role: 'user'
    };

    return this.token;
  }

  async logout(): Promise<void> {
    this.token = null;
    this.user = null;
  }

  setToken(token: AuthToken): void {
    this.token = token;
  }

  clearToken(): void {
    this.token = null;
    this.user = null;
  }
}

// Authentication Service Manager
export class AuthServiceManager {
  private service: AuthService;

  constructor(service?: AuthService) {
    this.service = service || this.createDefaultService();
  }

  private createDefaultService(): AuthService {
    const isDevelopment = (typeof process !== 'undefined' && process.env?.NODE_ENV) === 'development';
    const useMockAuth = (typeof process !== 'undefined' && process.env?.REACT_APP_USE_MOCK_AUTH) === 'true';
    
    if (isDevelopment && useMockAuth) {
      return new MockAuthService();
    }
    
    return new DefaultAuthService();
  }

  getService(): AuthService {
    return this.service;
  }

  setService(service: AuthService): void {
    this.service = service;
  }

  // Convenience methods
  async getToken(): Promise<string | null> {
    return this.service.getToken();
  }

  async refreshToken(): Promise<string | null> {
    return this.service.refreshToken();
  }

  isAuthenticated(): boolean {
    return this.service.isAuthenticated();
  }

  getUser(): AuthUser | null {
    return this.service.getUser();
  }

  async login(email: string, password: string): Promise<AuthToken> {
    return this.service.login(email, password);
  }

  async logout(): Promise<void> {
    return this.service.logout();
  }
}

// Singleton instance
export const authServiceManager = new AuthServiceManager();

// Export default service
export const authService = authServiceManager.getService();

export default authServiceManager;
