/**
 * Google Identity Services integration
 * 
 * This module provides a simple interface to Google Identity Services (GIS)
 * for handling Google OAuth authentication in the frontend.
 * 
 * Features:
 * - Loads Google Identity Services script once
 * - Initializes client with VITE_GOOGLE_CLIENT_ID
 * - Provides async getGoogleIdToken() function
 * - Supports mock mode for development (use createMockGooglePayload() helper)
 * 
 * Mock Usage:
 * - Set VITE_GOOGLE_ALLOW_MOCK=true in development
 * - Use createMockGooglePayload(email, name) to create mock payload
 * - Pass mock payload to loginWithGoogle() instead of getGoogleIdToken()
 */

// Type definitions for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          prompt: (momentListener?: (res: { gisIn: boolean }) => void) => void;
        };
      };
    };
  }
}

type GoogleCredential = {
  credential: string;
};


type MockGooglePayload = {
  mock: {
    sub: string;
    email: string;
    name: string;
  };
};

// Environment variables
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_ALLOW_MOCK = import.meta.env.VITE_GOOGLE_ALLOW_MOCK === 'true';

// State management
let isGoogleLoaded = false;
let isGoogleInitialized = false;
let loadPromise: Promise<void> | null = null;
let originalCallback: ((response: { credential: string }) => void) | null = null;

/**
 * Loads Google Identity Services script if not already loaded
 * @returns Promise that resolves when script is loaded
 */
async function loadGoogleIdentityScript(): Promise<void> {
  if (isGoogleLoaded) {
    return Promise.resolve();
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.google?.accounts?.id) {
      isGoogleLoaded = true;
      resolve();
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      isGoogleLoaded = true;
      resolve();
    };
    
    script.onerror = () => {
      reject(new Error('Failed to load Google Identity Services script'));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}

/**
 * Initializes Google Identity Services client
 * @returns Promise that resolves when client is initialized
 */
async function initializeGoogleClient(): Promise<void> {
  if (isGoogleInitialized) {
    return Promise.resolve();
  }

  if (!GOOGLE_CLIENT_ID) {
    throw new Error('VITE_GOOGLE_CLIENT_ID environment variable is required');
  }

  await loadGoogleIdentityScript();

  if (!window.google?.accounts?.id) {
    throw new Error('Google Identity Services not available');
  }

  // Initialize the client with a temporary callback
  // We'll override this in getGoogleIdToken for each request
  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: (response: { credential: string }) => {
      // Store the original callback to restore later
      if (originalCallback) {
        originalCallback(response);
      }
    }
  });

  isGoogleInitialized = true;
}

/**
 * Detects if mock mode is enabled for development
 * @returns true if mock mode is enabled
 */
export function detectMockEnabled(): boolean {
  return GOOGLE_ALLOW_MOCK;
}

/**
 * Creates a mock Google payload for development testing
 * @param email User email for mock login
 * @param name User name for mock login
 * @returns Mock payload object for loginWithGoogle()
 */
export function createMockGooglePayload(email: string, name: string): MockGooglePayload {
  return {
    mock: {
      sub: `mock-${Date.now()}`,
      email: email.trim(),
      name: name.trim()
    }
  };
}

/**
 * Gets Google ID token through OAuth flow
 * @returns Promise that resolves with Google credential
 * @throws Error if user cancels or authentication fails
 */
export async function getGoogleIdToken(): Promise<GoogleCredential> {
  // Check for mock mode - only log warning, don't return mock token
  if (detectMockEnabled()) {
    console.warn('Google Identity: Mock mode enabled - use createMockGooglePayload() helper instead of getGoogleIdToken()');
  }

  try {
    await initializeGoogleClient();
  } catch (error) {
    throw new Error(`Failed to initialize Google Identity: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.id) {
      reject(new Error('Google Identity Services not available'));
      return;
    }

    // Store the current callback to restore later
    const currentCallback = originalCallback;
    
    // Set up the callback for this specific request
    originalCallback = (response: { credential: string }) => {
      // Restore the previous callback
      originalCallback = currentCallback;
      resolve({
        credential: response.credential
      });
    };

    // Re-initialize with our temporary callback
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID!,
      callback: originalCallback
    });

    // Show the Google sign-in prompt
    try {
      window.google.accounts.id.prompt((res) => {
        if (!res.gisIn) {
          // User cancelled or closed the prompt
          // Restore the previous callback
          originalCallback = currentCallback;
          reject(new Error('User cancelled Google authentication'));
        }
      });
    } catch (error) {
      // Restore the previous callback on error
      originalCallback = currentCallback;
      reject(new Error(`Failed to show Google sign-in prompt: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  });
}

/**
 * Preloads Google Identity Services for better UX
 * Call this early in your app lifecycle
 */
export async function preloadGoogleIdentity(): Promise<void> {
  try {
    await loadGoogleIdentityScript();
    console.log('Google Identity Services preloaded');
  } catch (error) {
    console.warn('Failed to preload Google Identity Services:', error);
  }
}
