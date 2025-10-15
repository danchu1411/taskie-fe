# AI Suggestions Frontend Integration Guide

## Overview

Tài liệu này cung cấp best practices và patterns để integrate AI Suggestions API vào frontend applications, bao gồm state management, UI/UX recommendations, performance optimizations, và **Manual Input Mode** mới.

---

## New Features for Frontend

### 1. Manual Input Mode
Cho phép user nhập task/checklist cụ thể và nhận slot suggestions từ AI.

#### Implementation Example
```typescript
interface ManualInput {
  title: string;
  description?: string;
  duration_minutes: number; // 15-180, multiple of 15
  deadline?: string; // ISO 8601
  preferred_window?: [string, string]; // [start, end] ISO 8601
  target_task_id?: string; // For checklist items
}

// API Call
const generateSuggestionWithManualInput = async (manualInput: ManualInput) => {
  const response = await fetch('/api/ai-suggestions/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      suggestionType: manualInput.target_task_id ? 1 : 0, // Checklist if has parent task
      manual_input: manualInput,
      timezone: userTimezone
    })
  });
  
  return response.json();
};
```

### 2. Enhanced Response Format
```typescript
interface SuggestionItem {
  item_type: 0 | 1;
  title: string;
  description: string;
  estimated_minutes: number;
  deadline?: string;
  suggested_slots?: SuggestedSlot[]; // NEW: Slot suggestions
  metadata: {
    source?: 'manual_input' | 'auto_suggestion';
    adjusted_duration?: boolean;
    original_duration?: number;
    [key: string]: any;
  };
}

interface SuggestedSlot {
  suggested_start_at: string; // ISO 8601
  planned_minutes: number;
  confidence: number; // 0.0-1.0
  reason: string;
  original_index: number; // For frontend mapping
}
```

### 3. Improved Confidence Scores
- **Context-aware**: Confidence dựa trên context quality
- **Realistic range**: 0.1-1.0 với meaningful distribution
- **Manual input boost**: Manual input có confidence cao hơn

---

## State Management

### React State Pattern

#### Basic State Structure
```typescript
interface SuggestionState {
  loading: boolean;
  suggestions: Suggestion[];
  currentSuggestion: Suggestion | null;
  error: Error | null;
  rateLimitInfo: {
    remaining: number;
    reset: number;
  } | null;
}

interface Suggestion {
  suggestion_id: string;
  suggestion_type: 0 | 1 | 2;
  status: 0 | 1 | 2;
  items: SuggestionItem[];
  confidence: number;
  reason: string;
  created_at: string;
  updated_at?: string;
}

interface SuggestionItem {
  item_type: 0 | 1;
  title: string;
  description: string;
  estimated_minutes: number;
  deadline?: string;
  metadata: {
    priority?: number;
    tags?: string[];
    task_id?: string;
    [key: string]: any;
  };
}
```

#### State Management Hook
```typescript
import { useState, useCallback } from 'react';

const useAISuggestions = () => {
  const [state, setState] = useState<SuggestionState>({
    loading: false,
    suggestions: [],
    currentSuggestion: null,
    error: null,
    rateLimitInfo: null
  });

  const generateSuggestion = useCallback(async (type: 0 | 1 | 2) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await api.post('/api/ai-suggestions/generate', {
        suggestionType: type,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
      
      setState(prev => ({
        ...prev,
        currentSuggestion: response.data,
        loading: false,
        rateLimitInfo: {
          remaining: parseInt(response.headers['x-ratelimit-remaining']),
          reset: parseInt(response.headers['x-ratelimit-reset'])
        }
      }));
      
      return response.data;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error,
        loading: false
      }));
      throw error;
    }
  }, []);

  const acceptSuggestion = useCallback(async (suggestionId: string) => {
    try {
      await api.patch(`/api/ai-suggestions/${suggestionId}/status`, {
        status: 1
      });
      
      setState(prev => ({
        ...prev,
        suggestions: prev.suggestions.map(s => 
          s.suggestion_id === suggestionId 
            ? { ...s, status: 1 }
            : s
        ),
        currentSuggestion: prev.currentSuggestion?.suggestion_id === suggestionId
          ? { ...prev.currentSuggestion, status: 1 }
          : prev.currentSuggestion
      }));
    } catch (error) {
      setState(prev => ({ ...prev, error }));
      throw error;
    }
  }, []);

  const rejectSuggestion = useCallback(async (suggestionId: string) => {
    try {
      await api.patch(`/api/ai-suggestions/${suggestionId}/status`, {
        status: 2
      });
      
      setState(prev => ({
        ...prev,
        suggestions: prev.suggestions.map(s => 
          s.suggestion_id === suggestionId 
            ? { ...s, status: 2 }
            : s
        ),
        currentSuggestion: prev.currentSuggestion?.suggestion_id === suggestionId
          ? { ...prev.currentSuggestion, status: 2 }
          : prev.currentSuggestion
      }));
    } catch (error) {
      setState(prev => ({ ...prev, error }));
      throw error;
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    generateSuggestion,
    acceptSuggestion,
    rejectSuggestion,
    clearError
  };
};
```

