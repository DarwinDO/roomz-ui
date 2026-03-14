import { Suspense } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { BottomNav } from '@/components/common/BottomNav';
import { Chatbot } from '@/components/common/Chatbot';
import { NotificationBell } from '@/components/common/NotificationBell';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, User as UserIcon, Building2, Home, Crown, MessageCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useConversations } from '@/hooks/chat/useConversations';
import RommzLogo from '@/assets/logo/rommz-logo.png';
import { useAuth } from '@/contexts';
import { usePremiumLimits } from '@/hooks/usePremiumLimits';
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
  const { isPremium } = usePremiumLimits();
  const { unreadCount: messagesUnreadCount } = useConversations();

  useActivityTracker();

  const isActive = (path: string) => location.pathname === path;
  const isHost = profile?.role === 'landlord';
  const isPendingHostApplication = profile?.account_status === 'pending_landlord';

  const navItems = [
    { path: '/search', label: 'Tìm phòng' },
    { path: '/roommates', label: 'Tìm bạn cùng phòng' },
    { path: '/swap', label: 'Ở ngắn hạn' },
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

  const getUserInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map((name: string) => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }

    return user?.email?.charAt(0).toUpperCase() || '?';
  };

  const renderHostMenuItem = () => {
    if (isHost) {
      return (
        <DropdownMenuItem onClick={() => navigate('/host')}>
          <Building2 className="mr-2 h-4 w-4" />
          <span>Host console</span>
        </DropdownMenuItem>
      );
    }

    if (isPendingHostApplication) {
      return (
        <DropdownMenuItem onClick={() => navigate('/become-host')}>
          <Clock className="mr-2 h-4 w-4" />
          <span>Đơn host đang chờ duyệt</span>
        </DropdownMenuItem>
      );
    }

    return (
      <DropdownMenuItem onClick={() => navigate('/become-host')}>
        <Home className="mr-2 h-4 w-4" />
        <span>Đăng ký làm host</span>
      </DropdownMenuItem>
    );
  };

  const renderUserMenu = (showSettings: boolean) => (
    <DropdownMenuContent className="w-56" align="end" forceMount>
      <DropdownMenuLabel className="font-normal">
        <div className="flex flex-col space-y-1">
          <p className="text-sm font-medium leading-none">{profile?.full_name || 'User'}</p>
          <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => navigate('/profile')}>
        <UserIcon className="mr-2 h-4 w-4" />
        <span>Hồ sơ</span>
      </DropdownMenuItem>
      {showSettings && (
        <DropdownMenuItem onClick={() => navigate('/profile?tab=settings')}>
          <UserIcon className="mr-2 h-4 w-4" />
          <span>Cài đặt</span>
        </DropdownMenuItem>
      )}
      <DropdownMenuSeparator />
      {renderHostMenuItem()}
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
        <LogOut className="mr-2 h-4 w-4" />
        <span>Đăng xuất</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 hidden border-b border-border bg-card/95 backdrop-blur-sm md:block">
        <div className="mx-auto max-w-7xl px-6 py-2.5">
          <div className="flex items-center justify-between">
            <a href="/" className="flex cursor-pointer items-center gap-2 transition-opacity hover:opacity-80">
              <img src={RommzLogo} alt="rommz" className="h-10 w-auto object-contain lg:h-12" />
            </a>

            <nav className="flex items-center gap-1.5">
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(item.path)}
                  className={`rounded-full text-sm transition-colors ${isActive(item.path)
                    ? 'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary'
                    : 'hover:bg-primary/10 hover:text-primary'
                    }`}
                >
                  {item.label}
                </Button>
              ))}

              {user && !isPremium && (
                <Button
                  size="sm"
                  className="ml-2 gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-sm text-white hover:from-amber-600 hover:to-orange-600"
                  onClick={() => navigate(`/payment?source=${UPGRADE_SOURCES.SIDEBAR_CTA}`)}
                >
                  <Crown className="h-3.5 w-3.5" />
                  Nâng cấp Premium
                </Button>
              )}

              {loading ? (
                <div className="ml-2 h-9 w-9 animate-skeleton rounded-full bg-muted"></div>
              ) : user ? (
                <div className="ml-2 flex items-center gap-1">
                  <Link to="/messages">
                    <Button variant="ghost" size="icon" className="relative rounded-full">
                      <MessageCircle className="h-5 w-5" />
                      {messagesUnreadCount > 0 && (
                        <Badge
                          variant="destructive"
                          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center p-0 text-xs"
                        >
                          {messagesUnreadCount > 9 ? '9+' : messagesUnreadCount}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                  <NotificationBell />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative ml-2 h-9 w-9 rounded-full">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || user.email || ''} />
                          <AvatarFallback className="bg-gradient-to-r from-primary to-secondary text-white">
                            {getUserInitials()}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    {renderUserMenu(false)}
                  </DropdownMenu>
                </div>
              ) : (
                <Button
                  onClick={() => navigate('/login')}
                  size="sm"
                  className="ml-2 rounded-full bg-gradient-to-r from-primary to-secondary text-sm hover:from-primary/90 hover:to-secondary/90"
                >
                  <LogIn className="mr-1.5 h-3.5 w-3.5" />
                  Đăng nhập
                </Button>
              )}
            </nav>
          </div>
        </div>
      </header>

      <header className="top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm md:hidden">
        <div className="flex items-center justify-between px-4 py-2">
          <a href="/" className="flex cursor-pointer items-center gap-2 transition-opacity hover:opacity-80">
            <img src={RommzLogo} alt="rommz" className="h-8 w-auto object-contain sm:h-10" />
          </a>

          {loading ? (
            <div className="h-8 w-8 animate-skeleton rounded-full bg-muted"></div>
          ) : user ? (
            <div className="flex items-center gap-1">
              <Link to="/messages">
                <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
                  <MessageCircle className="h-5 w-5" />
                  {messagesUnreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center p-0 text-[10px]"
                    >
                      {messagesUnreadCount > 9 ? '9+' : messagesUnreadCount}
                    </Badge>
                  )}
                </Button>
              </Link>
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || user.email || ''} />
                      <AvatarFallback className="bg-gradient-to-r from-primary to-secondary text-xs text-white">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                {renderUserMenu(true)}
              </DropdownMenu>
            </div>
          ) : (
            <Button
              onClick={() => navigate('/login')}
              size="sm"
              className="rounded-full bg-gradient-to-r from-primary to-secondary text-xs hover:from-primary/90 hover:to-secondary/90"
            >
              <LogIn className="mr-1 h-3.5 w-3.5" />
              Đăng nhập
            </Button>
          )}
        </div>
      </header>

      <main>
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>

      <BottomNav />
      <Chatbot />
      <Toaster />
    </div>
  );
}
