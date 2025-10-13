# AI Suggestions API Endpoints

## Base URL
```
https://api.taskie.com/api/ai-suggestions
```

## Authentication
Tất cả endpoints đều yêu cầu JWT token trong Authorization header:

```javascript
headers: {
  'Authorization': `Bearer ${jwtToken}`,
  'Content-Type': 'application/json'
}
```

---

## POST /api/ai-suggestions/generate

Tạo AI suggestions mới dựa trên context của user.

### Request

#### Headers
```javascript
{
  'Authorization': 'Bearer <jwt_token>',
  'Content-Type': 'application/json'
}
```

#### Body
```javascript
{
  "suggestionType": 0,  // Required: 0=task, 1=checklist, 2=mixed
  "timezone": "Asia/Ho_Chi_Minh",  // Required: User timezone (IANA format)
  "promptTemplate": "optional custom template"  // Optional: Custom prompt template
}
```

#### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `suggestionType` | number | ✅ | 0=task suggestions, 1=checklist suggestions, 2=mixed |
| `timezone` | string | ✅ | IANA timezone (e.g., "Asia/Ho_Chi_Minh", "UTC") |
| `promptTemplate` | string | ❌ | Custom prompt template (optional) |

#### Validation Rules
- `suggestionType`: Must be 0, 1, or 2
- `timezone`: Must be valid IANA timezone string
- `promptTemplate`: If provided, must be non-empty string

### Response

