# Authentication Token Integration Guide

## Overview

The AI Suggestions Modal now supports both manual token injection and automatic token synchronization from existing authentication systems.

## Methods

### 1. Manual Token Injection

After login, inject your JWT token:

```javascript
// In browser console
authServiceManager.setToken({
  accessToken: '<YOUR_JWT_TOKEN>',
  refreshToken: '<refresh_token_optional>',
  expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
  tokenType: 'Bearer'
});
```

### 2. Auto-sync from Existing Auth

The modal automatically tries to sync tokens from common storage locations:

- `localStorage.getItem('auth_token')`
- `localStorage.getItem('access_token')`
- `localStorage.getItem('token')`
- `sessionStorage.getItem('auth_token')`
- `sessionStorage.getItem('access_token')`
- `sessionStorage.getItem('token')`

### 3. Helper Script

Use the provided helper script (`auth-token-helper.js`) in browser console:

```javascript
// Load helper script first
// Then use:
injectAuthToken('<YOUR_JWT_TOKEN>');
syncExistingAuth();
getStoredToken();
```

## Implementation Details

### AuthService Methods

```typescript
interface AuthService {
  setToken(token: AuthToken): void;           // Manual injection
  syncFromExistingAuth(): Promise<boolean>;   // Auto-sync
  getToken(): Promise<string | null>;          // Get formatted token
  isAuthenticated(): boolean;                 // Check auth status
}
```

### Token Format

```typescript
interface AuthToken {
  accessToken: string;      // JWT token
  refreshToken?: string;    // Optional refresh token
  expiresAt: number;        // Expiration timestamp
  tokenType: 'Bearer';      // Token type
}
```

## Usage Flow

1. **User logs in** → JWT token stored in localStorage/sessionStorage
2. **AI Modal opens** → Auto-sync attempts to find existing token
3. **If no token found** → Manual injection required
4. **API calls** → Token automatically included in Authorization header

## Console Messages

- `✅ Auth token synced from existing system` - Auto-sync successful
- `ℹ️ No existing auth token found - manual injection needed` - Auto-sync failed
- `💡 Use: injectAuthToken("<YOUR_JWT>") in browser console` - Manual injection hint
- `✅ Auth token manually set` - Manual injection successful

## Error Handling

- **401 Unauthorized**: Token missing, expired, or invalid
- **Token expired**: Automatic refresh attempt (if refresh token available)
- **No token**: Graceful fallback to mock services

## Testing

1. **With existing auth**: Token should auto-sync
2. **Without auth**: Use manual injection for testing
3. **Expired token**: Automatic refresh or re-injection needed

## Security Notes

- Tokens are stored in localStorage (persistent) or sessionStorage (session-only)
- JWT expiration is automatically checked
- Refresh tokens are used when available
- No sensitive data logged to console
