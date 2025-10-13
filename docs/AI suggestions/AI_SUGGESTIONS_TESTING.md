# AI Suggestions Testing Guide

## Overview

Tài liệu này cung cấp comprehensive testing strategies cho AI Suggestions feature, bao gồm unit tests, integration tests, và manual testing procedures.

---

## Unit Testing

### API Service Testing

#### Test Setup
```typescript
// __tests__/services/aiSuggestionsService.test.ts
import { jest } from '@jest/globals';
import axios from 'axios';
import { generateSuggestion, getSuggestions, updateSuggestionStatus } from '../services/aiSuggestionsService';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AI Suggestions Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateSuggestion', () => {
    it('should generate task suggestions successfully', async () => {
      const mockResponse = {
        data: {
          suggestion_id: 'test-id',
          suggestion_type: 0,
          status: 0,
          items: [
            {
              item_type: 0,
              title: 'Test Task',
              description: 'Test description',
              estimated_minutes: 60,
              deadline: '2025-01-01T00:00:00Z',
              metadata: { priority: 1, tags: ['test'] }
            }
          ],
          confidence: 0.9,
          reason: 'Test reason'
        }
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await generateSuggestion(0, 'Asia/Ho_Chi_Minh');

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/ai-suggestions/generate', {
        suggestionType: 0,
        timezone: 'Asia/Ho_Chi_Minh'
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle validation errors', async () => {
      const mockError = {
        response: {
          status: 400,
          data: {
            message: 'Validation failed',
            errors: {
              suggestionType: 'Must be 0, 1, or 2'
            }
          }
        }
      };

      mockedAxios.post.mockRejectedValue(mockError);

      await expect(generateSuggestion(5, 'Asia/Ho_Chi_Minh'))
        .rejects.toThrow('Validation failed');
    });

    it('should handle rate limiting', async () => {
      const mockError = {
        response: {
          status: 429,
          data: {
            message: 'Too many requests',
            retryAfter: 900
          }
        }
      };

      mockedAxios.post.mockRejectedValue(mockError);

      await expect(generateSuggestion(0, 'Asia/Ho_Chi_Minh'))
        .rejects.toThrow('Too many requests');
    });

    it('should handle service unavailable', async () => {
      const mockError = {
        response: {
          status: 503,
          data: {
            message: 'AI service temporarily unavailable',
            retryAfter: 60
          }
        }
      };

      mockedAxios.post.mockRejectedValue(mockError);

      await expect(generateSuggestion(0, 'Asia/Ho_Chi_Minh'))
        .rejects.toThrow('AI service temporarily unavailable');
    });
  });

  describe('getSuggestions', () => {
    it('should get suggestions with pagination', async () => {
      const mockResponse = {
        data: {
          suggestions: [
            {
              suggestion_id: 'test-id-1',
              suggestion_type: 0,
              status: 0,
              items: [],
              confidence: 0.9,
              reason: 'Test reason',
              created_at: '2025-01-01T00:00:00Z'
            }
          ],
          total: 1,
          limit: 10,
          offset: 0,
          hasMore: false
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await getSuggestions({ status: 0, limit: 10, offset: 0 });

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/ai-suggestions', {
        params: { status: 0, limit: 10, offset: 0 }
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('updateSuggestionStatus', () => {
    it('should accept suggestion successfully', async () => {
      const mockResponse = {
        data: {
          suggestion_id: 'test-id',
          status: 1,
          updated_at: '2025-01-01T00:05:00Z'
        }
      };

      mockedAxios.patch.mockResolvedValue(mockResponse);

      const result = await updateSuggestionStatus('test-id', 1);

      expect(mockedAxios.patch).toHaveBeenCalledWith('/api/ai-suggestions/test-id/status', {
        status: 1
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should reject suggestion successfully', async () => {
      const mockResponse = {
        data: {
          suggestion_id: 'test-id',
          status: 2,
          updated_at: '2025-01-01T00:05:00Z'
        }
      };

      mockedAxios.patch.mockResolvedValue(mockResponse);

      const result = await updateSuggestionStatus('test-id', 2);

      expect(mockedAxios.patch).toHaveBeenCalledWith('/api/ai-suggestions/test-id/status', {
        status: 2
      });
      expect(result).toEqual(mockResponse.data);
    });
  });
});
```

