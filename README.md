# Taskie API

Backend Node.js (Express 5 + MSSQL) cho he thong Taskie. Tai lieu nay giai thich cach team front-end tich hop voi API: cach khoi dong, auth, quy uoc du lieu va tung endpoint chinh.

## 1. Tong quan
- **Base URL (dev)**: `http://localhost:3000/api`.
- **Stack**: Node.js 22, Express 5, MSSQL (`mssql`), Zod, JWT auth.
- **Modules**: Auth, Tasks, Checklist Items, Schedule Entries, Users (seed/dev).
- **Deploy dev**: Docker Compose chay API + SQL Server, hot reload bang `npm run dev` neu mount ma nguon.

## 2. Khoi dong nhanh
### 2.1 Yeu cau
- Docker Desktop (Linux containers).
- Neu chay local: SQL Server 2022+ va Node.js 22.
- Muon test login Google thi can `GOOGLE_CLIENT_ID` hoac bat mock.

### 2.2 Chay bang Docker (goi y cho frontend)
```bash
docker compose up --build
```
- API: http://localhost:3000
- SQL Server: localhost:14333 (user `sa`, pass `YourStrong!Passw0rd`).
- Tao DB va nap schema:
```bash
# Tao DB neu chua co
docker run --rm --network taskie_api_default mcr.microsoft.com/mssql-tools \
  /opt/mssql-tools/bin/sqlcmd -S db -U sa -P "YourStrong!Passw0rd" -Q "IF DB_ID('Taskie') IS NULL CREATE DATABASE Taskie;"

# Nap schema
docker run --rm --network taskie_api_default -v "${PWD}/db:/scripts" mcr.microsoft.com/mssql-tools \
  /opt/mssql-tools/bin/sqlcmd -S db -U sa -P "YourStrong!Passw0rd" -d Taskie -i /scripts/schema.sql
```

### 2.3 Chay local (khong Docker)
1. Cai SQL Server, tao DB `Taskie`, chay script `db/schema.sql`.
2. Tao file `.env` (xem phan 6) va chay:
   ```bash
   npm install
   npm run dev
   ```
3. Test nhanh: GET `http://localhost:3000/health` tra `{ "ok": true }`.
4. Moi khi thay doi `.env` (vi du cau hinh SMTP), hay dung hoac khoi dong lai server (`npm run dev` hoac `docker compose restart api`) de env moi duoc nap.

### 2.4 Cau truc thu muc lien quan den frontend
```
src/
  app.js           # Mount /api + middleware
  server.js        # Doc env va start HTTP server
  config/env.js    # Helper phan biet prod/dev
  db/mssql.js      # MSSQL pool (singleton)
  middlewares/     # authRequired, validate(Zod), error handler
  routes/          # auth, tasks, checklist-items, schedule-entries, users
  controllers/     # Xu ly request, tra response JSON
  services/        # Business logic (auth, schedule, ...)
  repositories/    # Lam viec truc tiep voi SQL
  validation/      # Schema Zod cho params/query/body
db/schema.sql      # Bang, view, trigger

## 2.5 AI Suggestions (LLM)
- Module `ai` exposes `/api/ai/suggestions[...]` for generate/list/accept/dismiss flows.
- `src/lib/llmAdapter.js` renders prompt templates, enforces timeout/retry, and writes entries to `AIRequestLogs`.
- Data layer includes tables `AISuggestions`, `AISuggestionItems`, `AIRequestLogs`, service `src/services/aiSuggestions.service.js`, and the schedule free-slot helper.
- Body validation: `src/validation/ai.js` (Zod) ensures `promptTemplate` and suggestion `:id` are well formed before hitting the controller.
- Study profile (chronotype/focusStyle/workStyle) duoc lay tu `StudyProfiles` va dua vao prompt/metadata de ca nhan hoa goi y.
- Requests are logged before and after the LLM call; responses are validated then stored with `origin_type = 'ai'`.
- Tests: run `npm test` for Jest unit coverage and Supertest integration coverage.

```

## 3. Vong doi mot request
1. Front-end goi API voi header auth va payload dung schema.
2. `authRequired` xac thuc JWT (hoac `x-user-id` neu bat dev mode).
3. `validate` chay Zod, chuan hoa params/query/body.
4. Controller doc `req.user`, `req.body`, `req.query` va goi repo/service.
5. Repository thuc thi SQL (transaction/trigger neu can).
6. Controller tra JSON; neu loi, middleware `error` tra `{ error: message }` hoac response co `code` cu the.

## 4. Auth & bao mat
- JWT payload yeu cau `sub = GUID user`. Access token mac dinh het han 900s.
- Refresh token luu thanh hash trong `AuthRefreshTokens`, moi lan refresh se thay token cu.
- Dev co the bat `AUTH_ALLOW_LEGACY_HEADER=true` de gui `x-user-id` (chi dung khi test).
- Google login: `/auth/google` nhan `idToken`; dev co the bat `GOOGLE_ALLOW_MOCK=true` va gui body.mock.
- Email verification:
- LLM_API_KEY: dat trong secrets manager/.env (khong commit) de LLMAdapter doc key qua process.env.
  - Signup tra them `verification.status`. Neu SMTP cau hinh, backend tu dong gui mail.
  - API moi: `POST /auth/verify-email`, `POST /auth/verify-email/resend`, `GET /auth/verify-email?token=` (HTML don gian).
  - JWT access token chua `email_verified` de front-end biet dang user duoc unlock chua.
