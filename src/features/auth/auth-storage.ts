export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  emailVerified?: boolean;
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

function normalizeUser(raw: Partial<AuthUser> | null | undefined): AuthUser | null {
  if (!raw) return null;
  const { id, email } = raw;
  if (!id || !email) return null;
  return {
    id: String(id),
    email: String(email).toLowerCase(),
    name: typeof raw.name === "string" ? raw.name : raw.name ?? null,
    emailVerified: Boolean((raw as Record<string, unknown>).emailVerified ?? (raw as Record<string, unknown>).email_verified ?? false),
  };
}

function normalizeTokens(raw: Partial<AuthTokens> | null | undefined): AuthTokens | null {
  if (!raw) return null;
  const { accessToken, refreshToken } = raw;
  if (!accessToken || !refreshToken) return null;
  return {
    accessToken: String(accessToken),
    accessTokenExpiresIn: Number(raw.accessTokenExpiresIn ?? 0),
    refreshToken: String(refreshToken),
    refreshTokenExpiresAt: String(raw.refreshTokenExpiresAt ?? ""),
    refreshTokenId: String(raw.refreshTokenId ?? ""),
  };
}

function normalizeState(raw: Partial<StoredAuthState> | null | undefined): StoredAuthState | null {
  if (!raw) return null;
  const user = normalizeUser(raw.user as Partial<AuthUser>);
  const tokens = normalizeTokens(raw.tokens as Partial<AuthTokens>);
  if (!user || !tokens) return null;
  return { user, tokens };
}

export function loadAuthState(): StoredAuthState | null {
  if (!isBrowser) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredAuthState> | null;
    return normalizeState(parsed);
  } catch (error) {
    console.warn("Failed to parse stored auth state", error);
    return null;
  }
}

export function saveAuthState(state: StoredAuthState) {
  if (!isBrowser) return;
  try {
    const normalized = normalizeState(state);
    if (!normalized) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
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
