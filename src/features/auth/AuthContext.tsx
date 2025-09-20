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

type LogoutArgs = {
  revokeAll?: boolean;
};

type AuthContextValue = {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  login: (payload: LoginArgs) => Promise<void>;
  logout: (payload?: LogoutArgs) => Promise<void>;
  setAuthState: (state: StoredAuthState | null, options?: { remember?: boolean }) => void;
};

type LoginResponse = {
  user: AuthUser;
  tokens: AuthTokens;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const initialState = loadAuthState();
  const [authState, setAuthStateInternal] = useState<StoredAuthState | null>(initialState);
  const [status, setStatus] = useState<AuthStatus>(initialState ? "authenticated" : "idle");
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
        clearAuthState();
        return;
      }

      const remember = options?.remember ?? shouldPersistRef.current ?? false;
      shouldPersistRef.current = remember;
      setRuntimeAccessToken(state.tokens.accessToken);
      setAuthStateInternal(state);
      if (remember) {
        saveAuthState(state);
      } else {
        clearAuthState();
      }
    },
    []
  );

  const login = useCallback(
    async ({ email, password, remember }: LoginArgs) => {
      setStatus("authenticating");
      try {
        const response = await api.post<LoginResponse>("/auth/login", { email, password });
        const snapshot: StoredAuthState = {
          user: response.data.user,
          tokens: response.data.tokens,
        };
        setAuthState(snapshot, { remember });
        setStatus("authenticated");
      } catch (error) {
        setStatus(authState ? "authenticated" : "idle");
        throw error;
      }
    },
    [authState, setAuthState]
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

  const value = useMemo<AuthContextValue>(
    () => ({
      user: authState?.user ?? null,
      tokens: authState?.tokens ?? null,
      status,
      isAuthenticated: Boolean(authState?.tokens?.accessToken),
      login,
      logout,
      setAuthState,
    }),
    [authState, status, login, logout, setAuthState]
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
