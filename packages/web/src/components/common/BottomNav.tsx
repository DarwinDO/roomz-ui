import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Search,
  MessageCircle,
  User,
  Plus,
  Users,
  RefreshCw,
  Settings,
  BriefcaseBusiness,
  LayoutDashboard,
  HousePlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts';

export function BottomNav() {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();
  const { profile } = useAuth();
  const isLandlord = profile?.role === 'landlord';

  if (location.pathname === '/messages') {
    return null;
  }

  const mainNavItems = [
    { id: 'home', label: 'Trang chủ', icon: Home, path: '/' },
    { id: 'search', label: 'Tìm kiếm', icon: Search, path: '/search' },
  ];

  const rightNavItems = [
    { id: 'messages', label: 'Tin nhắn', icon: MessageCircle, path: '/messages' },
    { id: 'profile', label: 'Hồ sơ', icon: User, path: '/profile' },
  ];

  const expandedMenuItems = [
    { id: 'roommates', label: 'Tìm bạn cùng phòng', icon: Users, color: 'bg-blue-50', path: '/roommates' },
    { id: 'services', label: 'Dịch vụ & Ưu đãi', icon: BriefcaseBusiness, color: 'bg-amber-50', path: '/services' },
    { id: 'community', label: 'Cộng đồng', icon: Users, color: 'bg-indigo-50', path: '/community' },
    { id: 'swap', label: 'Ở ngắn hạn', icon: RefreshCw, color: 'bg-green-50', path: '/swap' },
    isLandlord
      ? { id: 'host', label: 'Chủ nhà', icon: LayoutDashboard, color: 'bg-slate-100', path: '/host' }
      : { id: 'become-host', label: 'Trở thành chủ nhà', icon: HousePlus, color: 'bg-sky-50', path: '/become-host' },
    { id: 'settings', label: 'Cài đặt', icon: Settings, color: 'bg-gray-50', path: '/settings' },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      {isExpanded && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          style={{ animation: 'fadeIn 300ms ease-out' }}
          onClick={() => setIsExpanded(false)}
        />
      )}

      {isExpanded && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 overflow-hidden rounded-t-3xl bg-card shadow-[0_-4px_12px_rgba(0,0,0,0.08)] md:hidden"
          style={{ height: '65vh', maxHeight: '600px', animation: 'slideUp 300ms ease-out' }}
        >
          <div className="flex h-full flex-col p-5">
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-muted-foreground/30" />
            <h3 className="mb-4 text-center">Truy cập nhanh</h3>

            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 pb-4">
                {expandedMenuItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      onClick={() => setIsExpanded(false)}
                      className={`flex flex-col items-center gap-2.5 rounded-2xl p-3 transition-all active:scale-95 ${active ? 'bg-primary/10' : 'hover:bg-muted'}`}
                    >
                      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${active ? 'bg-primary' : item.color}`}>
                        <Icon className={`h-6 w-6 ${active ? 'text-white' : 'text-primary'}`} />
                      </div>
                      <span className={`text-center text-sm ${active ? 'font-medium text-primary' : ''}`}>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <Button
              onClick={() => setIsExpanded(false)}
              variant="outline"
              className="mt-3 h-11 w-full shrink-0 rounded-full border-border text-muted-foreground"
            >
              Hủy
            </Button>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-card shadow-[0_-2px_6px_rgba(0,0,0,0.05)] md:hidden">
        <div className="flex items-center justify-around px-4 py-3">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link key={item.id} to={item.path} className="flex min-w-[48px] flex-col items-center gap-1 transition-all active:scale-95">
                <Icon className={`h-6 w-6 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                <span
                  className={`text-xs ${active ? 'font-medium text-primary' : 'text-muted-foreground'}`}
                  style={{ fontSize: '12px', fontWeight: active ? 500 : 400 }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="-mt-2 flex min-w-[48px] flex-col items-center gap-1 transition-all active:scale-95"
          >
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform"
              style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                transform: isExpanded ? 'rotate(45deg)' : 'rotate(0deg)',
              }}
            >
              <Plus className="h-7 w-7 text-white" />
            </div>
          </button>

          {rightNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link key={item.id} to={item.path} className="flex min-w-[48px] flex-col items-center gap-1 transition-all active:scale-95">
                <Icon className={`h-6 w-6 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                <span
                  className={`text-xs ${active ? 'font-medium text-primary' : 'text-muted-foreground'}`}
                  style={{ fontSize: '12px', fontWeight: active ? 500 : 400 }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

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
