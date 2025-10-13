# Backend Integration & Testing Plan

## Executive Summary

Kế hoạch chi tiết cho việc tích hợp Study Profile Quiz với backend API và thực hiện testing toàn diện. Bao gồm API testing, integration testing, và validation của toàn bộ flow từ frontend đến backend.

---

## 1. Backend Integration Checklist

### 1.1 API Endpoints Verification

#### Required Endpoints
- [ ] **GET** `/api/study-profile`
  - **Purpose**: Retrieve user's study profile
  - **Auth**: Bearer token required
  - **Response**: `StudyProfile` object hoặc 404
  - **Test Cases**: Valid profile, no profile, invalid token

- [ ] **POST** `/api/study-profile`
  - **Purpose**: Create/update study profile (upsert)
  - **Auth**: Bearer token required
  - **Body**: `{ chronotype: 0-2, focusStyle: 0-2, workStyle: 0-1 }`
  - **Response**: Updated `StudyProfile` object
  - **Test Cases**: Valid data, invalid workStyle, missing fields

#### Auth Endpoints Integration
- [ ] **POST** `/auth/login`
  - **Response**: Include `hasStudyProfile: boolean` trong user object
  - **Test Cases**: User with/without profile

- [ ] **POST** `/auth/signup`
  - **Response**: Include `hasStudyProfile: false` trong user object
  - **Test Cases**: New user creation

- [ ] **POST** `/auth/refresh`
  - **Response**: Include `hasStudyProfile: boolean` trong user object
  - **Test Cases**: Token refresh với profile status

### 1.2 Data Format Validation

#### Request Format
```typescript
// POST /api/study-profile
{
  chronotype: 0,    // 0=MorningWarrior, 1=NightOwl, 2=Flexible
  focusStyle: 1,    // 0=DeepFocus, 1=SprintWorker, 2=Multitasker
  workStyle: 0      // 0=DeadlineDriven, 1=SteadyPacer (NO 2)
}
```

#### Response Format
```typescript
// GET/POST /api/study-profile
{
  user_id: "uuid-string",
  chronotype: 0,
  focusStyle: 1,
  workStyle: 0,
  updated_at: "2025-01-15T10:30:00Z"
}
```

#### Error Format
```typescript
// 400 Bad Request
{
  error: "Validation failed",
  details: {
    workStyle: "Must be 0 or 1"
  }
}

// 403 Forbidden (Future)
{
  error: "Study profile required",
  code: "STUDY_PROFILE_REQUIRED"
}
```

---

## 2. Integration Testing Strategy

### 2.1 API Integration Tests

#### Test Suite 1: Study Profile CRUD
```typescript
describe('Study Profile API Integration', () => {
  beforeEach(() => {
    // Setup authenticated user
    setupAuthenticatedUser();
  });

  describe('GET /api/study-profile', () => {
    it('should return profile for user with existing profile', async () => {
      // Arrange: Create profile via POST
      await createTestProfile();
      
      // Act: GET profile
      const response = await getStudyProfile();
      
      // Assert: Profile returned
      expect(response).toMatchObject({
        chronotype: expect.any(Number),
        focusStyle: expect.any(Number),
        workStyle: expect.any(Number),
        updated_at: expect.any(String)
      });
    });

    it('should return 404 for user without profile', async () => {
      // Act & Assert: 404 for new user
      await expect(getStudyProfile()).rejects.toThrow('404');
    });
  });

  describe('POST /api/study-profile', () => {
    it('should create new profile with valid data', async () => {
      // Arrange: Valid profile data
      const profileData = {
        chronotype: Chronotype.MorningWarrior,
        focusStyle: FocusStyle.DeepFocus,
        workStyle: WorkStyle.DeadlineDriven
      };

      // Act: Create profile
      const response = await saveStudyProfile(profileData);

      // Assert: Profile created
      expect(response).toMatchObject(profileData);
      expect(response.user_id).toBeDefined();
      expect(response.updated_at).toBeDefined();
    });

    it('should update existing profile', async () => {
      // Arrange: Existing profile
      await createTestProfile();
      
      // Act: Update profile
      const newData = {
        chronotype: Chronotype.NightOwl,
        focusStyle: FocusStyle.SprintWorker,
        workStyle: WorkStyle.SteadyPacer
      };
      const response = await saveStudyProfile(newData);

      // Assert: Profile updated
      expect(response).toMatchObject(newData);
    });

    it('should reject invalid workStyle', async () => {
      // Arrange: Invalid workStyle
      const invalidData = {
        chronotype: 0,
        focusStyle: 1,
        workStyle: 2  // Invalid!
      };

      // Act & Assert: 400 error
      await expect(saveStudyProfile(invalidData))
        .rejects.toThrow('400');
    });
  });
});
```