### Redux Pattern

#### Actions
```typescript
// actions/aiSuggestions.ts
export const AI_SUGGESTIONS_ACTIONS = {
  GENERATE_REQUEST: 'AI_SUGGESTIONS/GENERATE_REQUEST',
  GENERATE_SUCCESS: 'AI_SUGGESTIONS/GENERATE_SUCCESS',
  GENERATE_FAILURE: 'AI_SUGGESTIONS/GENERATE_FAILURE',
  ACCEPT_REQUEST: 'AI_SUGGESTIONS/ACCEPT_REQUEST',
  ACCEPT_SUCCESS: 'AI_SUGGESTIONS/ACCEPT_SUCCESS',
  ACCEPT_FAILURE: 'AI_SUGGESTIONS/ACCEPT_FAILURE',
  REJECT_REQUEST: 'AI_SUGGESTIONS/REJECT_REQUEST',
  REJECT_SUCCESS: 'AI_SUGGESTIONS/REJECT_SUCCESS',
  REJECT_FAILURE: 'AI_SUGGESTIONS/REJECT_FAILURE',
  CLEAR_ERROR: 'AI_SUGGESTIONS/CLEAR_ERROR'
} as const;

export const generateSuggestion = (type: 0 | 1 | 2) => async (dispatch: Dispatch) => {
  dispatch({ type: AI_SUGGESTIONS_ACTIONS.GENERATE_REQUEST });
  
  try {
    const response = await api.post('/api/ai-suggestions/generate', {
      suggestionType: type,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
    
    dispatch({
      type: AI_SUGGESTIONS_ACTIONS.GENERATE_SUCCESS,
      payload: response.data
    });
  } catch (error) {
    dispatch({
      type: AI_SUGGESTIONS_ACTIONS.GENERATE_FAILURE,
      payload: error
    });
  }
};

export const acceptSuggestion = (suggestionId: string) => async (dispatch: Dispatch) => {
  dispatch({ type: AI_SUGGESTIONS_ACTIONS.ACCEPT_REQUEST, payload: suggestionId });
  
  try {
    await api.patch(`/api/ai-suggestions/${suggestionId}/status`, {
      status: 1
    });
    
    dispatch({
      type: AI_SUGGESTIONS_ACTIONS.ACCEPT_SUCCESS,
      payload: suggestionId
    });
  } catch (error) {
    dispatch({
      type: AI_SUGGESTIONS_ACTIONS.ACCEPT_FAILURE,
      payload: { suggestionId, error }
    });
  }
};
```

#### Reducer
```typescript
// reducers/aiSuggestions.ts
interface AISuggestionsState {
  loading: boolean;
  suggestions: Suggestion[];
  currentSuggestion: Suggestion | null;
  error: Error | null;
  rateLimitInfo: RateLimitInfo | null;
}

const initialState: AISuggestionsState = {
  loading: false,
  suggestions: [],
  currentSuggestion: null,
  error: null,
  rateLimitInfo: null
};

export const aiSuggestionsReducer = (
  state = initialState,
  action: AISuggestionsAction
): AISuggestionsState => {
  switch (action.type) {
    case AI_SUGGESTIONS_ACTIONS.GENERATE_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
      
    case AI_SUGGESTIONS_ACTIONS.GENERATE_SUCCESS:
      return {
        ...state,
        loading: false,
        currentSuggestion: action.payload,
        error: null
      };
      
    case AI_SUGGESTIONS_ACTIONS.GENERATE_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
      
    case AI_SUGGESTIONS_ACTIONS.ACCEPT_SUCCESS:
      return {
        ...state,
        suggestions: state.suggestions.map(s => 
          s.suggestion_id === action.payload 
            ? { ...s, status: 1 }
            : s
        ),
        currentSuggestion: state.currentSuggestion?.suggestion_id === action.payload
          ? { ...state.currentSuggestion, status: 1 }
          : state.currentSuggestion
      };
      
    case AI_SUGGESTIONS_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
      
    default:
      return state;
  }
};
```

