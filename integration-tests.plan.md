# Integration Tests Plan - Study Profile Quiz

## Executive Summary

Tạo comprehensive integration tests cho Study Profile Quiz system sử dụng:
- **MSW (Mock Service Worker)** cho realistic HTTP mocking
- **React Query hooks testing** với cache behavior verification
- **Component integration tests** với AuthContext updates
- **Cache behavior testing**: invalidation, optimistic updates, stale-while-revalidate

**Timeline**: 3-4 days
**Test Coverage Target**: >90% cho hooks và components

---

## 1. Test Infrastructure Setup

### 1.1 Dependencies Installation

```bash
npm install --save-dev msw
```

**MSW version**: Sử dụng latest stable version (2.x)

### 1.2 MSW Configuration Files

#### File: `src/test/mocks/handlers.ts`

```typescript
import { http, HttpResponse } from 'msw';
import { Chronotype, FocusStyle, WorkStyle } from '../../lib/types';

// Mock data
const mockProfile = {
  user_id: 'test-user-123',
  chronotype: Chronotype.MorningWarrior,
  focusStyle: FocusStyle.DeepFocus,
  workStyle: WorkStyle.DeadlineDriven,
  updated_at: '2025-01-15T10:30:00Z'
};

export const handlers = [
  // GET /api/study-profile - Success
  http.get('/api/study-profile', () => {
    return HttpResponse.json(mockProfile);
  }),

  // POST /api/study-profile - Success
  http.post('/api/study-profile', async ({ request }) => {
    const body = await request.json();
    
    // Validate workStyle constraint
    if (body.workStyle === 2) {
      return HttpResponse.json(
        { error: 'Validation failed', details: { workStyle: 'Must be 0 or 1' } },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      user_id: 'test-user-123',
      ...body,
      updated_at: new Date().toISOString()
    });
  }),
];

// Error handlers for specific test scenarios
export const errorHandlers = {
  networkError: http.get('/api/study-profile', () => {
    return HttpResponse.error();
  }),
  
  serverError: http.get('/api/study-profile', () => {
    return HttpResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }),
  
  notFound: http.get('/api/study-profile', () => {
    return HttpResponse.json(
      { error: 'Profile not found' },
      { status: 404 }
    );
  }),
  
  validationError: http.post('/api/study-profile', () => {
    return HttpResponse.json(
      { error: 'Validation failed', details: { workStyle: 'Must be 0 or 1' } },
      { status: 400 }
    );
  })
};
```

#### File: `src/test/mocks/server.ts`

```typescript
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Setup server for Node environment (Jest)
export const server = setupServer(...handlers);

// Reset handlers after each test
export function resetHandlers() {
  server.resetHandlers();
}
```

#### Update: `src/test/setup.ts`

```typescript
import '@testing-library/jest-dom';
import { server } from './mocks/server';

// Remove old API mock, replace with MSW
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
```

### 1.3 Test Utilities

#### File: `src/test/utils/test-utils.tsx`

```typescript
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
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
    refreshToken: 'mock-refresh-token'
  };
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialAuthState?: {
    user: AuthUser | null;
    tokens: AuthTokens | null;
  };
  queryClient?: QueryClient;
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
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryClientProvider>
      </BrowserRouter>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient
  };
}

// Wait for React Query to settle
export async function waitForQueryToSettle(queryClient: QueryClient) {
  await queryClient.cancelQueries();
}
```

---

## 2. Integration Test Suites

### Suite 1: React Query Hook Integration

#### File: `src/features/study-profile/hooks/__tests__/useStudyProfileData.integration.test.tsx`

**Test scenarios:**