#### Test Suite 2: Auth Integration
```typescript
describe('Auth Integration with Study Profile', () => {
  describe('Login Response', () => {
    it('should include hasStudyProfile flag', async () => {
      // Act: Login
      const response = await login(testUser);
      
      // Assert: hasStudyProfile included
      expect(response.user).toHaveProperty('hasStudyProfile');
      expect(typeof response.user.hasStudyProfile).toBe('boolean');
    });

    it('should set hasStudyProfile=true for user with profile', async () => {
      // Arrange: User with profile
      await createTestProfile();
      
      // Act: Login
      const response = await login(testUser);
      
      // Assert: hasStudyProfile=true
      expect(response.user.hasStudyProfile).toBe(true);
    });

    it('should set hasStudyProfile=false for user without profile', async () => {
      // Act: Login new user
      const response = await login(newUser);
      
      // Assert: hasStudyProfile=false
      expect(response.user.hasStudyProfile).toBe(false);
    });
  });

  describe('Token Refresh', () => {
    it('should maintain hasStudyProfile flag on refresh', async () => {
      // Arrange: User with profile
      await createTestProfile();
      const loginResponse = await login(testUser);
      
      // Act: Refresh token
      const refreshResponse = await refreshToken(loginResponse.tokens.refreshToken);
      
      // Assert: hasStudyProfile maintained
      expect(refreshResponse.user.hasStudyProfile).toBe(true);
    });
  });
});
```

### 2.2 End-to-End Flow Testing

#### Test Suite 3: Complete User Journey
```typescript
describe('Complete Study Profile Flow', () => {
  it('should complete full quiz flow for new user', async () => {
    // Arrange: New user
    const user = await createTestUser();
    await login(user);

    // Act 1: Should redirect to quiz
    const quizPage = await navigateTo('/study-profile/quiz');
    expect(quizPage).toBeVisible();

    // Act 2: Complete quiz
    await completeQuiz({
      chrono_1: Chronotype.MorningWarrior,
      chrono_2: Chronotype.MorningWarrior,
      focus_1: FocusStyle.DeepFocus,
      focus_2: FocusStyle.DeepFocus,
      focus_3: FocusStyle.DeepFocus,
      work_1: WorkStyle.DeadlineDriven,
      work_2: WorkStyle.DeadlineDriven
    });

    // Assert: Profile created and user redirected
    const profile = await getStudyProfile();
    expect(profile).toMatchObject({
      chronotype: Chronotype.MorningWarrior,
      focusStyle: FocusStyle.DeepFocus,
      workStyle: WorkStyle.DeadlineDriven
    });

    // Assert: hasStudyProfile updated
    const authState = await getAuthState();
    expect(authState.user.hasStudyProfile).toBe(true);
  });

  it('should allow editing existing profile', async () => {
    // Arrange: User with existing profile
    await createTestProfile();
    await login(testUser);

    // Act: Navigate to settings and edit
    await navigateTo('/settings');
    await clickEditProfile();
    
    // Assert: Pre-filled form
    const quizForm = await getQuizForm();
    expect(quizForm.chrono_1).toBe(Chronotype.MorningWarrior);
    
    // Act: Update profile
    await updateQuizAnswer('chrono_1', Chronotype.NightOwl);
    await submitQuiz();

    // Assert: Profile updated
    const updatedProfile = await getStudyProfile();
    expect(updatedProfile.chronotype).toBe(Chronotype.NightOwl);
  });
});
```

---

## 3. Frontend-Backend Integration Testing

### 3.1 API Client Testing

