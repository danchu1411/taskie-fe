# Login API Flow - Chi tiết cách gọi API /auth/login

## 📋 Flow hoàn chỉnh

### 1. **User nhập email/password trong Login Page**

📁 File: `src/features/auth/TaskieLogin.tsx`  
📍 Dòng: 64

```tsx
await login({ email, password, remember: rememberMe });
```

### 2. **Function `login` trong AuthContext**

📁 File: `src/features/auth/AuthContext.tsx`  
📍 Dòng: 324-336

```tsx
const login = useCallback(
  async ({ email, password, remember }: LoginArgs) => {
    setStatus("authenticating");
    try {
      // ⬇️ ĐÂY LÀ ĐOẠN CODE GỌI API
      const response = await api.post<AuthResponsePayload>(
        "/auth/login",           // ← Endpoint
        { email, password }       // ← Payload
      );
      hydrateState(response.data, remember, { 
        promptVerification: !response.data.user.emailVerified 
      });
    } catch (error) {
      handleAuthFailure("Invalid email or password. Please try again.");
      throw error;
    }
  },
  [hydrateState, handleAuthFailure]
);
```

### 3. **API Client Configuration**

📁 File: `src/lib/api.ts`

API được cấu hình với base URL:
```tsx
const baseURL = (import.meta.env.VITE_API_BASE as MaybeString) ?? 
  (import.meta.env.PROD 
    ? "https://u8y31meg0e.execute-api.ap-southeast-1.amazonaws.com/api" 
    : "/api"
  );

const api = axios.create({ baseURL });
```

**Full URL sẽ là:** `${baseURL}/auth/login`

## 🔍 Chi tiết request

### Request được gửi:
```
POST http://taskie-api-env.eba-tddpmyzh.ap-southeast-1.elasticbeanstalk.com/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Response mong đợi:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "emailVerified": true,
    "hasStudyProfile": false
  },
  "tokens": {
    "accessToken": "jwt_token",
    "accessTokenExpiresIn": 900,
    "refreshToken": "opaque_token",
    "refreshTokenExpiresAt": "2025-01-01T00:00:00.000Z"
  },
  "verification": {
    "status": "logged"
  }
}
```

## ⚠️ Lỗi hiện tại

```
POST http://taskie-api-env.eba-tddpmyzh.ap-southeast-1.elasticbeanstalk.com/api/auth/login 
net::ERR_NAME_NOT_RESOLVED
```

**Nguyên nhân:** Domain không tồn tại hoặc server đã down

## 🔧 Cách fix

### Option 1: Sửa API URL trong `.env`
```env
VITE_API_BASE=http://taskie-api-env.eba-tddpmyzh.ap-southeast-1.elasticbeanstalk.com/api
```

### Option 2: Dùng API mới
```env
VITE_API_BASE=https://new-api-domain.com/api
```

### Option 3: Local dev
```env
VITE_API_BASE=/api
# Rồi chạy backend local
```

## 📊 Sơ đồ flow

```
TaskieLogin.tsx (User submits form)
    ↓
    handleSubmit() { login({ email, password }) }
    ↓
AuthContext.tsx (lines 324-336)
    ↓
    api.post("/auth/login", { email, password })
    ↓
src/lib/api.ts (Axios instance)
    ↓
    GET/POST http://[VITE_API_BASE]/auth/login
    ↓
Backend API Server
    ↓
Response → AuthContext → Update State → Redirect
```

## 🎯 Các file liên quan

1. **TaskieLogin.tsx** - UI form, gọi `auth.login()`
2. **AuthContext.tsx** - Function `login()` gọi API
3. **api.ts** - Axios config, xử lý request
4. **.env** - API base URL

## 💡 Test locally

Nếu muốn test mà không cần API thật:

```tsx
// Tạm thời mock trong AuthContext.tsx
const login = useCallback(
  async ({ email, password, remember }: LoginArgs) => {
    setStatus("authenticating");
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate
    
    // Mock response
    hydrateState({
      user: {
        id: "mock-id",
        email: email,
        name: "Mock User",
        emailVerified: true,
        hasStudyProfile: false
      },
      tokens: {
        accessToken: "mock-token",
        accessTokenExpiresIn: 900,
        refreshToken: "mock-refresh",
        refreshTokenExpiresAt: new Date().toISOString()
      },
      verification: { status: "logged" }
    }, remember, { promptVerification: false });
  },
  [hydrateState, handleAuthFailure]
);
```

