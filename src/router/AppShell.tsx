import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { BottomNav } from '@/components/common/BottomNav';
import { Chatbot } from '@/components/common/Chatbot';
import { Button } from '@/components/ui/button';
import LogoRZ from '@/assets/LogoRZWithSlogan.png';

export default function AppShell() {
  const location = useLocation();
  
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
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
              <img src={LogoRZ} alt="RoomZ Logo" className="h-30 w-30" />
            </a>

            <nav className="flex items-center gap-2">
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  variant="ghost"
                  onClick={() => window.location.href = item.path}
                  className={`rounded-full transition-colors ${
                    isActive(item.path)
                      ? 'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary'
                      : 'hover:bg-primary/10 hover:text-primary'
                  }`}
                >
                  {item.label}
                </Button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className=" top-0 bg-white dark:bg-slate-900 border-b border-border z-50 md:hidden">
        <div className="px-4 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
            <img src={LogoRZ} alt="RoomZ Logo" className="h-30 w-30" />
          </a>
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

