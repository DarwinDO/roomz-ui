# RoomZ Admin Panel

Hệ thống quản trị toàn diện cho RoomZ với giao diện modern minimal aesthetic (Vercel/Stripe inspired).

## 🚀 Truy cập Admin Panel

### URL
- **Login**: `http://localhost:5174/admin/login`
- **Dashboard**: `http://localhost:5174/admin/dashboard`

### Demo Credentials
```
Email: admin@roomz.vn
Password: admin123
```

> ⚠️ **Lưu ý**: Đây là mock authentication cho demo. Trong production cần thay thế bằng JWT/session authentication.

---

## 📊 Tính năng chính

### 1. Dashboard (`/admin/dashboard`)
- **Overview cards**: Tổng users, phòng active, doanh thu, verification requests
- **Charts**: User growth, revenue by category, room types distribution
- **Recent activities**: 10 hoạt động gần nhất
- **Quick actions**: Shortcuts đến các trang quản lý

### 2. User Management (`/admin/users`)
- **Data table**: Avatar, Name, Email, Role, Status, Verified, Join Date
- **Filters**: All/Active/Suspended/Verified
- **Search**: Tìm theo tên hoặc email
- **Actions**: 
  - View profile detail
  - Suspend/Activate user
  - Verify user manually
  - Delete user (with confirm)
- **Stats**: Tổng users, active, suspended, verified

### 3. Room Management (`/admin/rooms`)
- **Data table**: Thumbnail, Title, Location, Price, Owner, Status, Posted Date
- **Filters**: Status (Active/Pending/Rejected/Removed)
- **Actions**:
  - View detail
  - Approve/Reject pending rooms
  - Feature room (priority listing)
  - Delete room
- **Stats**: Tổng phòng, active, pending, featured

### 4. Verification Requests (`/admin/verifications`)
- **Tabs**: Pending / Approved / Rejected
- **Document viewer**: Modal hiển thị giấy tờ upload
- **Actions**:
  - View documents (with image viewer)
  - Approve/Reject với reason
- **Types**: CMND/CCCD, Thẻ sinh viên, Chủ nhà

### 5. Reports & Complaints (`/admin/reports`)
- **Data table**: Reporter, Reported, Type, Status, Priority, Date
- **Filters**: Type, Status, Priority
- **Actions**:
  - View report detail
  - Investigate
  - Resolve/Dismiss with notes
- **Priority levels**: High/Medium/Low

### 6. Analytics (`/admin/analytics`)
- **Key metrics**: MAU, Conversion rate, Average session time, Bounce rate
- **Charts**: User growth, Revenue trends
- **Feature usage**: Progress bars cho từng tính năng
- **Popular locations**: Top locations by room count
- **User retention**: Retention table by cohort
- **Export**: Export reports button

### 7. Revenue Management (`/admin/revenue`)
- **Overview**: Total revenue, MRR, RoomZ+ subscriptions, Refund requests
- **Charts**: Revenue trend, Revenue by source
- **Transactions table**: Recent transactions với filter và search
- **Export**: Export revenue reports

### 8. Partners Management (`/admin/partners`)
- **Data table**: Name, Category, Status, Discount, Join Date, Views
- **Categories**: Café, Gym, Laundry, Restaurant
- **Actions**:
  - Add new partner
  - Edit partner info
  - Activate/Deactivate
  - View analytics
  - Delete partner
- **Stats**: Tổng partners, Active, By category

---

## 🎨 Design System

