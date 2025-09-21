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
import api, { setRuntimeAccessToken } from "../../lib/api";
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

type AuthContextValue = {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  verification: VerificationInfo | null;
  login: (payload: LoginArgs) => Promise<void>;
  signUp: (payload: SignUpArgs) => Promise<void>;
  logout: (payload?: LogoutArgs) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: (email?: string) => Promise<VerificationInfo>;
  setAuthState: (state: StoredAuthState | null, options?: { remember?: boolean }) => void;
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
  user: AuthUser | null | undefined
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
    initialState ? normalizeVerification(null, initialState.user) : null
  );
  const shouldPersistRef = useRef<boolean>(Boolean(initialState));

  useEffect(() => {
    setRuntimeAccessToken(authState?.tokens.accessToken ?? null);
  }, [authState?.tokens.accessToken]);

  const setAuthState = useCallback(
    (state: StoredAuthState | null, options?: { remember?: boolean }) => {
      if (!state) {
        setRuntimeAccessToken(null);
        setAuthStateInternal(null);
        shouldPersistRef.current = false;
        setVerification(null);
        clearAuthState();
        return;
      }

      const remember = options?.remember ?? shouldPersistRef.current ?? false;
      shouldPersistRef.current = remember;
      setRuntimeAccessToken(state.tokens.accessToken);
      setAuthStateInternal(state);
      setVerification((prev) => {
        if (state.user.emailVerified) {
          return { status: "verified", expiresAt: null };
        }
        return prev ?? { status: "pending", expiresAt: null };
      });
      if (remember) {
        saveAuthState(state);
      } else {
        clearAuthState();
      }
    },
    []
  );

  const hydrateState = useCallback(
    (payload: AuthResponsePayload, remember?: boolean) => {
      const snapshot: StoredAuthState = {
        user: {
          ...payload.user,
          emailVerified: Boolean(payload.user.emailVerified),
        },
        tokens: payload.tokens,
      };
      setAuthState(snapshot, { remember });
      setVerification(normalizeVerification(payload.verification, snapshot.user));
      setStatus("authenticated");
    },
    [setAuthState]
  );

  const handleAuthFailure = useCallback(
    () => setStatus(authState ? "authenticated" : "idle"),
    [authState]
  );

  const login = useCallback(
    async ({ email, password, remember }: LoginArgs) => {
      setStatus("authenticating");
      try {
        const response = await api.post<AuthResponsePayload>("/auth/login", { email, password });
        hydrateState(response.data, remember);
      } catch (error) {
        handleAuthFailure();
        throw error;
      }
    },
    [hydrateState, handleAuthFailure]
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
        hydrateState(response.data, remember);
      } catch (error) {
        handleAuthFailure();
        throw error;
      }
    },
    [hydrateState, handleAuthFailure]
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
        });
      } catch (error) {
        console.warn("Failed to revoke refresh token", error);
      }
    },
    [authState, setAuthState]
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
      };
      setVerification({ status: "verified", expiresAt: null, lastRequestedAt: new Date().toISOString() });
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
    [authState, setAuthState]
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
      return info;
    },
    [authState?.user?.email]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user: authState?.user ?? null,
      tokens: authState?.tokens ?? null,
      status,
      isAuthenticated: Boolean(authState?.tokens?.accessToken),
      verification,
      login,
      signUp,
      logout,
      verifyEmail,
      resendVerification,
      setAuthState,
    }),
    [authState, status, verification, login, signUp, logout, verifyEmail, resendVerification, setAuthState]
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