- Password reset: `POST /auth/password/forgot` gui mail dat lai (neu email ton tai) va `POST /auth/password/reset` dat mat khau moi bang token; reset xong backend revoke refresh tokens.

## 5. Quy uoc giao tiep
- **Base URL**: `http://<host>:<port>/api`.
- **Headers**: `Authorization: Bearer <JWT>` hoac (dev) `x-user-id`.
- **Content-Type**: `application/json` cho request co body.
- **Datetime**: ISO 8601 co offset (UTC uu tien), vd `2025-09-12T09:00:00Z`.
- **GUID**: dang `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`.
- **Pagination**: `page` (>=1), `pageSize` (<=100) -> response `{ items, total, page, pageSize }`.
- **Sap xep**: `order=asc|desc`, `orderBy=created_at|deadline` (tuy endpoint).
- **Status/Priority**:
  - Tasks/Checklist status: 0=planned, 1=in_progress, 2=done, 3=skipped.
  - Priority: 1=must, 2=should, 3=want.
  - Schedule entries: 0..3 hoac chuoi `planned|in_progress|done|canceled`.
- **Derived Status** (Tasks):
  - Tasks co them field `derived_status` tu dong tinh tu checklist items.
  - Atomic tasks (khong co checklist): `derived_status = status`.
  - Non-atomic tasks (co checklist): `derived_status` tu dong cap nhat theo quy tac:
    1. Co bat ky item nao IN_PROGRESS (1) → Task IN_PROGRESS (1)
    2. Co item DONE va item PLANNED → Task IN_PROGRESS (1)
    3. Tat ca item DONE (2) → Task DONE (2)
    4. Khong con item pending (chi DONE + SKIPPED) → Task DONE (2)
    5. Tat ca item SKIPPED (3) → Task SKIPPED (3)
    6. Mac dinh (co item PLANNED, chua bat dau) → Task PLANNED (0)
  - **QUAN TRONG**: Khong the cap nhat `status` cho tasks co checklist items (loi 400).
  - Frontend nen dung `derived_status` de hien thi thay vi `status`.
- **Errors**: Validation -> `400 { message: 'Validation failed', errors: [...] }`; auth -> `401 { message: 'Unauthorized' }`; cac loi khac co the co `code` rieng (`DEADLINE_CONFLICT`, `OVERLAP_CONFLICT`, `CANNOT_SET_STATUS_FOR_NON_ATOMIC_TASK`, ...).

## 6. Bien moi truong (local sample)
```
PORT=3000
DB_SERVER=localhost
DB_DATABASE=Taskie
DB_USER=sa
DB_PASSWORD=your-password
DB_PORT=1433
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true

# Connection pool configuration (optional, defaults shown)
POOL_MAX=10                  # Maximum number of connections in pool
POOL_MIN=0                   # Minimum number of connections in pool
POOL_IDLE_TIMEOUT=30000      # Idle timeout in milliseconds (30s default)

# Query timing logs (optional, for performance monitoring)
DB_QUERY_LOG=false           # Set to 'true' to enable [db-timing] logs via console.debug

AUTH_ALLOW_LEGACY_HEADER=true
JWT_ALG=HS256
JWT_SECRET=dev-secret-change-me
# AI Suggestions Configuration
LLM_PROVIDER=google
LLM_MODEL=gemini-1.5-flash
LLM_API_KEY=your-gemini-api-key
LLM_TIMEOUT_MS=15000
LLM_MAX_RETRIES=2
AI_SUGGESTIONS_ENABLED=true

# AI Cost Tracking (optional)
AI_COST_IN_PER_1K=0.000075
AI_COST_OUT_PER_1K=0.0003

# AI Rate Limiting & Bulkhead (optional)
AI_RATE_LIMIT_WINDOW_MS=900000
AI_RATE_LIMIT_MAX_REQUESTS=20
AI_BULKHEAD_MAX_CONCURRENT=10
AI_BULKHEAD_QUEUE_SIZE=10

# AI Circuit Breaker (optional)
AI_CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
AI_CIRCUIT_BREAKER_RECOVERY_TIMEOUT=60000
AI_CIRCUIT_BREAKER_HALF_OPEN_MAX_CALLS=3
EMAIL_FROM="Taskie <no-reply@taskie.dev>"
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-pass
EMAIL_VERIFY_WEB_URL=http://localhost:5173/verify-email?token={token}
# EMAIL_VERIFY_TOKEN_EXPIRES_IN_MINUTES=1440
EMAIL_VERIFY_SEND_ON_SIGNUP=true
PASSWORD_RESET_WEB_URL=http://localhost:5173/reset-password?token={token}
# PASSWORD_RESET_TOKEN_EXPIRES_IN_MINUTES=60
# PASSWORD_RESET_TOKEN_BYTE_LENGTH=32
# JWT_ISS=taskie_api
# JWT_AUD=taskie_web
GOOGLE_CLIENT_ID=your-google-client-id
# GOOGLE_ALLOW_MOCK=true  # dev only: cho phep body.mock khi test Google login

# Frontend Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your-google-client-id
# VITE_GOOGLE_ALLOW_MOCK=true  # dev only: cho phep mock Google login trong frontend
```
- Google login: dat `GOOGLE_CLIENT_ID` = `<client-id>` tu Google Cloud (OAuth client type Web hoac iOS/Android); dev co the set `GOOGLE_ALLOW_MOCK=true` de test khong can Google, va dieu chinh `GOOGLE_AUTO_VERIFY_EMAIL=false` neu muon giu trang thai verify = pending de UI hien thong bao.
- Neu dung Gmail de test: bat 2FA, tao App Password, su dung `smtp.gmail.com` (`SMTP_PORT=587`, `SMTP_SECURE=false` hoac `SMTP_PORT=465`, `SMTP_SECURE=true`), va bo khoang trang trong mat khau ung dung khi dat vao `.env`.
- Dat `PASSWORD_RESET_WEB_URL` tro ve trang Reset Password cua front-end (co the dung mau `http://localhost:5173/reset-password?token={token}`); neu khong set se fallback ve `http://localhost:5173/reset-password`.
- Co the dat `DEFAULT_RESET_PASSWORD_URL` neu muon doi fallback khac (mac dinh la `http://localhost:5173/reset-password`).
- Len prod: tat `AUTH_ALLOW_LEGACY_HEADER`, doi secret manh hoac chuyen sang RS256 (`JWT_PUBLIC_KEY`).

