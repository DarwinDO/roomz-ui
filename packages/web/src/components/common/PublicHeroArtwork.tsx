import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarRange,
  LocateFixed,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "./MetricCard";
import { SurfacePanel } from "./SurfacePanel";

type PublicHeroArtworkProps = {
  variant: "landing" | "login";
  className?: string;
};

const LANDING_CALLOUTS = [
  { label: "Host tin cậy", value: "+5.000" },
  { label: "Phòng xác thực", value: "24h" },
] as const;

const LOGIN_STEPS = [
  {
    title: "Vào đúng tiến trình đang làm dở",
    description: "Tìm phòng, ở ngắn hạn hay roommate đều không bị rơi nhịp.",
  },
  {
    title: "OTP hoặc Google, không cần thêm ma sát",
    description: "Rõ ràng, gọn và quen thuộc trên cả desktop lẫn mobile.",
  },
] as const;

export function PublicHeroArtwork({ variant, className }: PublicHeroArtworkProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[36px]",
        variant === "landing" ? "min-h-[420px] p-4 md:p-5" : "min-h-[260px] p-0",
        className,
      )}
    >
      {variant === "landing" ? <LandingArtwork /> : <LoginArtwork />}
    </div>
  );
}

function LandingArtwork() {
  return (
    <div className="relative h-full min-h-[420px] overflow-hidden rounded-[34px] bg-[linear-gradient(160deg,#f5f2ff_0%,#fefeff_54%,#fff4e4_100%)] p-5 shadow-[0_24px_48px_rgba(40,43,81,0.08)]">
      <div
        aria-hidden="true"
        className="absolute left-8 top-6 h-24 w-40 rounded-full bg-[radial-gradient(circle,rgba(123,156,255,0.34)_0%,rgba(123,156,255,0)_72%)] blur-2xl"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-6 right-10 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(255,200,133,0.36)_0%,rgba(255,200,133,0)_70%)] blur-2xl"
      />

      <div className="relative flex h-full flex-col justify-between">
        <div className="flex flex-wrap gap-2">
          <Badge className="rounded-full bg-white/88 px-3 py-1 text-primary shadow-[0_10px_24px_rgba(40,43,81,0.08)]">
            Room đã xác thực
          </Badge>
          <Badge className="rounded-full bg-[var(--surface-container-highest)] px-3 py-1 text-[var(--primary-container-foreground)]">
            Theo đúng khu vực
          </Badge>
        </div>

        <div className="relative mx-auto mt-6 flex w-full max-w-[400px] flex-1 items-end justify-center">
          <div className="relative h-[310px] w-full rounded-[42px] bg-[linear-gradient(180deg,#fff9f1_0%,#f2ebff_36%,#fffdf9_100%)] px-6 pb-6 pt-5 shadow-[0_28px_56px_rgba(40,43,81,0.12)]">
            <div className="mx-auto h-3 w-24 rounded-full bg-white/78" />
            <div className="absolute left-7 top-14 h-28 w-[34%] rounded-[22px] bg-[linear-gradient(180deg,#ebe6ff_0%,#ffffff_100%)] shadow-[inset_0_0_0_1px_rgba(167,170,215,0.18)]" />
            <div className="absolute right-8 top-14 h-40 w-[42%] rounded-[28px] bg-[linear-gradient(180deg,#f0ebff_0%,#ffffff_100%)] shadow-[inset_0_0_0_1px_rgba(167,170,215,0.18)]" />
            <div className="absolute bottom-8 left-1/2 h-24 w-[58%] -translate-x-1/2 rounded-[28px] bg-[linear-gradient(180deg,#f7f4ff_0%,#fff0df_100%)] shadow-[0_16px_28px_rgba(40,43,81,0.08)]" />
            <div className="absolute bottom-20 left-[23%] h-16 w-[38%] rounded-[24px] bg-[linear-gradient(180deg,#ffffff_0%,#f4efff_100%)] shadow-[0_12px_20px_rgba(40,43,81,0.08)]" />
            <div className="absolute bottom-8 right-8 h-20 w-16 rounded-b-[24px] rounded-t-[16px] bg-[linear-gradient(180deg,#a4c5ff_0%,#5f8fff_100%)]" />
            <div className="absolute bottom-24 right-[4.8rem] h-14 w-1 rounded-full bg-[rgba(40,43,81,0.22)]" />
            <div className="absolute bottom-9 left-8 h-20 w-16 rounded-[26px] bg-[linear-gradient(180deg,#70edb0_0%,#006947_100%)]" />
            <div className="absolute bottom-[6.1rem] left-[3.9rem] h-14 w-1 rounded-full bg-[rgba(40,43,81,0.16)]" />
          </div>

          <SurfacePanel
            tone="glass"
            className="absolute -bottom-2 left-0 max-w-[220px] rounded-[28px] border-white/30 p-4 shadow-[0_24px_44px_rgba(40,43,81,0.12)]"
          >
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                <span className="h-8 w-8 rounded-full border-2 border-white bg-[var(--primary)]" />
                <span className="h-8 w-8 rounded-full border-2 border-white bg-[var(--secondary-container)]" />
                <span className="h-8 w-8 rounded-full border-2 border-white bg-[var(--tertiary-container)]" />
              </div>
              <p className="text-sm font-semibold text-foreground">+5.000 người thuê trẻ</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Tìm thấy chỗ ở thông qua hành trình rõ giá, rõ khu vực và đủ tín hiệu để chốt.
            </p>
          </SurfacePanel>

          <SurfacePanel
            tone="lowest"
            className="absolute right-0 top-12 w-[180px] rounded-[26px] bg-white/92 p-3 shadow-[0_20px_34px_rgba(40,43,81,0.09)]"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Đã chọn lọc
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">Không gian phù hợp cho ở lâu dài</p>
            <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
              {LANDING_CALLOUTS.map((item) => (
                <div key={item.label}>
                  <p className="text-lg font-semibold text-foreground">{item.value}</p>
                  <p className="text-[11px] uppercase tracking-[0.18em]">{item.label}</p>
                </div>
              ))}
            </div>
          </SurfacePanel>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <MetricCard
            icon={LocateFixed}
            eyebrow="Bắt đầu đúng chỗ"
            title="Theo trường, quận, landmark"
            description="Ưu tiên ngữ cảnh thật trước khi người thuê phải đọc cả danh sách dài."
            tone="primary"
          />
          <MetricCard
            icon={BadgeCheck}
            eyebrow="Đủ tín hiệu"
            title="Giá, xác thực và trạng thái còn trống"
            description="Các tín hiệu quyết định được đưa lên sớm hơn thay vì chôn trong chi tiết."
            tone="secondary"
          />
        </div>
      </div>
    </div>
  );
}

