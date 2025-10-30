import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Search, MessageCircle, User, Plus, Users, RefreshCw, Gift, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BottomNav() {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();

  const mainNavItems = [
    { id: "home", label: "Trang chủ", icon: Home, path: "/" },
    { id: "search", label: "Tìm kiếm", icon: Search, path: "/search" },
  ];

  const rightNavItems = [
    { id: "messages", label: "Tin nhắn", icon: MessageCircle, path: "/messages" },
    { id: "profile", label: "Hồ sơ", icon: User, path: "/profile" },
  ];

  const expandedMenuItems = [
    { id: "community", label: "Cộng đồng", icon: Users, color: "bg-blue-50", path: "/community" },
    { id: "swap", label: "SwapRoom", icon: RefreshCw, color: "bg-green-50", path: "/swap" },
    { id: "local-passport", label: "Ưu đãi", icon: Gift, color: "bg-purple-50", path: "/local-passport" },
    { id: "settings", label: "Cài đặt", icon: Settings, color: "bg-gray-50", path: "/settings" },
  ];

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      {/* Overlay */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          style={{
            animation: "fadeIn 300ms ease-out",
          }}
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Expandable Bottom Sheet */}
      {isExpanded && (
        <div
          className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 md:hidden"
          style={{
            height: "45vh",
            boxShadow: "0 -4px 12px rgba(0,0,0,0.1)",
            animation: "slideUp 300ms ease-out",
          }}
        >
          <div className="p-6">
            {/* Handle Bar */}
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6" />

            {/* Menu Title */}
            <h3 className="mb-6 text-center">Truy cập nhanh</h3>

            {/* Menu Grid */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              {expandedMenuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    onClick={() => setIsExpanded(false)}
                    className={`flex flex-col items-center gap-3 p-4 rounded-2xl transition-all active:scale-95 ${
                      active ? 'bg-primary/10' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                        active ? 'bg-primary' : item.color
                      }`}
                    >
                      <Icon className={`w-6 h-6 ${active ? 'text-white' : 'text-primary'}`} />
                    </div>
                    <span className={`text-sm ${active ? 'text-primary font-medium' : ''}`}>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Cancel Button */}
            <Button
              onClick={() => setIsExpanded(false)}
              variant="outline"
              className="w-full h-12 rounded-full text-gray-600 border-gray-300"
            >
              Hủy
            </Button>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white z-40 md:hidden"
        style={{
          boxShadow: "0 -2px 6px rgba(0,0,0,0.06)",
        }}
      >
        <div className="flex items-center justify-around px-4 py-3">
          {/* Left Navigation Items */}
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.id}
                to={item.path}
                className="flex flex-col items-center gap-1 min-w-[48px] transition-all active:scale-95"
              >
                <Icon
                  className={`w-6 h-6 ${
                    active ? "text-primary" : "text-gray-400"
                  }`}
                />
                <span
                  className={`text-xs ${
                    active ? "text-primary font-medium" : "text-gray-500"
                  }`}
                  style={{ fontSize: "12px", fontWeight: active ? 500 : 400 }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Center Action Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex flex-col items-center gap-1 -mt-2 min-w-[48px] transition-all active:scale-95"
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform"
              style={{
                background: "linear-gradient(135deg, #1557FF 0%, #3EC8C8 100%)",
                transform: isExpanded ? "rotate(45deg)" : "rotate(0deg)",
              }}
            >
              <Plus className="w-7 h-7 text-white" />
            </div>
          </button>

          {/* Right Navigation Items */}
          {rightNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.id}
                to={item.path}
                className="flex flex-col items-center gap-1 min-w-[48px] transition-all active:scale-95"
              >
                <Icon
                  className={`w-6 h-6 ${
                    active ? "text-primary" : "text-gray-400"
                  }`}
                />
                <span
                  className={`text-xs ${
                    active ? "text-primary font-medium" : "text-gray-500"
                  }`}
                  style={{ fontSize: "12px", fontWeight: active ? 500 : 400 }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Animation Styles */}
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
