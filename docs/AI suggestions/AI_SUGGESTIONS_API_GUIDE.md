# AI Suggestions API Guide

## Overview

AI Suggestions là một tính năng thông minh giúp người dùng tự động tạo ra các task và checklist dựa trên lịch trình, thói quen học tập và thời gian rảnh của họ. Tính năng này sử dụng Gemini AI để phân tích context và đưa ra gợi ý phù hợp.

## Use Cases

### 1. Task Suggestions (suggestionType: 0)
- **Mục đích**: Tạo ra các task mới dựa trên lịch trình và thời gian rảnh
- **Khi nào dùng**: Khi người dùng muốn AI đề xuất các công việc mới phù hợp với schedule
- **Ví dụ**: "Học Toán từ 9h-11h sáng", "Tập thể dục từ 6h-7h chiều"

### 2. Checklist Suggestions (suggestionType: 1)
- **Mục đích**: Chia nhỏ các task phức tạp thành các checklist items
- **Khi nào dùng**: Khi người dùng có task lớn cần break down thành các bước nhỏ
- **Ví dụ**: Task "Ôn thi Toán" → Checklist ["Làm bài tập chương 1", "Review công thức", "Làm đề thi thử"]

### 3. Mixed Suggestions (suggestionType: 2)
- **Mục đích**: Kết hợp cả task và checklist trong một response
- **Khi nào dùng**: Khi cần đề xuất cả task mới và checklist cho task hiện tại
- **Ví dụ**: Vừa đề xuất task mới, vừa tạo checklist cho task đang có

## Architecture Overview

```
Frontend → API Gateway → AI Suggestions Service → Gemini AI
                ↓
            Database (MSSQL)
                ↓
        Rate Limiting & Circuit Breaker
```

### Components

1. **API Gateway**: Handle authentication, rate limiting, request validation
2. **AI Suggestions Service**: Core business logic, prompt engineering, response validation
3. **Gemini AI**: Large Language Model để generate suggestions
4. **Database**: Store suggestions, user data, và logs
5. **Rate Limiting**: Protect API khỏi abuse và control costs
6. **Circuit Breaker**: Prevent cascade failures khi AI service down

## Authentication Requirements

### JWT Token
Tất cả API calls đều cần JWT token trong Authorization header:

```javascript
headers: {
  'Authorization': `Bearer ${jwtToken}`,
  'Content-Type': 'application/json'
}
```

### Token Format
- **Algorithm**: HS256
- **Expiration**: 15 minutes (900 seconds)
- **Refresh**: Có refresh token để renew access token

### Getting Token
```javascript
// Login để lấy token
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password'
  })
});

const { tokens } = await response.json();
const jwtToken = tokens.accessToken;
```

## Rate Limiting & Quotas

### Current Limits
- **Rate Limit**: 20 requests per 15 minutes per user
- **Window**: Rolling window (15 minutes = 900,000ms)
- **Scope**: Per user (không share giữa users)

### Rate Limit Headers
```javascript
// Response headers khi rate limited
{
  'X-RateLimit-Limit': '20',
  'X-RateLimit-Remaining': '0',
  'X-RateLimit-Reset': '1640995200', // Unix timestamp
  'Retry-After': '900' // seconds
}
```

### Error Response
```javascript
// 429 Too Many Requests
{
  "message": "Too many AI suggestion requests from this user",
  "retryAfter": 900
}
```

### Best Practices
- **Implement retry logic** với exponential backoff
- **Show countdown timer** cho user khi rate limited
- **Cache suggestions** để giảm API calls
- **Batch requests** khi có thể

## Cost Considerations

### Gemini API Costs
- **Model**: gemini-2.5-flash-lite
- **Input tokens**: ~$0.0000375 per 1K tokens
- **Output tokens**: ~$0.00015 per 1K tokens
- **Average cost**: ~$0.00016 per request

### Cost Tracking
Mỗi response đều có cost information:

```javascript
{
  "meta": {
    "cost": 0.000156,
    "model": "gemini-2.5-flash-lite",
    "provider": "gemini"
  }
}
```

