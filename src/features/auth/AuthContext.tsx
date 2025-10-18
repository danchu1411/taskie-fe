import { isAxiosError } from "axios";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import api, { setRuntimeAccessToken, setRuntimeRefreshToken, getRefreshToken, clearRuntimeAuth } from "../../lib/api";
import { setUnauthorizedHandler } from "../../lib/auth-events";
import { setNetworkErrorHandler } from "../../lib/network-events";
import {
  clearAuthState,
  loadAuthState,
  saveAuthState,
  type AuthTokens,
  type AuthUser,
  type StoredAuthState,
} from "./auth-storage";

type AuthStatus = "idle" | "authenticating" | "authenticated";

type LoginArgs = {
  email: string;
  password: string;
  remember?: boolean;
};

type LoginWithGoogleArgs = {
  idToken: string;
  remember?: boolean;
} | {
  mock: {
    sub: string;
    email: string;
    name: string;
  };
  remember?: boolean;
};

type SignUpArgs = {
  name?: string;
  email: string;
  password: string;
  remember?: boolean;
};

type LogoutArgs = {
  revokeAll?: boolean;
};

type VerificationStatus =
  | "verified"
  | "sent"
  | "logged"
  | "failed"
  | "already_verified"
  | "pending"
  | "unknown"
  | string;

type VerificationInfo = {
  status: VerificationStatus;
  expiresAt?: string | null;
  lastRequestedAt?: string | null;
  error?: string | null;
};

type VerificationResponsePayload = {
  status?: string;
  expiresAt?: string | null;
};

type ForgotPasswordResponse = {
  status?: string;
  expiresAt?: string | null;
};

type ResetPasswordResponse = {
  passwordReset: boolean;
};

type AuthContextValue = {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  shouldPromptVerification: boolean;
  verification: VerificationInfo | null;
  authError: string | null;
  networkError: string | null;
  login: (payload: LoginArgs) => Promise<void>;
  loginWithGoogle: (payload: LoginWithGoogleArgs) => Promise<void>;
  signUp: (payload: SignUpArgs) => Promise<void>;
  logout: (payload?: LogoutArgs) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: (email?: string) => Promise<VerificationInfo>;
  requestPasswordReset: (email: string) => Promise<ForgotPasswordResponse>;
  resetPassword: (payload: { token: string; password: string }) => Promise<ResetPasswordResponse>;
  setAuthState: (state: StoredAuthState | null, options?: { remember?: boolean }) => void;
  setPromptVerification: (flag: boolean) => void;
  clearAuthError: () => void;
  setAuthError: (error: string | null) => void;
  clearNetworkError: () => void;
  updateUserProfile: (updates: Partial<AuthUser>) => void; // ADD THIS
};

type AuthResponsePayload = {
  user: AuthUser;
  tokens: AuthTokens;
  verification?: VerificationResponsePayload | null;
};

type VerifyEmailResponse = {
  emailVerified: boolean;
  user: AuthUser;
};