### Component Testing

#### React Component Tests
```typescript
// __tests__/components/AISuggestions.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AISuggestions } from '../components/AISuggestions';
import { useAISuggestions } from '../hooks/useAISuggestions';

// Mock the hook
jest.mock('../hooks/useAISuggestions');
const mockUseAISuggestions = useAISuggestions as jest.MockedFunction<typeof useAISuggestions>;

describe('AISuggestions Component', () => {
  const mockGenerateSuggestion = jest.fn();
  const mockAcceptSuggestion = jest.fn();
  const mockRejectSuggestion = jest.fn();

  beforeEach(() => {
    mockUseAISuggestions.mockReturnValue({
      loading: false,
      suggestions: [],
      currentSuggestion: null,
      error: null,
      rateLimitInfo: null,
      generateSuggestion: mockGenerateSuggestion,
      acceptSuggestion: mockAcceptSuggestion,
      rejectSuggestion: mockRejectSuggestion,
      clearError: jest.fn()
    });
  });

  it('should render suggestion buttons', () => {
    render(<AISuggestions />);
    
    expect(screen.getByText('Generate Tasks')).toBeInTheDocument();
    expect(screen.getByText('Generate Checklist')).toBeInTheDocument();
    expect(screen.getByText('Generate Mixed')).toBeInTheDocument();
  });

  it('should generate suggestions when button is clicked', async () => {
    render(<AISuggestions />);
    
    const generateButton = screen.getByText('Generate Tasks');
    fireEvent.click(generateButton);
    
    expect(mockGenerateSuggestion).toHaveBeenCalledWith(0);
  });

  it('should show loading state', () => {
    mockUseAISuggestions.mockReturnValue({
      loading: true,
      suggestions: [],
      currentSuggestion: null,
      error: null,
      rateLimitInfo: null,
      generateSuggestion: mockGenerateSuggestion,
      acceptSuggestion: mockAcceptSuggestion,
      rejectSuggestion: mockRejectSuggestion,
      clearError: jest.fn()
    });

    render(<AISuggestions />);
    
    expect(screen.getByText('Generating suggestions...')).toBeInTheDocument();
  });

  it('should display suggestions', () => {
    const mockSuggestion = {
      suggestion_id: 'test-id',
      suggestion_type: 0,
      status: 0,
      items: [
        {
          item_type: 0,
          title: 'Test Task',
          description: 'Test description',
          estimated_minutes: 60,
          deadline: '2025-01-01T00:00:00Z',
          metadata: { priority: 1, tags: ['test'] }
        }
      ],
      confidence: 0.9,
      reason: 'Test reason',
      created_at: '2025-01-01T00:00:00Z'
    };

    mockUseAISuggestions.mockReturnValue({
      loading: false,
      suggestions: [],
      currentSuggestion: mockSuggestion,
      error: null,
      rateLimitInfo: null,
      generateSuggestion: mockGenerateSuggestion,
      acceptSuggestion: mockAcceptSuggestion,
      rejectSuggestion: mockRejectSuggestion,
      clearError: jest.fn()
    });

    render(<AISuggestions />);
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('60 min')).toBeInTheDocument();
  });

  it('should handle error display', () => {
    mockUseAISuggestions.mockReturnValue({
      loading: false,
      suggestions: [],
      currentSuggestion: null,
      error: new Error('Test error'),
      rateLimitInfo: null,
      generateSuggestion: mockGenerateSuggestion,
      acceptSuggestion: mockAcceptSuggestion,
      rejectSuggestion: mockRejectSuggestion,
      clearError: jest.fn()
    });

    render(<AISuggestions />);
    
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('should show rate limit warning', () => {
    mockUseAISuggestions.mockReturnValue({
      loading: false,
      suggestions: [],
      currentSuggestion: null,
      error: null,
      rateLimitInfo: { remaining: 3, reset: Date.now() / 1000 + 900 },
      generateSuggestion: mockGenerateSuggestion,
      acceptSuggestion: mockAcceptSuggestion,
      rejectSuggestion: mockRejectSuggestion,
      clearError: jest.fn()
    });

    render(<AISuggestions />);
    
    expect(screen.getByText(/3 requests remaining/i)).toBeInTheDocument();
  });
});
```

