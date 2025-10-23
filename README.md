# RoomZ - Find Your Perfect Room & Roommate

RoomZ là một nền tảng tìm kiếm phòng trọ và bạn cùng phòng hiện đại, được xây dựng với React, TypeScript, và Vite.

## 🚀 Tính năng

- 🏠 **Tìm kiếm phòng trọ**: Tìm kiếm phòng trọ đã được xác minh với bộ lọc thông minh
- 👥 **Tìm bạn cùng phòng**: Khớp với bạn cùng phòng tương thích dựa trên lối sống và sở thích
- 🔄 **SwapRoom**: Trao đổi phòng trọ với người khác
- ✅ **Xác minh**: Xác minh danh tính và phòng trọ để tăng độ tin cậy
- 💬 **Nhắn tin**: Chat trực tiếp với chủ nhà và bạn cùng phòng tiềm năng
- 🎁 **Local Passport**: Ưu đãi và voucher từ các đối tác địa phương
- 🏘️ **Cộng đồng**: Diễn đàn và bài viết từ cộng đồng người thuê trọ
- 🛠️ **Dịch vụ hỗ trợ**: Đặt dịch vụ dọn dẹp, chuyển nhà, và nhiều hơn nữa

## 🛠️ Tech Stack

- **Framework**: React 19
- **Language**: TypeScript
- **Build Tool**: Vite 7
- **Styling**: TailwindCSS 4
- **UI Components**: Radix UI
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Forms**: React Hook Form
- **Toasts**: Sonner

## 📁 Cấu trúc dự án

```
roomz-ui/
├── public/                 # Static assets
│   └── vite.svg
├── src/
│   ├── components/         # React components
│   │   ├── ui/            # UI components cơ bản (shadcn/ui)
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   └── ...
│   │   ├── figma/         # Figma-exported components
│   │   │   └── ImageWithFallback.tsx
│   │   ├── LandingPage.tsx
│   │   ├── SearchPage.tsx
│   │   ├── CompatibilityPage.tsx
│   │   ├── ProfilePage.tsx
│   │   └── ...            # Các page components khác
│   ├── data/              # Data files
│   │   └── messages.ts
│   ├── App.tsx            # Main App component
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── docs/                  # Documentation
│   └── ai/               # AI-DevKit documentation
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

## 📦 Cài đặt

### Yêu cầu

- Node.js >= 18.x
- npm hoặc yarn hoặc pnpm

### Các bước cài đặt

1. **Clone repository** (hoặc bạn đã có mã nguồn)

```bash
cd roomz-ui
```

2. **Cài đặt dependencies**

```bash
npm install
```

3. **Chạy development server**

```bash
npm run dev
```

Ứng dụng sẽ chạy tại `http://localhost:5173` (hoặc port khác nếu 5173 đang được sử dụng)

## 🔨 Scripts

- `npm run dev` - Khởi động development server
- `npm run build` - Build production
- `npm run preview` - Preview production build
- `npm run lint` - Chạy ESLint

## 🎨 Styling

Dự án sử dụng TailwindCSS v4 với custom design tokens:

- **Primary Color**: `#1557FF` (Blue)
- **Secondary Color**: `#3EC8C8` (Teal)
- **Font**: Poppins (Google Fonts)
- **Border Radius**: 1rem (16px)

Tất cả design tokens được định nghĩa trong `src/index.css` với CSS variables hỗ trợ dark mode.

## 🧩 Components

### UI Components (shadcn/ui)

Dự án sử dụng [shadcn/ui](https://ui.shadcn.com/) components được custom hóa:

- Button, Input, Label
- Dialog, Sheet, Drawer
- Card, Badge, Avatar
- Select, Checkbox, Switch
- Tabs, Accordion
- Toast (Sonner)
- Và nhiều components khác...

### Page Components

- **LandingPage**: Trang chủ với hero section và features
- **SearchPage**: Tìm kiếm phòng với filters và map view
- **CompatibilityPage**: Tìm bạn cùng phòng với compatibility quiz
- **RoomDetailPage**: Chi tiết phòng trọ với gallery và booking
- **ProfilePage**: Quản lý profile người dùng
- **SwapRoomPage**: Trao đổi phòng trọ
- **CommunityPage**: Diễn đàn cộng đồng
- **SupportServicesPage**: Đặt dịch vụ hỗ trợ
- **LocalPassportPage**: Ưu đãi và vouchers

## 🔐 Authentication

Hiện tại ứng dụng sử dụng mock authentication. Bạn có thể login bằng bất kỳ email/password nào.

Để tích hợp authentication thật, bạn có thể sử dụng:
- Firebase Auth
- Auth0
- Supabase Auth
- NextAuth.js

## 🌐 Deployment

### Build Production

```bash
npm run build
```

Build output sẽ được tạo trong thư mục `dist/`

### Deploy lên Hosting

Dự án có thể deploy lên:

- **Vercel**: `vercel deploy`
- **Netlify**: Drag & drop thư mục `dist/`
- **GitHub Pages**: Sử dụng GitHub Actions
- **Cloudflare Pages**: Connect repository

## 📱 Responsive Design

Ứng dụng được thiết kế responsive với:
- Mobile-first approach
- Bottom navigation cho mobile
- Top navigation cho desktop
- Breakpoints: `sm`, `md`, `lg`, `xl`, `2xl`

## 🤝 Contributing

Để đóng góp vào dự án:

1. Fork repository
2. Tạo branch mới: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Mở Pull Request

## 📄 License

MIT License - xem file LICENSE để biết thêm chi tiết

## 🙏 Credits

- UI Components: [shadcn/ui](https://ui.shadcn.com/)
- Icons: [Lucide](https://lucide.dev/)
- Images: [Unsplash](https://unsplash.com/)
- Design inspired by modern rental platforms

## 📞 Support

Nếu bạn gặp vấn đề hoặc có câu hỏi, vui lòng tạo issue trên GitHub.

---

Made with ❤️ by RoomZ Team