type ResendVerificationResponse = {
  status?: string;
  expiresAt?: string | null;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function normalizeVerification(
  payload: VerificationResponsePayload | null | undefined,
  user: AuthUser | null | undefined,
): VerificationInfo | null {
  if (payload?.status) {
    return {
      status: payload.status,
      expiresAt: payload.expiresAt ?? null,
      lastRequestedAt: new Date().toISOString(),
    };
  }
  if (!user) return null;
  return {
    status: user.emailVerified ? "verified" : "pending",
    expiresAt: null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const initialState = loadAuthState();
  const [authState, setAuthStateInternal] = useState<StoredAuthState | null>(initialState);
  const [status, setStatus] = useState<AuthStatus>(initialState ? "authenticated" : "idle");
  const [verification, setVerification] = useState<VerificationInfo | null>(
    initialState ? normalizeVerification(null, initialState.user) : null,
  );
  const [shouldPromptVerification, setShouldPromptVerification] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const shouldPersistRef = useRef<boolean>(Boolean(initialState));
  const refreshPromiseRef = useRef<Promise<boolean> | null>(null);

  useEffect(() => {
    setRuntimeAccessToken(authState?.tokens.accessToken ?? null);
    setRuntimeRefreshToken(authState?.tokens.refreshToken ?? null);
  }, [authState?.tokens.accessToken, authState?.tokens.refreshToken]);

  const refreshTokens = useCallback(async (): Promise<boolean> => {
    // If a refresh is already in progress, return that promise
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const refreshToken = authState?.tokens.refreshToken ?? getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    const refreshPromise = (async () => {
      try {
        // Create a bare axios instance to avoid interceptor loops
        const refreshResponse = await api.post('/auth/refresh', { refreshToken }, {
          skipAuthRefresh: true
        });

        const newTokens = refreshResponse.data.tokens;
        if (!newTokens || !newTokens.accessToken || !newTokens.refreshToken) {
          throw new Error('Invalid refresh response');
        }

        // Update auth state with new tokens but keep current user
        if (authState) {
          const updatedState: StoredAuthState = {
            user: authState.user,
            tokens: newTokens
          };
          setAuthStateInternal(updatedState);
          
          // Persist if we were persisting before
          if (shouldPersistRef.current) {
            saveAuthState(updatedState);
          }
        }

        return true;
      } catch (error) {
        console.warn('Token refresh failed:', error);
        // Clear auth state on refresh failure
        setAuthStateInternal(null);
        clearRuntimeAuth();
        clearAuthState();
        setStatus("idle");
        return false;
      } finally {
        // Clear the promise ref when done
        refreshPromiseRef.current = null;
      }
    })();

    refreshPromiseRef.current = refreshPromise;
    return refreshPromise;
  }, [authState]);

  useEffect(() => {
    // When unauthorized globally, attempt token refresh first
    setUnauthorizedHandler(async (error: unknown) => {
      try {
        const refreshed = await refreshTokens();
        if (refreshed) {
          return true; // Signal success to interceptor for retry
        }
      } catch (refreshError) {
        console.warn("Token refresh failed in unauthorized handler:", refreshError);
      }
      
      // Fall back to clearing state and setting error
      setAuthStateInternal(null);
      setStatus("idle");
      // Only set session expired message if no specific error is already set
      if (!authError) {
        setAuthError("Your session has expired. Please log in again.");
      }
      console.warn("Unauthorized access detected:", error);
      return false;
    });

    // When network error occurs globally, set network error flag
    setNetworkErrorHandler(({ message }: { message: string; originalError: unknown }) => {
      setNetworkError(message);
      console.warn("Network error detected:", message);
    });

    return () => {
      setUnauthorizedHandler(null);
      setNetworkErrorHandler(null);
    };
  }, [refreshTokens]);

  const setAuthState = useCallback(
    (state: StoredAuthState | null, options?: { remember?: boolean }) => {
      if (!state) {
        clearRuntimeAuth();
        setAuthStateInternal(null);
        shouldPersistRef.current = false;
        setVerification(null);
        setShouldPromptVerification(false);
        setAuthError(null); // Clear auth error when setting new auth state
        setNetworkError(null); // Clear network error when setting new auth state
        clearAuthState();
        return;
      }

      const remember = options?.remember ?? shouldPersistRef.current ?? false;
      shouldPersistRef.current = remember;
      setRuntimeAccessToken(state.tokens.accessToken);
      setRuntimeRefreshToken(state.tokens.refreshToken);
      setAuthStateInternal(state);
      setAuthError(null); // Clear auth error when setting new auth state
      setNetworkError(null); // Clear network error when setting new auth state
      if (remember) {
        saveAuthState(state);
      } else {
        clearAuthState();
      }
    },
    [],
  );

  const hydrateState = useCallback(
    (
      payload: AuthResponsePayload,
      remember?: boolean,
      options?: { promptVerification?: boolean },
    ) => {
      const snapshot: StoredAuthState = {
        user: {
          ...payload.user,
          emailVerified: Boolean(payload.user.emailVerified),
          hasStudyProfile: Boolean(payload.user.hasStudyProfile), // ADD THIS
        },
        tokens: payload.tokens,
      };
      setAuthState(snapshot, { remember });
      setVerification(normalizeVerification(payload.verification, snapshot.user));
      setShouldPromptVerification(Boolean(options?.promptVerification && !snapshot.user.emailVerified));
      
      // For signup with unverified email, don't set authenticated status
      if (options?.promptVerification && !snapshot.user.emailVerified) {
        setStatus("idle");
      } else {
        setStatus("authenticated");
      }
    },
    [setAuthState],
  );

  const handleAuthFailure = useCallback(
    (errorMessage?: string) => {
      setStatus(authState ? "authenticated" : "idle");
      if (errorMessage) {
        setAuthError(errorMessage);
      }
    },
    [authState],
  );

  const login = useCallback(
    async ({ email, password, remember }: LoginArgs) => {
      setStatus("authenticating");
      try {
        const response = await api.post<AuthResponsePayload>("/auth/login", { email, password });
        hydrateState(response.data, remember, { promptVerification: !response.data.user.emailVerified });
      } catch (error) {
        handleAuthFailure("Invalid email or password. Please try again.");
        throw error;
      }
    },
    [hydrateState, handleAuthFailure],
  );

  const loginWithGoogle = useCallback(
    async (payload: LoginWithGoogleArgs) => {
      setStatus("authenticating");
      try {
        const response = await api.post<AuthResponsePayload>("/auth/google", payload);
        hydrateState(response.data, payload.remember, { promptVerification: !response.data.user.emailVerified });
      } catch (error) {
        handleAuthFailure("Google authentication failed. Please try again.");
        throw error;
      }
    },
    [hydrateState, handleAuthFailure],
  );

  const signUp = useCallback(
    async ({ name, email, password, remember }: SignUpArgs) => {
      setStatus("authenticating");
      try {
        const response = await api.post<AuthResponsePayload>("/auth/signup", {
          name: name?.trim() || undefined,
          email,
          password,
        });
        hydrateState(response.data, remember, { promptVerification: !response.data.user.emailVerified });
      } catch (error) {
        handleAuthFailure();
        throw error;
      }
    },
    [hydrateState, handleAuthFailure],
  );

  const logout = useCallback(
    async (payload?: LogoutArgs) => {
      const refreshToken = authState?.tokens.refreshToken;
      setAuthState(null);
      setStatus("idle");
      if (!refreshToken) return;

      try {
        await api.post("/auth/logout", {
          refreshToken,
          allSessions: payload?.revokeAll ?? false,
        }, {
          skipAuthRefresh: true
        });
      } catch (error) {
        console.warn("Failed to revoke refresh token", error);
      }
    },
    [authState, setAuthState],
  );

  const verifyEmail = useCallback(
    async (token: string) => {
      const trimmed = token.trim();
      if (!trimmed) {
        throw new Error("Verification token is required");
      }
      const response = await api.post<VerifyEmailResponse>("/auth/verify-email", { token: trimmed });
      const effectiveUser: AuthUser = {
        ...(authState?.user ?? response.data.user),
        ...response.data.user,
        emailVerified: Boolean(response.data.emailVerified ?? response.data.user?.emailVerified ?? true),
        hasStudyProfile: Boolean(response.data.user?.hasStudyProfile ?? false),
      };
      setVerification({ status: "verified", expiresAt: null, lastRequestedAt: new Date().toISOString() });
      setShouldPromptVerification(false);
      if (authState) {
        setAuthState({
          user: effectiveUser,
          tokens: authState.tokens,
        });
        setStatus("authenticated");
      } else {
        setStatus("idle");
      }
    },
    [authState, setAuthState],
  );

  const resendVerification = useCallback(
    async (email?: string) => {
      const payloadEmail = email?.trim() || authState?.user?.email;
      if (!payloadEmail) {
        throw new Error("Email is required to resend verification");
      }
      const response = await api.post<ResendVerificationResponse>("/auth/verify-email/resend", {
        email: payloadEmail,
      });
      const info: VerificationInfo = {
        status: response.data.status ?? "sent",
        expiresAt: response.data.expiresAt ?? null,
        lastRequestedAt: new Date().toISOString(),
      };
      setVerification(info);
      setShouldPromptVerification(true);
      return info;
    },
    [authState?.user?.email],
  );

  const requestPasswordReset = useCallback(
    async (email: string) => {
      const trimmed = email.trim();
      if (!trimmed) {
        throw new Error("Email is required");
      }
      try {
        const response = await api.post<ForgotPasswordResponse>("/auth/password/forgot", { email: trimmed });
        return response.data ?? { status: "unknown" };
      } catch (error) {
        if (isAxiosError(error)) {
          const data = error.response?.data as { message?: string; error?: string } | undefined;
          throw new Error(data?.message ?? data?.error ?? "Unable to send password reset email");
        }
        throw error;
      }
    },
    [],
  );

  const resetPassword = useCallback(
    async ({ token, password }: { token: string; password: string }) => {
      const trimmedToken = token.trim();
      if (!trimmedToken) {
        throw new Error("Reset token is required");
      }
      const response = await api.post<ResetPasswordResponse>("/auth/password/reset", {
        token: trimmedToken,
        password,
      });
      return response.data;
    },
    [],
  );

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const setAuthErrorManually = useCallback((error: string | null) => {
    setAuthError(error);
  }, []);

  const clearNetworkError = useCallback(() => {
    setNetworkError(null);
  }, []);

  // Add method to update user profile
  const updateUserProfile = useCallback((updates: Partial<AuthUser>) => {
    if (!authState) return;
    
    const updatedUser = { ...authState.user, ...updates };
    setAuthState({ ...authState, user: updatedUser });
  }, [authState, setAuthState]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: authState?.user ?? null,
      tokens: authState?.tokens ?? null,
      status,
      isAuthenticated: Boolean(authState?.tokens?.accessToken && authState?.user?.emailVerified),
      shouldPromptVerification,
      verification,
      authError,
      networkError,
      login,
      loginWithGoogle,
      signUp,
      logout,
      verifyEmail,
      resendVerification,
      requestPasswordReset,
      resetPassword,
      setAuthState,
      setPromptVerification: setShouldPromptVerification,
      clearAuthError,
      setAuthError: setAuthErrorManually,
      clearNetworkError,
      updateUserProfile,
    }),
    [
      authState,
      status,
      shouldPromptVerification,
      verification,
      authError,
      networkError,
      login,
      loginWithGoogle,
      signUp,
      logout,
      verifyEmail,
      resendVerification,
      requestPasswordReset,
      resetPassword,
      setAuthState,
      setShouldPromptVerification,
      clearAuthError,
      setAuthErrorManually,
      clearNetworkError,
      updateUserProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
}
