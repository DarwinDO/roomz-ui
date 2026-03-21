import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

type StitchFooterVariant = "light" | "dark";

interface StitchFooterProps {
  variant?: StitchFooterVariant;
  className?: string;
}

export function StitchFooter({ variant = "light", className }: StitchFooterProps) {
  const isDark = variant === "dark";

  return (
    <footer
      className={cn(
        isDark
          ? "mt-20 bg-[var(--inverse-surface)] text-[var(--inverse-on-surface)]"
          : "mt-20 rounded-t-[3rem] bg-slate-50 text-slate-500",
        className,
      )}
    >
      <div className="mx-auto max-w-7xl px-6 py-14 md:px-8 md:py-16">
        <div className="flex flex-col gap-12 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <div
              className={cn(
                "font-display text-2xl font-black tracking-tighter",
                isDark ? "text-white" : "text-slate-900",
              )}
            >
              RommZ
            </div>
            <p
              className={cn(
                "mt-4 text-sm leading-7",
                isDark ? "text-slate-400" : "text-slate-500",
              )}
            >
              Nền tảng tìm phòng, kết nối bạn ở ghép và mở rộng các dịch vụ quanh
              nơi ở cho sinh viên và người thuê trẻ.
            </p>
          </div>

          <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3">
            <div className="space-y-4">
              <h4
                className={cn(
                  "font-display text-sm font-bold uppercase tracking-[0.18em]",
                  isDark ? "text-white" : "text-slate-900",
                )}
              >
                Khám phá
              </h4>
              <div className="flex flex-col gap-2 text-sm">
                <Link to="/" className={cn("transition-colors", isDark ? "hover:text-white" : "hover:text-primary")}>
                  Trang chủ
                </Link>
                <Link
                  to="/search"
                  className={cn("transition-colors", isDark ? "hover:text-white" : "hover:text-primary")}
                >
                  Tìm phòng
                </Link>
                <Link
                  to="/roommates"
                  className={cn("transition-colors", isDark ? "hover:text-white" : "hover:text-primary")}
                >
                  Tìm bạn đồng hành
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              <h4
                className={cn(
                  "font-display text-sm font-bold uppercase tracking-[0.18em]",
                  isDark ? "text-white" : "text-slate-900",
                )}
              >
                Dịch vụ
              </h4>
              <div className="flex flex-col gap-2 text-sm">
                <Link
                  to="/services"
                  className={cn("transition-colors", isDark ? "hover:text-white" : "hover:text-primary")}
                >
                  Dịch vụ & ưu đãi
                </Link>
                <Link
                  to="/community"
                  className={cn("transition-colors", isDark ? "hover:text-white" : "hover:text-primary")}
                >
                  Cộng đồng
                </Link>
                <Link
                  to="/support-services"
                  className={cn("transition-colors", isDark ? "hover:text-white" : "hover:text-primary")}
                >
                  Hỗ trợ
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              <h4
                className={cn(
                  "font-display text-sm font-bold uppercase tracking-[0.18em]",
                  isDark ? "text-white" : "text-slate-900",
                )}
              >
                Pháp lý
              </h4>
              <div className="flex flex-col gap-2 text-sm">
                <span>Chính sách bảo mật</span>
                <span>Điều khoản dịch vụ</span>
                <span>Liên hệ</span>
              </div>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "mt-12 border-t pt-6 text-sm",
            isDark ? "border-white/10 text-slate-500" : "border-slate-200 text-slate-500",
          )}
        >
          © 2026 RommZ. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
