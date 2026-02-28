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
    Star
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import type { UserProfile as Profile } from "@/contexts/AuthContext";
import { getUserInitials } from "@roomz/shared/utils/user";

interface ProfileHeaderProps {
    user: User | null;
    profile: Profile | null;
    isEmailVerified: boolean;
    trustScore: number;
    onEditProfile: () => void;
}

export function ProfileHeader({
    user,
    profile,
    isEmailVerified,
    trustScore,
    onEditProfile,
}: ProfileHeaderProps) {
    return (
        <div className="bg-gradient-to-b from-accent/30 to-background px-4 sm:px-6 py-6 sm:py-8">
            <div className="max-w-6xl mx-auto animate-fade-in">
                <div className="flex items-start gap-3 sm:gap-6 mb-4 sm:mb-6">
                    <Avatar className="w-[72px] h-[72px] sm:w-[120px] sm:h-[120px] border-4 border-white shadow-lg shrink-0">
                        <AvatarImage
                            src={profile?.avatar_url || undefined}
                            alt={profile?.full_name || user?.email || ''}
                        />
                        <AvatarFallback className="text-xl sm:text-2xl bg-gradient-to-r from-primary to-secondary text-white">
                            {getUserInitials(profile?.full_name, user?.email)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <h2 className="text-lg sm:text-2xl">{profile?.full_name || 'Người dùng'}</h2>
                                    {(isEmailVerified || profile?.email_verified) && (
                                        <Badge className="bg-primary text-white text-xs sm:text-sm px-2 py-0.5 sm:px-3 sm:py-1">
                                            <ShieldCheck className="w-3 h-3 mr-1" />
                                            Đã xác thực
                                        </Badge>
                                    )}
                                    {profile?.is_premium && (
                                        <Badge className="bg-gradient-to-r from-warning to-orange-400 text-white text-xs sm:text-sm px-2 py-0.5">
                                            <Crown className="w-3 h-3 mr-1" />
                                            Premium
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-sm sm:text-base text-muted-foreground">
                                    {profile?.major && profile?.university
                                        ? `${profile.major}, ${profile.university}`
                                        : profile?.university || user?.email || 'Chưa cập nhật thông tin'
                                    }
                                </p>
                                {profile?.bio && (
                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{profile.bio}</p>
                                )}
                            </div>
                            <Button
                                onClick={onEditProfile}
                                variant="outline"
                                size="sm"
                                className="rounded-xl shrink-0 min-w-[90px] text-sm border-border hover:bg-muted">
                                <Edit className="w-4 h-4 mr-1 sm:mr-2" />
                                <span className="hidden xs:inline">Chỉnh sửa hồ sơ</span>
                                <span className="xs:hidden">Sửa</span>
                            </Button>
                        </div>

                        {/* User Info Row */}
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Mail className="w-3.5 h-3.5" />
                                <span className="truncate max-w-[150px] sm:max-w-none">{user?.email}</span>
                            </div>
                            {profile?.phone && (
                                <div className="flex items-center gap-1">
                                    <Phone className="w-3.5 h-3.5" />
                                    <span>{profile.phone}</span>
                                </div>
                            )}
                            {profile?.graduation_year && (
                                <div className="flex items-center gap-1">
                                    <GraduationCap className="w-3.5 h-3.5" />
                                    <span>K{profile.graduation_year}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3 sm:gap-6 mt-3 sm:mt-4">
                            <div>
                                <div className="flex items-center gap-1 mb-1">
                                    <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-warning text-warning" />
                                    <span className="text-base sm:text-lg">{profile?.trust_score ? (profile.trust_score / 20).toFixed(1) : '0.0'}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Đánh giá</p>
                            </div>
                            <div className="h-6 sm:h-8 w-px bg-border"></div>
                            <div>
                                <p className="text-base sm:text-lg">{profile?.role === 'landlord' ? 'Chủ nhà' : profile?.role === 'student' ? 'Sinh viên' : 'User'}</p>
                                <p className="text-xs text-muted-foreground">Vai trò</p>
                            </div>
                            <div className="h-6 sm:h-8 w-px bg-border"></div>
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

// Internal component for TrustScore (since it's tightly coupled visually in the header section in original design)
// Or we can keep it separate if reused. Given the design, it sits right inside the header area.
function TrustScoreCard({
    trustScore,
    profile,
    isEmailVerified
}: {
    trustScore: number;
    profile: Profile | null;
    isEmailVerified: boolean;
}) {
    return (
        <Card className="p-4 rounded-2xl bg-card shadow-soft border border-border">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    <span>Điểm tin cậy</span>
                </div>
                <span className="text-primary">{trustScore}%</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden mb-3">
                <div
                    className="h-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: `${trustScore}%` }}
                />
            </div>
            <div className="flex flex-wrap gap-2">
                {profile?.id_card_verified ? (
                    <Badge variant="secondary" className="bg-secondary/10 text-secondary border-0">
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        Đã xác thực CMND
                    </Badge>
                ) : (
                    <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted">
                        Chưa xác thực CMND
                    </Badge>
                )}
                {(isEmailVerified || profile?.email_verified) ? (
                    <Badge variant="secondary" className="bg-secondary/10 text-secondary border-0">
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        Đã xác thực Email
                    </Badge>
                ) : (
                    <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted">
                        Chưa xác thực Email
                    </Badge>
                )}
                {profile?.student_card_verified ? (
                    <Badge variant="secondary" className="bg-secondary/10 text-secondary border-0">
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        Đã xác thực thẻ SV
                    </Badge>
                ) : (
                    <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted">
                        Chưa xác thực thẻ SV
                    </Badge>
                )}
                {profile?.phone_verified ? (
                    <Badge variant="secondary" className="bg-secondary/10 text-secondary border-0">
                        <ShieldCheck className="w-3 h-3 mr-1" />
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
