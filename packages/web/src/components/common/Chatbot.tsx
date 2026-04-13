import { useLocation, useNavigate } from "react-router-dom";
import { ArrowUpRight, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts";
import { trackRomiLauncherClicked } from "@/services/analyticsTracking";
import { ROMI_AVATAR } from "@/lib/romiAvatar";

export function Chatbot() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const shouldHideOnRoute =
    location.pathname === "/login" ||
    location.pathname === "/verify-email" ||
    location.pathname === "/forgot-password" ||
    location.pathname === "/reset-password" ||
    location.pathname.startsWith("/auth/") ||
    location.pathname.startsWith("/messages") ||
    location.pathname.startsWith("/romi");

  if (shouldHideOnRoute) {
    return null;
  }

  const handleOpenRomi = () => {
    void trackRomiLauncherClicked(user?.id || null);
    navigate("/romi");
  };

  return (
    <div className="pointer-events-none fixed bottom-24 right-4 z-[60] flex flex-col items-end gap-3 md:bottom-8 md:right-8">
      <div className="pointer-events-auto hidden max-w-[220px] rounded-[20px] border border-white/70 bg-white/92 px-4 py-3 text-right shadow-soft backdrop-blur xl:block">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
          Trợ lý AI RommZ
        </p>
        <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
          Hỏi về phòng, ưu đãi hoặc dịch vụ — ROMI sẽ dẫn bạn đến đúng chỗ.
        </p>
      </div>

      <Button
        type="button"
        onClick={handleOpenRomi}
        className="pointer-events-auto h-11 rounded-full bg-[image:var(--cta-primary)] px-4 text-white shadow-[0_16px_36px_rgba(0,80,212,0.22)] transition-transform hover:-translate-y-0.5 hover:opacity-95"
      >
        <div className="flex items-center gap-2.5">
          {ROMI_AVATAR ? (
            <img
              src={ROMI_AVATAR}
              alt="ROMI"
              className="h-7 w-7 rounded-full object-cover ring-2 ring-white/30"
            />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/16">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
          )}

          <div className="hidden text-left sm:block">
            <p className="text-sm font-semibold leading-none">Hỏi ROMI</p>
            <p className="mt-0.5 text-[11px] font-medium text-white/78">
              {user ? "Trải nghiệm đầy đủ" : "Dùng thử miễn phí"}
            </p>
          </div>

          <div className="sm:hidden">
            {ROMI_AVATAR ? (
              <img src={ROMI_AVATAR} alt="ROMI" className="h-5 w-5 rounded-full object-cover" />
            ) : (
              <MessageCircle className="h-5 w-5 text-white" />
            )}
          </div>

          <ArrowUpRight className="hidden h-3.5 w-3.5 text-white/88 sm:block" />
        </div>
      </Button>
    </div>
  );
}