---

## UI/UX Recommendations

### Loading States

#### Skeleton Loading
```typescript
const SuggestionSkeleton = () => (
  <div className="suggestion-skeleton">
    <div className="skeleton-header">
      <div className="skeleton-title"></div>
      <div className="skeleton-confidence"></div>
    </div>
    <div className="skeleton-items">
      {[1, 2, 3].map(i => (
        <div key={i} className="skeleton-item">
          <div className="skeleton-item-title"></div>
          <div className="skeleton-item-description"></div>
          <div className="skeleton-item-meta"></div>
        </div>
      ))}
    </div>
  </div>
);
```

#### Progress Indicator
```typescript
const AIGenerationProgress = ({ progress }: { progress: number }) => (
  <div className="ai-progress">
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

### Confidence Display

#### Confidence Badge
```typescript
const ConfidenceBadge = ({ confidence }: { confidence: number }) => {
  const getConfidenceLevel = (conf: number) => {
    if (conf >= 0.8) return { level: 'High', color: 'green' };
    if (conf >= 0.6) return { level: 'Medium', color: 'yellow' };
    return { level: 'Low', color: 'red' };
  };
  
  const { level, color } = getConfidenceLevel(confidence);
  
  return (
    <div className={`confidence-badge confidence-${color}`}>
      <span className="confidence-icon">🎯</span>
      <span className="confidence-text">{level} Confidence</span>
      <span className="confidence-score">{Math.round(confidence * 100)}%</span>
    </div>
  );
};
```

#### AI Reasoning Display
```typescript
const AIReasoning = ({ reason }: { reason: string }) => (
  <div className="ai-reasoning">
    <div className="reasoning-header">
      <span className="reasoning-icon">🤖</span>
      <span className="reasoning-title">AI Explanation</span>
    </div>
    <div className="reasoning-content">
      {reason}
    </div>
  </div>
);
```

### Suggestion Cards

#### Task Suggestion Card
```typescript
const TaskSuggestionCard = ({ 
  item, 
  onAccept, 
  onReject 
}: { 
  item: SuggestionItem;
  onAccept: () => void;
  onReject: () => void;
}) => (
  <div className="suggestion-card task-card">
    <div className="card-header">
      <div className="card-type">
        <span className="type-icon">📝</span>
        <span className="type-label">Task</span>
      </div>
      <div className="card-meta">
        <span className="estimated-time">{item.estimated_minutes} min</span>
        {item.deadline && (
          <span className="deadline">
            Due: {new Date(item.deadline).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
    
    <div className="card-content">
      <h3 className="card-title">{item.title}</h3>
      <p className="card-description">{item.description}</p>
      
      {item.metadata.tags && (
        <div className="card-tags">
          {item.metadata.tags.map(tag => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
      )}
    </div>
    
    <div className="card-actions">
      <button 
        className="btn-accept"
        onClick={onAccept}
      >
        Accept
      </button>
      <button 
        className="btn-reject"
        onClick={onReject}
      >
        Reject
      </button>
    </div>
  </div>
);
```

#### Checklist Suggestion Card
```typescript
const ChecklistSuggestionCard = ({ 
  item, 
  onAccept, 
  onReject 
}: { 
  item: SuggestionItem;
  onAccept: () => void;
  onReject: () => void;
}) => (
  <div className="suggestion-card checklist-card">
    <div className="card-header">
      <div className="card-type">
        <span className="type-icon">✅</span>
        <span className="type-label">Checklist Item</span>
      </div>
      <div className="card-meta">
        <span className="estimated-time">{item.estimated_minutes} min</span>
        {item.metadata.task_id && (
          <span className="parent-task">
            Part of: {getTaskTitle(item.metadata.task_id)}
          </span>
        )}
      </div>
    </div>
    
    <div className="card-content">
      <h3 className="card-title">{item.title}</h3>
      <p className="card-description">{item.description}</p>
      
      {item.metadata.priority && (
        <div className="priority-indicator">
          Priority: {item.metadata.priority}/5
        </div>
      )}
    </div>
    
    <div className="card-actions">
      <button 
        className="btn-accept"
        onClick={onAccept}
      >
        Add to Checklist
      </button>
      <button 
        className="btn-reject"
        onClick={onReject}
      >
        Skip
      </button>
    </div>
  </div>
);
```

### Rate Limiting UI

#### Rate Limit Warning
```typescript
const RateLimitWarning = ({ 
  remaining, 
  reset 
}: { 
  remaining: number;
  reset: number;
}) => {
  const [timeLeft, setTimeLeft] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      setTimeLeft(Math.max(0, reset - now));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [reset]);
  
  if (remaining > 5) return null;
  
  return (
    <div className="rate-limit-warning">
      <div className="warning-icon">⚠️</div>
      <div className="warning-content">
        <div className="warning-title">Rate Limit Warning</div>
        <div className="warning-text">
          {remaining} requests remaining
          {timeLeft > 0 && (
            <span className="reset-time">
              (resets in {Math.ceil(timeLeft / 60)} minutes)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
```

#### Rate Limit Modal
```typescript
const RateLimitModal = ({ 
  retryAfter, 
  onClose 
}: { 
  retryAfter: number;
  onClose: () => void;
}) => {
  const [timeLeft, setTimeLeft] = useState(retryAfter);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  const minutes = Math.ceil(timeLeft / 60);
  
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Rate Limit Exceeded</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="rate-limit-icon">⏰</div>
          <p>
            You've reached the limit of 20 AI suggestions per 15 minutes.
          </p>
          <p>
            Please wait <strong>{minutes} minutes</strong> before trying again.
          </p>
          
          <div className="countdown-timer">
            <div className="timer-circle">
              <span className="timer-text">{minutes}</span>
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn-primary" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

## Performance Optimizations

### Request Optimization

#### Debounced Requests
```typescript
import { useCallback, useRef } from 'react';

const useDebouncedRequest = (delay: number = 300) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const debouncedRequest = useCallback((requestFn: () => Promise<void>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(requestFn, delay);
  }, [delay]);
  
  return debouncedRequest;
};

// Usage
const debouncedGenerate = useDebouncedRequest(500);

const handleSuggestionTypeChange = (type: number) => {
  debouncedGenerate(() => generateSuggestion(type));
};
```

#### Request Cancellation
```typescript
import { useRef, useCallback } from 'react';

const useCancellableRequest = () => {
  const abortControllerRef = useRef<AbortController>();
  
  const makeRequest = useCallback(async (requestFn: (signal: AbortSignal) => Promise<any>) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    try {
      return await requestFn(abortControllerRef.current.signal);
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request cancelled');
      }
      throw error;
    }
  }, []);
  
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);
  
  return { makeRequest, cancelRequest };
};

// Usage
const { makeRequest, cancelRequest } = useCancellableRequest();

const generateSuggestion = async (type: number) => {
  try {
    const response = await makeRequest(signal => 
      api.post('/api/ai-suggestions/generate', {
        suggestionType: type,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }, { signal })
    );
    
    setSuggestions(response.data.items);
  } catch (error) {
    if (error.message !== 'Request cancelled') {
      setError(error);
    }
  }
};
```

### Caching

#### Local Storage Cache
```typescript
const useSuggestionCache = () => {
  const CACHE_KEY = 'ai_suggestions_cache';
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  
  const getCachedSuggestions = useCallback((type: number) => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;
      
      const { data, timestamp } = JSON.parse(cached);
      
      // Check if cache is expired
      if (Date.now() - timestamp > CACHE_DURATION) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }
      
      // Return cached suggestions for the same type
      return data[type] || null;
    } catch (error) {
      console.error('Error reading cache:', error);
      return null;
    }
  }, []);
  
  const setCachedSuggestions = useCallback((type: number, suggestions: SuggestionItem[]) => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const data = cached ? JSON.parse(cached).data : {};
      
      data[type] = suggestions;
      
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error writing cache:', error);
    }
  }, []);
  
  return { getCachedSuggestions, setCachedSuggestions };
};
```

#### Memory Cache
```typescript
class SuggestionCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private maxAge = 5 * 60 * 1000; // 5 minutes
  
  get(key: string) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }
  
  set(key: string, data: any) {
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
```

### Optimistic Updates

#### Optimistic Suggestion Acceptance
```typescript
const useOptimisticUpdates = () => {
  const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, any>>(new Map());
  
  const optimisticAccept = useCallback((suggestionId: string) => {
    // Update UI immediately
    setOptimisticUpdates(prev => new Map(prev).set(suggestionId, { status: 1 }));
    
    // Make API call
    return api.patch(`/api/ai-suggestions/${suggestionId}/status`, { status: 1 })
      .then(() => {
        // Remove optimistic update on success
        setOptimisticUpdates(prev => {
          const newMap = new Map(prev);
          newMap.delete(suggestionId);
          return newMap;
        });
      })
      .catch(error => {
        // Revert optimistic update on failure
        setOptimisticUpdates(prev => {
          const newMap = new Map(prev);
          newMap.delete(suggestionId);
          return newMap;
        });
        throw error;
      });
  }, []);
  
  return { optimisticAccept, optimisticUpdates };
};
```

---

## Error Handling Patterns

### Error Boundary
```typescript
class AISuggestionsErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service
    console.error('AI Suggestions Error:', error, errorInfo);
    
    // Send to error tracking
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
```

### Retry Logic
```typescript
const useRetryLogic = (maxRetries: number = 3) => {
  const [retryCount, setRetryCount] = useState(0);
  
  const retry = useCallback(async (requestFn: () => Promise<any>) => {
    try {
      const result = await requestFn();
      setRetryCount(0); // Reset on success
      return result;
    } catch (error) {
      if (retryCount < maxRetries && shouldRetry(error)) {
        setRetryCount(prev => prev + 1);
        
        // Exponential backoff
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return retry(requestFn);
      }
      
      throw error;
    }
  }, [retryCount, maxRetries]);
  
  const shouldRetry = (error: any) => {
    // Retry on server errors and rate limits
    return error.response?.status >= 500 || error.response?.status === 429;
  };
  
  return { retry, retryCount };
};
```

---

## Testing Patterns

### Mock API Responses
```typescript
// __mocks__/aiSuggestionsApi.ts
export const mockAISuggestionsApi = {
  generateSuggestion: jest.fn(),
  getSuggestions: jest.fn(),
  updateSuggestionStatus: jest.fn()
};

// Mock successful response
mockAISuggestionsApi.generateSuggestion.mockResolvedValue({
  data: {
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
  }
});

// Mock error response
mockAISuggestionsApi.generateSuggestion.mockRejectedValue({
  response: {
    status: 429,
    data: {
      message: 'Too many requests',
      retryAfter: 900
    }
  }
});
```

### Component Testing
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AISuggestions } from './AISuggestions';

describe('AISuggestions Component', () => {
  it('should generate suggestions when button is clicked', async () => {
    render(<AISuggestions />);
    
    const generateButton = screen.getByText('Generate Tasks');
    fireEvent.click(generateButton);
    
    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });
  });
  
  it('should handle rate limiting error', async () => {
    mockAISuggestionsApi.generateSuggestion.mockRejectedValueOnce({
      response: {
        status: 429,
        data: { message: 'Too many requests', retryAfter: 900 }
      }
    });
    
    render(<AISuggestions />);
    
    const generateButton = screen.getByText('Generate Tasks');
    fireEvent.click(generateButton);
    
    await waitFor(() => {
      expect(screen.getByText(/too many requests/i)).toBeInTheDocument();
    });
  });
});
```

---

## Best Practices Summary

### 1. State Management
- Use consistent state structure
- Implement proper error handling
- Handle loading states gracefully
- Update state optimistically when possible

### 2. User Experience
- Show loading indicators during AI generation
- Display confidence scores và AI reasoning
- Implement proper error messages
- Provide retry mechanisms

### 3. Performance
- Implement request debouncing
- Use request cancellation
- Cache suggestions locally
- Optimize re-renders

### 4. Error Handling
- Implement error boundaries
- Handle all error scenarios
- Provide fallback options
- Log errors for debugging

### 5. Testing
- Mock API responses
- Test error scenarios
- Test loading states
- Test user interactions
