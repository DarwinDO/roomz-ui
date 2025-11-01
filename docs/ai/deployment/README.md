---
phase: deployment
title: Deployment Strategy
description: Define deployment process, infrastructure, and release procedures
---

# Deployment Strategy - RoomZ UI

## Infrastructure

### Hosting Platform: **Vercel** (Recommended)

**Why Vercel:**
- ✅ Miễn phí cho personal projects
- ✅ Setup cực kỳ đơn giản (connect GitHub → auto deploy)
- ✅ Tự động handle SPA routing
- ✅ CDN toàn cầu, hiệu suất cao
- ✅ Preview deployments cho mỗi PR
- ✅ HTTPS tự động
- ✅ Zero-config cho Vite projects

### Alternative Options:
- **Netlify**: Tương tự Vercel, dễ dùng
- **Firebase Hosting**: Tốt nếu dùng Firebase services
- **AWS S3 + CloudFront**: Full control, chi phí thấp
- **GitHub Pages**: Miễn phí hoàn toàn

## Build Configuration

### Build Commands
```bash
# Development
npm run dev

# Production build
npm run build

# Preview build locally
npm run preview
```

### Output
- **Build directory**: `dist/`
- **Build time**: ~30-40s
- **Bundle size**: ~1.3 MB (gzipped: ~400 KB)

## Deployment Steps

### Method 1: Vercel Web UI (Khuyến nghị)

1. **Tạo tài khoản Vercel**
   - Truy cập: https://vercel.com/signup
   - Login với GitHub

2. **Import Project**
   - Click "Add New" → "Project"
   - Chọn repository `roomz-ui`
   - Vercel tự động detect Vite

3. **Configure (Auto-detected)**
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Deploy**
   - Click "Deploy"
   - Chờ ~2-3 phút
   - ✅ Live tại `https://your-project.vercel.app`

### Method 2: Vercel CLI

```bash
# Cài Vercel CLI
npm i -g vercel

# Deploy (lần đầu)
vercel

# Deploy production
vercel --prod
```

### Method 3: GitHub Auto-Deploy

Sau khi link với Vercel:
- Mỗi push lên `dev` branch → auto preview deployment
- Mỗi merge vào `main` → auto production deployment

## Configuration Files

### vercel.json
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/index.html",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    }
  ]
}
```

**Giải thích:**
- **rewrites**: Chuyển tất cả requests về `/index.html` (quan trọng cho SPA routing!)
- **headers**: Optimize caching
  - Assets (JS/CSS) cache 1 năm
  - index.html không cache (để luôn lấy version mới)

## Environment Configuration

### Development
```bash
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=RoomZ
```

### Production
Set trong Vercel Dashboard → Settings → Environment Variables:
```
VITE_API_URL=https://api.roomz.app
VITE_APP_NAME=RoomZ
```

⚠️ **Lưu ý**: Trong Vite, biến phải bắt đầu với `VITE_` để exposed trên client.

## Routing Configuration

### Client-Side Routing (React Router)

Project sử dụng React Router với các routes:
- `/` - Landing page
- `/search` - Search rooms
- `/room/:id` - Room details
- `/sublet/:id` - Sublet details
- `/profile` - User profile
- `/admin` - Admin dashboard (protected)
- `/admin/login` - Admin login

**Cấu hình rewrite trong `vercel.json` đảm bảo:**
- Direct URL access hoạt động (`/admin`, `/search`, v.v.)
- Browser back/forward buttons hoạt động
- Deep linking hoạt động

## Admin Route Security

⚠️ **QUAN TRỌNG**: Admin authentication hiện tại chỉ là client-side protection!

### Current Implementation (Development Only)
```typescript
const isAuthenticated = localStorage.getItem('adminAuth') === 'true';
```

### Production Requirements (TODO)

1. **Backend API Authentication**
   ```typescript
   // Cần implement
   const verifyToken = async (token: string) => {
     const response = await fetch('/api/auth/verify', {
       headers: { Authorization: `Bearer ${token}` }
     });
     return response.ok;
   };
   ```

2. **JWT Tokens**
   - Store tokens securely
   - Implement token refresh
   - Set expiration (24h recommended)

3. **Rate Limiting**
   - Limit login attempts
   - Implement CAPTCHA sau 5 lần failed

4. **HTTPS Only**
   - Vercel tự động enable HTTPS
   - Never send tokens over HTTP

## Custom Domain (Optional)

### Add Custom Domain

1. **Mua domain** (GoDaddy, Namecheap, v.v.) hoặc qua Vercel
2. **Vercel Dashboard** → Settings → Domains
3. **Add domain** (e.g., `roomz.app`)
4. **Update DNS records**:
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   ```
5. **Wait for SSL** (tự động, ~30 phút)

