# AI Suggestions API Examples

## Overview

Tài liệu này cung cấp các ví dụ thực tế về cách sử dụng AI Suggestions API, bao gồm request/response examples cho các use cases phổ biến.

---

## Example 1: Generate Task Suggestions

### Scenario
User muốn AI đề xuất các task mới dựa trên lịch trình và thời gian rảnh của họ.

### Request
```javascript
const response = await fetch('/api/ai-suggestions/generate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    suggestionType: 0,  // Task suggestions
    timezone: 'Asia/Ho_Chi_Minh'
  })
});

const data = await response.json();
```

### Response
```javascript
{
  "suggestion_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "550e8400-e29b-41d4-a716-446655440001",
  "suggestion_type": 0,
  "status": 0,
  "items": [
    {
      "item_type": 0,
      "title": "Luyện tập bài tập Toán",
      "description": "Làm các bài tập từ chương 1-3 trong sách giáo khoa để củng cố kiến thức",
      "estimated_minutes": 90,
      "deadline": "2025-09-25T10:30:00Z",
      "metadata": {
        "priority": 1,
        "tags": ["study", "math"],
        "subject": "Toán học"
      }
    },
    {
      "item_type": 0,
      "title": "Tập thể dục buổi sáng",
      "description": "Chạy bộ 30 phút và tập các động tác khởi động để duy trì sức khỏe",
      "estimated_minutes": 45,
      "deadline": "2025-09-25T07:00:00Z",
      "metadata": {
        "priority": 2,
        "tags": ["health", "exercise"],
        "activity_type": "cardio"
      }
    }
  ],
  "confidence": 0.9,
  "reason": "Dựa trên lịch trình hiện tại và thời gian rảnh, tôi đề xuất các task này để tối ưu hóa thời gian học tập và sức khỏe. Task Toán học phù hợp với thời gian rảnh buổi sáng, còn tập thể dục giúp duy trì năng lượng cho cả ngày.",
  "created_at": "2025-01-01T00:00:00Z",
  "meta": {
    "requestId": "req_550e8400-e29b-41d4-a716-446655440002",
    "model": "gemini-2.5-flash-lite",
    "provider": "gemini",
    "latency_ms": 5234,
    "cost": 0.000156
  }
}
```

### Frontend Implementation
```javascript
async function generateTaskSuggestions() {
  try {
    setLoading(true);
    
    const response = await api.post('/api/ai-suggestions/generate', {
      suggestionType: 0,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
    
    // Display suggestions to user
    setSuggestions(response.data.items);
    setConfidence(response.data.confidence);
    setReason(response.data.reason);
    
  } catch (error) {
    if (error.response?.status === 429) {
      showMessage('Too many requests. Please wait a few minutes.');
    } else {
      showMessage('Failed to generate suggestions');
    }
  } finally {
    setLoading(false);
  }
}
```

---

## Example 2: Generate Checklist for Existing Task

### Scenario
User có một task phức tạp "Ôn thi Toán" và muốn AI chia nhỏ thành các checklist items.

### Request
```javascript
const response = await fetch('/api/ai-suggestions/generate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    suggestionType: 1,  // Checklist suggestions
    timezone: 'Asia/Ho_Chi_Minh'
  })
});

const data = await response.json();
```

