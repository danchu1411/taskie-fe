# Taskie Documentation

This directory contains documentation and example files for the Taskie application.

## Google OAuth Examples

### Files:
- `googleIdentity.example.ts` - Examples of using the Google Identity library
- `GoogleLogin.example.tsx` - React component examples for Google login

### Usage:
These files are for reference only and demonstrate how to integrate Google OAuth authentication in your application. They are not included in the production build.

### Key Features Demonstrated:
1. **Real Google OAuth**: Using `getGoogleIdToken()` for production authentication
2. **Mock Mode**: Using `createMockGooglePayload()` for development testing
3. **Error Handling**: Proper error handling for different scenarios
4. **React Integration**: How to use Google OAuth in React components

### Environment Setup:
```bash
# Development
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_GOOGLE_ALLOW_MOCK=true

# Production
VITE_GOOGLE_CLIENT_ID=your-production-google-client-id
# VITE_GOOGLE_ALLOW_MOCK=false (or omit)
```

### Mock Mode Usage:
- Set `VITE_GOOGLE_ALLOW_MOCK=true` in development
- Alt+click "Continue with Google" to open mock dialog
- Enter custom email/name for testing
- Use `createMockGooglePayload()` helper function

### Production Usage:
- Remove or set `VITE_GOOGLE_ALLOW_MOCK=false`
- Use real Google OAuth flow with `getGoogleIdToken()`
- Ensure proper Google Cloud Console configuration