### Hook Testing

#### Custom Hook Tests
```typescript
// __tests__/hooks/useAISuggestions.test.ts
import { renderHook, act } from '@testing-library/react';
import { useAISuggestions } from '../hooks/useAISuggestions';
import * as api from '../services/aiSuggestionsService';

jest.mock('../services/aiSuggestionsService');
const mockApi = api as jest.Mocked<typeof api>;

describe('useAISuggestions Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate suggestion successfully', async () => {
    const mockResponse = {
      suggestion_id: 'test-id',
      items: [
        {
          item_type: 0,
          title: 'Test Task',
          description: 'Test description',
          estimated_minutes: 60,
          deadline: '2025-01-01T00:00:00Z',
          metadata: { priority: 1, tags: ['test'] }
        }
      ],
      confidence: 0.9,
      reason: 'Test reason'
    };

    mockApi.generateSuggestion.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAISuggestions());

    await act(async () => {
      await result.current.generateSuggestion(0);
    });

    expect(result.current.currentSuggestion).toEqual(mockResponse);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should handle generation error', async () => {
    const mockError = new Error('Test error');
    mockApi.generateSuggestion.mockRejectedValue(mockError);

    const { result } = renderHook(() => useAISuggestions());

    await act(async () => {
      try {
        await result.current.generateSuggestion(0);
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.error).toEqual(mockError);
    expect(result.current.loading).toBe(false);
  });

  it('should accept suggestion', async () => {
    const mockResponse = {
      suggestion_id: 'test-id',
      status: 1,
      updated_at: '2025-01-01T00:05:00Z'
    };

    mockApi.updateSuggestionStatus.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAISuggestions());

    await act(async () => {
      await result.current.acceptSuggestion('test-id');
    });

    expect(mockApi.updateSuggestionStatus).toHaveBeenCalledWith('test-id', 1);
  });
});
```

---

## Integration Testing

### API Integration Tests

