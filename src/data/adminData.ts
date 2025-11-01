// Mock data for Admin Panel

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: "user" | "landlord" | "admin";
  status: "active" | "suspended" | "pending";
  verified: boolean;
  joinDate: string;
  roomsPosted?: number;
  lastActive?: string;
}

export interface AdminRoom {
  id: string;
  title: string;
  location: string;
  price: number;
  thumbnail: string;
  owner: string;
  ownerId: string;
  status: "active" | "pending" | "rejected" | "removed";
  verified: boolean;
  featured: boolean;
  postedDate: string;
  views?: number;
}

export interface VerificationRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: "id" | "student_id" | "landlord";
  status: "pending" | "approved" | "rejected";
  submittedDate: string;
  documents: string[];
  reason?: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  reportedId: string;
  reportedName: string;
  reportedType: "user" | "room";
  type: "spam" | "fraud" | "inappropriate" | "other";
  priority: "high" | "medium" | "low";
  status: "pending" | "investigating" | "resolved" | "dismissed";
  description: string;
  date: string;
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  type: "subscription" | "booking_fee" | "feature_listing";
  amount: number;
  status: "completed" | "pending" | "refunded";
  date: string;
}

export interface Partner {
  id: string;
  name: string;
  logo?: string;
  category: "cafe" | "gym" | "laundry" | "restaurant" | "other";
  discount: string;
  status: "active" | "inactive";
  joinDate: string;
  views?: number;
}

// Generate mock users
export const mockUsers: AdminUser[] = Array.from({ length: 120 }, (_, i) => ({
  id: `user-${i + 1}`,
  name: [
    "Nguyễn Văn An", "Trần Thị Bình", "Lê Hoàng Cường", "Phạm Thị Dung", 
    "Hoàng Văn Em", "Đỗ Thị Phương", "Vũ Minh Giang", "Bùi Thị Hương",
    "Ngô Văn Hùng", "Đinh Thị Lan", "Lý Văn Khoa", "Mai Thị Linh",
    "Đặng Văn Minh", "Phan Thị Nga", "Tô Văn Phúc", "Cao Thị Quỳnh"
  ][i % 16],
  email: `user${i + 1}@example.com`,
  role: i < 100 ? "user" : i < 115 ? "landlord" : "admin",
  status: i % 20 === 0 ? "suspended" : i % 15 === 0 ? "pending" : "active",
  verified: i % 3 !== 0,
  joinDate: new Date(2024, Math.floor(i / 10), (i % 28) + 1).toISOString(),
  roomsPosted: i >= 100 ? Math.floor(Math.random() * 5) + 1 : undefined,
  lastActive: new Date(2025, 9, 30 - (i % 30)).toISOString(),
}));

// Generate mock rooms
export const mockRooms: AdminRoom[] = Array.from({ length: 60 }, (_, i) => ({
  id: `room-${i + 1}`,
  title: [
    "Phòng riêng ấm cúng gần trường",
    "Căn studio hiện đại",
    "Phòng có ban công thoáng mát",
    "Phòng 2 người ở ghép",
    "Căn hộ mini đầy đủ tiện nghi"
  ][i % 5],
  location: [
    "Quận 1, TP.HCM",
    "Quận 3, TP.HCM",
    "Thủ Đức, TP.HCM",
    "Quận 10, TP.HCM",
    "Bình Thạnh, TP.HCM"
  ][i % 5],
  price: [2500000, 3000000, 3500000, 4000000, 4500000, 5000000][i % 6],
  thumbnail: `https://images.unsplash.com/photo-${1668089677938 + i}?w=400&h=300&fit=crop`,
  owner: mockUsers[100 + (i % 15)].name,
  ownerId: mockUsers[100 + (i % 15)].id,
  status: i % 10 === 0 ? "pending" : i % 20 === 0 ? "rejected" : i % 25 === 0 ? "removed" : "active",
  verified: i % 4 !== 0,
  featured: i % 8 === 0,
  postedDate: new Date(2025, 9, 30 - (i % 30)).toISOString(),
  views: Math.floor(Math.random() * 500) + 50,
}));

// Generate verification requests
export const mockVerifications: VerificationRequest[] = Array.from({ length: 25 }, (_, i) => ({
  id: `verify-${i + 1}`,
  userId: mockUsers[i].id,
  userName: mockUsers[i].name,
  userEmail: mockUsers[i].email,
  type: ["id", "student_id", "landlord"][i % 3] as "id" | "student_id" | "landlord",
  status: i < 8 ? "pending" : i < 18 ? "approved" : "rejected",
  submittedDate: new Date(2025, 9, 30 - (i % 30)).toISOString(),
  documents: [
    "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400",
    "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400"
  ],
  reason: i >= 18 ? "Giấy tờ không rõ ràng" : undefined,
}));