### Colors
- **Sidebar**: Dark (#1a1d29)
- **Content Area**: Light (#f9fafb)
- **Primary**: Indigo (#6366f1)
- **Secondary**: Purple (#8b5cf6)

### Components
- **Stats Card**: Icon, Title, Value, Change percentage với color variants
- **Data Table**: Generic table với pagination, sort, filter, search, selection
- **Charts**: LineChart, BarChart, PieChart (sử dụng Recharts)
- **Error Boundary**: Catch errors và hiển thị fallback UI

### Icons
- Sử dụng [Lucide React](https://lucide.dev/)

---

## 🏗️ Cấu trúc Files

```
src/
├── pages/admin/
│   ├── AdminLoginPage.tsx       # Trang đăng nhập admin
│   ├── DashboardPage.tsx        # Dashboard tổng quan
│   ├── UsersPage.tsx            # Quản lý người dùng
│   ├── RoomsPage.tsx            # Quản lý phòng trọ
│   ├── VerificationsPage.tsx   # Xử lý xác thực
│   ├── ReportsPage.tsx          # Báo cáo vi phạm
│   ├── AnalyticsPage.tsx        # Phân tích & thống kê
│   ├── RevenuePage.tsx          # Quản lý doanh thu
│   └── PartnersPage.tsx         # Quản lý đối tác
├── components/admin/
│   ├── StatsCard.tsx            # Component stats card
│   ├── DataTable.tsx            # Generic data table
│   ├── Charts.tsx               # Chart components
│   └── ErrorBoundary.tsx        # Error boundary wrapper
├── router/
│   └── AdminShell.tsx           # Admin layout với sidebar
└── data/
    └── adminData.ts             # Mock data cho admin
```

---

## 📝 Mock Data

File `src/data/adminData.ts` chứa:
- **120 mock users** với roles, statuses, verification states
- **60 mock rooms** với đa dạng statuses và prices
- **25 verification requests** (pending/approved/rejected)
- **30 reports** với priorities và statuses
- **100 transactions** cho revenue tracking
- **8 partners** cho Local Passport
- **Analytics data**: User growth, revenue trends, retention metrics

---

## 🔒 Authentication & Security

### Current (Mock)
- Authentication state lưu trong `localStorage.adminAuth`
- ProtectedAdminRoute component check auth trước khi render
- Redirect về `/admin/login` nếu chưa đăng nhập

### Production TODO
- [ ] Thay thế mock auth bằng JWT tokens
- [ ] Implement refresh token mechanism
- [ ] Add role-based access control (RBAC)
- [ ] Implement proper session management
- [ ] Add CSRF protection
- [ ] Implement rate limiting
- [ ] Add audit logs cho admin actions

---

## 🧪 Testing

### To-do
- [ ] Unit tests: StatsCard, DataTable, Charts components
- [ ] Integration tests: Admin login flow, CRUD operations
- [ ] E2E tests: Complete admin workflows
- [ ] Accessibility tests

---

## 📱 Responsive Design

Admin panel responsive cho:
- **Mobile** (< 768px): Sidebar collapse, simplified tables
- **Tablet** (768px - 1024px): Partial sidebar, optimized layouts
- **Desktop** (> 1024px): Full sidebar, all features

---

## 🚧 Known Limitations

1. **Mock Data**: Tất cả data là mock, không persist khi reload
2. **Mock Auth**: Authentication không secure, chỉ dùng cho demo
3. **Export Features**: Export buttons chỉ là placeholders
4. **Image URLs**: Sử dụng Unsplash placeholders, có thể broken nếu offline
5. **Real-time Updates**: Không có websocket/polling cho real-time data

---

## 🔄 Next Steps

### Immediate
- [ ] Add comprehensive tests
- [ ] Implement real API integration
- [ ] Add real authentication
- [ ] Implement actual export functionality

### Future Enhancements
- [ ] Real-time notifications
- [ ] Advanced analytics dashboard
- [ ] Bulk operations improvements
- [ ] Activity logs & audit trail
- [ ] Customizable dashboards
- [ ] Multi-language support
- [ ] Dark mode toggle

---

## 📞 Support

Nếu có vấn đề hoặc câu hỏi, liên hệ:
- **Email**: admin@roomz.vn
- **GitHub Issues**: [Create an issue](../../issues)

---

**Last Updated**: October 30, 2025  
**Version**: 1.0.0


