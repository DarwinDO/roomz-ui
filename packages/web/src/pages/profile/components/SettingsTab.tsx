import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    ShieldCheck,
    ChevronDown,
    Mail,
    GraduationCap,
    Phone,
    Crown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import type { UserProfile as Profile } from "@/contexts/AuthContext";

interface SettingsTabProps {
    profile: Profile | null;
    isPremium: boolean;
    premiumUntil: string | null;
    isEmailVerified: boolean;
    trustScore: number;
    onEditProfile: () => void;
    onSignOut: () => void;
}

export function SettingsTab({
    profile,
    isPremium,
    premiumUntil,
    isEmailVerified,
    trustScore,
    onEditProfile,
    onSignOut,
}: SettingsTabProps) {
    const navigate = useNavigate();
    const [expandedSettings, setExpandedSettings] = useState<string | null>(null);

    const toggleSettingsSection = (section: string) => {
        setExpandedSettings(expandedSettings === section ? null : section);
    };

    return (
        <div className="space-y-6 rounded-[28px] border border-border/70 bg-card/85 p-5 shadow-soft animate-fade-in">
            {/* Edit Profile Button */}
            <Card className="rounded-[24px] border border-border/70 p-6 shadow-soft">
                <h3 className="mb-4">Cài đặt tài khoản</h3>
                <div className="space-y-3">
                    <Button
                        onClick={onEditProfile}
                        variant="outline"
                        className="w-full justify-start rounded-xl"
                    >
                        Chỉnh sửa thông tin cá nhân
                    </Button>

                    {/* Verification Status */}
                    <Collapsible
                        open={expandedSettings === "verification"}
                        onOpenChange={() => toggleSettingsSection("verification")}
                    >
                        <CollapsibleTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full justify-between rounded-xl hover:bg-muted"
                            >
                                <div className="flex items-center">
                                    <ShieldCheck className="w-4 h-4 mr-3" />
                                    Trạng thái xác thực ({trustScore}%)
                                </div>
                                <ChevronDown
                                    className={`w-4 h-4 transition-transform ${expandedSettings === "verification" ? "rotate-180" : ""}`}
                                />
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-3 rounded-[20px] bg-muted/30 p-4 space-y-3">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className={`w-4 h-4 ${profile?.id_card_verified ? 'text-secondary' : 'text-muted-foreground'}`} />
                                        <span className="text-sm">Xác thực CMND/CCCD</span>
                                    </div>
                                    {profile?.id_card_verified ? (
                                        <Badge className="bg-secondary/10 text-secondary border-0">
                                            ✓ Đã xác thực
                                        </Badge>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-xs h-7 rounded-lg"
                                            onClick={() => navigate('/verification')}
                                        >
                                            Xác thực ngay
                                        </Button>
                                    )}
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Mail className={`w-4 h-4 ${(isEmailVerified || profile?.email_verified) ? 'text-secondary' : 'text-muted-foreground'}`} />
                                        <span className="text-sm">Xác thực Email</span>
                                    </div>
                                    {(isEmailVerified || profile?.email_verified) ? (
                                        <Badge className="bg-secondary/10 text-secondary border-0">
                                            ✓ Đã xác thực
                                        </Badge>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-xs h-7 rounded-lg"
                                            onClick={() => navigate('/verify-email')}
                                        >
                                            Xác thực ngay
                                        </Button>
                                    )}
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <GraduationCap className={`w-4 h-4 ${profile?.student_card_verified ? 'text-secondary' : 'text-muted-foreground'}`} />
                                        <span className="text-sm">Xác thực thẻ sinh viên</span>
                                    </div>
                                    {profile?.student_card_verified ? (
                                        <Badge className="bg-secondary/10 text-secondary border-0">
                                            ✓ Đã xác thực
                                        </Badge>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-xs h-7 rounded-lg"
                                            onClick={() => navigate('/verification')}
                                        >
                                            Xác thực ngay
                                        </Button>
                                    )}
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Phone className={`w-4 h-4 ${profile?.phone_verified ? 'text-secondary' : 'text-muted-foreground'}`} />
                                        <span className="text-sm">Xác thực số điện thoại</span>
                                    </div>
                                    {profile?.phone_verified ? (
                                        <Badge className="bg-secondary/10 text-secondary border-0">
                                            ✓ Đã xác thực
                                        </Badge>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-xs h-7 rounded-lg"
                                            disabled={!profile?.phone}
                                        >
                                            {profile?.phone ? 'Xác thực ngay' : 'Thêm SĐT trước'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>

                    {/* Coming Soon */}
                    <div className="rounded-[20px] bg-muted/20 p-4 text-center">
                        <p className="text-sm text-muted-foreground">Cài đặt tuỳ chỉnh, bảo mật và thông báo sẽ sớm ra mắt</p>
                    </div>
                </div>
            </Card>

            {/* Subscription Card */}
            {isPremium ? (
                // Premium User Card
                <Card className="rounded-[24px] border border-amber-200 bg-gradient-to-br from-amber-50/50 to-orange-50/50 p-6 shadow-soft">
                    <div className="flex items-center gap-2 mb-4">
                        <Crown className="w-5 h-5 text-amber-500" />
                        <h3>RommZ+ Premium</h3>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Trạng thái</span>
                            <Badge className="bg-green-100 text-green-700 border-0">Đang hoạt động</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Hết hạn</span>
                            <span className="text-sm font-medium">
                                {premiumUntil
                                    ? new Date(premiumUntil).toLocaleDateString('vi-VN')
                                    : 'Không giới hạn'}
                            </span>
                        </div>
                    </div>
                    <Button
                        onClick={() => navigate('/payment')}
                        variant="outline"
                        className="mt-4 w-full rounded-xl border-amber-300 bg-white text-amber-900 hover:bg-amber-50"
                    >
                        Xem gói của bạn
                    </Button>
                </Card>
            ) : (
                // Free User Card
                <Card className="rounded-[24px] border border-border/70 p-6 shadow-soft">
                    <h3 className="mb-4">Gói dịch vụ</h3>
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                        <div>
                            <p className="font-medium">Gói miễn phí</p>
                            <p className="text-sm text-muted-foreground">Giới hạn xem profile, SĐT, yêu thích</p>
                        </div>
                        <Button
                            onClick={() => navigate('/payment')}
                            className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                        >
                            <Crown className="w-4 h-4 mr-2" />
                            Nâng cấp
                        </Button>
                    </div>
                </Card>
            )}

            <Button
                variant="outline"
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/5 rounded-xl border-destructive/30"
                onClick={onSignOut}>
                Đăng xuất
            </Button>
        </div>
    );
}