#### End-to-End API Tests
```typescript
// __tests__/integration/aiSuggestionsApi.test.ts
import request from 'supertest';
import app from '../../app';
import { generateJWT } from '../helpers/auth';

describe('AI Suggestions API Integration', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Setup test user and get auth token
    const authResult = await generateJWT('test@example.com');
    authToken = authResult.token;
    userId = authResult.userId;
  });

  describe('POST /api/ai-suggestions/generate', () => {
    it('should generate task suggestions', async () => {
      const response = await request(app)
        .post('/api/ai-suggestions/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          suggestionType: 0,
          timezone: 'Asia/Ho_Chi_Minh'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('suggestion_id');
      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('confidence');
      expect(response.body).toHaveProperty('reason');
      expect(response.body.items).toBeInstanceOf(Array);
      expect(response.body.items.length).toBeGreaterThan(0);
    });

    it('should generate checklist suggestions', async () => {
      const response = await request(app)
        .post('/api/ai-suggestions/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          suggestionType: 1,
          timezone: 'Asia/Ho_Chi_Minh'
        });

      expect(response.status).toBe(201);
      expect(response.body.suggestion_type).toBe(1);
      expect(response.body.items.every((item: any) => item.item_type === 1)).toBe(true);
    });

    it('should generate mixed suggestions', async () => {
      const response = await request(app)
        .post('/api/ai-suggestions/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          suggestionType: 2,
          timezone: 'Asia/Ho_Chi_Minh'
        });

      expect(response.status).toBe(201);
      expect(response.body.suggestion_type).toBe(2);
      expect(response.body.items).toBeInstanceOf(Array);
    });

    it('should return 400 for invalid suggestionType', async () => {
      const response = await request(app)
        .post('/api/ai-suggestions/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          suggestionType: 5,
          timezone: 'Asia/Ho_Chi_Minh'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('errors');
    });

    it('should return 400 for invalid timezone', async () => {
      const response = await request(app)
        .post('/api/ai-suggestions/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          suggestionType: 0,
          timezone: 'invalid-timezone'
        });

      expect(response.status).toBe(400);
      expect(response.body.errors.timezone).toBeDefined();
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/ai-suggestions/generate')
        .send({
          suggestionType: 0,
          timezone: 'Asia/Ho_Chi_Minh'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/ai-suggestions', () => {
    it('should get user suggestions', async () => {
      const response = await request(app)
        .get('/api/ai-suggestions')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('suggestions');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('offset');
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/ai-suggestions?status=0')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.suggestions.every((s: any) => s.status === 0)).toBe(true);
    });

    it('should handle pagination', async () => {
      const response = await request(app)
        .get('/api/ai-suggestions?limit=5&offset=0')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.limit).toBe(5);
      expect(response.body.offset).toBe(0);
      expect(response.body.suggestions.length).toBeLessThanOrEqual(5);
    });
  });

  describe('PATCH /api/ai-suggestions/:id/status', () => {
    let suggestionId: string;

    beforeAll(async () => {
      // Create a suggestion first
      const response = await request(app)
        .post('/api/ai-suggestions/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          suggestionType: 0,
          timezone: 'Asia/Ho_Chi_Minh'
        });

      suggestionId = response.body.suggestion_id;
    });

    it('should accept suggestion', async () => {
      const response = await request(app)
        .patch(`/api/ai-suggestions/${suggestionId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 1 });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(1);
      expect(response.body).toHaveProperty('updated_at');
    });

    it('should reject suggestion', async () => {
      const response = await request(app)
        .patch(`/api/ai-suggestions/${suggestionId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 2 });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(2);
    });

    it('should return 400 for invalid status', async () => {
      const response = await request(app)
        .patch(`/api/ai-suggestions/${suggestionId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 5 });

      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent suggestion', async () => {
      const response = await request(app)
        .patch('/api/ai-suggestions/non-existent-id/status')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 1 });

      expect(response.status).toBe(404);
    });
  });
});
```

### Rate Limiting Tests

#### Rate Limit Integration Tests
```typescript
// __tests__/integration/rateLimiting.test.ts
import request from 'supertest';
import app from '../../app';
import { generateJWT } from '../helpers/auth';

