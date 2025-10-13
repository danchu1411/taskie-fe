# AI Suggestions Quick Start Guide

## Overview

Hướng dẫn này giúp bạn integrate AI Suggestions API vào ứng dụng trong vòng 5 phút. Bao gồm setup, basic usage, và common patterns.

---

## 5-Minute Integration

### Step 1: Install Dependencies

```bash
# Install axios for HTTP requests
npm install axios

# Install TypeScript types (optional but recommended)
npm install @types/node
```

### Step 2: Create API Client

```javascript
// api/aiSuggestions.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.taskie.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwtToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Step 3: Create Service Functions

```javascript
// services/aiSuggestionsService.js
import api from '../api/aiSuggestions';

/**
 * Generate AI suggestions
 */
export const generateSuggestion = async (suggestionType, timezone) => {
  try {
    const response = await api.post('/api/ai-suggestions/generate', {
      suggestionType, // 0=task, 1=checklist, 2=mixed
      timezone
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get user's suggestion history
 */
export const getSuggestions = async (params = {}) => {
  try {
    const response = await api.get('/api/ai-suggestions', { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Accept a suggestion
 */
export const acceptSuggestion = async (suggestionId) => {
  try {
    const response = await api.patch(`/api/ai-suggestions/${suggestionId}/status`, {
      status: 1 // 1=accepted
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Reject a suggestion
 */
export const rejectSuggestion = async (suggestionId) => {
  try {
    const response = await api.patch(`/api/ai-suggestions/${suggestionId}/status`, {
      status: 2 // 2=rejected
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
```

### Step 4: Create React Component

```javascript
// components/AISuggestions.jsx
import React, { useState } from 'react';
import { generateSuggestion, acceptSuggestion, rejectSuggestion } from '../services/aiSuggestionsService';

const AISuggestions = () => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState(null);

  const handleGenerateSuggestions = async (type) => {
    setLoading(true);
    setError(null);

    try {
      const response = await generateSuggestion(
        type, 
        Intl.DateTimeFormat().resolvedOptions().timeZone
      );
      
      setSuggestions(response.items);
    } catch (error) {
      if (error.response?.status === 429) {
        setError('Too many requests. Please wait a few minutes.');
      } else if (error.response?.status === 503) {
        setError('AI service is temporarily unavailable.');
      } else {
        setError('Failed to generate suggestions.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptSuggestion = async (suggestionId) => {
    try {
      await acceptSuggestion(suggestionId);
      // Update UI to show accepted state
      setSuggestions(prev => 
        prev.map(item => 
          item.suggestion_id === suggestionId 
            ? { ...item, status: 1 }
            : item
        )
      );
    } catch (error) {
      setError('Failed to accept suggestion.');
    }
  };

  const handleRejectSuggestion = async (suggestionId) => {
    try {
      await rejectSuggestion(suggestionId);
      // Update UI to show rejected state
      setSuggestions(prev => 
        prev.map(item => 
          item.suggestion_id === suggestionId 
            ? { ...item, status: 2 }
            : item
        )
      );
    } catch (error) {
      setError('Failed to reject suggestion.');
    }
  };

  return (
    <div className="ai-suggestions">
      <h2>AI Suggestions</h2>
      
      <div className="suggestion-buttons">
        <button 
          onClick={() => handleGenerateSuggestions(0)}
          disabled={loading}
        >
          Generate Tasks
        </button>
        <button 
          onClick={() => handleGenerateSuggestions(1)}
          disabled={loading}
        >
          Generate Checklist
        </button>
        <button 
          onClick={() => handleGenerateSuggestions(2)}
          disabled={loading}
        >
          Generate Mixed
        </button>
      </div>

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          Generating suggestions...
        </div>
      )}

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      <div className="suggestions-list">
        {suggestions.map((item, index) => (
          <div key={index} className="suggestion-card">
            <div className="card-header">
              <h3>{item.title}</h3>
              <span className="item-type">
                {item.item_type === 0 ? '📝 Task' : '✅ Checklist'}
              </span>
            </div>
            
            <div className="card-content">
              <p>{item.description}</p>
              <div className="card-meta">
                <span className="estimated-time">
                  {item.estimated_minutes} minutes
                </span>
                {item.deadline && (
                  <span className="deadline">
                    Due: {new Date(item.deadline).toLocaleDateString()}
                  </span>
                )}
              </div>
              
              {item.metadata.tags && (
                <div className="tags">
                  {item.metadata.tags.map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              )}
            </div>
            
            <div className="card-actions">
              <button 
                className="btn-accept"
                onClick={() => handleAcceptSuggestion(item.suggestion_id)}
              >
                Accept
              </button>
              <button 
                className="btn-reject"
                onClick={() => handleRejectSuggestion(item.suggestion_id)}
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AISuggestions;
```

### Step 5: Add Basic Styling

```css
/* styles/aiSuggestions.css */
.ai-suggestions {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.suggestion-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.suggestion-buttons button {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  background: #007bff;
  color: white;
  cursor: pointer;
  transition: background 0.2s;
}

.suggestion-buttons button:hover:not(:disabled) {
  background: #0056b3;
}

.suggestion-buttons button:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.loading {
  text-align: center;
  padding: 20px;
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #007bff;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
  margin: 0 auto 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  background: #f8d7da;
  color: #721c24;
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 20px;
}

.suggestions-list {
  display: grid;
  gap: 20px;
}

.suggestion-card {
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 20px;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.card-header h3 {
  margin: 0;
  color: #333;
}

.item-type {
  background: #e9ecef;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.card-content p {
  color: #666;
  margin-bottom: 15px;
}

.card-meta {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  font-size: 14px;
  color: #666;
}

.tags {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.tag {
  background: #007bff;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.card-actions {
  display: flex;
  gap: 10px;
}

.btn-accept, .btn-reject {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-accept {
  background: #28a745;
  color: white;
}

.btn-accept:hover {
  background: #218838;
}

.btn-reject {
  background: #dc3545;
  color: white;
}

.btn-reject:hover {
  background: #c82333;
}
```

---

## Advanced Usage

### Custom Hook Implementation

```javascript
// hooks/useAISuggestions.js
import { useState, useCallback } from 'react';
import { generateSuggestion, acceptSuggestion, rejectSuggestion } from '../services/aiSuggestionsService';

export const useAISuggestions = () => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState(null);
  const [rateLimitInfo, setRateLimitInfo] = useState(null);

  const generateSuggestions = useCallback(async (type) => {
    setLoading(true);
    setError(null);

    try {
      const response = await generateSuggestion(
        type, 
        Intl.DateTimeFormat().resolvedOptions().timeZone
      );
      
      setSuggestions(response.items);
      
      // Update rate limit info from headers
      if (response.meta) {
        setRateLimitInfo({
          remaining: response.headers?.['x-ratelimit-remaining'],
          reset: response.headers?.['x-ratelimit-reset']
        });
      }
      
      return response;
    } catch (error) {
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const acceptSuggestionItem = useCallback(async (suggestionId) => {
    try {
      await acceptSuggestion(suggestionId);
      setSuggestions(prev => 
        prev.map(item => 
          item.suggestion_id === suggestionId 
            ? { ...item, status: 1 }
            : item
        )
      );
    } catch (error) {
      setError(error);
      throw error;
    }
  }, []);

  const rejectSuggestionItem = useCallback(async (suggestionId) => {
    try {
      await rejectSuggestion(suggestionId);
      setSuggestions(prev => 
        prev.map(item => 
          item.suggestion_id === suggestionId 
            ? { ...item, status: 2 }
            : item
        )
      );
    } catch (error) {
      setError(error);
      throw error;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    suggestions,
    error,
    rateLimitInfo,
    generateSuggestions,
    acceptSuggestionItem,
    rejectSuggestionItem,
    clearError
  };
};
```

### Error Handling with Retry Logic

```javascript
// utils/retryLogic.js
export const retryRequest = async (requestFn, maxRetries = 3) => {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await requestFn();
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
};

// Usage
const generateSuggestionsWithRetry = async (type) => {
  return retryRequest(() => generateSuggestion(type, 'Asia/Ho_Chi_Minh'));
};
```

### Caching Implementation

```javascript
// utils/suggestionCache.js
class SuggestionCache {
  constructor(maxAge = 5 * 60 * 1000) { // 5 minutes default
    this.cache = new Map();
    this.maxAge = maxAge;
  }

  get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clear() {
    this.cache.clear();
  }
}

const suggestionCache = new SuggestionCache();

// Usage in service
export const generateSuggestionWithCache = async (suggestionType, timezone) => {
  const cacheKey = `${suggestionType}-${timezone}`;
  
  // Check cache first
  const cached = suggestionCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Generate new suggestions
  const response = await generateSuggestion(suggestionType, timezone);
  
  // Cache the response
  suggestionCache.set(cacheKey, response);
  
  return response;
};
```

---

## Common Patterns

### Rate Limit Handling

```javascript
// components/RateLimitHandler.jsx
import React, { useState, useEffect } from 'react';

const RateLimitHandler = ({ retryAfter, onRetry }) => {
  const [timeLeft, setTimeLeft] = useState(retryAfter);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const minutes = Math.ceil(timeLeft / 60);

  return (
    <div className="rate-limit-modal">
      <div className="modal-content">
        <h3>Rate Limit Exceeded</h3>
        <p>You've reached the limit of 20 AI suggestions per 15 minutes.</p>
        <p>Please wait <strong>{minutes} minutes</strong> before trying again.</p>
        
        <div className="countdown">
          <div className="countdown-circle">
            <span>{minutes}</span>
          </div>
        </div>
        
        <button 
          className="btn-primary"
          onClick={onRetry}
          disabled={timeLeft > 0}
        >
          {timeLeft > 0 ? `Retry in ${minutes}m` : 'Try Again'}
        </button>
      </div>
    </div>
  );
};
```

### Loading States

```javascript
// components/LoadingStates.jsx
import React from 'react';

export const SkeletonLoader = () => (
  <div className="skeleton-loader">
    <div className="skeleton-header">
      <div className="skeleton-title"></div>
      <div className="skeleton-type"></div>
    </div>
    <div className="skeleton-content">
      <div className="skeleton-line"></div>
      <div className="skeleton-line short"></div>
    </div>
    <div className="skeleton-actions">
      <div className="skeleton-button"></div>
      <div className="skeleton-button"></div>
    </div>
  </div>
);

export const ProgressIndicator = ({ progress }) => (
  <div className="progress-indicator">
    <div className="progress-bar">
      <div 
        className="progress-fill" 
        style={{ width: `${progress}%` }}
      ></div>
    </div>
    <div className="progress-text">
      {progress < 30 && "Analyzing your schedule..."}
      {progress >= 30 && progress < 70 && "Generating suggestions..."}
      {progress >= 70 && "Finalizing recommendations..."}
    </div>
  </div>
);
```

### Error Boundaries

```javascript
// components/AIErrorBoundary.jsx
import React from 'react';

class AIErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('AI Suggestions Error:', error, errorInfo);
    
    // Send to error tracking service
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: false
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-icon">⚠️</div>
          <h2>Something went wrong with AI Suggestions</h2>
          <p>Please refresh the page or try again later.</p>
          <button 
            className="btn-primary"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AIErrorBoundary;
```

---

## Best Practices

### 1. Error Handling
- Always handle API errors gracefully
- Show user-friendly error messages
- Implement retry logic for transient errors
- Log errors for debugging

### 2. Performance
- Implement request debouncing
- Use loading states to improve UX
- Cache suggestions when appropriate
- Cancel requests when component unmounts

### 3. User Experience
- Show confidence scores to users
- Display AI reasoning/explanations
- Implement optimistic updates
- Provide clear feedback for all actions

### 4. Security
- Always include JWT token in requests
- Validate responses before displaying
- Handle authentication errors
- Don't expose sensitive information

### 5. Testing
- Mock API responses in tests
- Test error scenarios
- Test loading states
- Test user interactions

---

## Troubleshooting

### Common Issues

#### 1. Authentication Errors (401)
```javascript
// Check if token exists and is valid
const token = localStorage.getItem('jwtToken');
if (!token) {
  // Redirect to login
  window.location.href = '/login';
}
```

#### 2. Rate Limiting (429)
```javascript
// Handle rate limiting gracefully
if (error.response?.status === 429) {
  const retryAfter = error.response.data.retryAfter;
  showRateLimitMessage(retryAfter);
}
```

#### 3. Service Unavailable (503)
```javascript
// Provide fallback options
if (error.response?.status === 503) {
  showServiceUnavailableMessage();
  enableOfflineMode();
}
```

#### 4. Network Errors
```javascript
// Handle network issues
if (!navigator.onLine) {
  showOfflineMessage();
  enableOfflineMode();
}
```

### Debug Tips

1. **Check Network Tab**: Look for failed requests và error responses
2. **Console Logs**: Add logging để track request flow
3. **Error Details**: Log error objects để see full details
4. **Request IDs**: Use request IDs để correlate errors với server logs

---

## Next Steps

Sau khi hoàn thành basic integration:

1. **Read Full Documentation**: Xem [API Endpoints Guide](./AI_SUGGESTIONS_API_ENDPOINTS.md)
2. **Implement Error Handling**: Xem [Error Handling Guide](./AI_SUGGESTIONS_ERROR_HANDLING.md)
3. **Add Advanced Features**: Xem [Frontend Integration Guide](./AI_SUGGESTIONS_FRONTEND_INTEGRATION.md)
4. **Write Tests**: Xem [Testing Guide](./AI_SUGGESTIONS_TESTING.md)
5. **Use TypeScript**: Xem [TypeScript Types](./AI_SUGGESTIONS_TYPES.md)

Chúc bạn integrate thành công! 🚀