### Response
```javascript
{
  "suggestion_id": "550e8400-e29b-41d4-a716-446655440001",
  "user_id": "550e8400-e29b-41d4-a716-446655440001",
  "suggestion_type": 1,
  "status": 0,
  "items": [
    {
      "item_type": 1,
      "title": "Ôn tập lý thuyết chương 1-3",
      "description": "Đọc lại các định nghĩa, công thức và ví dụ từ chương 1 đến 3",
      "estimated_minutes": 60,
      "metadata": {
        "task_id": "550e8400-e29b-41d4-a716-446655440010",
        "priority": 1,
        "tags": ["theory", "review"]
      }
    },
    {
      "item_type": 1,
      "title": "Làm bài tập cơ bản",
      "description": "Làm các bài tập từ sách giáo khoa để củng cố kiến thức",
      "estimated_minutes": 90,
      "metadata": {
        "task_id": "550e8400-e29b-41d4-a716-446655440010",
        "priority": 2,
        "tags": ["practice", "basic"]
      }
    },
    {
      "item_type": 1,
      "title": "Làm đề thi thử",
      "description": "Làm 2-3 đề thi thử để kiểm tra kiến thức và làm quen với format",
      "estimated_minutes": 120,
      "metadata": {
        "task_id": "550e8400-e29b-41d4-a716-446655440010",
        "priority": 3,
        "tags": ["exam", "practice"]
      }
    }
  ],
  "confidence": 0.85,
  "reason": "Tôi đã chia task 'Ôn thi Toán' thành 3 bước logic: ôn lý thuyết trước, sau đó làm bài tập cơ bản, cuối cùng là đề thi thử. Cách tiếp cận này giúp củng cố kiến thức từ cơ bản đến nâng cao.",
  "created_at": "2025-01-01T00:00:00Z",
  "meta": {
    "requestId": "req_550e8400-e29b-41d4-a716-446655440003",
    "model": "gemini-2.5-flash-lite",
    "provider": "gemini",
    "latency_ms": 7890,
    "cost": 0.000198
  }
}
```

### Frontend Implementation
```javascript
async function generateChecklistSuggestions(parentTaskId) {
  try {
    setLoading(true);
    
    const response = await api.post('/api/ai-suggestions/generate', {
      suggestionType: 1,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
    
    // Filter items that belong to the parent task
    const checklistItems = response.data.items.filter(
      item => item.metadata.task_id === parentTaskId
    );
    
    setChecklistItems(checklistItems);
    
  } catch (error) {
    handleError(error);
  } finally {
    setLoading(false);
  }
}
```

---

## Example 3: Generate Mixed Suggestions

### Scenario
User muốn AI đề xuất cả task mới và checklist cho task hiện tại trong một response.

### Request
```javascript
const response = await fetch('/api/ai-suggestions/generate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    suggestionType: 2,  // Mixed suggestions
    timezone: 'Asia/Ho_Chi_Minh'
  })
});

const data = await response.json();
```

### Response
```javascript
{
  "suggestion_id": "550e8400-e29b-41d4-a716-446655440002",
  "user_id": "550e8400-e29b-41d4-a716-446655440001",
  "suggestion_type": 2,
  "status": 0,
  "items": [
    {
      "item_type": 0,
      "title": "Học tiếng Anh mỗi ngày",
      "description": "Dành 30 phút mỗi ngày để học từ vựng và ngữ pháp tiếng Anh",
      "estimated_minutes": 30,
      "deadline": "2025-09-25T20:00:00Z",
      "metadata": {
        "priority": 2,
        "tags": ["language", "daily"],
        "subject": "Tiếng Anh"
      }
    },
    {
      "item_type": 1,
      "title": "Chuẩn bị bài thuyết trình",
      "description": "Tạo outline và slide cho bài thuyết trình tuần sau",
      "estimated_minutes": 45,
      "metadata": {
        "task_id": "550e8400-e29b-41d4-a716-446655440011",
        "priority": 1,
        "tags": ["presentation", "preparation"]
      }
    },
    {
      "item_type": 1,
      "title": "Luyện tập thuyết trình",
      "description": "Thực hành thuyết trình trước gương và ghi âm để cải thiện",
      "estimated_minutes": 30,
      "metadata": {
        "task_id": "550e8400-e29b-41d4-a716-446655440011",
        "priority": 2,
        "tags": ["practice", "presentation"]
      }
    }
  ],
  "confidence": 0.8,
  "reason": "Tôi đề xuất một task mới về học tiếng Anh hàng ngày để cải thiện kỹ năng ngôn ngữ, đồng thời chia nhỏ task thuyết trình thành 2 bước: chuẩn bị và luyện tập. Cách tiếp cận này giúp cân bằng giữa việc học mới và hoàn thành công việc hiện tại.",
  "created_at": "2025-01-01T00:00:00Z",
  "meta": {
    "requestId": "req_550e8400-e29b-41d4-a716-446655440004",
    "model": "gemini-2.5-flash-lite",
    "provider": "gemini",
    "latency_ms": 10234,
    "cost": 0.000234
  }
}
```