**A. Profile Fetching**
```typescript
describe('useStudyProfileData - Profile Fetching', () => {
  it('should fetch profile successfully when hasStudyProfile=true', async () => {
    // Setup: User with profile
    const { result } = renderHook(() => useStudyProfileData(), {
      wrapper: createWrapper({ hasStudyProfile: true })
    });

    // Verify: Loading state
    expect(result.current.isLoading).toBe(true);

    // Wait: For query to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert: Profile loaded
    expect(result.current.profile).toEqual(mockProfile);
    expect(result.current.error).toBeNull();
  });

  it('should skip fetch when hasStudyProfile=false', () => {
    // Setup: User without profile
    const { result } = renderHook(() => useStudyProfileData(), {
      wrapper: createWrapper({ hasStudyProfile: false })
    });

    // Assert: Query disabled
    expect(result.current.isLoading).toBe(false);
    expect(result.current.profile).toBeUndefined();
  });

  it('should handle 404 and return null', async () => {
    // Setup: Mock 404 response
    server.use(errorHandlers.notFound);

    const { result } = renderHook(() => useStudyProfileData(), {
      wrapper: createWrapper({ hasStudyProfile: true })
    });

    await waitFor(() => {
      expect(result.current.profile).toBeNull();
    });
  });

  it('should handle server errors', async () => {
    // Setup: Mock 500 response
    server.use(errorHandlers.serverError);

    const { result } = renderHook(() => useStudyProfileData(), {
      wrapper: createWrapper({ hasStudyProfile: true })
    });

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });
  });
});
```

**B. Profile Saving**
```typescript
describe('useStudyProfileData - Profile Saving', () => {
  it('should save profile and update cache', async () => {
    const { result, queryClient } = renderHook(() => useStudyProfileData(), {
      wrapper: createWrapper()
    });

    const profileData = {
      chronotype: Chronotype.MorningWarrior,
      focusStyle: FocusStyle.DeepFocus,
      workStyle: WorkStyle.DeadlineDriven
    };

    // Act: Save profile
    act(() => {
      result.current.saveProfile(profileData);
    });

    // Assert: Saving state
    expect(result.current.isSaving).toBe(true);

    // Wait: For mutation to complete
    await waitFor(() => {
      expect(result.current.isSaving).toBe(false);
    });

    // Verify: Cache updated
    const cachedProfile = queryClient.getQueryData(['study-profile']);
    expect(cachedProfile).toMatchObject(profileData);
  });

  it('should update AuthContext hasStudyProfile on success', async () => {
    const mockSetAuthState = jest.fn();
    const { result } = renderHook(() => useStudyProfileData(), {
      wrapper: createWrapper({ mockSetAuthState })
    });

    const profileData = {
      chronotype: Chronotype.MorningWarrior,
      focusStyle: FocusStyle.DeepFocus,
      workStyle: WorkStyle.DeadlineDriven
    };

    // Act: Save profile
    await act(async () => {
      result.current.saveProfile(profileData);
    });

    // Wait for mutation
    await waitFor(() => {
      expect(mockSetAuthState).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({ hasStudyProfile: true })
        })
      );
    });
  });

  it('should handle validation errors', async () => {
    server.use(errorHandlers.validationError);

    const { result } = renderHook(() => useStudyProfileData(), {
      wrapper: createWrapper()
    });

    const invalidData = {
      chronotype: Chronotype.MorningWarrior,
      focusStyle: FocusStyle.DeepFocus,
      workStyle: 2 as any // Invalid
    };

    // Act: Try to save invalid data
    await act(async () => {
      result.current.saveProfile(invalidData);
    });

    // Assert: Error captured
    await waitFor(() => {
      expect(result.current.saveError).toBeDefined();
      expect(result.current.saveError.response?.status).toBe(400);
    });
  });
});
```