### Cost Optimization
- **Rate limiting** giúp control costs
- **Prompt optimization** giảm token usage
- **Response validation** tránh regenerate
- **Caching** giảm duplicate requests

## Performance Characteristics

### Response Times
- **Average**: 5-15 seconds
- **Task suggestions**: 5-10 seconds
- **Checklist suggestions**: 8-15 seconds
- **Mixed suggestions**: 10-15 seconds

### Factors Affecting Performance
1. **Prompt complexity**: Longer prompts = more tokens = slower
2. **Response length**: More items = more output tokens = slower
3. **Gemini API load**: External factor
4. **Network latency**: Depends on server location

### Best Practices
- **Show loading indicators** (AI generation takes time)
- **Implement timeout** (30 seconds recommended)
- **Allow cancellation** của requests
- **Cache responses** để improve UX

## Error Handling

### Common Error Scenarios
1. **Validation errors** (400) - Invalid request format
2. **Rate limiting** (429) - Too many requests
3. **Service unavailable** (503) - Circuit breaker open
4. **Internal errors** (500) - AI service failures

### Error Response Format
```javascript
{
  "message": "Error description",
  "errors": { /* validation errors */ },
  "retryAfter": 900, /* for rate limiting */
  "requestId": "uuid" /* for debugging */
}
```

## Security Considerations

### Data Privacy
- **User data**: Chỉ được sử dụng để generate suggestions
- **No data retention**: Không lưu trữ personal data trong AI logs
- **Encryption**: All data encrypted in transit và at rest

### API Security
- **JWT authentication**: Required cho tất cả endpoints
- **Rate limiting**: Prevent abuse và DDoS
- **Input validation**: Strict validation cho tất cả inputs
- **CORS**: Proper CORS configuration

### AI Safety
- **Content filtering**: Gemini có built-in safety filters
- **Response validation**: Validate AI responses trước khi return
- **Fallback mechanisms**: Graceful degradation khi AI fails

## Monitoring & Observability

### Metrics Tracked
- **Request count**: Total requests per user/timeframe
- **Response time**: Latency distribution
- **Error rate**: 4xx/5xx error percentages
- **Cost tracking**: Token usage và costs
- **Rate limiting**: Number of rate limited requests

### Logging
- **Request logs**: All API calls với metadata
- **Error logs**: Detailed error information
- **AI logs**: LLM requests và responses
- **Performance logs**: Response times và costs

### Health Checks
- **API health**: `/api/health/ai` endpoint
- **Database health**: Connection status
- **AI service health**: Gemini API availability
- **Circuit breaker status**: Open/closed state

## Getting Started

### Quick Start
1. **Get JWT token** từ authentication endpoint
2. **Make request** đến `/api/ai-suggestions/generate`
3. **Handle response** và display suggestions
4. **Implement error handling** cho rate limits và errors

### Next Steps
- Xem [API Endpoints Documentation](./AI_SUGGESTIONS_API_ENDPOINTS.md) cho chi tiết endpoints
- Xem [Examples](./AI_SUGGESTIONS_EXAMPLES.md) cho code examples
- Xem [Error Handling Guide](./AI_SUGGESTIONS_ERROR_HANDLING.md) cho error scenarios
- Xem [Frontend Integration Guide](./AI_SUGGESTIONS_FRONTEND_INTEGRATION.md) cho best practices

## Support

### Documentation
- **API Reference**: Complete endpoint documentation
- **Code Examples**: Real-world usage examples
- **TypeScript Types**: Type definitions
- **Testing Guide**: Unit và integration testing

### Troubleshooting
- **Common Issues**: Rate limiting, validation errors
- **Debug Information**: Request IDs và error details
- **Performance Issues**: Response time optimization
- **Cost Optimization**: Token usage reduction

### Contact
- **Technical Issues**: Check error logs và request IDs
- **Feature Requests**: Submit through project channels
- **Bug Reports**: Include request ID và error details