### Frontend Implementation
```javascript
async function generateMixedSuggestions() {
  try {
    setLoading(true);
    
    const response = await api.post('/api/ai-suggestions/generate', {
      suggestionType: 2,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
    
    // Separate tasks and checklist items
    const tasks = response.data.items.filter(item => item.item_type === 0);
    const checklistItems = response.data.items.filter(item => item.item_type === 1);
    
    setNewTasks(tasks);
    setChecklistItems(checklistItems);
    
  } catch (error) {
    handleError(error);
  } finally {
    setLoading(false);
  }
}
```

---

## Example 4: Get Suggestion History

### Scenario
User muốn xem lịch sử các suggestions đã tạo, chỉ hiển thị những suggestions chưa được xử lý.

### Request
```javascript
const response = await fetch('/api/ai-suggestions?status=0&limit=10&offset=0', {
  headers: {
    'Authorization': `Bearer ${jwtToken}`
  }
});

const data = await response.json();
```

### Response
```javascript
{
  "suggestions": [
    {
      "suggestion_id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "550e8400-e29b-41d4-a716-446655440001",
      "suggestion_type": 0,
      "status": 0,
      "items": [
        {
          "item_type": 0,
          "title": "Luyện tập bài tập Toán",
          "description": "Làm các bài tập từ chương 1-3",
          "estimated_minutes": 90,
          "deadline": "2025-09-25T10:30:00Z",
          "metadata": {
            "priority": 1,
            "tags": ["study", "math"]
          }
        }
      ],
      "confidence": 0.9,
      "reason": "Dựa trên lịch trình hiện tại...",
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": null
    },
    {
      "suggestion_id": "550e8400-e29b-41d4-a716-446655440001",
      "user_id": "550e8400-e29b-41d4-a716-446655440001",
      "suggestion_type": 1,
      "status": 0,
      "items": [
        {
          "item_type": 1,
          "title": "Ôn tập lý thuyết",
          "description": "Đọc lại các định nghĩa và công thức",
          "estimated_minutes": 60,
          "metadata": {
            "task_id": "550e8400-e29b-41d4-a716-446655440010",
            "priority": 1,
            "tags": ["theory", "review"]
          }
        }
      ],
      "confidence": 0.85,
      "reason": "Chia task phức tạp thành các bước nhỏ...",
      "created_at": "2025-01-01T00:05:00Z",
      "updated_at": null
    }
  ],
  "total": 25,
  "limit": 10,
  "offset": 0,
  "hasMore": true
}
```

### Frontend Implementation
```javascript
async function getSuggestionHistory(status = 0, page = 0) {
  try {
    const offset = page * 10;
    
    const response = await api.get('/api/ai-suggestions', {
      params: {
        status,
        limit: 10,
        offset
      }
    });
    
    setSuggestions(response.data.suggestions);
    setHasMore(response.data.hasMore);
    setTotal(response.data.total);
    
  } catch (error) {
    handleError(error);
  }
}
```

---

## Example 5: Accept/Reject Suggestion

### Scenario
User muốn accept một suggestion để tạo tasks/checklist items từ suggestions.

### Accept Suggestion
```javascript
const response = await fetch(`/api/ai-suggestions/${suggestionId}/status`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ status: 1 })  // 1 = accepted
});

const data = await response.json();
```

