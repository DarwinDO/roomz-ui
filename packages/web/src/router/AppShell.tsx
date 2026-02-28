import { Suspense } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { BottomNav } from '@/components/common/BottomNav';
import { Chatbot } from '@/components/common/Chatbot';
import { NotificationBell } from '@/components/common/NotificationBell';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, User as UserIcon, Building2, Home, Crown } from 'lucide-react';
import RommzLogo from '@/assets/logo/rommz-logo.png';
import { useAuth } from '@/contexts';
import { useActivityTracker } from '@/hooks/useActivityTracker';
import { UPGRADE_SOURCES } from '@roomz/shared/constants/tracking';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, loading, signOut } = useAuth();

  // Track user activity - updates last_seen every 5 minutes
  useActivityTracker();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/search', label: 'Tìm phòng' },
    { path: '/roommates', label: 'Tìm bạn cùng phòng' },
    { path: '/swap', label: 'SwapRoom' },
    { path: '/support-services', label: 'Dịch vụ' },
    { path: '/community', label: 'Cộng đồng' },
    { path: '/local-passport', label: 'Ưu đãi' },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Helper function to get user initials
  const getUserInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.charAt(0).toUpperCase() || '?';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation - Desktop */}
      <header className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border z-50 hidden md:block">
        <div className="max-w-7xl mx-auto px-6 py-2.5">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
              <img src={RommzLogo} alt="rommz" className="h-10 lg:h-12 w-auto object-contain" />
            </a>

            <nav className="flex items-center gap-1.5">
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(item.path)}
                  className={`rounded-full transition-colors text-sm ${isActive(item.path)
                    ? 'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary'
                    : 'hover:bg-primary/10 hover:text-primary'
                    }`}
                >
                  {item.label}
                </Button>
              ))}

              {/* Premium CTA - Desktop - Show for logged in non-premium users */}
              {user && !profile?.is_premium && (
                <Button
                  size="sm"
                  className="rounded-full ml-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm gap-1.5"
                  onClick={() => navigate(`/payment?source=${UPGRADE_SOURCES.SIDEBAR_CTA}`)}
                >
                  <Crown className="w-3.5 h-3.5" />
                  Nâng cấp Premium
                </Button>
              )}

              {/* Authentication Section */}
              {loading ? (
                <div className="w-9 h-9 ml-2 rounded-full bg-muted animate-skeleton"></div>
              ) : user ? (
                <div className="flex items-center gap-1 ml-2">
                  <NotificationBell />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-9 w-9 rounded-full ml-2">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || user.email || ''} />
                          <AvatarFallback className="bg-gradient-to-r from-primary to-secondary text-white">
                            {getUserInitials()}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{profile?.full_name || 'User'}</p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/profile')}>
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Hồ sơ</span>
                      </DropdownMenuItem>
                      {/* <DropdownMenuItem onClick={() => navigate('/settings')}>
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>Cài đặt</span>
                    </DropdownMenuItem> */}
                      <DropdownMenuSeparator />
                      {/* Landlord Section */}
                      {profile?.role === 'landlord' ? (
                        <DropdownMenuItem onClick={() => navigate('/landlord')}>
                          <Building2 className="mr-2 h-4 w-4" />
                          <span>Quản lý phòng</span>
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => navigate('/become-landlord')}>
                          <Home className="mr-2 h-4 w-4" />
                          <span>Cho thuê phòng</span>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Đăng xuất</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <Button
                  onClick={() => navigate('/login')}
                  size="sm"
                  className="rounded-full ml-2 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-sm"
                >
                  <LogIn className="w-3.5 h-3.5 mr-1.5" />
                  Đăng nhập
                </Button>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="top-0 bg-card/95 backdrop-blur-sm border-b border-border z-50 md:hidden">
        <div className="px-4 py-2 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
            <img src={RommzLogo} alt="rommz" className="h-8 sm:h-10 w-auto object-contain" />
          </a>

          {/* Mobile Authentication Section */}
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-muted animate-skeleton"></div>
          ) : user ? (
            <div className="flex items-center gap-1">
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || user.email || ''} />
                      <AvatarFallback className="bg-gradient-to-r from-primary to-secondary text-white text-xs">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{profile?.full_name || 'User'}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Hồ sơ</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/profile?tab=settings')}>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Cài đặt</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {/* Landlord Section */}
                  {profile?.role === 'landlord' ? (
                    <DropdownMenuItem onClick={() => navigate('/landlord')}>
                      <Building2 className="mr-2 h-4 w-4" />
                      <span>Quản lý phòng</span>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => navigate('/become-landlord')}>
                      <Home className="mr-2 h-4 w-4" />
                      <span>Cho thuê phòng</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Button
              onClick={() => navigate('/login')}
              size="sm"
              className="rounded-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-xs"
            >
              <LogIn className="w-3.5 h-3.5 mr-1" />
              Đăng nhập
            </Button>
          )}
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