**C. React Query Cache Behavior**
```typescript
describe('useStudyProfileData - Cache Behavior', () => {
  it('should invalidate cache after successful save', async () => {
    const { result, queryClient } = renderHook(() => useStudyProfileData(), {
      wrapper: createWrapper()
    });

    // Setup: Set stale cache data
    queryClient.setQueryData(['study-profile'], { old: 'data' });

    const newProfileData = {
      chronotype: Chronotype.NightOwl,
      focusStyle: FocusStyle.SprintWorker,
      workStyle: WorkStyle.SteadyPacer
    };

    // Act: Save new profile
    await act(async () => {
      result.current.saveProfile(newProfileData);
    });

    // Wait: For mutation to complete
    await waitFor(() => {
      expect(result.current.isSaving).toBe(false);
    });

    // Verify: Cache updated with new data
    const cachedProfile = queryClient.getQueryData(['study-profile']);
    expect(cachedProfile).toMatchObject(newProfileData);
  });

  it('should preserve cache on error', async () => {
    server.use(errorHandlers.serverError);

    const { result, queryClient } = renderHook(() => useStudyProfileData(), {
      wrapper: createWrapper()
    });

    // Setup: Set existing cache
    const existingProfile = { ...mockProfile };
    queryClient.setQueryData(['study-profile'], existingProfile);

    // Act: Try to save (will fail)
    await act(async () => {
      result.current.saveProfile({
        chronotype: Chronotype.NightOwl,
        focusStyle: FocusStyle.SprintWorker,
        workStyle: WorkStyle.SteadyPacer
      });
    });

    // Wait: For error
    await waitFor(() => {
      expect(result.current.saveError).toBeDefined();
    });

    // Verify: Old cache preserved
    const cachedProfile = queryClient.getQueryData(['study-profile']);
    expect(cachedProfile).toEqual(existingProfile);
  });

  it('should revalidate stale data on window focus', async () => {
    const { result, queryClient } = renderHook(() => useStudyProfileData(), {
      wrapper: createWrapper({ hasStudyProfile: true })
    });

    // Wait: Initial fetch
    await waitFor(() => {
      expect(result.current.profile).toBeDefined();
    });

    // Setup: Mark query as stale
    queryClient.invalidateQueries({ queryKey: ['study-profile'] });

    // Act: Simulate window focus
    window.dispatchEvent(new Event('focus'));

    // Verify: Query refetches (MSW handler called again)
    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });
});
```

### Suite 2: Component Integration with Quiz

#### File: `src/features/study-profile/__tests__/StudyProfileQuiz.integration.test.tsx`

**Test scenarios:**

```typescript
describe('StudyProfileQuiz - Complete Flow', () => {
  it('should complete quiz and update AuthContext', async () => {
    const mockNavigate = jest.fn();
    const mockSetAuthState = jest.fn();
    
    const { getByText, getByRole } = renderWithProviders(
      <StudyProfileQuiz onNavigate={mockNavigate} />,
      {
        initialAuthState: {
          user: createMockUser({ hasStudyProfile: false }),
          tokens: createMockTokens()
        }
      }
    );

    // Step 1: Welcome screen
    expect(getByText(/Khám phá phong cách học tập/i)).toBeInTheDocument();
    
    // Start quiz
    fireEvent.click(getByText(/Bắt đầu/i));

    // Step 2: Answer all questions
    for (let i = 0; i < 7; i++) {
      // Select first option
      const options = screen.getAllByRole('button');
      fireEvent.click(options[0]);
      
      // Navigate to next (or submit on last question)
      if (i < 6) {
        fireEvent.click(getByText(/Tiếp theo/i));
      } else {
        fireEvent.click(getByText(/Hoàn thành/i));
      }
    }

    // Wait: For API call to complete
    await waitFor(() => {
      expect(mockSetAuthState).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({ hasStudyProfile: true })
        })
      );
    });

    // Verify: Success screen
    await waitFor(() => {
      expect(getByText(/Hoàn thành/i)).toBeInTheDocument();
    });

    // Verify: Navigation to return URL
    fireEvent.click(getByText(/Bắt đầu sử dụng/i));
    expect(mockNavigate).toHaveBeenCalledWith('/today');
  });

  it('should pre-fill answers when editing existing profile', async () => {
    const existingProfile = {
      user_id: 'test-user-123',
      chronotype: Chronotype.MorningWarrior,
      focusStyle: FocusStyle.DeepFocus,
      workStyle: WorkStyle.DeadlineDriven,
      updated_at: '2025-01-15T10:30:00Z'
    };

    const { getAllByRole } = renderWithProviders(
      <StudyProfileQuiz 
        onNavigate={jest.fn()} 
        existingProfile={existingProfile}
      />
    );

    // Verify: First question has pre-selected answer
    await waitFor(() => {
      const selectedOptions = getAllByRole('button').filter(
        btn => btn.classList.contains('selected')
      );
      expect(selectedOptions.length).toBeGreaterThan(0);
    });
  });

  it('should handle network error with retry', async () => {
    server.use(errorHandlers.networkError);

    const { getByText, queryByText } = renderWithProviders(
      <StudyProfileQuiz onNavigate={jest.fn()} />
    );

    // Complete quiz
    // ... (answer all questions)

    // Submit
    fireEvent.click(getByText(/Hoàn thành/i));

    // Wait: For error message
    await waitFor(() => {
      expect(queryByText(/lỗi xảy ra/i)).toBeInTheDocument();
    });

    // Retry: Reset handler to success
    server.resetHandlers();

    fireEvent.click(getByText(/Thử lại/i));

    // Verify: Success after retry
    await waitFor(() => {
      expect(queryByText(/Hoàn thành/i)).toBeInTheDocument();
    });
  });
});
```

