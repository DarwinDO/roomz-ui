import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    ShieldCheck,
    Crown,
    Edit,
    Mail,
    Phone,
    GraduationCap,
    Star,
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
    const displaySubtitle = profile?.major && profile?.university
        ? `${profile.major}, ${profile.university}`
        : profile?.university || user?.email || "Chưa cập nhật thông tin";
    const roleLabel = profile?.role === "landlord"
        ? "Host"
        : profile?.role === "student"
            ? "Sinh viên"
            : "Người dùng";

    return (
        <div className="bg-gradient-to-b from-accent/30 to-background px-4 py-6 sm:px-6 sm:py-8">
            <div className="mx-auto max-w-6xl animate-fade-in">
                <div className="mb-4 flex items-start gap-3 sm:mb-6 sm:gap-6">
                    <Avatar className="h-[72px] w-[72px] shrink-0 border-4 border-white shadow-lg sm:h-[120px] sm:w-[120px]">
                        <AvatarImage
                            src={profile?.avatar_url || undefined}
                            alt={profile?.full_name || user?.email || ""}
                        />
                        <AvatarFallback className="bg-gradient-to-r from-primary to-secondary text-xl text-white sm:text-2xl">
                            {getUserInitials(profile?.full_name, user?.email)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <div className="mb-2 flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                                <div className="mb-1 flex flex-wrap items-center gap-2">
                                    <h2 className="text-lg sm:text-2xl">{displayName}</h2>
                                    {(isEmailVerified || profile?.email_verified) && (
                                        <Badge className="bg-primary px-2 py-0.5 text-xs text-white sm:px-3 sm:py-1 sm:text-sm">
                                            <ShieldCheck className="mr-1 h-3 w-3" />
                                            Đã xác thực
                                        </Badge>
                                    )}
                                    {isPremium && (
                                        <Badge className="bg-gradient-to-r from-warning to-orange-400 px-2 py-0.5 text-xs text-white sm:text-sm">
                                            <Crown className="mr-1 h-3 w-3" />
                                            Premium
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground sm:text-base">{displaySubtitle}</p>
                                {profile?.bio && (
                                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{profile.bio}</p>
                                )}
                            </div>
                            <Button
                                onClick={onEditProfile}
                                variant="outline"
                                size="sm"
                                className="min-w-[90px] shrink-0 rounded-xl border-border text-sm hover:bg-muted"
                            >
                                <Edit className="mr-1 h-4 w-4 sm:mr-2" />
                                <span className="hidden xs:inline">Chỉnh sửa hồ sơ</span>
                                <span className="xs:hidden">Sửa</span>
                            </Button>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground sm:mt-3 sm:gap-4">
                            <div className="flex items-center gap-1">
                                <Mail className="h-3.5 w-3.5" />
                                <span className="max-w-[150px] truncate sm:max-w-none">{user?.email}</span>
                            </div>
                            {profile?.phone && (
                                <div className="flex items-center gap-1">
                                    <Phone className="h-3.5 w-3.5" />
                                    <span>{profile.phone}</span>
                                </div>
                            )}
                            {profile?.graduation_year && (
                                <div className="flex items-center gap-1">
                                    <GraduationCap className="h-3.5 w-3.5" />
                                    <span>K{profile.graduation_year}</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-3 flex items-center gap-3 sm:mt-4 sm:gap-6">
                            <div>
                                <div className="mb-1 flex items-center gap-1">
                                    <Star className="h-3.5 w-3.5 fill-warning text-warning sm:h-4 sm:w-4" />
                                    <span className="text-base sm:text-lg">{profile?.trust_score ? (profile.trust_score / 20).toFixed(1) : "0.0"}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Đánh giá</p>
                            </div>
                            <div className="h-6 w-px bg-border sm:h-8" />
                            <div>
                                <p className="text-base sm:text-lg">{roleLabel}</p>
                                <p className="text-xs text-muted-foreground">Vai trò</p>
                            </div>
                            <div className="h-6 w-px bg-border sm:h-8" />
                            <div>
                                <p className="text-base sm:text-lg">{trustScore}%</p>
                                <p className="text-xs text-muted-foreground">Điểm tin cậy</p>
                            </div>
                        </div>
                    </div>
                </div>

                <TrustScoreCard
                    trustScore={trustScore}
                    profile={profile}
                    isEmailVerified={isEmailVerified}
                />
            </div>
        </div>
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
    return (
        <Card className="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <span>Điểm tin cậy</span>
                </div>
                <span className="text-primary">{trustScore}%</span>
            </div>
            <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                    className="h-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: `${trustScore}%` }}
                />
            </div>
            <div className="flex flex-wrap gap-2">
                {profile?.id_card_verified ? (
                    <Badge variant="secondary" className="border-0 bg-secondary/10 text-secondary">
                        <ShieldCheck className="mr-1 h-3 w-3" />
                        Đã xác thực CMND
                    </Badge>
                ) : (
                    <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted">
                        Chưa xác thực CMND
                    </Badge>
                )}
                {(isEmailVerified || profile?.email_verified) ? (
                    <Badge variant="secondary" className="border-0 bg-secondary/10 text-secondary">
                        <ShieldCheck className="mr-1 h-3 w-3" />
                        Đã xác thực Email
                    </Badge>
                ) : (
                    <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted">
                        Chưa xác thực Email
                    </Badge>
                )}
                {profile?.student_card_verified ? (
                    <Badge variant="secondary" className="border-0 bg-secondary/10 text-secondary">
                        <ShieldCheck className="mr-1 h-3 w-3" />
                        Đã xác thực thẻ SV
                    </Badge>
                ) : (
                    <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted">
                        Chưa xác thực thẻ SV
                    </Badge>
                )}
                {profile?.phone_verified ? (
                    <Badge variant="secondary" className="border-0 bg-secondary/10 text-secondary">
                        <ShieldCheck className="mr-1 h-3 w-3" />
                        Đã xác thực SĐT
                    </Badge>
                ) : (
                    <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted">
                        Chưa xác thực SĐT
                    </Badge>
                )}
            </div>
        </Card>
    );
}
