import { useLocation, useNavigate } from "react-router-dom";
import { ArrowUpRight, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts";
import { trackRomiOpened } from "@/services/analyticsTracking";

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
    void trackRomiOpened(user?.id || null);
    navigate("/romi");
  };

  return (
    <div className="pointer-events-none fixed bottom-24 right-4 z-[60] flex flex-col items-end gap-3 md:bottom-8 md:right-8">
      <div className="pointer-events-auto hidden max-w-[240px] rounded-[24px] border border-white/70 bg-white/92 px-4 py-3 text-right shadow-soft backdrop-blur xl:block">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          Trợ lý AI RommZ
        </p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Mở ROMI để khám phá phòng, deal, entitlement hoặc đi thẳng vào flow phù hợp hơn.
        </p>
      </div>

      <Button
        type="button"
        onClick={handleOpenRomi}
        className="pointer-events-auto h-14 rounded-full bg-[image:var(--cta-primary)] px-5 text-white shadow-[0_22px_48px_rgba(0,80,212,0.24)] transition-transform hover:-translate-y-0.5 hover:opacity-95"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/16">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-semibold leading-none">Hỏi ROMI</p>
            <p className="mt-1 text-[11px] font-medium text-white/78">
              {user ? "Workspace đầy đủ" : "Guest mode mở"}
            </p>
          </div>
          <div className="sm:hidden">
            <MessageCircle className="h-5 w-5 text-white" />
          </div>
          <ArrowUpRight className="hidden h-4 w-4 text-white/88 sm:block" />
        </div>
      </Button>
    </div>
  );
}
