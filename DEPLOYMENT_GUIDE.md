# 🚀 Hướng Dẫn Deploy RoomZ lên Vercel

## ✅ Chuẩn Bị

Project đã sẵn sàng deploy với:
- ✅ Build thành công (không lỗi TypeScript)
- ✅ File `vercel.json` đã được config
- ✅ SPA routing được hỗ trợ
- ✅ Bundle size đã tối ưu (~400KB gzipped)

## 🎯 Deploy trong 5 phút

### Bước 1: Đảm bảo code đã push lên GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push origin dev
```

### Bước 2: Tạo tài khoản Vercel

1. Truy cập: https://vercel.com/signup
2. Chọn **"Continue with GitHub"**
3. Authorize Vercel

### Bước 3: Import Project

1. Vào Vercel Dashboard: https://vercel.com/dashboard
2. Click **"Add New"** → **"Project"**
3. Tìm và chọn repository **`roomz-ui`**
4. Vercel tự động detect:
   - **Framework**: Vite ✅
   - **Build Command**: `npm run build` ✅
   - **Output Directory**: `dist` ✅

5. Click **"Deploy"**

### Bước 4: Chờ Deploy

- ⏱ Thời gian: ~2-3 phút
- 🎉 Hoàn tất!
- 🔗 URL: `https://your-project.vercel.app`

## 🔧 Cấu Hình Tự Động Deploy

Sau khi connect, mỗi khi push code:
- **Push vào `dev`** → Preview deployment (test trước)
- **Merge vào `main`** → Production deployment

## 📱 Test sau khi Deploy

Mở các URL sau để kiểm tra:
- ✅ https://your-site.vercel.app/ (Landing page)
- ✅ https://your-site.vercel.app/search (Search)
- ✅ https://your-site.vercel.app/profile (Profile)
- ✅ https://your-site.vercel.app/admin/login (Admin)

## 🌐 Custom Domain (Tuỳ chọn)

Nếu muốn dùng domain riêng (ví dụ: `roomz.app`):

1. Mua domain tại Vercel hoặc provider khác
2. **Settings** → **Domains** → **Add**
3. Update DNS records theo hướng dẫn
4. SSL tự động enabled (~30 phút)

## ⚠️ Lưu Ý Quan Trọng

### Admin Route Security

**HIỆN TẠI**: Admin authentication chỉ là client-side (localStorage)
```typescript
// src/router/router.tsx
const isAuthenticated = localStorage.getItem('adminAuth') === 'true';
```

**TRƯỚC KHI PUBLIC**: Cần implement:
1. Backend API với JWT tokens
2. Rate limiting cho login
3. Session management
4. HTTPS only (Vercel đã enable)

### Environment Variables

Nếu cần API URL hoặc config:
1. Vercel Dashboard → **Settings** → **Environment Variables**
2. Add biến (phải bắt đầu với `VITE_`):
   ```
   VITE_API_URL=https://api.yoursite.com
   ```
3. Redeploy để áp dụng

## 🐛 Troubleshooting

### ❌ Lỗi 404 khi truy cập trực tiếp URL
**Nguyên nhân**: Thiếu rewrite rule  
**Giải pháp**: File `vercel.json` đã được config sẵn ✅

### ❌ Build failed trên Vercel
**Giải pháp**:
```bash
# Test local trước
npm run build
npm run preview
```

### ❌ Assets không load
**Giải pháp**: Check `vercel.json` có `outputDirectory: "dist"` ✅

## 📊 Performance

### Current Stats
```
Bundle size: 407 KB (gzipped: 129 KB)
Build time: ~30-40s
Lighthouse score target: >90
```

### Optimization Applied
- ✅ Code splitting by route
- ✅ Lazy loading
- ✅ Asset caching (1 year for static, 0 for HTML)
- ✅ Tree shaking & minification

## 📚 Tài Liệu Chi Tiết

Xem file `docs/ai/deployment/README.md` để biết:
- Alternative hosting options (Netlify, Firebase, AWS)
- Advanced configuration
- Monitoring & analytics setup
- Security best practices
- Rollback procedures

## 🆘 Cần Giúp Đỡ?

- **Vercel Docs**: https://vercel.com/docs
- **Vite Deployment**: https://vitejs.dev/guide/static-deploy.html
- **React Router**: https://reactrouter.com/

---

**Tóm tắt**: Push code lên GitHub → Connect Vercel → Click Deploy → Done! 🎉


