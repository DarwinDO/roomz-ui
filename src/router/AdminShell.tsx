import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ErrorBoundary } from "@/components/admin/ErrorBoundary";
import {
  LayoutDashboard,
  Users,
  Home,
  ShieldCheck,
  Flag,
  BarChart3,
  DollarSign,
  Handshake,
  Menu,
  X,
  LogOut,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { path: "/admin/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { path: "/admin/users", label: "Người dùng", icon: Users },
  { path: "/admin/rooms", label: "Phòng trọ", icon: Home },
  { path: "/admin/verifications", label: "Xác thực", icon: ShieldCheck },
  { path: "/admin/reports", label: "Báo cáo", icon: Flag },
  { path: "/admin/analytics", label: "Phân tích", icon: BarChart3 },
  { path: "/admin/revenue", label: "Doanh thu", icon: DollarSign },
  { path: "/admin/partners", label: "Đối tác", icon: Handshake },
];

export default function AdminShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("adminAuth");
    navigate("/admin/login");
  };

  const getBreadcrumb = () => {
    const item = navItems.find((i) => i.path === location.pathname);
    return item ? item.label : "Admin";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-[#1a1d29]">
          {/* Logo */}
          <div className="flex h-16 flex-shrink-0 items-center px-6 border-b border-gray-700/50">
            <h1 className="text-xl font-bold text-white">RoomZ Admin</h1>
          </div>

          {/* Navigation */}
          <div className="flex flex-1 flex-col overflow-y-auto">
            <nav className="flex-1 space-y-1 px-3 py-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary text-white"
                        : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Admin User Info */}
          <div className="flex flex-shrink-0 border-t border-gray-700/50 p-4">
            <div className="flex items-center w-full">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-white">
                  AD
                </AvatarFallback>
              </Avatar>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-white">Admin</p>
                <p className="text-xs text-gray-400">admin@roomz.vn</p>
              </div>
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white hover:bg-gray-700/50"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-[#1a1d29] md:hidden">
            <div className="flex h-16 items-center justify-between px-6 border-b border-gray-700/50">
              <h1 className="text-xl font-bold text-white">RoomZ Admin</h1>
              <Button
                onClick={() => setSidebarOpen(false)}
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary text-white"
                        : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex flex-shrink-0 border-t border-gray-700/50 p-4">
              <div className="flex items-center w-full">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-white">
                    AD
                  </AvatarFallback>
                </Avatar>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-white">Admin</p>
                  <p className="text-xs text-gray-400">admin@roomz.vn</p>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-white hover:bg-gray-700/50"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 flex-shrink-0 items-center border-b border-gray-200 bg-white shadow-sm">
          <Button
            onClick={() => setSidebarOpen(true)}
            variant="ghost"
            size="icon"
            className="md:hidden ml-4"
          >
            <Menu className="h-6 w-6" />
          </Button>

          {/* Breadcrumb */}
          <div className="flex items-center px-4 sm:px-6 lg:px-8 flex-1">
            <div className="flex items-center text-sm text-gray-500">
              <Link to="/admin/dashboard" className="hover:text-gray-700">
                Admin
              </Link>
              <ChevronRight className="h-4 w-4 mx-2" />
              <span className="text-gray-900 font-medium">{getBreadcrumb()}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}

