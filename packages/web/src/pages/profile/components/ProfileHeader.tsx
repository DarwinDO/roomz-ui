import { AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PremiumAvatar } from "@/components/ui/PremiumAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Crown,
  Edit,
  GraduationCap,
  Mail,
  Phone,
  ShieldCheck,
  Star,
  UserRoundCheck,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import type { UserProfile as Profile } from "@/contexts/AuthContext";
import { getUserInitials } from "@roomz/shared/utils/user";

interface ProfileHeaderProps {
  user: User | null;
  profile: Profile | null;
  isPremium: boolean;
  isEmailVerified: boolean;
  trustScore: number;
  onEditProfile: () => void;
}

export function ProfileHeader({
  user,
  profile,
  isPremium,
  isEmailVerified,
  trustScore,
  onEditProfile,
}: ProfileHeaderProps) {
  const displayName = profile?.full_name || "Người dùng";
  const displaySubtitle =
    profile?.major && profile?.university
      ? `${profile.major}, ${profile.university}`
      : profile?.university || user?.email || "Chưa cập nhật thông tin";
  const roleLabel =
    profile?.role === "landlord"
      ? "Host"
      : profile?.role === "student"
        ? "Sinh viên"
        : "Người dùng";
  const publicTrustScore = profile?.trust_score ? (profile.trust_score / 20).toFixed(1) : "0.0";

  return (
    <div className="px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <Card className="overflow-hidden border-border/70 bg-[linear-gradient(135deg,#102131_0%,#16324b_52%,#22597a_100%)] p-0 text-white shadow-soft-lg">
          <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="border-b border-white/10 px-6 py-7 lg:border-b-0 lg:border-r lg:px-8 lg:py-8">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-100">
                <UserRoundCheck className="h-3.5 w-3.5" />
                Hồ sơ tài khoản
              </div>

              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <PremiumAvatar
                  isPremium={profile?.is_premium ?? false}
                  className="h-24 w-24 shrink-0 border-4 border-white/15 shadow-lg sm:h-28 sm:w-28"
                >
                  <AvatarImage
                    src={profile?.avatar_url || undefined}
                    alt={profile?.full_name || user?.email || ""}
                  />
                  <AvatarFallback className="bg-white/10 text-2xl text-white">
                    {getUserInitials(profile?.full_name, user?.email)}
                  </AvatarFallback>
                </PremiumAvatar>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="font-display text-white">{displayName}</h1>
                    {(isEmailVerified || profile?.email_verified) ? (
                      <Badge className="rounded-full bg-white/10 text-white">
                        <ShieldCheck className="mr-1 h-3 w-3" />
                        Đã xác thực
                      </Badge>
                    ) : null}
                    {isPremium ? (
                      <Badge className="rounded-full bg-[linear-gradient(90deg,#f59e0b_0%,#f97316_100%)] text-white">
                        <Crown className="mr-1 h-3 w-3" />
                        Premium
                      </Badge>
                    ) : null}
                  </div>

                  <p className="mt-2 text-sm text-slate-200 sm:text-base">{displaySubtitle}</p>
                  {profile?.bio ? (
                    <p className="mt-3 max-w-[62ch] text-sm leading-7 text-slate-300">{profile.bio}</p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-200">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="max-w-[220px] truncate">{user?.email || "Chưa có email"}</span>
                    </div>
                    {profile?.phone ? (
                      <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{profile.phone}</span>
                      </div>
                    ) : null}
                    {profile?.graduation_year ? (
                      <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                        <GraduationCap className="h-3.5 w-3.5" />
                        <span>K{profile.graduation_year}</span>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-6">
                    <Button
                      onClick={onEditProfile}
                      variant="outline"
                      className="rounded-full border-white/15 bg-white/10 text-white hover:bg-white/15 hover:text-white"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Chỉnh sửa hồ sơ
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 px-6 py-6 sm:grid-cols-3 lg:grid-cols-1">
              <MetricCard title="Điểm đánh giá" value={publicTrustScore} subtitle="thang 5.0" icon={Star} />
              <MetricCard title="Vai trò" value={roleLabel} subtitle="trong hệ RommZ" icon={UserRoundCheck} />
              <MetricCard title="Điểm tin cậy" value={`${trustScore}%`} subtitle="mức hoàn thiện xác thực" icon={ShieldCheck} />
            </div>
          </div>
        </Card>

        <TrustScoreCard trustScore={trustScore} profile={profile} isEmailVerified={isEmailVerified} />
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: typeof Star;
}) {
  return (
    <Card className="rounded-[24px] border-white/10 bg-white/8 p-5 text-white shadow-none backdrop-blur-sm">
      <Icon className="h-5 w-5 text-sky-100" />
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-sky-100">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-sm text-slate-300">{subtitle}</p>
    </Card>
  );
}

function TrustScoreCard({
  trustScore,
  profile,
  isEmailVerified,
}: {
  trustScore: number;
  profile: Profile | null;
  isEmailVerified: boolean;
}) {
  const trustBadges = [
    {
      label: "CMND/CCCD",
      verified: Boolean(profile?.id_card_verified),
    },
    {
      label: "Email",
      verified: Boolean(isEmailVerified || profile?.email_verified),
    },
    {
      label: "Thẻ sinh viên",
      verified: Boolean(profile?.student_card_verified),
    },
    {
      label: "Số điện thoại",
      verified: Boolean(profile?.phone_verified),
    },
  ];

  return (
    <Card className="rounded-[28px] border-border/70 bg-card/90 p-5 shadow-soft">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Trust status
          </p>
          <h2 className="mt-2 text-2xl text-foreground">Mức độ hoàn thiện xác thực</h2>
          <p className="mt-2 max-w-[62ch] text-sm leading-7 text-muted-foreground">
            Đây là lớp tín hiệu giúp người khác tin tưởng hơn khi xem hồ sơ, nhắn tin hoặc ra quyết định liên hệ.
          </p>
        </div>
        <div className="min-w-[120px] rounded-[24px] border border-primary/15 bg-primary/5 px-5 py-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Trust score</p>
          <p className="mt-2 text-3xl font-semibold text-primary">{trustScore}%</p>
        </div>
      </div>

      <div className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-[linear-gradient(90deg,var(--primary)_0%,var(--secondary)_100%)] transition-all duration-500 ease-out"
          style={{ width: `${trustScore}%` }}
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {trustBadges.map((item) =>
          item.verified ? (
            <Badge
              key={item.label}
              variant="secondary"
              className="border-0 bg-secondary/10 text-secondary"
            >
              <ShieldCheck className="mr-1 h-3 w-3" />
              Đã xác thực {item.label}
            </Badge>
          ) : (
            <Badge
              key={item.label}
              variant="secondary"
              className="bg-muted text-muted-foreground hover:bg-muted"
            >
              Chưa xác thực {item.label}
            </Badge>
          ),
        )}
      </div>
    </Card>
  );
}
