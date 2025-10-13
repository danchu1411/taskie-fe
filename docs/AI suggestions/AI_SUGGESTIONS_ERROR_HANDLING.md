# AI Suggestions Error Handling Guide

## Overview

Tài liệu này mô tả cách handle các lỗi có thể xảy ra khi sử dụng AI Suggestions API, bao gồm error codes, response formats, và strategies để handle từng loại lỗi.

---

## Error Response Format

Tất cả error responses đều follow format chuẩn:

```javascript
{
  "message": "Human-readable error description",
  "errors": { /* validation errors */ },
  "retryAfter": 900, /* seconds - for rate limiting */
  "requestId": "uuid" /* for debugging */
}
```

### Error Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `message` | string | Human-readable error message |
| `errors` | object | Validation errors (for 400 status) |
| `retryAfter` | number | Seconds until retry allowed (for 429/503) |
| `requestId` | string | Unique request ID for debugging |

---

## HTTP Status Codes

### 400 Bad Request
**Khi nào xảy ra**: Request validation failed

#### Common Causes
- Invalid `suggestionType` (not 0, 1, or 2)
- Invalid `timezone` format
- Missing required fields
- Invalid `promptTemplate` format

#### Error Response
```javascript
{
  "message": "Validation failed",
  "errors": {
    "suggestionType": "Must be 0, 1, or 2",
    "timezone": "Invalid timezone format"
  },
  "requestId": "req_550e8400-e29b-41d4-a716-446655440002"
}
```

#### Frontend Handling
```javascript
try {
  const response = await api.post('/api/ai-suggestions/generate', {
    suggestionType: 5, // Invalid value
    timezone: 'invalid-timezone'
  });
} catch (error) {
  if (error.response?.status === 400) {
    const errors = error.response.data.errors;
    
    // Display validation errors to user
    Object.keys(errors).forEach(field => {
      showFieldError(field, errors[field]);
    });
    
    // Log for debugging
    console.error('Validation errors:', errors);
  }
}
```

#### Best Practices
- Validate input trước khi gửi request
- Show field-specific error messages
- Highlight invalid fields trong UI
- Provide helpful suggestions để fix errors

---

### 401 Unauthorized
**Khi nào xảy ra**: Authentication failed hoặc missing

#### Common Causes
- Missing JWT token
- Expired JWT token
- Invalid JWT token format
- Token không có quyền access API

#### Error Response
```javascript
{
  "message": "Authentication required",
  "error": "UNAUTHORIZED",
  "requestId": "req_550e8400-e29b-41d4-a716-446655440002"
}
```

#### Frontend Handling
```javascript
try {
  const response = await api.post('/api/ai-suggestions/generate', data);
} catch (error) {
  if (error.response?.status === 401) {
    // Redirect to login page
    window.location.href = '/login';
    
    // Or refresh token if available
    const refreshed = await refreshToken();
    if (refreshed) {
      // Retry the request
      return retryRequest();
    }
  }
}
```

#### Best Practices
- Implement automatic token refresh
- Redirect to login khi authentication fails
- Store tokens securely
- Handle token expiration gracefully

---

### 429 Too Many Requests
**Khi nào xảy ra**: Rate limit exceeded

#### Common Causes
- User đã gửi quá 20 requests trong 15 phút
- Rapid-fire requests từ cùng một user
- Bulk requests không có delay

#### Error Response
```javascript
{
  "message": "Too many AI suggestion requests from this user",
  "retryAfter": 900, // 15 minutes in seconds
  "requestId": "req_550e8400-e29b-41d4-a716-446655440002"
}
```

#### Frontend Handling
```javascript
try {
  const response = await api.post('/api/ai-suggestions/generate', data);
} catch (error) {
  if (error.response?.status === 429) {
    const retryAfter = error.response.data.retryAfter;
    const minutes = Math.ceil(retryAfter / 60);
    
    // Show user-friendly message
    showMessage(`Too many requests. Please wait ${minutes} minutes before trying again.`);
    
    // Show countdown timer
    startCountdownTimer(retryAfter);
    
    // Disable suggestion buttons
    setSuggestionDisabled(true);
    
    // Re-enable after countdown
    setTimeout(() => {
      setSuggestionDisabled(false);
    }, retryAfter * 1000);
  }
}
```

#### Rate Limit Headers
```javascript
// Response headers
{
  'X-RateLimit-Limit': '20',
  'X-RateLimit-Remaining': '0',
  'X-RateLimit-Reset': '1640995200',
  'Retry-After': '900'
}
```

