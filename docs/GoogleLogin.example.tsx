/**
 * Example usage of Google login in AuthContext
 * 
 * This file demonstrates how to integrate Google login with the existing
 * authentication flow using the new loginWithGoogle function.
 */

import { useAuth } from './AuthContext';
import { getGoogleIdToken, detectMockEnabled } from '../../lib/googleIdentity';

// Example 1: Basic Google login component
export function GoogleLoginButton() {
  const { loginWithGoogle, status, authError } = useAuth();

  const handleGoogleLogin = async () => {
    try {
      // Check if mock mode is enabled
      if (detectMockEnabled()) {
        // Use mock payload for development
        await loginWithGoogle({
          mock: {
            sub: 'mock-uid-123',
            email: 'mockuser@example.com',
            name: 'Mock User'
          },
          remember: true
        });
      } else {
        // Get real Google ID token
        const credential = await getGoogleIdToken();
        await loginWithGoogle({
          idToken: credential.credential,
          remember: true
        });
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('cancelled')) {
        // User cancelled - no need to show error
        console.log('User cancelled Google authentication');
        return;
      }
      
      // Handle other errors (400/401 will be thrown and can be caught by UI)
      console.error('Google login failed:', error);
      throw error;
    }
  };

  return (
    <button
      onClick={handleGoogleLogin}
      disabled={status === 'authenticating'}
      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
    >
      {status === 'authenticating' ? 'Signing in...' : 'Sign in with Google'}
    </button>
  );
}

// Example 2: Integration with existing login form
export function LoginForm() {
  const { login, loginWithGoogle, status, authError } = useAuth();

  const handleTraditionalLogin = async (email: string, password: string) => {
    try {
      await login({ email, password, remember: true });
    } catch (error) {
      // Handle login errors
      console.error('Login failed:', error);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      if (detectMockEnabled()) {
        await loginWithGoogle({
          mock: {
            sub: 'mock-uid-123',
            email: 'mockuser@example.com',
            name: 'Mock User'
          },
          remember: true
        });
      } else {
        const credential = await getGoogleIdToken();
        await loginWithGoogle({
          idToken: credential.credential,
          remember: true
        });
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('cancelled')) {
        return; // User cancelled
      }
      console.error('Google login failed:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Traditional login form */}
      <form onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        handleTraditionalLogin(
          formData.get('email') as string,
          formData.get('password') as string
        );
      }}>
        <input name="email" type="email" placeholder="Email" required />
        <input name="password" type="password" placeholder="Password" required />
        <button type="submit" disabled={status === 'authenticating'}>
          {status === 'authenticating' ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      {/* Google login button */}
      <button
        onClick={handleGoogleLogin}
        disabled={status === 'authenticating'}
        className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {status === 'authenticating' ? 'Signing in...' : 'Sign in with Google'}
      </button>

      {/* Error display */}
      {authError && (
        <div className="text-red-500 text-sm">
          {authError}
        </div>
      )}
    </div>
  );
}

// Example 3: Type-safe usage with proper error handling
export function useGoogleLogin() {
  const { loginWithGoogle, status } = useAuth();

  const signInWithGoogle = async (remember: boolean = true) => {
    try {
      if (detectMockEnabled()) {
        return await loginWithGoogle({
          mock: {
            sub: 'mock-uid-123',
            email: 'mockuser@example.com',
            name: 'Mock User'
          },
          remember
        });
      } else {
        const credential = await getGoogleIdToken();
        return await loginWithGoogle({
          idToken: credential.credential,
          remember
        });
      }
    } catch (error) {
      // Re-throw with more context
      if (error instanceof Error) {
        if (error.message.includes('cancelled')) {
          throw new Error('Authentication cancelled by user');
        }
        if (error.message.includes('400')) {
          throw new Error('Invalid Google token');
        }
        if (error.message.includes('401')) {
          throw new Error('Google authentication failed');
        }
      }
      throw error;
    }
  };

  return {
    signInWithGoogle,
    isLoading: status === 'authenticating'
  };
}
