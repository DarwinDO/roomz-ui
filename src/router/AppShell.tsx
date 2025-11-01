import { Suspense } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { BottomNav } from '@/components/common/BottomNav';
import { Chatbot } from '@/components/common/Chatbot';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';
import LogoRZ from '@/assets/LogoRZWithSlogan.png';

export default function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/search', label: 'Tìm phòng' },
    { path: '/roommates', label: 'Tìm bạn cùng phòng' },
    { path: '/swap', label: 'SwapRoom' },
    { path: '/verification', label: 'Xác thực' },
    { path: '/support-services', label: 'Dịch vụ' },
    { path: '/community', label: 'Cộng đồng' },
    { path: '/local-passport', label: 'Ưu đãi' },
    { path: '/profile', label: 'Hồ sơ' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation - Desktop */}
      <header className="sticky top-0 bg-white dark:bg-slate-900 border-b border-border z-50 hidden md:block">
        <div className="max-w-7xl mx-auto px-6 py-2.5">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
              <img src={LogoRZ} alt="RoomZ Logo" className="h-10 w-auto" />
            </a>

            <nav className="flex items-center gap-1.5">
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(item.path)}
                  className={`rounded-full transition-colors text-sm ${
                    isActive(item.path)
                      ? 'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary'
                      : 'hover:bg-primary/10 hover:text-primary'
                  }`}
                >
                  {item.label}
                </Button>
              ))}
              <Button
                onClick={() => navigate('/login')}
                size="sm"
                className="rounded-full ml-2 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-sm"
              >
                <LogIn className="w-3.5 h-3.5 mr-1.5" />
                Đăng nhập
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className=" top-0 bg-white dark:bg-slate-900 border-b border-border z-50 md:hidden">
        <div className="px-4 py-2 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
            <img src={LogoRZ} alt="RoomZ Logo" className="h-9 w-auto" />
          </a>
          <Button
            onClick={() => navigate('/login')}
            size="sm"
            className="rounded-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-xs"
          >
            <LogIn className="w-3.5 h-3.5 mr-1" />
            Đăng nhập
          </Button>
        </div>
      </header>

      {/* Main Content with Suspense */}
      <main>
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-screen">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>

      {/* Bottom Navigation - Mobile */}
      <BottomNav />

      {/* Chatbot - Available on all screens */}
      <Chatbot />

      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
}

