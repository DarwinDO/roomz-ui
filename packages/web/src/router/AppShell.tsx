import { Suspense } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LogIn, LogOut, MessageCircle, User as UserIcon } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { BottomNav } from "@/components/common/BottomNav";
import { Chatbot } from "@/components/common/Chatbot";
import { NotificationBell } from "@/components/common/NotificationBell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUnreadConversationCount } from "@/hooks/chat/useUnreadConversationCount";
import { useAuth } from "@/contexts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const NAV_ITEMS = [
  { path: "/", label: "Trang chủ" },
  { path: "/search", label: "Tìm phòng" },
  { path: "/roommates", label: "Tìm bạn đồng hành" },
  { path: "/swap", label: "Ở ngắn hạn" },
  { path: "/services", label: "Dịch vụ" },
  { path: "/community", label: "Cộng đồng" },
];

export default function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, loading, signOut } = useAuth();
  const { unreadCount } = useUnreadConversationCount();

  const isActive = (path: string) =>
    path === "/" ? location.pathname === path : location.pathname.startsWith(path);

  const getUserInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(" ")
        .map((part: string) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }

    return user?.email?.charAt(0).toUpperCase() || "?";
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <a href="#main-content" className="skip-link">
        Bỏ qua đến nội dung chính
      </a>

      <header className="scroll-lock-shell fixed top-0 z-50 hidden w-full border-b border-white/20 bg-white/70 backdrop-blur-xl shadow-sm md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
          <Link
            to="/"
            className="font-display text-2xl font-black tracking-tighter text-slate-900 transition-opacity hover:opacity-80"
          >
            RommZ
          </Link>

          <nav className="flex items-center gap-8 font-display text-sm font-semibold tracking-tight">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={
                  isActive(item.path)
                    ? "border-b-2 border-primary pb-1 text-primary"
                    : "text-slate-500 transition-colors hover:text-slate-900"
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {loading ? (
              <div className="h-10 w-24 animate-skeleton rounded-full bg-muted" />
            ) : user ? (
              <>
                <Link to="/messages">
                  <Button variant="ghost" size="icon" className="relative rounded-full">
                    <MessageCircle className="h-5 w-5" />
                    {unreadCount > 0 ? (
                      <Badge
                        variant="destructive"
                        className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center p-0 text-[10px]"
                      >
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </Badge>
                    ) : null}
                  </Button>
                </Link>
                <NotificationBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={profile?.avatar_url || undefined}
                          alt={profile?.full_name || user.email || ""}
                        />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-medium leading-none">
                          {profile?.full_name || "Người dùng"}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => navigate("/profile")}>
                      <UserIcon className="mr-2 h-4 w-4" />
                      Hồ sơ
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => navigate("/messages")}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Tin nhắn
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={handleSignOut} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button
                onClick={() => navigate("/login")}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.currentTarget.blur();
                  }
                }}
                className="rounded-full bg-[image:var(--cta-primary)] px-6 text-white shadow-[0_20px_40px_rgba(0,80,212,0.18)]"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Đăng nhập
              </Button>
            )}
          </div>
        </div>
      </header>

      <header className="scroll-lock-shell sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/" className="font-display text-xl font-black tracking-tighter text-slate-900">
            RommZ
          </Link>
          {loading ? (
            <div className="h-9 w-9 animate-skeleton rounded-full bg-muted" />
          ) : user ? (
            <div className="flex items-center gap-1">
              <Link to="/messages">
                <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
                  <MessageCircle className="h-5 w-5" />
                  {unreadCount > 0 ? (
                    <Badge
                      variant="destructive"
                      className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center p-0 text-[10px]"
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Badge>
                  ) : null}
                </Button>
              </Link>
              <NotificationBell />
            </div>
          ) : (
            <Button
              onClick={() => navigate("/login")}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.currentTarget.blur();
                }
              }}
              size="sm"
              className="rounded-full bg-[image:var(--cta-primary)] text-white"
            >
              <LogIn className="mr-1 h-3.5 w-3.5" />
              Đăng nhập
            </Button>
          )}
        </div>
      </header>

      <main id="main-content" tabIndex={-1}>
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
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