#### Best Practices
- Implement exponential backoff
- Show countdown timer cho user
- Disable buttons khi rate limited
- Cache suggestions để giảm API calls
- Implement request queuing

---

### 503 Service Unavailable
**Khi nào xảy ra**: Circuit breaker open hoặc AI service down

#### Common Causes
- Gemini API service down
- Circuit breaker triggered (too many failures)
- AI service overload
- Network issues với AI provider

#### Error Response
```javascript
{
  "message": "AI suggestion service is temporarily unavailable",
  "retryAfter": 60, // 1 minute
  "requestId": "req_550e8400-e29b-41d4-a716-446655440002"
}
```

#### Frontend Handling
```javascript
try {
  const response = await api.post('/api/ai-suggestions/generate', data);
} catch (error) {
  if (error.response?.status === 503) {
    const retryAfter = error.response.data.retryAfter;
    
    // Show service unavailable message
    showMessage('AI service is temporarily down. Please try again later.');
    
    // Show retry button after delay
    setTimeout(() => {
      showRetryButton();
    }, retryAfter * 1000);
    
    // Log for monitoring
    logServiceUnavailable(error.response.data.requestId);
  }
}
```

#### Best Practices
- Implement retry logic với exponential backoff
- Show clear service status messages
- Provide fallback options
- Monitor service health
- Implement circuit breaker pattern

---

### 500 Internal Server Error
**Khi nào xảy ra**: Unexpected server errors

#### Common Causes
- AI service internal errors
- Database connection issues
- LLM response parsing errors
- Unexpected exceptions trong code

#### Error Response
```javascript
{
  "message": "Failed to generate AI suggestions",
  "requestId": "req_550e8400-e29b-41d4-a716-446655440002"
}
```

#### Frontend Handling
```javascript
try {
  const response = await api.post('/api/ai-suggestions/generate', data);
} catch (error) {
  if (error.response?.status === 500) {
    const requestId = error.response.data.requestId;
    
    // Show generic error message
    showMessage('Something went wrong. Please try again.');
    
    // Log error with request ID
    logError('AI suggestion generation failed', {
      requestId,
      error: error.response.data.message
    });
    
    // Send to error tracking service
    trackError('ai_suggestion_500', {
      requestId,
      userId: getCurrentUserId(),
      timestamp: new Date().toISOString()
    });
  }
}
```

#### Best Practices
- Log errors với request ID
- Send errors to monitoring service
- Show generic user-friendly messages
- Implement error tracking
- Provide fallback options

---

## Error Handling Strategies

### 1. Retry Logic

#### Exponential Backoff
```javascript
async function generateSuggestionWithRetry(data, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await api.post('/api/ai-suggestions/generate', data);
    } catch (error) {
      lastError = error;
      
      // Don't retry for client errors
      if (error.response?.status < 500) {
        throw error;
      }
      
      // Don't retry for rate limiting
      if (error.response?.status === 429) {
        throw error;
      }
      
      // Wait before retry
      const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}
```

#### Retry với Rate Limit Handling
```javascript
async function generateSuggestionWithSmartRetry(data) {
  try {
    return await api.post('/api/ai-suggestions/generate', data);
  } catch (error) {
    if (error.response?.status === 429) {
      const retryAfter = error.response.data.retryAfter;
      
      // Wait for rate limit reset
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      
      // Retry once after rate limit reset
      return await api.post('/api/ai-suggestions/generate', data);
    }
    
    throw error;
  }
}
```

### 2. Error Recovery

#### Graceful Degradation
```javascript
async function generateSuggestionsWithFallback(data) {
  try {
    return await api.post('/api/ai-suggestions/generate', data);
  } catch (error) {
    if (error.response?.status === 503 || error.response?.status === 500) {
      // Fallback to cached suggestions
      const cachedSuggestions = getCachedSuggestions(data.suggestionType);
      if (cachedSuggestions) {
        return {
          data: {
            ...cachedSuggestions,
            meta: {
              ...cachedSuggestions.meta,
              fallback: true,
              originalError: error.response.data.message
            }
          }
        };
      }
    }
    
    throw error;
  }
}
```

#### Offline Mode
```javascript
async function generateSuggestions(data) {
  try {
    return await api.post('/api/ai-suggestions/generate', data);
  } catch (error) {
    if (!navigator.onLine) {
      // Show offline message
      showMessage('You are offline. Suggestions will be available when you reconnect.');
      
      // Return empty suggestions
      return {
        data: {
          items: [],
          confidence: 0,
          reason: 'Offline mode - no suggestions available',
          meta: { offline: true }
        }
      };
    }
    
    throw error;
  }
}
```