#### Test Suite 4: API Client Functions
```typescript
describe('Study Profile API Client', () => {
  let mockApi: jest.Mocked<typeof api>;

  beforeEach(() => {
    mockApi = api as jest.Mocked<typeof api>;
  });

  describe('getStudyProfile', () => {
    it('should return profile data on success', async () => {
      // Arrange: Mock successful response
      const mockProfile = {
        user_id: 'test-user',
        chronotype: 0,
        focusStyle: 1,
        workStyle: 0,
        updated_at: '2025-01-15T10:30:00Z'
      };
      mockApi.get.mockResolvedValue({ data: mockProfile });

      // Act: Get profile
      const result = await getStudyProfile();

      // Assert: Profile returned
      expect(result).toEqual(mockProfile);
      expect(mockApi.get).toHaveBeenCalledWith('/api/study-profile');
    });

    it('should return null on 404', async () => {
      // Arrange: Mock 404 response
      const error = { response: { status: 404 } };
      mockApi.get.mockRejectedValue(error);

      // Act: Get profile
      const result = await getStudyProfile();

      // Assert: Null returned
      expect(result).toBeNull();
    });

    it('should throw error on other failures', async () => {
      // Arrange: Mock 500 response
      const error = { response: { status: 500 } };
      mockApi.get.mockRejectedValue(error);

      // Act & Assert: Error thrown
      await expect(getStudyProfile()).rejects.toThrow();
    });
  });

  describe('saveStudyProfile', () => {
    it('should save profile data', async () => {
      // Arrange: Mock successful response
      const profileData = {
        chronotype: Chronotype.MorningWarrior,
        focusStyle: FocusStyle.DeepFocus,
        workStyle: WorkStyle.DeadlineDriven
      };
      const mockResponse = { ...profileData, user_id: 'test', updated_at: '2025-01-15T10:30:00Z' };
      mockApi.post.mockResolvedValue({ data: mockResponse });

      // Act: Save profile
      const result = await saveStudyProfile(profileData);

      // Assert: Profile saved
      expect(result).toEqual(mockResponse);
      expect(mockApi.post).toHaveBeenCalledWith('/api/study-profile', profileData);
    });
  });
});
```

### 3.2 React Query Integration Testing

#### Test Suite 5: React Query Hooks
```typescript
describe('useStudyProfileData Hook', () => {
  let queryClient: QueryClient;
  let wrapper: ReactWrapper;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    
    wrapper = render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StudyProfileDataTestComponent />
        </AuthProvider>
      </QueryClientProvider>
    );
  });

  it('should fetch profile data', async () => {
    // Arrange: Mock API response
    const mockProfile = createMockProfile();
    jest.spyOn(api, 'get').mockResolvedValue({ data: mockProfile });

    // Act: Component mounts
    await waitFor(() => {
      expect(screen.getByText('Profile loaded')).toBeInTheDocument();
    });

    // Assert: Profile data displayed
    expect(screen.getByText('Morning Warrior')).toBeInTheDocument();
  });

  it('should update profile on mutation', async () => {
    // Arrange: Mock API responses
    const initialProfile = createMockProfile();
    const updatedProfile = { ...initialProfile, chronotype: Chronotype.NightOwl };
    
    jest.spyOn(api, 'get').mockResolvedValue({ data: initialProfile });
    jest.spyOn(api, 'post').mockResolvedValue({ data: updatedProfile });

    // Act: Update profile
    await waitFor(() => {
      expect(screen.getByText('Profile loaded')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Update Profile'));

    // Assert: Profile updated
    await waitFor(() => {
      expect(screen.getByText('Night Owl')).toBeInTheDocument();
    });
  });
});
```

---

## 4. Error Handling Testing

### 4.1 Network Error Scenarios

#### Test Suite 6: Error Handling
```typescript
describe('Error Handling', () => {
  describe('Network Errors', () => {
    it('should handle network timeout', async () => {
      // Arrange: Mock timeout
      jest.spyOn(api, 'post').mockRejectedValue(new Error('timeout'));

      // Act: Try to save profile
      const { result } = renderHook(() => useStudyProfileData());
      
      await act(async () => {
        await result.current.saveProfile({
          chronotype: Chronotype.MorningWarrior,
          focusStyle: FocusStyle.DeepFocus,
          workStyle: WorkStyle.DeadlineDriven
        });
      });

      // Assert: Error state
      expect(result.current.saveError).toBeDefined();
    });

    it('should handle server errors', async () => {
      // Arrange: Mock 500 error
      jest.spyOn(api, 'post').mockRejectedValue({
        response: { status: 500, data: { error: 'Internal server error' } }
      });

      // Act: Try to save profile
      const { result } = renderHook(() => useStudyProfileData());
      
      await act(async () => {
        await result.current.saveProfile({
          chronotype: Chronotype.MorningWarrior,
          focusStyle: FocusStyle.DeepFocus,
          workStyle: WorkStyle.DeadlineDriven
        });
      });

      // Assert: Error handled
      expect(result.current.saveError).toBeDefined();
    });
  });

  describe('Validation Errors', () => {
    it('should handle invalid workStyle', async () => {
      // Arrange: Mock 400 error
      jest.spyOn(api, 'post').mockRejectedValue({
        response: { 
          status: 400, 
          data: { error: 'Validation failed', details: { workStyle: 'Must be 0 or 1' } }
        }
      });

      // Act: Try to save invalid profile
      const { result } = renderHook(() => useStudyProfileData());
      
      await act(async () => {
        await result.current.saveProfile({
          chronotype: Chronotype.MorningWarrior,
          focusStyle: FocusStyle.DeepFocus,
          workStyle: 2  // Invalid
        });
      });

      // Assert: Validation error handled
      expect(result.current.saveError).toBeDefined();
    });
  });
});
```