### Response
```javascript
{
  "suggestion_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": 1,
  "updated_at": "2025-01-01T00:10:00Z"
}
```

### Reject Suggestion
```javascript
const response = await fetch(`/api/ai-suggestions/${suggestionId}/status`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ status: 2 })  // 2 = rejected
});

const data = await response.json();
```

### Frontend Implementation
```javascript
async function acceptSuggestion(suggestionId) {
  try {
    await api.patch(`/api/ai-suggestions/${suggestionId}/status`, {
      status: 1  // Accept
    });
    
    // Update UI to show accepted state
    updateSuggestionStatus(suggestionId, 1);
    showMessage('Suggestion accepted successfully');
    
  } catch (error) {
    handleError(error);
  }
}

async function rejectSuggestion(suggestionId) {
  try {
    await api.patch(`/api/ai-suggestions/${suggestionId}/status`, {
      status: 2  // Reject
    });
    
    // Update UI to show rejected state
    updateSuggestionStatus(suggestionId, 2);
    showMessage('Suggestion rejected');
    
  } catch (error) {
    handleError(error);
  }
}
```

---

## Example 6: Get Suggestion Details

### Scenario
User muốn xem chi tiết một suggestion cụ thể, bao gồm metadata và cost information.

### Request
```javascript
const response = await fetch(`/api/ai-suggestions/${suggestionId}`, {
  headers: {
    'Authorization': `Bearer ${jwtToken}`
  }
});

const data = await response.json();
```

### Response
```javascript
{
  "suggestion_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "550e8400-e29b-41d4-a716-446655440001",
  "suggestion_type": 0,
  "status": 1,
  "items": [
    {
      "item_type": 0,
      "title": "Luyện tập bài tập Toán",
      "description": "Làm các bài tập từ chương 1-3 trong sách giáo khoa để củng cố kiến thức",
      "estimated_minutes": 90,
      "deadline": "2025-09-25T10:30:00Z",
      "metadata": {
        "priority": 1,
        "tags": ["study", "math"],
        "subject": "Toán học"
      }
    }
  ],
  "confidence": 0.9,
  "reason": "Dựa trên lịch trình hiện tại và thời gian rảnh, tôi đề xuất task này để tối ưu hóa thời gian học tập.",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:10:00Z",
  "meta": {
    "requestId": "req_550e8400-e29b-41d4-a716-446655440002",
    "model": "gemini-2.5-flash-lite",
    "provider": "gemini",
    "latency_ms": 5234,
    "cost": 0.000156
  }
}
```

### Frontend Implementation
```javascript
async function getSuggestionDetails(suggestionId) {
  try {
    const response = await api.get(`/api/ai-suggestions/${suggestionId}`);
    
    setSuggestionDetails(response.data);
    setCostInfo(response.data.meta);
    
  } catch (error) {
    if (error.response?.status === 404) {
      showMessage('Suggestion not found');
    } else {
      handleError(error);
    }
  }
}
```

---

## Example 7: Error Handling

### Rate Limit Exceeded
```javascript
try {
  const response = await api.post('/api/ai-suggestions/generate', {
    suggestionType: 0,
    timezone: 'Asia/Ho_Chi_Minh'
  });
} catch (error) {
  if (error.response?.status === 429) {
    const retryAfter = error.response.data.retryAfter;
    const minutes = Math.ceil(retryAfter / 60);
    
    showMessage(`Too many requests. Please wait ${minutes} minutes before trying again.`);
    
    // Show countdown timer
    startCountdownTimer(retryAfter);
  }
}
```

### Validation Error
```javascript
try {
  const response = await api.post('/api/ai-suggestions/generate', {
    suggestionType: 5,  // Invalid value
    timezone: 'invalid-timezone'
  });
} catch (error) {
  if (error.response?.status === 400) {
    const errors = error.response.data.errors;
    
    // Display validation errors to user
    Object.keys(errors).forEach(field => {
      showFieldError(field, errors[field]);
    });
  }
}
```

