export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
};

export type AuthTokens = {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  refreshTokenId: string;
};

export type StoredAuthState = {
  user: AuthUser;
  tokens: AuthTokens;
};

const STORAGE_KEY = "taskie.auth.v1";

const isBrowser = typeof window !== "undefined";

export function loadAuthState(): StoredAuthState | null {
  if (!isBrowser) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredAuthState> | null;
    if (!parsed || !parsed.user || !parsed.tokens) return null;
    if (!parsed.tokens.accessToken || !parsed.tokens.refreshToken) return null;
    return parsed as StoredAuthState;
  } catch (error) {
    console.warn("Failed to parse stored auth state", error);
    return null;
  }
}

export function saveAuthState(state: StoredAuthState) {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Unable to persist auth state", error);
  }
}

export function clearAuthState() {
  if (!isBrowser) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("Unable to clear auth state", error);
  }
}