#### Success (201 Created)
```javascript
{
  "suggestion_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "550e8400-e29b-41d4-a716-446655440001",
  "suggestion_type": 0,
  "status": 0,  // 0=pending, 1=accepted, 2=rejected
  "items": [
    {
      "item_type": 0,  // 0=task, 1=checklist
      "title": "Luyện tập bài tập Toán",
      "description": "Làm các bài tập từ chương 1-3 trong sách giáo khoa",
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
      "description": "Chạy bộ 30 phút và tập các động tác khởi động",
      "estimated_minutes": 45,
      "deadline": "2025-09-25T07:00:00Z",
      "metadata": {
        "priority": 2,
        "tags": ["health", "exercise"],
        "activity_type": "cardio"
      }
    }
  ],
  "confidence": 0.9,  // 0.0 - 1.0
  "reason": "Dựa trên lịch trình hiện tại và thời gian rảnh, tôi đề xuất các task này để tối ưu hóa thời gian học tập và sức khỏe.",
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

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `suggestion_id` | string | Unique identifier for the suggestion |
| `user_id` | string | User who requested the suggestion |
| `suggestion_type` | number | Type of suggestion (0=task, 1=checklist, 2=mixed) |
| `status` | number | Status (0=pending, 1=accepted, 2=rejected) |
| `items` | array | Array of suggested items |
| `confidence` | number | AI confidence score (0.0-1.0) |
| `reason` | string | AI explanation for the suggestions |
| `created_at` | string | ISO 8601 timestamp |
| `meta` | object | Request metadata |

#### Item Object Structure

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `item_type` | number | ✅ | 0=task, 1=checklist |
| `title` | string | ✅ | Item title |
| `description` | string | ✅ | Item description |
| `estimated_minutes` | number | ✅ | Estimated duration (15-120 minutes) |
| `deadline` | string | ❌ | ISO 8601 datetime (optional for checklist items) |
| `metadata` | object | ✅ | Additional metadata |

#### Metadata Object

| Field | Type | Description |
|-------|------|-------------|
| `priority` | number | Priority level (1-5) |
| `tags` | array | Array of tags |
| `task_id` | string | Parent task ID (for checklist items) |
| `subject` | string | Subject/category |
| `activity_type` | string | Type of activity |

### Error Responses

#### 400 Bad Request
```javascript
{
  "message": "Validation failed",
  "errors": {
    "suggestionType": "Must be 0, 1, or 2",
    "timezone": "Invalid timezone format"
  }
}
```

#### 401 Unauthorized
```javascript
{
  "message": "Authentication required",
  "error": "UNAUTHORIZED"
}
```

#### 429 Too Many Requests
```javascript
{
  "message": "Too many AI suggestion requests from this user",
  "retryAfter": 900
}
```

#### 503 Service Unavailable
```javascript
{
  "message": "AI suggestion service is temporarily unavailable",
  "retryAfter": 60
}
```

#### 500 Internal Server Error
```javascript
{
  "message": "Failed to generate AI suggestions",
  "requestId": "req_550e8400-e29b-41d4-a716-446655440002"
}
```

---

## GET /api/ai-suggestions

Lấy danh sách suggestions của user với pagination và filtering.

### Request

#### Headers
```javascript
{
  'Authorization': 'Bearer <jwt_token>'
}
```

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `status` | number | ❌ | all | Filter by status (0=pending, 1=accepted, 2=rejected) |
| `suggestionType` | number | ❌ | all | Filter by type (0=task, 1=checklist, 2=mixed) |
| `limit` | number | ❌ | 10 | Number of items per page (1-50) |
| `offset` | number | ❌ | 0 | Number of items to skip |

#### Example Request
```javascript
GET /api/ai-suggestions?status=0&limit=10&offset=0
```

### Response

#### Success (200 OK)
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
    }
  ],
  "total": 25,
  "limit": 10,
  "offset": 0,
  "hasMore": true
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `suggestions` | array | Array of suggestion objects |
| `total` | number | Total number of suggestions |
| `limit` | number | Items per page |
| `offset` | number | Items skipped |
| `hasMore` | boolean | Whether there are more items |

### Error Responses

#### 401 Unauthorized
```javascript
{
  "message": "Authentication required",
  "error": "UNAUTHORIZED"
}
```

#### 400 Bad Request
```javascript
{
  "message": "Invalid query parameters",
  "errors": {
    "limit": "Must be between 1 and 50",
    "offset": "Must be non-negative"
  }
}
```

---

## PATCH /api/ai-suggestions/:id/status

Cập nhật status của một suggestion (accept/reject).

### Request

#### Headers
```javascript
{
  'Authorization': 'Bearer <jwt_token>',
  'Content-Type': 'application/json'
}
```

#### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | ✅ | Suggestion ID |

#### Body
```javascript
{
  "status": 1  // Required: 1=accepted, 2=rejected
}
```

#### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | number | ✅ | 1=accepted, 2=rejected |

#### Validation Rules
- `status`: Must be 1 (accepted) or 2 (rejected)
- `id`: Must be valid UUID format

### Response

#### Success (200 OK)
```javascript
{
  "suggestion_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": 1,
  "updated_at": "2025-01-01T00:05:00Z"
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `suggestion_id` | string | Suggestion ID |
| `status` | number | Updated status |
| `updated_at` | string | ISO 8601 timestamp |

### Error Responses

#### 400 Bad Request
```javascript
{
  "message": "Validation failed",
  "errors": {
    "status": "Must be 1 (accepted) or 2 (rejected)"
  }
}
```

#### 401 Unauthorized
```javascript
{
  "message": "Authentication required",
  "error": "UNAUTHORIZED"
}
```

#### 404 Not Found
```javascript
{
  "message": "Suggestion not found",
  "error": "NOT_FOUND"
}
```

#### 403 Forbidden
```javascript
{
  "message": "You can only update your own suggestions",
  "error": "FORBIDDEN"
}
```

---

## GET /api/ai-suggestions/:id

Lấy chi tiết một suggestion cụ thể.

### Request

#### Headers
```javascript
{
  'Authorization': 'Bearer <jwt_token>'
}
```

#### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | ✅ | Suggestion ID |

### Response

#### Success (200 OK)
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
      "description": "Làm các bài tập từ chương 1-3 trong sách giáo khoa",
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
  "reason": "Dựa trên lịch trình hiện tại và thời gian rảnh...",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": null,
  "meta": {
    "requestId": "req_550e8400-e29b-41d4-a716-446655440002",
    "model": "gemini-2.5-flash-lite",
    "provider": "gemini",
    "latency_ms": 5234,
    "cost": 0.000156
  }
}
```

### Error Responses

#### 401 Unauthorized
```javascript
{
  "message": "Authentication required",
  "error": "UNAUTHORIZED"
}
```

#### 404 Not Found
```javascript
{
  "message": "Suggestion not found",
  "error": "NOT_FOUND"
}
```

#### 403 Forbidden
```javascript
{
  "message": "You can only view your own suggestions",
  "error": "FORBIDDEN"
}
```

---

## Rate Limiting

### Headers
Tất cả responses đều include rate limiting headers:

```javascript
{
  'X-RateLimit-Limit': '20',
  'X-RateLimit-Remaining': '15',
  'X-RateLimit-Reset': '1640995200'
}
```

### Rate Limit Information

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Maximum requests per window |
| `X-RateLimit-Remaining` | Remaining requests in current window |
| `X-RateLimit-Reset` | Unix timestamp when window resets |

### Rate Limit Exceeded
Khi rate limit exceeded, response sẽ có:

```javascript
{
  'Retry-After': '900'  // seconds until retry allowed
}
```

---

## Response Times

### Typical Response Times
- **Generate suggestions**: 5-15 seconds
- **Get suggestions list**: < 1 second
- **Update suggestion status**: < 1 second
- **Get suggestion details**: < 1 second

### Factors Affecting Response Time
1. **Suggestion type**: Checklist suggestions typically take longer
2. **Response complexity**: More items = longer generation time
3. **AI service load**: External Gemini API performance
4. **Network latency**: Server location và user location

---

## Best Practices

### Request Optimization
1. **Use appropriate suggestionType**: Choose the right type for your use case
2. **Provide accurate timezone**: Ensure timezone is correct for user
3. **Implement retry logic**: Handle rate limiting gracefully
4. **Cache responses**: Store suggestions locally when possible

### Error Handling
1. **Check status codes**: Always check HTTP status before processing
2. **Handle rate limits**: Implement exponential backoff
3. **Show user feedback**: Display appropriate messages for different errors
4. **Log errors**: Include request IDs for debugging

### Performance
1. **Show loading states**: AI generation takes time
2. **Implement timeouts**: Set reasonable timeout values
3. **Allow cancellation**: Let users cancel long-running requests
4. **Optimize UI**: Show partial results as they become available