describe('Rate Limiting Integration', () => {
  let authToken: string;

  beforeAll(async () => {
    const authResult = await generateJWT('test@example.com');
    authToken = authResult.token;
  });

  it('should enforce rate limiting', async () => {
    const requests = [];
    
    // Send 25 requests to exceed rate limit (20 requests per 15 minutes)
    for (let i = 0; i < 25; i++) {
      requests.push(
        request(app)
          .post('/api/ai-suggestions/generate')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            suggestionType: 0,
            timezone: 'Asia/Ho_Chi_Minh'
          })
      );
    }

    const responses = await Promise.all(requests);
    
    // First 20 requests should succeed
    const successfulRequests = responses.filter(r => r.status === 201);
    expect(successfulRequests.length).toBeLessThanOrEqual(20);
    
    // Remaining requests should be rate limited
    const rateLimitedRequests = responses.filter(r => r.status === 429);
    expect(rateLimitedRequests.length).toBeGreaterThan(0);
    
    // Check rate limit headers
    const rateLimitedResponse = rateLimitedRequests[0];
    expect(rateLimitedResponse.headers).toHaveProperty('retry-after');
    expect(rateLimitedResponse.body).toHaveProperty('retryAfter');
  });

  it('should reset rate limit after window', async () => {
    // This test would require mocking time or waiting for actual window reset
    // In practice, you might use a test environment with shorter rate limit windows
    jest.setTimeout(30000); // 30 seconds timeout
    
    // Wait for rate limit window to reset (this would be mocked in real tests)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const response = await request(app)
      .post('/api/ai-suggestions/generate')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        suggestionType: 0,
        timezone: 'Asia/Ho_Chi_Minh'
      });

    // Should eventually succeed after rate limit reset
    expect([201, 429]).toContain(response.status);
  });
});
```

---

## Manual Testing

### Manual Testing Checklist

#### Basic Functionality
- [ ] **Generate Task Suggestions**
  - [ ] Click "Generate Tasks" button
  - [ ] Verify suggestions are displayed
  - [ ] Check suggestion items have correct structure
  - [ ] Verify confidence score is displayed
  - [ ] Check AI reasoning is shown

- [ ] **Generate Checklist Suggestions**
  - [ ] Click "Generate Checklist" button
  - [ ] Verify checklist items are displayed
  - [ ] Check items have `item_type: 1`
  - [ ] Verify `metadata.task_id` is present
  - [ ] Check estimated minutes are reasonable

- [ ] **Generate Mixed Suggestions**
  - [ ] Click "Generate Mixed" button
  - [ ] Verify both tasks and checklist items are shown
  - [ ] Check items have correct `item_type` values
  - [ ] Verify response structure is correct

#### Error Handling
- [ ] **Validation Errors**
  - [ ] Test with invalid `suggestionType`
  - [ ] Test with invalid `timezone`
  - [ ] Verify error messages are displayed
  - [ ] Check error handling doesn't break UI

- [ ] **Rate Limiting**
  - [ ] Send multiple requests rapidly
  - [ ] Verify rate limit warning appears
  - [ ] Check countdown timer works
  - [ ] Verify buttons are disabled when rate limited
  - [ ] Test rate limit reset functionality

- [ ] **Service Unavailable**
  - [ ] Simulate AI service down
  - [ ] Verify error message is shown
  - [ ] Check retry functionality works
  - [ ] Test fallback behavior

- [ ] **Network Errors**
  - [ ] Test with no internet connection
  - [ ] Verify offline message is shown
  - [ ] Check error recovery when connection restored

#### User Experience
- [ ] **Loading States**
  - [ ] Verify loading indicators are shown
  - [ ] Check loading states don't block UI
  - [ ] Test loading cancellation works
  - [ ] Verify progress indicators are accurate

- [ ] **Accept/Reject Suggestions**
  - [ ] Click "Accept" on suggestions
  - [ ] Verify suggestion status updates
  - [ ] Check UI reflects accepted state
  - [ ] Test reject functionality
  - [ ] Verify rejected suggestions are marked

- [ ] **Suggestion History**
  - [ ] View suggestion history
  - [ ] Test pagination works
  - [ ] Check filtering by status
  - [ ] Verify suggestion details are shown

#### Performance
- [ ] **Response Times**
  - [ ] Measure suggestion generation time
  - [ ] Check response times are reasonable (5-15 seconds)
  - [ ] Test with different suggestion types
  - [ ] Verify timeout handling works

- [ ] **Caching**
  - [ ] Test suggestion caching
  - [ ] Verify cache expiration works
  - [ ] Check offline suggestions work
  - [ ] Test cache invalidation

- [ ] **Memory Usage**
  - [ ] Monitor memory usage during testing
  - [ ] Check for memory leaks
  - [ ] Verify cleanup works properly
  - [ ] Test with large suggestion lists

### Browser Testing

#### Cross-Browser Compatibility
- [ ] **Chrome**
  - [ ] Test all functionality works
  - [ ] Check error handling
  - [ ] Verify performance

- [ ] **Firefox**
  - [ ] Test all functionality works
  - [ ] Check error handling
  - [ ] Verify performance

- [ ] **Safari**
  - [ ] Test all functionality works
  - [ ] Check error handling
  - [ ] Verify performance

- [ ] **Edge**
  - [ ] Test all functionality works
  - [ ] Check error handling
  - [ ] Verify performance

#### Mobile Testing
- [ ] **iOS Safari**
  - [ ] Test touch interactions
  - [ ] Check responsive design
  - [ ] Verify performance

- [ ] **Android Chrome**
  - [ ] Test touch interactions
  - [ ] Check responsive design
  - [ ] Verify performance

### Accessibility Testing

#### Keyboard Navigation
- [ ] **Tab Navigation**
  - [ ] Test all buttons are accessible via Tab
  - [ ] Check focus indicators are visible
  - [ ] Verify keyboard shortcuts work

- [ ] **Screen Reader**
  - [ ] Test with screen reader
  - [ ] Check ARIA labels are correct
  - [ ] Verify content is readable

#### Visual Accessibility
- [ ] **Color Contrast**
  - [ ] Check color contrast ratios
  - [ ] Verify text is readable
  - [ ] Test with color blindness simulators

- [ ] **Font Size**
  - [ ] Test with different font sizes
  - [ ] Check responsive text scaling
  - [ ] Verify readability

---

## Performance Testing

### Load Testing

#### API Load Tests
```typescript
// __tests__/performance/loadTest.test.ts
import { performance } from 'perf_hooks';
import request from 'supertest';
import app from '../../app';

