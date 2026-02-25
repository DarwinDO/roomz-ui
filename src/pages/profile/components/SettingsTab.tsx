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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import type { UserProfile as Profile } from "@/contexts/AuthContext";

interface SettingsTabProps {
    profile: Profile | null;
    isEmailVerified: boolean;
    trustScore: number;
    onEditProfile: () => void;
    onSignOut: () => void;
}

export function SettingsTab({
    profile,
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
        <div className="space-y-6 animate-fade-in">
            {/* Edit Profile Button */}
            <Card className="p-6 rounded-2xl shadow-soft border border-border">
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
                        <CollapsibleContent className="mt-3 p-4 bg-muted/30 rounded-xl space-y-3">
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

                    {/* TODO: Preferences, Security, Notifications — implement when backend ready */}
                </div>
            </Card>

            <Button
                variant="outline"
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/5 rounded-xl border-destructive/30"
                onClick={onSignOut}>
                Đăng xuất
            </Button>
        </div>
    );
}
