# Cấu trúc Dự án RoomZ

## 📁 Cấu trúc Thư mục Tổng quan

```
roomz-ui/
├── 📂 docs/                         # Tài liệu dự án (AI DevKit)
│   └── ai/                          # AI-assisted development docs
│       ├── deployment/
│       ├── design/
│       ├── implementation/
│       ├── monitoring/
│       ├── planning/
│       ├── requirements/
│       └── testing/
│
├── 📂 public/                       # Static assets
│   └── vite.svg
│
├── 📂 src/                          # Source code
│   ├── 📂 assets/                   # Images, fonts, etc.
│   │   └── react.svg
│   │
│   ├── 📂 components/               # React components
│   │   ├── 📂 ui/                   # UI components cơ bản (shadcn/ui)
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── drawer.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── select.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── slider.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── tooltip.tsx
│   │   │   ├── sonner.tsx           # Toast notifications
│   │   │   ├── utils.ts             # Utility functions (cn)
│   │   │   └── ...                  # 40+ UI components
│   │   │
│   │   ├── 📂 figma/                # Figma-exported components
│   │   │   └── ImageWithFallback.tsx
│   │   │
│   │   ├── 📄 LandingPage.tsx       # Trang chủ
│   │   ├── 📄 SearchPage.tsx        # Tìm kiếm phòng
│   │   ├── 📄 RoomDetailPage.tsx    # Chi tiết phòng
│   │   ├── 📄 RoomCard.tsx          # Card component
│   │   ├── 📄 CompatibilityPage.tsx # Tìm bạn cùng phòng
│   │   ├── 📄 SwapRoomPage.tsx      # Trao đổi phòng
│   │   ├── 📄 ProfilePage.tsx       # Trang cá nhân
│   │   ├── 📄 LoginPage.tsx         # Đăng nhập
│   │   ├── 📄 VerificationPage.tsx  # Xác minh
│   │   ├── 📄 CommunityPage.tsx     # Cộng đồng
│   │   ├── 📄 LocalPassportPage.tsx # Ưu đãi & vouchers
│   │   ├── 📄 SupportServicesPage.tsx # Dịch vụ hỗ trợ
│   │   ├── 📄 SettingsPage.tsx      # Cài đặt
│   │   ├── 📄 SubletDetailPage.tsx  # Chi tiết cho thuê lại
│   │   ├── 📄 BottomNav.tsx         # Bottom navigation (mobile)
│   │   ├── 📄 Chatbot.tsx           # AI chatbot
│   │   ├── 📄 ChatDrawer.tsx        # Chat drawer
│   │   ├── 📄 MessagesList.tsx      # Danh sách tin nhắn
│   │   ├── 📄 ServicesBanner.tsx    # Services banner
│   │   │
│   │   └── 📄 *Modal.tsx            # Các modal components
│   │       ├── BookViewingModal.tsx
│   │       ├── BookSubletModal.tsx
│   │       ├── BookMovingModal.tsx
│   │       ├── ConfirmBookingModal.tsx
│   │       ├── ContactLandlordModal.tsx
│   │       ├── CreatePostModal.tsx
│   │       ├── GalleryModal.tsx
│   │       ├── PartnerSignUpModal.tsx
│   │       ├── PostDetailModal.tsx
│   │       ├── ProfileEditModal.tsx
│   │       ├── RoommateProfileModal.tsx
│   │       ├── ShopDetailModal.tsx
│   │       ├── SupportRequestModal.tsx
│   │       ├── CleaningScheduleModal.tsx
│   │       ├── UpgradeRoomZPlusModal.tsx
│   │       ├── Upload360Modal.tsx
│   │       ├── VerifyLandlordModal.tsx
│   │       ├── ViewAllMatchesModal.tsx
│   │       └── VoucherModal.tsx
│   │
│   ├── 📂 data/                     # Data files
│   │   └── messages.ts              # Mock messages data
│   │
│   ├── 📄 App.tsx                   # Main App component
│   ├── 📄 main.tsx                  # Entry point
│   └── 📄 index.css                 # Global styles (Tailwind)
│
├── 📄 index.html                    # HTML entry point
├── 📄 package.json                  # Dependencies
├── 📄 package-lock.json
├── 📄 vite.config.ts                # Vite configuration
├── 📄 tsconfig.json                 # TypeScript configuration (root)
├── 📄 tsconfig.app.json             # TypeScript config (app)
├── 📄 tsconfig.node.json            # TypeScript config (node)
├── 📄 tailwind.config.js            # TailwindCSS configuration
├── 📄 postcss.config.js             # PostCSS configuration
├── 📄 eslint.config.js              # ESLint configuration
├── 📄 README.md                     # Project documentation
├── 📄 PROJECT_STRUCTURE.md          # Tài liệu này
└── 📄 AGENTS.md                     # AI agents documentation

```

## 📦 Các Package Chính

### Dependencies (Runtime)