### 6.1 Moi truong front-end (Vite)
Neu frontend dung Vite, tao file .env hoac .env.local trong repo FE:
```
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_GOOGLE_ALLOW_MOCK=true  # Chi dung cho development
```

#### 6.1.1 Cấu hình Google OAuth
1. **Tạo Google Cloud Project:**
   - Vào [Google Cloud Console](https://console.cloud.google.com/)
   - Tạo project mới hoặc chọn project hiện có
   - Bật Google+ API và Google Identity Services

2. **Tạo OAuth 2.0 Client ID:**
   - Vào "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: "Web application"
   - Authorized JavaScript origins: `http://localhost:5173` (dev), `https://yourdomain.com` (prod)
   - Authorized redirect URIs: `http://localhost:5173` (dev), `https://yourdomain.com` (prod)

3. **Cấu hình Environment Variables:**
   ```bash
   # .env.local (development)
   VITE_GOOGLE_CLIENT_ID=your-google-client-id-from-console
   VITE_GOOGLE_ALLOW_MOCK=true
   
   # .env.production (production)
   VITE_GOOGLE_CLIENT_ID=your-production-google-client-id
   # Không set VITE_GOOGLE_ALLOW_MOCK hoặc set = false
   ```

4. **Mock Mode cho Development:**
   - Khi `VITE_GOOGLE_ALLOW_MOCK=true`, hiển thị hint "Alt+click for mock login"
   - Alt+click vào "Continue with Google" → mở mock dialog
   - Nhập email/name → sử dụng `createMockGooglePayload()` helper
   - Chỉ dùng cho development, không ship production

5. **Troubleshooting:**
   - Lỗi "Google chưa được cấu hình": Kiểm tra `VITE_GOOGLE_CLIENT_ID`
   - Lỗi "Google token không hợp lệ": Kiểm tra authorized origins
   - Lỗi "Xác thực Google thất bại": Kiểm tra client ID permissions
## 7. Quy trinh tich hop (goi y)
1. Dang ky hoac dang nhap de lay `{ accessToken, refreshToken }` va `user`.
2. Neu `user.emailVerified = false`, hien thi UI nhac xac minh va goi `/auth/verify-email` (token lay tu email) hoac `/auth/verify-email/resend` khi nguoi dung xin gui lai.
3. Luu token, gan header `Authorization: Bearer` cho cac API can auth.
4. Khi bi 401 do het han, goi `/auth/refresh` de lay cap token moi (refresh cu bi thu hoi).
5. Su dung cac module duoi day de quan ly tasks, checklist, Schedule entries.
6. Khi nguoi dung dang xuat, goi `/auth/logout` (co the revoke tat ca session bang `allSessions=true`).
7. Neu nguoi dung quen mat khau, goi `/auth/password/forgot` -> frontend thong bao da gui email (ke ca truong hop khong co tai khoan); khi co token tu email, goi `/auth/password/reset` de dat lai.

## 8. API cho front-end
Tat ca endpoint tinh tu goc `/api`.

### 8.1 Auth
| Method | Path | Mo ta |
|--------|------|-------|
| POST | `/auth/signup` | Tao user email/password, tra token + trang thai verify.
| POST | `/auth/login` | Dang nhap email/password.
| POST | `/auth/google` | Dang nhap Google (idToken hoac mock cho dev).
| POST | `/auth/refresh` | Cap nhat access token + refresh token.
| POST | `/auth/logout` | Huy refresh token hien tai (204).
| POST | `/auth/verify-email` | Xac minh email bang body.token.
| POST | `/auth/verify-email/resend` | Gui lai mail xac minh (khong lo ro tai khoan).
| POST | `/auth/password/forgot` | Gui email dat lai mat khau (luon tra 200).
| POST | `/auth/password/reset` | Dat lai mat khau bang token va password moi.
| GET  | `/auth/verify-email` | Link xac minh truc tiep (tra HTML).

**Signup/Login response mau**
```json
{
  "user": { "id": "<GUID>", "email": "dev@example.com", "name": "Dev User", "emailVerified": false },
  "tokens": {
    "accessToken": "<JWT>",
    "accessTokenExpiresIn": 900,
    "refreshToken": "<opaque>",
    "refreshTokenExpiresAt": "2025-10-01T00:00:00.000Z",
    "refreshTokenId": "<GUID>"
  },
  "verification": {
    "status": "sent",
    "expiresAt": "2025-09-01T12:00:00.000Z"
  }
}
```
- `verification.status`: `sent`, `logged`, `failed`, `already_verified` hoac `pending` (neu khong gui).
- `user.emailVerified`: front-end dung de chan tinh nang khi chua xac minh.

**Google Sign-In flow (Frontend)**
1. Tren FE, dung Google Identity Services (One Tap hoac popup) de lay `idToken` sau khi nguoi dung dong y.
2. Gui `POST /api/auth/google` (base URL + `/auth/google`) kem header `Content-Type: application/json` va body JSON ben duoi.
3. Backend se tao/gan user va tra `user`, `tokens`, `verification`. Neu `GOOGLE_AUTO_VERIFY_EMAIL=true` (mac dinh) thi `user.emailVerified` va `verification.status` = `verified`; neu tat auto verify thi front-end can xu ly nhu signup thuong (`pending`).

**Request**
```json
POST /api/auth/google
{
  "idToken": "<google-id-token>"
}
```

**Response mau**
```json
{
  "user": {
    "id": "<GUID>",
    "email": "student@example.com",
    "name": "Student",
    "emailVerified": true
  },
  "tokens": {
    "accessToken": "<JWT>",
    "accessTokenExpiresIn": 900,
    "refreshToken": "<opaque>",
    "refreshTokenExpiresAt": "2025-10-01T00:00:00.000Z",
    "refreshTokenId": "<GUID>"
  },
  "verification": {
    "status": "verified"
  }
}
```
- Loi thuong gap: `400 Google token required` (thieu `idToken`), `401 Google token invalid` (token het han/khong dung client), `500 Google login not configured` (chua dat `GOOGLE_CLIENT_ID`).

**Local dev khong co Google**
- Dat env `GOOGLE_ALLOW_MOCK=true` de bat che do mock.
- Gui body dang sau thay cho `idToken`:
  ```json
  POST /api/auth/google
  {
    "mock": {
      "sub": "mock-uid-123",
      "email": "mockuser@example.com",
      "name": "Mock User"
    }
  }
  ```
- Backend van tra cau truc `user`/`tokens`/`verification` nhu tren; co the su dung de lien ket voi front-end trong giai doan UI dev.

**Refresh**
```json
POST /api/auth/refresh
{ "refreshToken": "<opaque>" }
```
Response tra access token moi + refresh token moi.

**Verify email**
```json
POST /api/auth/verify-email
{ "token": "<token tu email>" }
```
=> `200 { "emailVerified": true, "user": { ... } }` (token het han -> 400 `TOKEN_EXPIRED`).

**Resend verify email**
```json
POST /api/auth/verify-email/resend
{ "email": "dev@example.com" }
```
=> `200 { "status": "sent", "expiresAt": "2025-09-01T12:00:00.000Z" }` hoac `status = logged|failed|already_verified|unknown`.

**Forgot password**
```json
POST /api/auth/password/forgot
{ "email": "dev@example.com" }
```
=> `200 { "status": "sent", "expiresAt": "2025-09-01T12:00:00.000Z" }` (neu chua cau hinh SMTP se tra `status = logged`). Neu email khong ton tai -> `status = unknown` nhung van 200 de tranh ro ri thong tin.

**Reset password**
```json
POST /api/auth/password/reset
{ "token": "<token tu email>", "password": "NewStrongPass!" }
```
=> `200 { "passwordReset": true }`. Neu token sai/het han -> 400 `TOKEN_INVALID|TOKEN_EXPIRED|TOKEN_USED`. Reset thanh cong se huy refresh token cu, nguoi dung can dang nhap lai.

### 8.2 Tasks
| Method | Path | Ghi chu |
|--------|------|---------|
| POST | `/tasks/create` | Tao task moi (yeu cau auth).
| PATCH | `/tasks/:taskId` | Cap nhat task, ho tro confirm shrink/cascade.
| DELETE | `/tasks/:taskId` | Xoa task.
| GET | `/tasks/by-user/:userId` | Lay task cua user (backend su dung `req.user.id`).

Task object mau:
```json
{
  "task_id": "b6d5...",
  "user_id": "1111...",
  "title": "On tap Mon",
  "description": "Lam chuong 1-3",
  "deadline": "2025-09-12T09:00:00Z",
  "priority": 1,
  "status": 0,
  "is_atomic": true,
  "created_at": "2025-09-01T10:00:00Z"
}
```

**Tao task**
```json
POST /api/tasks/create
{
  "title": "On tap Mon",
  "description": "Lam chuong 1-3",
  "deadline": "2025-09-12T09:00:00Z",
  "priority": 1
}
```

**Cap nhat task**
```json
PATCH /api/tasks/<taskId>
{
  "title": "On tap Mon - update",
  "deadline": "2025-09-13T09:00:00Z",
  "priority": 2,
  "status": 1,
  "confirm": {
    "shrinkChildrenToTaskDeadline": true,
    "cascadeStatusToChildren": true
  }
}
```
- Giam deadline ma khong `shrinkChildrenToTaskDeadline` -> 409 `DEADLINE_CONFLICT`.
- Task khong thuoc user -> 404 `TASK_NOT_FOUND_OR_NOT_OWNED`.
- **MOI**: Cap nhat `status` cho task co checklist items -> 400 `CANNOT_SET_STATUS_FOR_NON_ATOMIC_TASK`.
  - Tasks co checklist items tu dong tinh `derived_status` tu cac item.
  - Chi atomic tasks (khong co checklist) moi co the cap nhat `status` truc tiep.

**Danh sach task**
```
GET /api/tasks/by-user/<guid>
  ?page=1&pageSize=20&status=0&includeChecklist=true&includeWorkItems=true&q=keyword
```
- `includeChecklist=true` -> tra kem `checklist[]`.
- `includeWorkItems=true` -> tra kem `workItems[]` (moi item co `work_id`, `checklist_item_id`/`atomic_task_id`, `work_type`).
- Response `{ items, total, page, pageSize }`.
- **MOI**: Moi task trong `items` co them field `derived_status`:
  ```json
  {
    "id": "task-guid",
    "title": "Task with checklist",
    "status": 0,           // Manual status
    "derived_status": 1,   // Auto-computed status (use this for display)
    "is_atomic": false,
    "checklist": [...],
    "total_items": 3,
    "done_items": 1
  }
  ```
  - Atomic tasks: `derived_status = status`
  - Non-atomic tasks: `derived_status` tu dong tinh tu checklist items
  - Frontend nen dung `derived_status` thay vi `status` khi hien thi

### 8.3 Checklist Items
| Method | Path | Ghi chu |
|--------|------|---------|
| GET | `/checklist-items/:taskId` | Lay danh sach checklist items cua task.
| POST | `/checklist-items/:taskId/checklist` | Them 1/nhieu item. **Tu dong cap nhat `derived_status` cua task cha**.
| PATCH | `/checklist-items/:itemId` | Cap nhat title/deadline/priority/status/order. **Tu dong cap nhat `derived_status` cua task cha khi doi status**.
| DELETE | `/checklist-items/:itemId` | Xoa item, tu dong compact order. **Tu dong cap nhat `derived_status` cua task cha**.

**Lay danh sach checklist items**
```
GET /api/checklist-items/<taskId>
```
- Tra ve danh sach checklist items cua task, sap xep theo `order_index`.
- Response: `[{ checklist_item_id, task_id, title, status, order_index, item_deadline_raw, item_priority_raw, task_deadline_raw, task_priority_raw, effective_deadline, effective_priority }]`.
- Task khong thuoc user -> 404 `TASK_NOT_FOUND_OR_NOT_OWNED`.

**Them checklist**
```json
POST /api/checklist-items/<taskId>/checklist
{
  "checklist": [
    { "title": "Chuong 1", "deadline": null, "priority": null },
    { "title": "Chuong 2", "deadline": "2025-09-10T10:00:00Z", "priority": 2 }
  ]
}
```
- Task khong thuoc user -> 404 `TASK_NOT_FOUND_OR_NOT_OWNED`.

**Cap nhat item**
```json
PATCH /api/checklist-items/<itemId>
{
  "title": "Chuong 2 - update",
  "deadline": "2025-09-11T10:00:00Z",
  "priority": 1,
  "status": 1,
  "order": 2,
  "confirm": { "expandTaskDeadline": true }
}
```
- Tang deadline vuot task ma khong confirm -> 409 `DEADLINE_EXPAND_REQUIRED`.
- Item khong thuoc user -> 404 `CHECKLIST_NOT_FOUND_OR_NOT_OWNED`.

### 8.4 Schedule Entries (Work Items)
| Method | Path | Ghi chu |
|--------|------|---------|
| POST | `/schedule-entries` | Dat lich cho task atomic/checklist (`workItemId`).
| PATCH | `/schedule-entries/:entryId` | Cap nhat `startAt`, `plannedMinutes`, `status` theo entry ID.
| **PATCH** | **`/schedule-entries/by-work-item/:workItemId`** | **Reschedule work item (1 API call, recommended)**.
| GET | `/schedule-entries/upcoming` | Danh sach lich sap toi (mac dinh now..+7 ngay UTC).

**Tao entry**
```json
POST /api/schedule-entries
{
  "workItemId": "<GUID work item>",
  "startAt": "2025-09-10T13:00:00Z",
  "plannedMinutes": 90,
  "status": 0
}
```
- `workItemId`: Dung `work_id` tu `workItems[]` array (hoac `checklist_item_id` cho checklist, `atomic_task_id` cho task).
- `plannedMinutes`: 5..240.
- Trung lich voi entry status 0/1 -> 409 `OVERLAP_CONFLICT`.
- Work item khong thuoc user -> 403 `WORKITEM_NOT_OWNED`.

**Update entry theo work item (Recommended)** ⭐
```json
PATCH /api/schedule-entries/by-work-item/<workItemId>
{
  "startAt": "2025-09-10T14:00:00Z",
  "plannedMinutes": 60
}
```
- **Efficient**: 1 API call thay vi GET + PATCH (2 calls).
- **Atomic**: Backend tim entry tu `workItemId`, update 1 transaction.
- **Safe**: Prevent race conditions.
- Chi update entry dang **active** (status = 0 hoac 1).
- Response: Updated entry object.
- Errors:
  - 404 `NO_ACTIVE_ENTRY` - Khong tim thay entry active cho work item nay.
  - 403 `WORKITEM_NOT_OWNED` - Work item khong thuoc user.
  - 409 `OVERLAP_CONFLICT` - Thoi gian moi trung voi entry khac.

**Quan ly trang thai (status)**
- Status flow: `0 (planned) -> 1 (in_progress) -> 2 (done)` hoac `0 -> 3 (canceled)`.
- **Luu y quan trong**: Filtered unique index `IX_SE_User_Active_StartAt` dam bao khong co 2 entry cung `start_at` khi status la active (0 hoac 1).
- Neu UPDATE status tu done/canceled (2,3) ve active (0,1), phai dam bao `start_at` khong trung voi bat ky entry active nao khac cua cung user, neu khong se bi loi unique constraint.
- **Goi y**: Chi cho phep status flow mot chieu (0->1->2 hoac 0->3) de tranh xung dot.

**Danh sach upcoming**
```
GET /api/schedule-entries/upcoming?from=2025-09-10T00:00:00Z&to=2025-09-15T00:00:00Z&status=planned&page=1&pageSize=20&order=asc
```
- Bo qua `from`/`to` -> mac dinh now..+7d.

### 8.5 Users (seed/test)

### 8.6 AI Suggestions API

**Overview:** AI-powered task and checklist suggestions using Google Gemini 1.5 Flash. All endpoints require authentication and are protected by rate limiting (10 requests/15 minutes) and bulkhead pattern (max 10 concurrent requests).

**Authentication:** `Authorization: Bearer <JWT_TOKEN>`

**Rate Limiting & Protection:**
- Rate Limit: 10 requests per 15 minutes per user
- Bulkhead: Max 10 concurrent AI requests
- Headers: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`

#### 8.6.1 Generate AI Suggestion

**POST** `/api/ai-suggestions/generate`

Generate AI suggestion based on prompt template and user context.

**Request Body (with custom template):**
```json
{
  "promptTemplate": "Using work items {{workItems}} suggest tasks for today",
  "variables": {
    "timezone": "Asia/Ho_Chi_Minh",
    "workItems": "[{id: 1, title: 'Review code'}]"
  },
  "promptVersion": "v1",
  "workItemStatuses": [0, 1],
  "scheduleFrom": "2025-01-12T09:00:00Z",
  "scheduleTo": "2025-01-12T17:00:00Z",
  "timezone": "UTC",
  "minSlotMinutes": 30,
  "suggestionType": 0,
  "metadata": {
    "source": "web_app",
    "version": "1.0"
  }
}
```

**Request Body (using default template):**
```json
{
  "suggestionType": 0,
  "workItemStatuses": [0, 1],
  "timezone": "Asia/Ho_Chi_Minh"
}
```

**Parameters:**
- `promptTemplate` (string, optional): Template for AI prompt. If omitted, backend uses default template based on `suggestionType`:
  - **Type 0 (Tasks)**: Suggests new standalone tasks
  - **Type 1 (Checklist)**: Suggests checklist items to break down existing tasks  
  - **Type 2 (Mixed)**: Suggests both tasks and checklist items
- `variables` (object, optional): Variables to substitute in template
- `promptVersion` (string, optional, default: "default"): Version of prompt template
- `workItemStatuses` (array, optional, default: [0,1]): Filter work items by status (0=planned, 1=in_progress, 2=done)
- `scheduleFrom/scheduleTo` (ISO 8601, optional): Time range for scheduling
- `timezone` (string, optional, default: "UTC"): User timezone
- `minSlotMinutes` (number, optional, default: 30): Minimum time slot in minutes (15-480)
- `suggestionType` (number, optional, default: 0): 0=task, 1=checklist, 2=mixed
- `metadata` (object, optional): Additional metadata

**Note**: The `AISuggestionItems` table stores: `item_type`, `title`, `description`, `estimated_minutes`, `deadline`, `metadata`. Additional fields like `priority` or `task_id` should be included in the `metadata` JSON field.

**Optional Prompt Template:**

The `promptTemplate` field is now optional. If omitted, the backend will automatically select a default template based on `suggestionType`:

- **Type 0 (Tasks)**: Suggests new standalone tasks (default if type not specified)
- **Type 1 (Checklist)**: Suggests checklist items to break down existing tasks  
- **Type 2 (Mixed)**: Suggests both tasks and checklist items

Example request without template:
```json
POST /api/ai-suggestions/generate
{
  "suggestionType": 0,
  "workItemStatuses": [0, 1],
  "timezone": "Asia/Ho_Chi_Minh"
}
```

**Note**: The `AISuggestionItems` table stores: `item_type`, `title`, `description`, `estimated_minutes`, `deadline`, `metadata`. Additional fields like `priority` or `task_id` should be included as a JSON object in the `metadata` field (the backend will automatically stringify it).

**Enhanced Features:**
- **Prompt Templates with Examples**: Default templates now include clear examples for each item type (0=task, 1=checklist)
- **Response Validation**: Automatic validation of LLM responses to ensure correct item types and metadata structure
- **MAX_TOKENS Retry Logic**: Automatic retry with increased token limits and prompt simplification on token limit errors
- **Increased Token Limits**: Default maxOutputTokens increased from 1024 to 3000 for better response quality

To use a custom template, provide `promptTemplate` with placeholders: `{{workItems}}`, `{{scheduleEntries}}`, `{{freeSlots}}`, `{{studyProfile}}`.

**Response:**
```json
{
  "suggestion": {
    "id": "uuid",
    "title": "Suggested task title",
    "description": "Detailed description",
    "confidence": 0.85,
    "suggestionType": 0,
    "status": 0,
    "createdAt": "2025-01-12T10:00:00Z"
  },
  "items": [
    {
      "id": "uuid",
      "title": "Task item",
      "description": "Item description",
      "estimatedMinutes": 60,
      "deadline": "2025-01-12T17:00:00Z",
      "confidence": 0.8,
      "itemType": 0
    }
  ],
  "freeSlots": [
    {
      "start": "2025-01-12T14:00:00Z",
      "end": "2025-01-12T15:00:00Z",
      "durationMinutes": 60
    }
  ],
  "usage": {
    "totalTokens": 1500,
    "promptTokens": 800,
    "completionTokens": 700,
    "cost": 0.00045
  },
  "meta": {
    "model": "gemini-1.5-flash",
    "provider": "google",
    "latency_ms": 1250
  }
}
```

#### 8.6.2 List User Suggestions

**GET** `/api/ai-suggestions`

List user's AI suggestions with pagination and filtering.

**Query Parameters:**
- `page` (number, optional, default: 1): Page number
- `pageSize` (number, optional, default: 20, max: 100): Items per page
- `status` (array, optional): Filter by status (0=pending, 1=accepted, 2=rejected, 3=archived)
- `suggestionType` (number, optional): Filter by type (0=task, 1=checklist, 2=mixed)
- `from` (ISO 8601, optional): Filter from date
- `to` (ISO 8601, optional): Filter to date

**Example:**
```
GET /api/ai-suggestions?page=1&pageSize=10&status[]=0&status[]=1&suggestionType=0
```

**Response:**
```json
{
  "suggestions": [
    {
      "id": "uuid",
      "title": "Suggestion title",
      "description": "Description",
      "status": 0,
      "suggestionType": 0,
      "confidence": 0.85,
      "createdAt": "2025-01-12T10:00:00Z",
      "items": [...]
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

#### 8.6.3 Accept Suggestion

**POST** `/api/ai-suggestions/:id/accept`

Accept a suggestion (status = 1).

**Parameters:**
- `id` (UUID, required): Suggestion ID

**Response:**
```json
{
  "message": "Suggestion accepted successfully",
  "suggestion": {
    "id": "uuid",
    "status": 1,
    "acceptedAt": "2025-01-12T10:30:00Z"
  }
}
```

#### 8.6.4 Dismiss Suggestion

**POST** `/api/ai-suggestions/:id/dismiss`

Dismiss a suggestion with optional reason (status = 2).

**Parameters:**
- `id` (UUID, required): Suggestion ID

**Request Body:**
```json
{
  "reason": "Not relevant to current priorities"
}
```

**Response:**
```json
{
  "message": "Suggestion dismissed successfully",
  "suggestion": {
    "id": "uuid",
    "status": 2,
    "dismissedAt": "2025-01-12T10:30:00Z",
    "reason": "Not relevant to current priorities"
  }
}
```

#### 8.6.5 Update Suggestion Status

**PATCH** `/api/ai-suggestions/:id/status`

Update suggestion status manually.

**Parameters:**
- `id` (UUID, required): Suggestion ID

**Request Body:**
```json
{
  "status": 1,
  "reason": "Updated via admin panel"
}
```

**Status Values:**
- `0`: Pending
- `1`: Accepted
- `2`: Rejected/Dismissed
- `3`: Archived

**Response:**
```json
{
  "message": "Suggestion status updated successfully",
  "suggestion": {
    "id": "uuid",
    "status": 1,
    "updatedAt": "2025-01-12T10:30:00Z",
    "reason": "Updated via admin panel"
  }
}
```

#### 8.6.6 Health Check

**GET** `/api/health/ai`

Check AI service status and metrics.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-12T10:00:00Z",
  "latency_ms": 150,
  "circuit_breaker": {
    "state": "CLOSED",
    "failure_count": 0
  },
  "bulkhead": {
    "running_jobs": 2,
    "queued_jobs": 0,
    "max_concurrent": 10
  }
}
```

#### 8.6.7 AI Metrics Endpoint

**GET** `/api/health/ai/metrics`

Expose detailed AI metrics for monitoring and operations.

**Response:**
```json
{
  "metrics": {
    "requestCount": 150,
    "successCount": 145,
    "errorCount": 5,
    "successRate": 96.67,
    "averageResponseTime": 1250,
    "p95_latency": 2100,
    "p99_latency": 3500,
    "totalTokens": 225000,
    "totalCost": 0.0675,
    "queueDepth": 2,
    "retryCount": 8
  },
  "bulkhead": {
    "running": 2,
    "queued": 0,
    "done": 145,
    "reservoir": 10,
    "circuitState": "CLOSED",
    "failureCount": 0,
    "maxConcurrent": 10,
    "queueTimeout": 30000
  },
  "timestamp": "2025-01-12T10:00:00.000Z"
}
```

**Use Cases:**
- Monitoring dashboard integration
- Performance analytics
- Cost tracking
- Capacity planning

#### 8.6.8 Error Codes

| Code | Description | Common Causes |
|------|-------------|---------------|
| 400 | Bad Request | Invalid request body/parameters |
| 401 | Unauthorized | Missing/invalid JWT token |
| 404 | Not Found | Suggestion ID not found |
| 429 | Too Many Requests | Rate limit exceeded (10/15min) |
| 500 | Internal Server Error | Bulkhead queue full, server error |
| 503 | Service Unavailable | AI service down, circuit breaker open |

**Error Response Format:**
```json
{
  "error": "Rate limit exceeded",
  "details": "Maximum 10 requests per 15 minutes",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 900
}
```

## 9. Rang buoc domain & DB
- `Tasks`: co checklist -> `is_atomic = 0`; xoa het checklist -> trigger dua ve 1.
- `ChecklistItems`: `order_index` bat dau 1, unique theo `(task_id, order_index)`.
- View `WorkItems`: gom task atomic + checklist item, dung cho Schedule entries. Cac truong quan trong:
  - `work_id`: ID de dung lam `workItemId` khi tao schedule entry
  - `checklist_item_id`: Non-null neu la checklist item, NULL neu la atomic task
  - `atomic_task_id`: Non-null neu la atomic task, NULL neu la checklist item
  - `work_type`: `'checklist_item'` hoac `'atomic_task'`
- `ScheduleEntries`: transaction SERIALIZABLE tranh trung lich, trigger xoa entry khi checklist item bi xoa.
- `AuthRefreshTokens`: luu rotation family, revoked khi refresh thay moi.
- `AuthEmailVerificationTokens`: luu hash token xac minh; resend se xoa token chua dung truoc khi tao token moi.
- `AuthPasswordResetTokens`: luu token reset mat khau (varbinary). Moi yeu cau se tao token moi va huy token cu, reset xong se danh dau consumed.

## 10. Ma loi pho bien
| HTTP | Code | Nghia |
|------|------|-------|
| 400 | `Validation failed` | Sai schema (Zod).
| 400 | `userId khong ton tai` | Tao task cho user chua seed.
| 400 | `TOKEN_INVALID`/`TOKEN_EXPIRED` | Token verify/reset sai hoac het han.
| 400 | `TOKEN_USED` | Token reset/email da duoc dung roi.
| 401 | `Unauthorized` | Thieu/sai token/header.
| 403 | `WORKITEM_NOT_OWNED` | Work item thuoc user khac.
| 404 | `TASK_NOT_FOUND_OR_NOT_OWNED` | Task khong thuoc user hoac khong ton tai.
| 404 | `CHECKLIST_NOT_FOUND_OR_NOT_OWNED` | Checklist item sai owner.
| 404 | `ENTRY_NOT_FOUND` | Schedule entry khong ton tai.
| 404 | `NO_ACTIVE_ENTRY` | Khong tim thay active entry cho work item nay.
| 409 | `DEADLINE_CONFLICT` | Deadline task < deadline checklist.
| 409 | `DEADLINE_EXPAND_REQUIRED` | Can confirm mo rong deadline task.
| 409 | `OVERLAP_CONFLICT` | Lich trung voi entry khac.
| 429 | `RATE_LIMIT_EXCEEDED` | AI suggestions rate limit exceeded (10/15min).
| 500 | `BULKHEAD_QUEUE_FULL` | AI request queue full, try again later.
| 503 | `AI_SERVICE_UNAVAILABLE` | AI service down, circuit breaker open.

## 11. Lenh huu ich cho dev
- Khoi dong API + DB: `docker compose up --build`.
- Xem log API: `docker compose logs -f api`.
- Restart API: `docker compose restart api`.
- Kiem tra SQL tu host: `sqlcmd -S localhost,14333 -U sa -P "YourStrong!Passw0rd" -d Taskie`.
- Test ket noi DB voi env hien hanh: `node db-ping.js`.

## 12. Seed du lieu mau
```sql
INSERT INTO dbo.Users (id, email, name)
VALUES ('11111111-1111-1111-1111-111111111111','dev@example.com','Dev User');
```
Dung GUID nay lam `sub` JWT hoac header `x-user-id` de test nhanh.

---
Neu frontend can them API moi, tao issue mo ta payload/response mong doi de backend bo sung controller/route/validation tuong ung.

## 13. AI Auto Suggestion Job
- File `src/jobs/autoSuggestion.job.js` cung cap `startAutoSuggestionJob` (cron) va `runAutoSuggestionCycle` de sinh suggestions dinh ky.
- Can truyen `fetchEligibleUsers` (tra ve user bat AI) va `promptBuilder` (chuan bi payload goi dich vu).
- Mac dinh dung `node-cron` voi `cronExpression='0 * * * *'` va ghi log qua console; co the truyen logger khac neu can.
- LLM adapter mac dinh tai su dung `LLMAdapter` + repo log, vi vay can dat `LLM_API_KEY` truoc khi chay job.
- Khi tich hop, import va goi `startAutoSuggestionJob({ fetchEligibleUsers, promptBuilder })` trong bootstrap (vi du `server.js`).
- Co the truyen logger tuy bien (vd. Winston) hoac ghi thong ke vao bang rieng (processed/succeed/failed, token usage) de theo doi hieu nang job.
  