---

## 5. Performance Testing

### 5.1 API Performance

#### Test Suite 7: Performance Tests
```typescript
describe('Performance Tests', () => {
  describe('API Response Times', () => {
    it('should load profile within acceptable time', async () => {
      // Arrange: Mock fast response
      jest.spyOn(api, 'get').mockResolvedValue({ 
        data: createMockProfile() 
      });

      const startTime = performance.now();
      
      // Act: Load profile
      const profile = await getStudyProfile();
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // Assert: Load time acceptable
      expect(loadTime).toBeLessThan(1000); // 1 second
      expect(profile).toBeDefined();
    });

    it('should save profile within acceptable time', async () => {
      // Arrange: Mock fast response
      jest.spyOn(api, 'post').mockResolvedValue({ 
        data: createMockProfile() 
      });

      const profileData = {
        chronotype: Chronotype.MorningWarrior,
        focusStyle: FocusStyle.DeepFocus,
        workStyle: WorkStyle.DeadlineDriven
      };

      const startTime = performance.now();
      
      // Act: Save profile
      const result = await saveStudyProfile(profileData);
      
      const endTime = performance.now();
      const saveTime = endTime - startTime;

      // Assert: Save time acceptable
      expect(saveTime).toBeLessThan(2000); // 2 seconds
      expect(result).toBeDefined();
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle multiple simultaneous requests', async () => {
      // Arrange: Mock responses
      jest.spyOn(api, 'get').mockResolvedValue({ 
        data: createMockProfile() 
      });

      // Act: Make multiple concurrent requests
      const promises = Array(5).fill(null).map(() => getStudyProfile());
      const results = await Promise.all(promises);

      // Assert: All requests successful
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });
  });
});
```

---

## 6. Security Testing

### 6.1 Authentication & Authorization

#### Test Suite 8: Security Tests
```typescript
describe('Security Tests', () => {
  describe('Authentication', () => {
    it('should reject requests without token', async () => {
      // Arrange: No token
      clearAuthToken();

      // Act & Assert: 401 error
      await expect(getStudyProfile()).rejects.toThrow('401');
    });

    it('should reject requests with invalid token', async () => {
      // Arrange: Invalid token
      setAuthToken('invalid-token');

      // Act & Assert: 401 error
      await expect(getStudyProfile()).rejects.toThrow('401');
    });

    it('should accept requests with valid token', async () => {
      // Arrange: Valid token
      const mockProfile = createMockProfile();
      jest.spyOn(api, 'get').mockResolvedValue({ data: mockProfile });

      // Act: Get profile
      const result = await getStudyProfile();

      // Assert: Success
      expect(result).toEqual(mockProfile);
    });
  });

  describe('Data Isolation', () => {
    it('should only return profile for authenticated user', async () => {
      // Arrange: User A profile
      const userA = await createTestUser('user-a');
      const userB = await createTestUser('user-b');
      
      await login(userA);
      await createTestProfile({ chronotype: Chronotype.MorningWarrior });

      // Act: Login as User B and try to get User A's profile
      await login(userB);
      
      // Assert: Should not get User A's profile
      const profile = await getStudyProfile();
      expect(profile).toBeNull(); // User B has no profile
    });
  });
});
```

---

## 7. Test Environment Setup

### 7.1 Test Configuration

#### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*'
  ]
};
```

#### Test Setup
```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
import { QueryClient } from '@tanstack/react-query';

// Mock API
jest.mock('../lib/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
}));

// Mock React Query
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});