### 3. User Experience

#### Error Messages
```javascript
const getErrorMessage = (error) => {
  switch (error.response?.status) {
    case 400:
      return 'Please check your input and try again.';
    case 401:
      return 'Please log in to continue.';
    case 429:
      return 'Too many requests. Please wait a few minutes.';
    case 503:
      return 'AI service is temporarily unavailable.';
    case 500:
      return 'Something went wrong. Please try again.';
    default:
      return 'An unexpected error occurred.';
  }
};
```

#### Loading States
```javascript
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const generateSuggestions = async (data) => {
  setLoading(true);
  setError(null);
  
  try {
    const response = await api.post('/api/ai-suggestions/generate', data);
    setSuggestions(response.data.items);
  } catch (error) {
    setError(getErrorMessage(error));
  } finally {
    setLoading(false);
  }
};
```

#### Error Boundaries (React)
```javascript
class AIErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to monitoring service
    logError('AI Suggestions Error Boundary', {
      error: error.message,
      errorInfo,
      userId: getCurrentUserId()
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong with AI Suggestions</h2>
          <p>Please refresh the page or try again later.</p>
          <button onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 4. Monitoring & Debugging

#### Error Logging
```javascript
const logError = (context, error, additionalData = {}) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    context,
    error: {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    },
    user: {
      id: getCurrentUserId(),
      agent: navigator.userAgent
    },
    ...additionalData
  };
  
  // Send to monitoring service
  sendToMonitoringService('ai_suggestions_error', errorLog);
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('AI Suggestions Error:', errorLog);
  }
};
```

#### Performance Monitoring
```javascript
const trackPerformance = (operation, startTime, endTime, success) => {
  const duration = endTime - startTime;
  
  const performanceLog = {
    operation,
    duration,
    success,
    timestamp: new Date().toISOString(),
    userId: getCurrentUserId()
  };
  
  sendToMonitoringService('ai_suggestions_performance', performanceLog);
};

// Usage
const startTime = Date.now();
try {
  const response = await api.post('/api/ai-suggestions/generate', data);
  trackPerformance('generate_suggestions', startTime, Date.now(), true);
} catch (error) {
  trackPerformance('generate_suggestions', startTime, Date.now(), false);
  throw error;
}
```

---

## Testing Error Scenarios

### Unit Tests
```javascript
describe('AI Suggestions Error Handling', () => {
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
    
    jest.spyOn(api, 'post').mockRejectedValue(mockError);
    
    await expect(generateSuggestion({ suggestionType: 5 }))
      .rejects.toThrow();
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
    
    jest.spyOn(api, 'post').mockRejectedValue(mockError);
    
    await expect(generateSuggestion({ suggestionType: 0 }))
      .rejects.toThrow();
  });
});
```

### Integration Tests
```javascript
describe('AI Suggestions API Error Handling', () => {
  it('should return 400 for invalid suggestionType', async () => {
    const response = await request(app)
      .post('/api/ai-suggestions/generate')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        suggestionType: 5,
        timezone: 'Asia/Ho_Chi_Minh'
      });
    
    expect(response.status).toBe(400);
    expect(response.body.errors.suggestionType).toBeDefined();
  });
  
  it('should return 429 when rate limit exceeded', async () => {
    // Send multiple requests to trigger rate limit
    for (let i = 0; i < 25; i++) {
      await request(app)
        .post('/api/ai-suggestions/generate')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          suggestionType: 0,
          timezone: 'Asia/Ho_Chi_Minh'
        });
    }
    
    const response = await request(app)
      .post('/api/ai-suggestions/generate')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        suggestionType: 0,
        timezone: 'Asia/Ho_Chi_Minh'
      });
    
    expect(response.status).toBe(429);
    expect(response.body.retryAfter).toBeDefined();
  });
});
```

---

## Best Practices Summary

### 1. Always Handle Errors
- Never ignore error responses
- Implement proper error boundaries
- Show user-friendly error messages
- Log errors for debugging

### 2. Implement Retry Logic
- Use exponential backoff for server errors
- Respect rate limit retry times
- Don't retry client errors (4xx)
- Implement circuit breaker pattern

### 3. Provide Fallbacks
- Cache suggestions for offline use
- Show cached data when service is down
- Provide alternative workflows
- Graceful degradation

### 4. Monitor & Debug
- Track error rates và patterns
- Log request IDs for debugging
- Monitor performance metrics
- Set up alerts for critical errors

### 5. User Experience
- Show loading states during requests
- Provide clear error messages
- Allow users to retry failed operations
- Implement offline mode support