### Service Unavailable
```javascript
try {
  const response = await api.post('/api/ai-suggestions/generate', {
    suggestionType: 0,
    timezone: 'Asia/Ho_Chi_Minh'
  });
} catch (error) {
  if (error.response?.status === 503) {
    showMessage('AI service is temporarily unavailable. Please try again later.');
    
    // Disable suggestion button temporarily
    setSuggestionDisabled(true);
    
    // Re-enable after retry time
    setTimeout(() => {
      setSuggestionDisabled(false);
    }, error.response.data.retryAfter * 1000);
  }
}
```

---

## Example 8: Complete Integration Example

### React Component Example
```javascript
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AISuggestions = () => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState(null);
  const [rateLimitInfo, setRateLimitInfo] = useState(null);

  const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
    }
  });

  const generateSuggestions = async (type) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/api/ai-suggestions/generate', {
        suggestionType: type,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });

      setSuggestions(response.data.items);
      
      // Update rate limit info
      setRateLimitInfo({
        remaining: response.headers['x-ratelimit-remaining'],
        reset: response.headers['x-ratelimit-reset']
      });

    } catch (error) {
      if (error.response?.status === 429) {
        const retryAfter = error.response.data.retryAfter;
        setError(`Rate limited. Please wait ${Math.ceil(retryAfter / 60)} minutes.`);
      } else if (error.response?.status === 503) {
        setError('AI service is temporarily unavailable.');
      } else {
        setError('Failed to generate suggestions.');
      }
    } finally {
      setLoading(false);
    }
  };

  const acceptSuggestion = async (suggestionId) => {
    try {
      await api.patch(`/api/ai-suggestions/${suggestionId}/status`, {
        status: 1
      });
      
      // Update local state
      setSuggestions(prev => 
        prev.map(s => 
          s.suggestion_id === suggestionId 
            ? { ...s, status: 1 }
            : s
        )
      );
      
    } catch (error) {
      setError('Failed to accept suggestion.');
    }
  };

  return (
    <div className="ai-suggestions">
      <h2>AI Suggestions</h2>
      
      {rateLimitInfo && (
        <div className="rate-limit-info">
          Remaining requests: {rateLimitInfo.remaining}
        </div>
      )}

      <div className="suggestion-buttons">
        <button 
          onClick={() => generateSuggestions(0)}
          disabled={loading}
        >
          Generate Tasks
        </button>
        <button 
          onClick={() => generateSuggestions(1)}
          disabled={loading}
        >
          Generate Checklist
        </button>
        <button 
          onClick={() => generateSuggestions(2)}
          disabled={loading}
        >
          Generate Mixed
        </button>
      </div>

      {loading && <div className="loading">Generating suggestions...</div>}
      
      {error && <div className="error">{error}</div>}

      <div className="suggestions-list">
        {suggestions.map((item, index) => (
          <div key={index} className="suggestion-item">
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <p>Estimated time: {item.estimated_minutes} minutes</p>
            {item.deadline && (
              <p>Deadline: {new Date(item.deadline).toLocaleString()}</p>
            )}
            <div className="metadata">
              {item.metadata.tags?.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
            <button onClick={() => acceptSuggestion(item.suggestion_id)}>
              Accept
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AISuggestions;
```

---

## Best Practices

### 1. Error Handling
- Always check HTTP status codes
- Implement retry logic for rate limits
- Show appropriate user messages
- Log errors for debugging

### 2. Performance
- Show loading states during AI generation
- Implement request cancellation
- Cache suggestions locally
- Use pagination for large lists

### 3. User Experience
- Display confidence scores
- Show AI reasoning/explanations
- Allow users to accept/reject suggestions
- Provide clear feedback for all actions

### 4. Security
- Always include JWT token in requests
- Validate responses before displaying
- Handle authentication errors gracefully
- Don't expose sensitive information in UI