## Performance Optimization

### Current Build Stats
```
Total bundle size: 407 KB (gzipped: 129 KB)
Largest chunks:
- Charts: 421 KB (gzipped: 113 KB)
- RoomDetailPage: 105 KB (gzipped: 31 KB)
```

### Optimization Applied
✅ Code splitting by route
✅ Lazy loading pages
✅ Asset optimization
✅ Tree shaking
✅ Minification

### Further Optimization (Optional)
- [ ] Image optimization (WebP, lazy load)
- [ ] Preload critical resources
- [ ] Service Worker for offline
- [ ] Bundle size reduction (split Charts)

## Monitoring & Analytics

### Vercel Analytics (Free)
Enable trong Vercel Dashboard:
- Page views
- Performance metrics (Web Vitals)
- Geographic distribution

### Error Tracking
Recommend: Sentry
```bash
npm install @sentry/react
```

## Rollback Plan

### Quick Rollback
1. Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "⋯" → "Promote to Production"

### Git Rollback
```bash
git revert HEAD
git push origin dev
# Vercel auto-redeploy
```

## Deployment Checklist

- [x] `npm run build` runs successfully
- [x] `npm run preview` works locally
- [x] `vercel.json` configured with rewrites
- [x] All routes tested (/, /search, /admin, v.v.)
- [ ] Environment variables set (if needed)
- [ ] Custom domain configured (optional)
- [ ] Admin authentication upgraded (before production)
- [ ] Error tracking setup (recommended)

## Post-Deployment Testing

### Test Routes
- [ ] https://your-site.vercel.app/ (Landing)
- [ ] https://your-site.vercel.app/search
- [ ] https://your-site.vercel.app/room/1
- [ ] https://your-site.vercel.app/profile
- [ ] https://your-site.vercel.app/admin/login
- [ ] https://your-site.vercel.app/admin (sau khi login)

### Performance Testing
- [ ] Run Lighthouse audit (target: >90)
- [ ] Test on mobile devices
- [ ] Test on slow 3G connection

### Functional Testing
- [ ] All navigation links work
- [ ] Images load correctly
- [ ] Forms submit properly
- [ ] Modals open/close
- [ ] Admin panel accessible

## Common Issues & Solutions

### Issue: 404 on Direct URL Access
**Solution**: Ensure `vercel.json` has rewrite rule → all requests to `/index.html`

### Issue: Assets Not Loading
**Solution**: Check build output directory is `dist`, not `build`

### Issue: Environment Variables Not Working
**Solution**: 
- Prefix with `VITE_`
- Rebuild after adding variables
- Access via `import.meta.env.VITE_VAR_NAME`

### Issue: Admin Route Not Protected
**Solution**: This is expected (client-side only). Implement backend auth before production.

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Vite Docs**: https://vitejs.dev/guide/
- **React Router**: https://reactrouter.com/

---

**Last Updated**: 2025-10-31
**Status**: ✅ Ready for Deployment
**Next Steps**: Push to GitHub → Connect Vercel → Deploy