export { createTestQueryClient };
```

### 7.2 Test Utilities

#### Test Helpers
```typescript
// src/test/utils.ts
export const createMockProfile = (overrides = {}) => ({
  user_id: 'test-user',
  chronotype: Chronotype.MorningWarrior,
  focusStyle: FocusStyle.DeepFocus,
  workStyle: WorkStyle.DeadlineDriven,
  updated_at: '2025-01-15T10:30:00Z',
  ...overrides
});

export const createMockUser = (overrides = {}) => ({
  id: 'test-user',
  email: 'test@example.com',
  name: 'Test User',
  emailVerified: true,
  hasStudyProfile: false,
  ...overrides
});

export const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {ui}
      </AuthProvider>
    </QueryClientProvider>
  );
};
```

---

## 8. Continuous Integration

### 8.1 GitHub Actions Workflow

#### CI Pipeline
```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run type check
        run: npm run typecheck
      
      - name: Run linting
        run: npm run lint
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          API_BASE_URL: ${{ secrets.TEST_API_URL }}
          TEST_USER_TOKEN: ${{ secrets.TEST_USER_TOKEN }}
      
      - name: Generate coverage report
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### 8.2 Test Scripts

#### Package.json Scripts
```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "playwright test",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch",
    "test:ci": "jest --ci --coverage --watchAll=false"
  }
}
```

---

## 9. Monitoring & Observability

### 9.1 API Monitoring

#### Error Tracking
```typescript
// src/lib/api-monitoring.ts
export const trackApiError = (error: any, context: string) => {
  // Track API errors for monitoring
  console.error(`API Error in ${context}:`, error);
  
  // Send to monitoring service
  if (window.gtag) {
    window.gtag('event', 'api_error', {
      error_type: error.response?.status || 'network',
      context: context,
      endpoint: error.config?.url
    });
  }
};

export const trackQuizEvent = (event: string, data: any) => {
  // Track quiz events
  if (window.gtag) {
    window.gtag('event', 'quiz_event', {
      event_name: event,
      ...data
    });
  }
};
```

### 9.2 Performance Monitoring

#### Performance Tracking
```typescript
// src/lib/performance-monitoring.ts
export const trackQuizPerformance = () => {
  const startTime = performance.now();
  
  return {
    end: (eventName: string) => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (window.gtag) {
        window.gtag('event', 'quiz_performance', {
          event_name: eventName,
          duration: duration
        });
      }
    }
  };
};
```

---

## 10. Deployment Checklist

### 10.1 Pre-deployment

- [ ] **API Endpoints**: All endpoints tested and working
- [ ] **Authentication**: Token handling verified
- [ ] **Data Validation**: Request/response format validated
- [ ] **Error Handling**: All error scenarios tested
- [ ] **Performance**: Response times within acceptable limits
- [ ] **Security**: Authentication and authorization tested
- [ ] **Integration**: Frontend-backend integration verified
- [ ] **Monitoring**: Error tracking and performance monitoring setup

### 10.2 Post-deployment

- [ ] **Smoke Tests**: Basic functionality verification
- [ ] **Monitoring**: Error rates and performance metrics
- [ ] **User Testing**: Real user flow testing
- [ ] **Rollback Plan**: Prepared in case of issues
- [ ] **Documentation**: API documentation updated

---

## 11. Test Execution Plan

### Phase 1: Unit Tests (Week 1)
- API client functions
- Quiz logic and validation
- Component rendering
- Hook functionality

### Phase 2: Integration Tests (Week 2)
- API integration
- React Query integration
- Auth state synchronization
- Error handling

### Phase 3: E2E Tests (Week 3)
- Complete user journeys
- Cross-browser testing
- Performance testing
- Security testing

### Phase 4: Production Testing (Week 4)
- Staging environment testing
- Load testing
- Monitoring setup
- Deployment verification

---

## Conclusion

Kế hoạch Backend Integration & Testing này đảm bảo:

- **Comprehensive Coverage**: Tất cả aspects của integration được test
- **Quality Assurance**: Error handling và edge cases được cover
- **Performance**: Response times và scalability được verify
- **Security**: Authentication và data isolation được test
- **Monitoring**: Observability và error tracking được setup
- **CI/CD**: Automated testing pipeline được implement

Với kế hoạch này, Study Profile Quiz system sẽ được tích hợp một cách an toàn và reliable với backend API.

---

**Implementation Timeline**: 4 weeks  
**Status**: Ready for execution  
**Next Steps**: Begin Phase 1 testing