| Package | Version | Mô tả |
|---------|---------|-------|
| react | ^19.1.1 | React framework |
| react-dom | ^19.1.1 | React DOM renderer |
| lucide-react | ^0.546.0 | Icon library |
| framer-motion | ^11.11.17 | Animation library |
| sonner | ^1.7.2 | Toast notifications |
| vaul | ^1.1.3 | Drawer component |
| embla-carousel-react | ^8.5.3 | Carousel component |
| recharts | ^2.15.1 | Chart library |
| @radix-ui/* | Various | Radix UI primitives |
| class-variance-authority | ^0.7.1 | CVA utilities |
| clsx | ^2.1.1 | Class name utilities |
| tailwind-merge | ^2.6.0 | Tailwind merge utilities |

### DevDependencies

| Package | Version | Mô tả |
|---------|---------|-------|
| vite | ^7.1.7 | Build tool |
| typescript | ~5.9.3 | TypeScript compiler |
| @vitejs/plugin-react | ^5.0.4 | React plugin for Vite |
| tailwindcss | ^4.1.15 | TailwindCSS v4 |
| autoprefixer | ^10.4.21 | CSS autoprefixer |
| postcss | ^8.5.6 | CSS processor |
| eslint | ^9.36.0 | Linter |
| typescript-eslint | ^8.45.0 | TypeScript ESLint |

## 🎨 Design System

### Colors

```css
--primary: #1557FF (Blue)
--secondary: #3EC8C8 (Teal)
--background: #ffffff
--foreground: #1a1a1a
--muted: #f5f5f5
--border: #e5e7eb
--destructive: #ef4444
```

### Typography

- **Font Family**: Poppins (Google Fonts)
- **Font Weights**: 400 (regular), 500 (medium), 600 (semi-bold), 700 (bold)
- **Font Sizes**: Base 16px, responsive scaling

### Border Radius

- Default: `1rem` (16px)
- Small: `calc(1rem - 4px)` (12px)
- Large: `calc(1rem + 4px)` (20px)

## 🔧 Configuration Files

### vite.config.ts

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### tsconfig.app.json

- Target: ES2022
- Module: ESNext
- JSX: react-jsx
- Strict mode enabled
- Path aliases: `@/*` → `./src/*`

### tailwind.config.js

- Content: `./index.html`, `./src/**/*.{js,ts,jsx,tsx}`
- TailwindCSS v4 với inline theme trong CSS

## 📱 Responsive Breakpoints

```css
xs: 375px   (Extra small)
sm: 640px   (Small)
md: 768px   (Medium)
lg: 1024px  (Large)
xl: 1280px  (Extra large)
2xl: 1536px (2X Extra large)
```

## 🚀 Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## 🗂️ Component Organization

### UI Components (src/components/ui/)

Các UI components cơ bản được xây dựng trên Radix UI và styled với TailwindCSS:

- **Form Components**: Button, Input, Textarea, Label, Checkbox, Switch, Slider, Select, Radio Group
- **Layout Components**: Card, Separator, Sheet, Drawer, Dialog, Tabs, Accordion, Collapsible
- **Data Display**: Badge, Avatar, Progress, Skeleton, Tooltip, Alert
- **Navigation**: Breadcrumb, Navigation Menu, Menubar, Dropdown Menu
- **Charts**: Chart components (recharts)
- **Feedback**: Sonner (Toast), Alert Dialog
- **Utilities**: utils.ts (cn function), use-mobile.ts

### Page Components (src/components/)

Các page components chính của ứng dụng:

1. **LandingPage** - Trang chủ với hero section
2. **SearchPage** - Tìm kiếm phòng với filters và map view
3. **RoomDetailPage** - Chi tiết phòng với gallery và booking
4. **CompatibilityPage** - Tìm bạn cùng phòng với quiz
5. **SwapRoomPage** - Trao đổi phòng trọ
6. **ProfilePage** - Quản lý profile
7. **VerificationPage** - Xác minh danh tính và phòng
8. **CommunityPage** - Diễn đàn cộng đồng
9. **LocalPassportPage** - Ưu đãi và vouchers
10. **SupportServicesPage** - Đặt dịch vụ hỗ trợ
11. **SettingsPage** - Cài đặt ứng dụng

### Modal Components

Tất cả modal components được đặt tên theo pattern `*Modal.tsx` và sử dụng Dialog hoặc Sheet từ UI components.

## 🔄 State Management

Hiện tại ứng dụng sử dụng:
- React useState cho local state
- Props drilling cho state sharing
- Screen-based routing (không dùng React Router)

Để scale up, có thể consider:
- React Context API
- Zustand
- Redux Toolkit
- TanStack Query (cho server state)

## 🎯 Features Overview

### 🏠 Core Features

1. **Room Search**: Advanced filters, map view, verified listings
2. **Roommate Matching**: Compatibility quiz, personality matching
3. **SwapRoom**: Room exchange between users
4. **Verification**: ID verification, landlord verification
5. **Messaging**: Real-time chat with potential roommates
6. **Community**: Forum, posts, discussions
7. **Local Passport**: Discounts and vouchers from local partners
8. **Support Services**: Cleaning, moving, maintenance booking

### 🔐 Authentication

Mock authentication (planned to integrate real auth):
- Email/Password login
- Social login (Google, Facebook)
- Magic link login

### 💬 Communication

- AI Chatbot (Chatbot.tsx)
- Direct messaging (ChatDrawer.tsx)
- Message list (MessagesList.tsx)

## 📸 Screenshots & Mockups

(Sẽ được thêm sau khi chạy development server)

## 🔜 Next Steps

1. ✅ Cài đặt dependencies: `npm install`
2. ✅ Chạy development server: `npm run dev`
3. ⏳ Tích hợp backend API
4. ⏳ Thêm authentication thật
5. ⏳ Thêm real-time messaging
6. ⏳ Thêm map integration (Google Maps/Mapbox)
7. ⏳ Thêm payment gateway
8. ⏳ Deploy lên production

## 🐛 Known Issues

Không có lỗi major. Tất cả imports đã được sửa và đúng chuẩn.

## 📝 Notes

- Dự án sử dụng TailwindCSS v4 (latest)
- React 19 với new features
- Vite 7 cho build speed tối ưu
- TypeScript strict mode
- ESLint configured
- Mobile-first responsive design
- Dark mode ready (CSS variables defined)

---

**Last Updated**: 2025-10-23

