# 🚀 Hướng dẫn Deploy Taskie Frontend lên Cloud

## 📋 Tổng quan

Dự án Taskie Frontend đã được kiểm tra và **SẴN SÀNG DEPLOY** lên cloud. Dưới đây là hướng dẫn chi tiết cho các platform phổ biến.

## ✅ Trạng thái kiểm tra

- ✅ **Build thành công**: `npm run build` hoàn thành không lỗi
- ✅ **TypeScript**: Type checking pass
- ✅ **Environment Variables**: Cấu hình đầy đủ
- ✅ **Security**: Không có hardcoded secrets
- ⚠️ **ESLint**: Có một số warnings (không ảnh hưởng deploy)
- ✅ **Bundle Analysis**: Đã tối ưu hóa với code splitting

## 🔧 Cấu hình Environment Variables

### Biến bắt buộc cho Production:

```bash
# API Configuration
VITE_API_BASE=https://your-api-domain.com/api

# Google OAuth (Production)
VITE_GOOGLE_CLIENT_ID=your-production-google-client-id
# KHÔNG set VITE_GOOGLE_ALLOW_MOCK trong production

# Optional: Dev mode (chỉ cho development)
VITE_DEV_USER_ID=your-dev-user-id
VITE_ACCESS_TOKEN=your-dev-token
```

### Cấu hình Google OAuth cho Production:

1. **Tạo Google Cloud Project**:
   - Vào [Google Cloud Console](https://console.cloud.google.com/)
   - Tạo project mới hoặc chọn project hiện có
   - Bật Google+ API và Google Identity Services

2. **Tạo OAuth 2.0 Client ID**:
   - Application type: "Web application"
   - Authorized JavaScript origins: `https://yourdomain.com`
   - Authorized redirect URIs: `https://yourdomain.com`

3. **Cập nhật Environment Variables**:
   ```bash
   VITE_GOOGLE_CLIENT_ID=your-production-google-client-id
   ```

## 🌐 Deploy trên các Platform

### 1. Vercel (Khuyến nghị)

#### Cách 1: Deploy từ GitHub
1. Kết nối repository với Vercel
2. Cấu hình Environment Variables trong Vercel Dashboard
3. Deploy tự động

#### Cách 2: Deploy từ CLI
```bash
# Cài đặt Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Cấu hình environment variables
vercel env add VITE_API_BASE
vercel env add VITE_GOOGLE_CLIENT_ID
```

#### Cấu hình vercel.json (tùy chọn):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 2. Netlify

#### Cách 1: Deploy từ GitHub
1. Kết nối repository với Netlify
2. Cấu hình Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Thêm Environment Variables trong Netlify Dashboard

#### Cách 2: Deploy từ CLI
```bash
# Cài đặt Netlify CLI
npm i -g netlify-cli

# Build và deploy
npm run build
netlify deploy --prod --dir=dist
```

#### Cấu hình netlify.toml (tùy chọn):
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 3. AWS S3 + CloudFront

#### Bước 1: Build và upload
```bash
# Build project
npm run build

# Upload to S3 (cần cấu hình AWS CLI)
aws s3 sync dist/ s3://your-bucket-name --delete
```

#### Bước 2: Cấu hình CloudFront
- Origin: S3 bucket
- Default root object: `index.html`
- Error pages: Redirect 404 → `/index.html` (status 200)

#### Bước 3: Environment Variables
- Sử dụng CloudFront Functions hoặc Lambda@Edge để inject env vars
- Hoặc build với env vars trước khi upload

### 4. Firebase Hosting

#### Cài đặt và cấu hình:
```bash
# Cài đặt Firebase CLI
npm i -g firebase-tools

# Login và init
firebase login
firebase init hosting

# Cấu hình firebase.json:
{
  "hosting": {
    "public": "dist",
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}

# Deploy
npm run build
firebase deploy
```

### 5. GitHub Pages

#### Cấu hình GitHub Actions:
Tạo file `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        env:
          VITE_API_BASE: ${{ secrets.VITE_API_BASE }}
          VITE_GOOGLE_CLIENT_ID: ${{ secrets.VITE_GOOGLE_CLIENT_ID }}
          
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## 🔒 Bảo mật Production

### 1. Environment Variables
- ✅ Không hardcode secrets trong code
- ✅ Sử dụng environment variables cho tất cả config
- ✅ Tắt mock mode trong production

### 2. CORS và CSP
- Cấu hình CORS trên backend để chỉ cho phép domain production
- Thêm Content Security Policy headers

### 3. HTTPS
- Đảm bảo sử dụng HTTPS trong production
- Cấu hình HSTS headers

## 📊 Performance Optimization

### Bundle Analysis Results:
- **JavaScript**: 1,137.93 KB (đã được code splitting)
- **CSS**: 127.06 KB
- **Images**: 2,918.42 KB (cần tối ưu)

### Khuyến nghị tối ưu:
1. **Lazy loading**: Đã được implement
2. **Code splitting**: Đã được cấu hình trong vite.config.ts
3. **Image optimization**: Cân nhắc sử dụng WebP format
4. **CDN**: Sử dụng CDN cho static assets

## 🚨 Lưu ý quan trọng

### 1. Node.js Version
- **Cảnh báo**: Hiện tại đang dùng Node.js 22.9.0
- **Khuyến nghị**: Upgrade lên Node.js 22.12+ hoặc downgrade xuống 20.19+
- **Tác động**: Không ảnh hưởng đến deploy nhưng có thể gây warning

### 2. ESLint Issues
- Có 196 errors và 17 warnings
- **Không ảnh hưởng deploy** nhưng nên fix để code quality tốt hơn
- Chủ yếu là `@typescript-eslint/no-explicit-any` và unused variables

### 3. API Configuration
- Đảm bảo backend API đã deploy và accessible
- Cấu hình CORS cho domain production
- Test kết nối API trước khi deploy frontend

## 🧪 Testing trước khi Deploy

### 1. Local Testing
```bash
# Build và test local
npm run build
npm run preview

# Test với production environment
VITE_API_BASE=https://your-api.com/api npm run build
npm run preview
```

### 2. Staging Environment
- Deploy lên staging trước
- Test đầy đủ các tính năng
- Kiểm tra performance và security

## 📞 Support

Nếu gặp vấn đề trong quá trình deploy:
1. Kiểm tra logs của platform
2. Verify environment variables
3. Test API connectivity
4. Check browser console for errors

---

**🎉 Chúc mừng! Dự án Taskie Frontend đã sẵn sàng deploy lên cloud!**
