# 🚀 Hướng dẫn Bắt đầu Nhanh - RoomZ

## ✅ Checklist

- [x] Cấu trúc thư mục đã được tổ chức đúng chuẩn
- [x] Tất cả imports đã được sửa (không còn lỗi module)
- [x] package.json đã có đầy đủ dependencies
- [x] Các file config (vite, tsconfig, tailwind) đã được thiết lập
- [x] TailwindCSS v4 đã được cấu hình đúng
- [x] Path aliases (@/*) đã được thiết lập
- [x] Framer Motion đã được thêm vào dependencies

## 🎯 Bước 1: Cài đặt Dependencies

```bash
npm install
```

Hoặc nếu dùng yarn:

```bash
yarn install
```

Hoặc pnpm:

```bash
pnpm install
```

**Thời gian ước tính**: 2-5 phút (tùy vào tốc độ internet)

## 🎯 Bước 2: Chạy Development Server

```bash
npm run dev
```

Ứng dụng sẽ chạy tại: **http://localhost:5173**

(Hoặc port khác nếu 5173 đang được sử dụng)

## 🎯 Bước 3: Mở trong Trình duyệt

Truy cập: **http://localhost:5173**

Bạn sẽ thấy trang Login. Click nút "Sign In" để vào ứng dụng (mock authentication).

## 📱 Tính năng chính để test

### 1. Landing Page (Trang chủ)
- Hero section với search bar
- Features overview
- Services banner

### 2. Search Page (Tìm kiếm phòng)
- Filters: giá, loại phòng, amenities
- List view / Map view
- Room cards với verified badge
- Match percentage

### 3. Room Detail
- Gallery modal
- Room information
- Book viewing modal
- Contact landlord

### 4. Compatibility Page (Tìm bạn cùng phòng)
- Personality quiz
- Compatibility matching
- Match percentage
- Chat với matches

### 5. SwapRoom
- Browse available room swaps
- Filter by location, price
- Book swap

### 6. Profile
- User information
- Verification status
- Saved rooms
- Messages

### 7. Community
- Forum posts
- Create new post
- Engage with community

### 8. Local Passport
- Vouchers & discounts
- Partner shops
- Redeem vouchers

### 9. Support Services
- Book cleaning service
- Book moving service
- Request maintenance

### 10. Chatbot
- AI assistant (bottom-right corner)
- Quick questions
- Help & support

## 🎨 Test Responsive Design

### Desktop View (> 768px)
- Top navigation bar
- Horizontal layout
- Sidebar navigation

### Mobile View (< 768px)
- Bottom navigation bar
- Vertical layout
- Hamburger menu
- Mobile-optimized UI

## 🔧 Development Tips

### 1. Hot Module Replacement (HMR)

Vite hỗ trợ HMR, code changes sẽ update ngay lập tức mà không cần refresh.

### 2. TypeScript Checking

Chạy TypeScript compiler để check lỗi:

```bash
npm run build
```

### 3. ESLint

Chạy linter để check code quality:

```bash
npm run lint
```

### 4. Format Code

Nếu bạn dùng Prettier:

```bash
npx prettier --write "src/**/*.{ts,tsx}"
```

## 🎨 Customization

### Thay đổi Colors

Edit `src/index.css`:

```css
:root {
  --primary: #1557FF;      /* Thay đổi màu primary */
  --secondary: #3EC8C8;    /* Thay đổi màu secondary */
  /* ... */
}
```

### Thay đổi Font

Edit `src/index.css`:

```css
@import url("https://fonts.googleapis.com/css2?family=YourFont:wght@400;500;600;700&display=swap");

html {
  font-family: "YourFont", sans-serif;
}
```

### Thay đổi Border Radius

Edit `src/index.css`:

```css
:root {
  --radius: 0.5rem;  /* Thay đổi từ 1rem thành 0.5rem để có góc nhọn hơn */
}
```

## 🐛 Troubleshooting

### Lỗi: Port 5173 đang được sử dụng

**Giải pháp**: Vite sẽ tự động chọn port khác. Hoặc bạn có thể chỉ định port:

```bash
npm run dev -- --port 3000
```

### Lỗi: Module not found

**Giải pháp**: Xóa node_modules và cài lại:

```bash
rm -rf node_modules package-lock.json
npm install
```

### Lỗi: TypeScript error

**Giải pháp**: Clear cache và rebuild:

```bash
npm run build
```

### Lỗi: TailwindCSS không hoạt động

**Giải pháp**: Đảm bảo `index.css` đã được import trong `main.tsx`:

```typescript
import './index.css'
```

## 📦 Build cho Production

```bash
npm run build
```

Output sẽ được tạo trong thư mục `dist/`

## 🚀 Deploy

### Vercel

```bash
npm i -g vercel
vercel
```

### Netlify

```bash
npm run build
# Drag & drop thư mục dist/ lên Netlify
```

### Cloudflare Pages

Connect repository và set build command:

```
npm run build
```

Output directory:

```
dist
```

## 📚 Tài liệu liên quan

- [README.md](./README.md) - Overview và features
- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) - Chi tiết cấu trúc dự án
- [AGENTS.md](./AGENTS.md) - AI agents documentation
- [docs/ai/](./docs/ai/) - AI DevKit documentation

## 🎓 Learning Resources

### React 19
- [React Docs](https://react.dev/)
- [React 19 Release Notes](https://react.dev/blog/2025/01/17/react-v19)

### Vite
- [Vite Guide](https://vite.dev/guide/)

### TailwindCSS
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [TailwindCSS v4 Changelog](https://tailwindcss.com/docs/v4-release-notes)

### Radix UI
- [Radix UI Docs](https://www.radix-ui.com/docs)

### shadcn/ui
- [shadcn/ui Docs](https://ui.shadcn.com/)

## 💡 Tips

1. **Sử dụng React DevTools** để debug components
2. **Sử dụng Vite DevTools** để inspect HMR và performance
3. **Sử dụng TailwindCSS IntelliSense** extension trong VS Code
4. **Enable TypeScript strict mode** để catch bugs sớm
5. **Commit code thường xuyên** với clear messages

## 🤝 Need Help?

- **GitHub Issues**: Tạo issue nếu gặp bug
- **Discussions**: Tham gia discussions để hỏi đáp
- **Documentation**: Đọc docs trong `docs/ai/`

---

**Happy Coding! 🎉**

Made with ❤️ by RoomZ Team