// Generate reports
export const mockReports: Report[] = Array.from({ length: 30 }, (_, i) => ({
  id: `report-${i + 1}`,
  reporterId: mockUsers[i].id,
  reporterName: mockUsers[i].name,
  reportedId: i % 2 === 0 ? mockRooms[i % 60].id : mockUsers[(i + 10) % 120].id,
  reportedName: i % 2 === 0 ? mockRooms[i % 60].title : mockUsers[(i + 10) % 120].name,
  reportedType: i % 2 === 0 ? "room" : "user",
  type: ["spam", "fraud", "inappropriate", "other"][i % 4] as any,
  priority: i % 3 === 0 ? "high" : i % 2 === 0 ? "medium" : "low",
  status: i < 10 ? "pending" : i < 15 ? "investigating" : i < 25 ? "resolved" : "dismissed",
  description: "Mô tả báo cáo vi phạm...",
  date: new Date(2025, 9, 30 - (i % 30)).toISOString(),
}));

// Generate transactions
export const mockTransactions: Transaction[] = Array.from({ length: 100 }, (_, i) => ({
  id: `trans-${i + 1}`,
  userId: mockUsers[i % 120].id,
  userName: mockUsers[i % 120].name,
  type: ["subscription", "booking_fee", "feature_listing"][i % 3] as any,
  amount: i % 3 === 0 ? 200000 : i % 3 === 1 ? 50000 : 100000,
  status: i % 20 === 0 ? "refunded" : i % 15 === 0 ? "pending" : "completed",
  date: new Date(2025, 9, 30 - (i % 30)).toISOString(),
}));

// Generate partners
export const mockPartners: Partner[] = [
  { id: "p1", name: "Café 89°", category: "cafe", discount: "20%", status: "active", joinDate: "2025-01-15", views: 1250 },
  { id: "p2", name: "Gym Plus", category: "gym", discount: "15%", status: "active", joinDate: "2025-02-20", views: 890 },
  { id: "p3", name: "CleanMe Laundry", category: "laundry", discount: "10%", status: "active", joinDate: "2025-03-10", views: 650 },
  { id: "p4", name: "Pizza House", category: "restaurant", discount: "25%", status: "active", joinDate: "2025-04-05", views: 1100 },
  { id: "p5", name: "Highlands Coffee", category: "cafe", discount: "15%", status: "active", joinDate: "2025-05-12", views: 980 },
  { id: "p6", name: "Fit24 Gym", category: "gym", discount: "20%", status: "inactive", joinDate: "2025-06-18", views: 450 },
  { id: "p7", name: "Fresh Wash", category: "laundry", discount: "12%", status: "active", joinDate: "2025-07-22", views: 520 },
  { id: "p8", name: "Phở 24", category: "restaurant", discount: "18%", status: "active", joinDate: "2025-08-08", views: 780 },
];

// Analytics data
export const analyticsData = {
  userGrowth: [
    { month: "Tháng 5", users: 450 },
    { month: "Tháng 6", users: 680 },
    { month: "Tháng 7", users: 920 },
    { month: "Tháng 8", users: 1250 },
    { month: "Tháng 9", users: 1580 },
    { month: "Tháng 10", users: 1920 },
  ],
  revenueByCategory: [
    { category: "RoomZ+", amount: 12500000 },
    { category: "Phí đặt phòng", amount: 5600000 },
    { category: "Tin nổi bật", amount: 3200000 },
  ],
  roomTypes: [
    { type: "Phòng riêng", value: 45 },
    { type: "Căn studio", value: 30 },
    { type: "Phòng ghép", value: 15 },
    { type: "Nguyên căn", value: 10 },
  ],
};

// Recent activities
export const recentActivities = [
  { id: "1", user: "Nguyễn Văn An", action: "Đăng ký tài khoản", time: "5 phút trước" },
  { id: "2", user: "Trần Thị Bình", action: "Đăng tin phòng mới", time: "12 phút trước" },
  { id: "3", user: "Lê Hoàng Cường", action: "Nâng cấp RoomZ+", time: "25 phút trước" },
  { id: "4", user: "Phạm Thị Dung", action: "Gửi yêu cầu xác thực", time: "1 giờ trước" },
  { id: "5", user: "Hoàng Văn Em", action: "Đặt lịch xem phòng", time: "2 giờ trước" },
  { id: "6", user: "Đỗ Thị Phương", action: "Báo cáo vi phạm", time: "3 giờ trước" },
  { id: "7", user: "Vũ Minh Giang", action: "Đánh giá phòng", time: "4 giờ trước" },
  { id: "8", user: "Bùi Thị Hương", action: "Gia hạn RoomZ+", time: "5 giờ trước" },
  { id: "9", user: "Ngô Văn Hùng", action: "Cập nhật hồ sơ", time: "6 giờ trước" },
  { id: "10", user: "Đinh Thị Lan", action: "Đăng tin cho thuê lại", time: "7 giờ trước" },
];