### Suite 3: Settings Integration

#### File: `src/features/settings/__tests__/SettingsPage.integration.test.tsx`

```typescript
describe('SettingsPage - Profile Integration', () => {
  it('should display profile from cache immediately', async () => {
    const { getByText, queryClient } = renderWithProviders(
      <SettingsPage onNavigate={jest.fn()} />,
      {
        initialAuthState: {
          user: createMockUser({ hasStudyProfile: true }),
          tokens: createMockTokens()
        }
      }
    );

    // Pre-populate cache
    queryClient.setQueryData(['study-profile'], mockProfile);

    // Verify: Profile displays immediately (no loading)
    expect(getByText(/Morning Warrior/i)).toBeInTheDocument();
    expect(getByText(/Deep Focus/i)).toBeInTheDocument();
  });

  it('should navigate to quiz for editing with return URL', async () => {
    const mockNavigate = jest.fn();

    const { getByText } = renderWithProviders(
      <SettingsPage onNavigate={mockNavigate} />
    );

    // Click edit button
    fireEvent.click(getByText(/Chỉnh sửa/i));

    // Verify: Navigate with return URL
    expect(mockNavigate).toHaveBeenCalledWith(
      '/study-profile/quiz?return=/settings'
    );
  });
});
```

### Suite 4: Enforcement Integration

#### File: `src/features/ai-suggestions/__tests__/AISuggestionsPage.integration.test.tsx`

```typescript
describe('AISuggestionsPage - Enforcement', () => {
  it('should show warning banner when hasStudyProfile=false', () => {
    const { getByText } = renderWithProviders(
      <AISuggestionsPage />,
      {
        initialAuthState: {
          user: createMockUser({ hasStudyProfile: false }),
          tokens: createMockTokens()
        }
      }
    );

    // Verify: Warning banner visible
    expect(getByText(/hoàn thành bài quiz/i)).toBeInTheDocument();
  });

  it('should hide banner when hasStudyProfile=true', () => {
    const { queryByText } = renderWithProviders(
      <AISuggestionsPage />,
      {
        initialAuthState: {
          user: createMockUser({ hasStudyProfile: true }),
          tokens: createMockTokens()
        }
      }
    );

    // Verify: No warning banner
    expect(queryByText(/hoàn thành bài quiz/i)).not.toBeInTheDocument();
  });

  it('should navigate to quiz with return URL when clicking banner', () => {
    const mockNavigate = jest.fn();

    const { getByText } = renderWithProviders(
      <AISuggestionsPage onNavigate={mockNavigate} />,
      {
        initialAuthState: {
          user: createMockUser({ hasStudyProfile: false }),
          tokens: createMockTokens()
        }
      }
    );

    // Click "Complete Quiz" button
    fireEvent.click(getByText(/Hoàn thành ngay/i));

    // Verify: Navigate with current path as return
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringContaining('/study-profile/quiz?return=')
    );
  });
});
```