function LoginArtwork() {
  return (
    <div className="relative h-full min-h-[280px] overflow-hidden rounded-[34px] bg-[linear-gradient(180deg,rgba(255,255,255,0.1)_0%,rgba(255,255,255,0.04)_100%)] p-5">
      <div
        aria-hidden="true"
        className="absolute left-10 top-10 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(123,156,255,0.34)_0%,rgba(123,156,255,0)_72%)] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-8 right-10 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(255,200,133,0.28)_0%,rgba(255,200,133,0)_72%)] blur-3xl"
      />

      <div className="relative grid gap-4 lg:grid-cols-[0.94fr_1.06fr]">
        <SurfacePanel
          tone="glass"
          className="rounded-[28px] border-white/15 bg-white/10 p-4 text-white shadow-none"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-200">
                Lối vào không ma sát
              </p>
              <p className="mt-3 text-xl font-semibold leading-tight text-white">
                Đăng nhập để quay lại đúng hành trình ở mà bạn đang tiếp tục.
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3 text-white">
              <ArrowRight className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {LOGIN_STEPS.map((step) => (
              <div
                key={step.title}
                className="rounded-[22px] border border-white/10 bg-white/8 px-4 py-3"
              >
                <p className="text-sm font-semibold text-white">{step.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-200">{step.description}</p>
              </div>
            ))}
          </div>
        </SurfacePanel>

        <div className="grid gap-4">
          <MetricCard
            icon={Building2}
            eyebrow="Giữ đúng bối cảnh"
            title="Host, người thuê và người quay lại đều không rơi nhịp"
            description="Route bảo vệ vẫn được nối lại sau khi xác thực thành công."
            tone="inverse"
            className="rounded-[26px] border border-white/10 bg-white/8 p-4 shadow-none"
          />
          <MetricCard
            icon={CalendarRange}
            eyebrow="Mở tiếp hệ sinh thái"
            title="Tìm phòng, roommate, ở ngắn hạn và dịch vụ cùng một nhịp"
            description="Một lần vào là đủ để tiếp tục hành trình tìm nơi ở và các việc phát sinh sau đó."
            tone="inverse"
            className="rounded-[26px] border border-white/10 bg-white/8 p-4 shadow-none"
          />
        </div>
      </div>
    </div>
  );
}