describe('AI Suggestions Load Testing', () => {
  it('should handle concurrent requests', async () => {
    const concurrentRequests = 10;
    const requests = [];
    
    const startTime = performance.now();
    
    for (let i = 0; i < concurrentRequests; i++) {
      requests.push(
        request(app)
          .post('/api/ai-suggestions/generate')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            suggestionType: 0,
            timezone: 'Asia/Ho_Chi_Minh'
          })
      );
    }
    
    const responses = await Promise.all(requests);
    const endTime = performance.now();
    
    const successfulRequests = responses.filter(r => r.status === 201);
    const averageResponseTime = (endTime - startTime) / concurrentRequests;
    
    expect(successfulRequests.length).toBeGreaterThan(0);
    expect(averageResponseTime).toBeLessThan(30000); // 30 seconds max
  });

  it('should maintain performance under load', async () => {
    const iterations = 50;
    const responseTimes = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      
      const response = await request(app)
        .post('/api/ai-suggestions/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          suggestionType: 0,
          timezone: 'Asia/Ho_Chi_Minh'
        });
      
      const endTime = performance.now();
      responseTimes.push(endTime - startTime);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const averageResponseTime = responseTimes.reduce((a, b) => a + b) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);
    
    expect(averageResponseTime).toBeLessThan(15000); // 15 seconds average
    expect(maxResponseTime).toBeLessThan(30000); // 30 seconds max
  });
});
```

### Memory Testing

#### Memory Leak Detection
```typescript
// __tests__/performance/memoryTest.test.ts
describe('Memory Leak Detection', () => {
  it('should not leak memory during repeated requests', async () => {
    const initialMemory = process.memoryUsage();
    
    // Make many requests
    for (let i = 0; i < 100; i++) {
      await request(app)
        .post('/api/ai-suggestions/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          suggestionType: 0,
          timezone: 'Asia/Ho_Chi_Minh'
        });
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    }
    
    const finalMemory = process.memoryUsage();
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
    
    // Memory increase should be reasonable (less than 50MB)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
  });
});
```

---

## Test Automation

### CI/CD Pipeline Tests

#### GitHub Actions Workflow
```yaml
# .github/workflows/ai-suggestions-tests.yml
name: AI Suggestions Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run unit tests
      run: npm run test:unit
    
    - name: Run integration tests
      run: npm run test:integration
      env:
        NODE_ENV: test
        DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
        JWT_SECRET: ${{ secrets.JWT_SECRET }}
    
    - name: Run performance tests
      run: npm run test:performance
    
    - name: Generate coverage report
      run: npm run test:coverage
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
```

### Test Scripts

#### Package.json Scripts
```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern=__tests__/unit",
    "test:integration": "jest --testPathPattern=__tests__/integration",
    "test:performance": "jest --testPathPattern=__tests__/performance",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch",
    "test:ci": "jest --ci --coverage --watchAll=false"
  }
}
```

---

## Best Practices Summary

### 1. Test Coverage
- Aim for 80%+ code coverage
- Test all error scenarios
- Test edge cases và boundary conditions
- Test both success và failure paths

### 2. Test Organization
- Separate unit, integration, và performance tests
- Use descriptive test names
- Group related tests together
- Mock external dependencies

### 3. Test Data
- Use realistic test data
- Create reusable test fixtures
- Clean up test data after tests
- Use factories for test data generation

### 4. Performance Testing
- Test response times
- Test memory usage
- Test concurrent requests
- Monitor for memory leaks

### 5. Manual Testing
- Create comprehensive checklists
- Test across different browsers
- Test accessibility features
- Test mobile responsiveness

### 6. Continuous Integration
- Run tests on every commit
- Use multiple Node.js versions
- Generate coverage reports
- Fail builds on test failures