---

## 3. Configuration Updates

### 3.1 Jest Config

**Update `jest.config.cjs`:**

```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.integration.{test,spec}.{js,jsx,ts,tsx}' // ADD THIS
  ],
  collectCoverageFrom: [
    'src/features/study-profile/**/*.{js,jsx,ts,tsx}',
    'src/lib/api-study-profile.ts',
    '!src/**/*.d.ts',
    '!src/test/**/*'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
};
```

### 3.2 Package.json Scripts

**Add to `package.json`:**

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern='test\\.(ts|tsx)$'",
    "test:integration": "jest --testPathPattern='integration\\.test\\.(ts|tsx)$'",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:all": "jest --coverage --verbose"
  }
}
```

---

## 4. Files to Create/Modify

### New Files (7)
- `src/test/mocks/handlers.ts` - MSW request handlers
- `src/test/mocks/server.ts` - MSW server setup
- `src/test/utils/test-utils.tsx` - Custom render utilities
- `src/features/study-profile/hooks/__tests__/useStudyProfileData.integration.test.tsx`
- `src/features/study-profile/__tests__/StudyProfileQuiz.integration.test.tsx`
- `src/features/settings/__tests__/SettingsPage.integration.test.tsx`
- `src/features/ai-suggestions/__tests__/AISuggestionsPage.integration.test.tsx`

### Modified Files (3)
- `src/test/setup.ts` - Replace API mock with MSW
- `jest.config.cjs` - Add integration test pattern
- `package.json` - Add test scripts

---

## 5. Success Criteria

### Test Coverage
- [ ] Hook integration: 100% coverage
- [ ] Component integration: >90% coverage
- [ ] Cache behavior: 100% verified
- [ ] AuthContext sync: 100% verified
- [ ] Error scenarios: >95% covered

### Test Quality
- [ ] All integration tests pass
- [ ] No flaky tests (run 10 times successfully)
- [ ] Tests run in <30 seconds total
- [ ] MSW properly intercepts all HTTP calls
- [ ] React Query cache behavior verified
- [ ] AuthContext updates confirmed

### Documentation
- [ ] Test utilities well-documented
- [ ] Mock handlers clearly organized
- [ ] Test scenarios cover all user flows

---

## 6. Implementation Checklist

### Phase 1: Infrastructure (Day 1)
- [ ] Install MSW dependency
- [ ] Create MSW handlers and server setup
- [ ] Update test/setup.ts with MSW
- [ ] Create test-utils.tsx with custom render
- [ ] Verify basic MSW integration works

### Phase 2: Hook Tests (Day 2)
- [ ] Write useStudyProfileData fetching tests
- [ ] Write useStudyProfileData saving tests
- [ ] Write cache behavior tests
- [ ] Verify AuthContext updates

### Phase 3: Component Tests (Day 3)
- [ ] Write StudyProfileQuiz integration tests
- [ ] Write SettingsPage integration tests
- [ ] Write AISuggestionsPage enforcement tests
- [ ] Test error handling flows

### Phase 4: Polish & Verify (Day 4)
- [ ] Run all tests multiple times
- [ ] Fix any flaky tests
- [ ] Add missing test scenarios
- [ ] Update package.json scripts
- [ ] Create test execution report

---

## Estimated Timeline

- **Day 1**: MSW setup và test utilities (4-5 hours)
- **Day 2**: Hook integration tests (5-6 hours)
- **Day 3**: Component integration tests (5-6 hours)
- **Day 4**: Polish, verification, documentation (3-4 hours)

**Total**: 3-4 days

---

## Notes

1. **MSW vs Jest Mocks**: MSW provides more realistic HTTP mocking và better separation of concerns
2. **Cache Testing**: React Query cache behavior critical for UX, must be thoroughly tested
3. **Auth Updates**: hasStudyProfile sync is critical path, needs comprehensive testing
4. **Error Scenarios**: Network failures, validation errors phải được test kỹ
5. **Deterministic Tests**: Tránh setTimeout, dùng waitFor cho async operations
