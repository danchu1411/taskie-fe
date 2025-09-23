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
- **Errors**: Validation -> `400 { message: 'Validation failed', errors: [...] }`; auth -> `401 { message: 'Unauthorized' }`; cac loi khac co the co `code` rieng (`DEADLINE_CONFLICT`, `OVERLAP_CONFLICT`, ...).

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

AUTH_ALLOW_LEGACY_HEADER=true
JWT_ALG=HS256
JWT_SECRET=dev-secret-change-me
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
```
- Neu dung Gmail de test: bat 2FA, tao App Password, su dung `smtp.gmail.com` (`SMTP_PORT=587`, `SMTP_SECURE=false` hoac `SMTP_PORT=465`, `SMTP_SECURE=true`), va bo khoang trang trong mat khau ung dung khi dat vao `.env`.
- Dat `PASSWORD_RESET_WEB_URL` tro ve trang Reset Password cua front-end (co the dung mau `http://localhost:5173/reset-password?token={token}`); neu khong set se fallback ve `http://localhost:5173/reset-password`.
- Co the dat `DEFAULT_RESET_PASSWORD_URL` neu muon doi fallback khac (mac dinh la `http://localhost:5173/reset-password`).
- Len prod: tat `AUTH_ALLOW_LEGACY_HEADER`, doi secret manh hoac chuyen sang RS256 (`JWT_PUBLIC_KEY`).

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

**Danh sach task**
```
GET /api/tasks/by-user/<guid>
  ?page=1&pageSize=20&status=0&includeChecklist=true&includeWorkItems=true&q=keyword
```
- `includeChecklist=true` -> tra kem `checklist[]`.
- `includeWorkItems=true` -> tra kem `workItems[]`.
- Response `{ items, total, page, pageSize }`.

### 8.3 Checklist Items
| Method | Path | Ghi chu |
|--------|------|---------|
| GET | `/checklist-items/:taskId` | Lay danh sach checklist items cua task.
| POST | `/checklist-items/:taskId/checklist` | Them 1/nhieu item.
| PATCH | `/checklist-items/:itemId` | Cap nhat title/deadline/priority/status/order.
| DELETE | `/checklist-items/:itemId` | Xoa item, tu dong compact order.

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
| PATCH | `/schedule-entries/:entryId` | Cap nhat `startAt`, `plannedMinutes`, `status`.
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
- `plannedMinutes`: 5..240.
- Trung lich voi entry status 0/1 -> 409 `OVERLAP_CONFLICT`.
- Work item khong thuoc user -> 403 `WORKITEM_NOT_OWNED`.

**Danh sach upcoming**
```
GET /api/schedule-entries/upcoming?from=2025-09-10T00:00:00Z&to=2025-09-15T00:00:00Z&status=planned&page=1&pageSize=20&order=asc
```
- Bo qua `from`/`to` -> mac dinh now..+7d.

### 8.5 Users (seed/test)
| Method | Path | Ghi chu |
|--------|------|---------|
| GET | `/users` | Lay top 50 user (`created_at DESC`).
| GET | `/users/:id` | Lay chi tiet user.

## 9. Rang buoc domain & DB
- `Tasks`: co checklist -> `is_atomic = 0`; xoa het checklist -> trigger dua ve 1.
- `ChecklistItems`: `order_index` bat dau 1, unique theo `(task_id, order_index)`.
- View `WorkItems`: gom task atomic + checklist item, dung cho Schedule entries
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
| 409 | `DEADLINE_CONFLICT` | Deadline task < deadline checklist.
| 409 | `DEADLINE_EXPAND_REQUIRED` | Can confirm mo rong deadline task.
| 409 | `OVERLAP_CONFLICT` | Lich trung voi entry khac.

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
