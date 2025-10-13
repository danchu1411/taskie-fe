import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { renderHook, RenderHookOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../features/auth/AuthContext';
import { AuthUser, AuthTokens } from '../../features/auth/auth-storage';

// Mock auth state helpers
export function createMockUser(overrides?: Partial<AuthUser>): AuthUser {
  return {
    id: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User',
    emailVerified: true,
    hasStudyProfile: false,
    ...overrides
  };
}

export function createMockTokens(): AuthTokens {
  return {
    accessToken: 'mock-access-token',
    accessTokenExpiresIn: 3600,
    refreshToken: 'mock-refresh-token',
    refreshTokenExpiresAt: '2025-01-16T10:30:00Z',
    refreshTokenId: 'mock-refresh-token-id'
  };
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialAuthState?: {
    user: AuthUser | null;
    tokens: AuthTokens | null;
  };
  queryClient?: QueryClient;
  initialEntries?: string[];
}

// Custom render with all providers
export function renderWithProviders(
  ui: ReactElement,
  {
    initialAuthState,
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    }),
    initialEntries = ['/'],
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MemoryRouter initialEntries={initialEntries}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryClientProvider>
      </MemoryRouter>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient
  };
}

// Hook testing wrapper with providers
interface HookRenderOptions<TProps> extends Omit<RenderHookOptions<TProps>, 'wrapper'> {
  initialAuthState?: {
    user: AuthUser | null;
    tokens: AuthTokens | null;
  };
  queryClient?: QueryClient;
}

export function renderHookWithProviders<TProps, TResult>(
  hook: (props: TProps) => TResult,
  {
    initialAuthState,
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    }),
    ...options
  }: HookRenderOptions<TProps> = {}
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryClientProvider>
      </MemoryRouter>
    );
  }

  return {
    ...renderHook(hook, { wrapper: Wrapper, ...options }),
    queryClient
  };
}

// Wait for React Query to settle
export async function waitForQueryToSettle(queryClient: QueryClient) {
  await queryClient.cancelQueries();
}

// Helper to create fresh QueryClient for each test
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
}
