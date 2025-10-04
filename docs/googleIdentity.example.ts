/**
 * Example usage of Google Identity Services
 * 
 * This file demonstrates how to integrate Google Identity with your authentication flow.
 * You can use this as a reference when implementing Google login in your components.
 */

import { getGoogleIdToken, detectMockEnabled, preloadGoogleIdentity, createMockGooglePayload } from './googleIdentity';

// Example 1: Basic usage in a login component
export async function handleGoogleLogin() {
  try {
    // Check if mock mode is enabled
    if (detectMockEnabled()) {
      console.log('Mock mode enabled - use createMockGooglePayload() helper');
      // For mock mode, use createMockGooglePayload() instead of getGoogleIdToken()
      const mockPayload = createMockGooglePayload('test@example.com', 'Test User');
      return await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockPayload)
      });
    }

    // Get real Google ID token
    const credential = await getGoogleIdToken();
    
    // Send to your backend
    const response = await fetch('/api/auth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idToken: credential.credential
      })
    });

    if (!response.ok) {
      throw new Error('Google login failed');
    }

    const authData = await response.json();
    console.log('Google login successful:', authData);
    
    return authData;
  } catch (error) {
    if (error instanceof Error && error.message.includes('cancelled')) {
      console.log('User cancelled Google authentication');
      return null;
    }
    
    console.error('Google login error:', error);
    throw error;
  }
}

// Example 2: Preload Google Identity for better UX
export function initializeGoogleAuth() {
  // Call this early in your app (e.g., in App.tsx or main.tsx)
  preloadGoogleIdentity().catch(console.warn);
}

// Example 3: Usage in a React component
export function GoogleLoginButton() {
  const handleClick = async () => {
    try {
      const result = await handleGoogleLogin();
      if (result) {
        // Handle successful login
        console.log('Login successful:', result);
      }
    } catch (error) {
      // Handle error
      console.error('Login failed:', error);
    }
  };

  return (
    <button 
      onClick={handleClick}
      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
    >
      Sign in with Google
    </button>
  );
}

// Example 4: Mock mode usage
export function MockGoogleLogin() {
  const handleMockLogin = async () => {
    if (!detectMockEnabled()) {
      console.warn('Mock mode not enabled');
      return;
    }

    try {
      // Create mock payload with custom user data
      const mockPayload = createMockGooglePayload('dev@example.com', 'Dev User');
      
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockPayload)
      });

      if (response.ok) {
        const authData = await response.json();
        console.log('Mock login successful:', authData);
      }
    } catch (error) {
      console.error('Mock login failed:', error);
    }
  };

  return (
    <button 
      onClick={handleMockLogin}
      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
    >
      Mock Google Login
    </button>
  );
}

// Example 4: Environment setup
export const GOOGLE_CONFIG = {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  allowMock: import.meta.env.VITE_GOOGLE_ALLOW_MOCK === 'true',
  
  // Check if Google is properly configured
  isConfigured: () => {
    return !!import.meta.env.VITE_GOOGLE_CLIENT_ID;
  }
};
