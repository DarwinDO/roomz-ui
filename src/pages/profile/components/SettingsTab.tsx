import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    User,
    ShieldCheck,
    ChevronDown,
    Loader2,
    Mail,
    GraduationCap,
    Phone,
    Award,
    Settings,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { UserProfile as Profile } from "@/contexts/AuthContext";

interface SettingsTabProps {
    profile: Profile | null;
    isEmailVerified: boolean;
    trustScore: number;
    onUpdateProfile: (data: any) => Promise<void>;
    onSignOut: () => void;
    isUpdating: boolean;
}

export function SettingsTab({
    profile,
    isEmailVerified,
    trustScore,
    onUpdateProfile,
    onSignOut,
    isUpdating,
}: SettingsTabProps) {
    const navigate = useNavigate();
    const [expandedSettings, setExpandedSettings] = useState<string | null>(null);

    // Local form states
    const [formData, setFormData] = useState({
        fullName: profile?.full_name || "",
        major: profile?.major || "",
        university: profile?.university || "",
        phone: profile?.phone || "",
        bio: profile?.bio || "",
    });

    const toggleSettingsSection = (section: string) => {
        setExpandedSettings(expandedSettings === section ? null : section);
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        onUpdateProfile(formData);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <Card className="p-6 rounded-2xl shadow-soft border border-border">
                <h3 className="mb-4">Cài đặt tài khoản</h3>
                <div className="space-y-3">
                    {/* Edit Profile Information */}
                    <Collapsible
                        open={expandedSettings === "profile"}
                        onOpenChange={() => toggleSettingsSection("profile")}
                    >
                        <CollapsibleTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full justify-between rounded-xl hover:bg-muted"
                            >
                                <div className="flex items-center">
                                    <User className="w-4 h-4 mr-3" />
                                    Chỉnh sửa thông tin hồ sơ
                                </div>
                                <ChevronDown
                                    className={`w-4 h-4 transition-transform ${expandedSettings === "profile" ? "rotate-180" : ""
                                        }`}
                                />
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-3 p-4 bg-muted/30 rounded-xl space-y-3">
                            <div className="space-y-2">
                                <Label htmlFor="profile-name">Họ và tên</Label>
                                <Input
                                    id="profile-name"
                                    value={formData.fullName}
                                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                                    placeholder="Nhập họ và tên"
                                    className="rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="profile-major">Ngành học</Label>
                                <Input
                                    id="profile-major"
                                    value={formData.major}
                                    onChange={(e) => handleInputChange("major", e.target.value)}
                                    placeholder="Ví dụ: Khoa học máy tính"
                                    className="rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="profile-university">Trường học</Label>
                                <Input
                                    id="profile-university"
                                    value={formData.university}
                                    onChange={(e) => handleInputChange("university", e.target.value)}
                                    placeholder="Ví dụ: ĐH Bách Khoa TP.HCM"
                                    className="rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="profile-phone">Số điện thoại</Label>
                                <Input
                                    id="profile-phone"
                                    value={formData.phone}
                                    onChange={(e) => handleInputChange("phone", e.target.value)}
                                    placeholder="Ví dụ: 0901234567"
                                    className="rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="profile-bio">Giới thiệu bản thân</Label>
                                <Textarea
                                    id="profile-bio"
                                    value={formData.bio}
                                    onChange={(e) => handleInputChange("bio", e.target.value)}
                                    placeholder="Viết vài dòng về bản thân bạn..."
                                    className="rounded-xl min-h-[80px]"
                                />
                            </div>
                            <Button
                                onClick={handleSave}
                                disabled={isUpdating}
                                className="w-full rounded-xl bg-primary hover:bg-primary/90">
                                {isUpdating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Đang lưu...
                                    </>
                                ) : (
                                    'Lưu thay đổi'
                                )}
                            </Button>
                        </CollapsibleContent>
                    </Collapsible>

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
                                    className={`w-4 h-4 transition-transform ${expandedSettings === "verification" ? "rotate-180" : ""
                                        }`}
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

                    {/* Preferences & Matching */}
                    <Collapsible
                        open={expandedSettings === "preferences"}
                        onOpenChange={() => toggleSettingsSection("preferences")}
                    >
                        <CollapsibleTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full justify-between rounded-xl hover:bg-muted"
                            >
                                <div className="flex items-center">
                                    <Award className="w-4 h-4 mr-3" />
                                    Tùy chọn & Phù hợp
                                </div>
                                <ChevronDown
                                    className={`w-4 h-4 transition-transform ${expandedSettings === "preferences" ? "rotate-180" : ""
                                        }`}
                                />
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-3 p-4 bg-muted/30 rounded-xl space-y-3">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Bạn cùng phòng yên tĩnh</span>
                                    <Switch defaultChecked />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Không hút thuốc</span>
                                    <Switch defaultChecked />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Cho phép thú cưng</span>
                                    <Switch />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Ngủ sớm (dậy 6-9h sáng)</span>
                                    <Switch />
                                </div>
                            </div>
                            <Button
                                onClick={handleSave}
                                className="w-full rounded-xl bg-primary hover:bg-primary/90">
                                Lưu tùy chọn
                            </Button>
                        </CollapsibleContent>
                    </Collapsible>

                    {/* Privacy & Security */}
                    <Collapsible
                        open={expandedSettings === "security"}
                        onOpenChange={() => toggleSettingsSection("security")}
                    >
                        <CollapsibleTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full justify-between rounded-xl hover:bg-muted"
                            >
                                <div className="flex items-center">
                                    <Settings className="w-4 h-4 mr-3" />
                                    Quyền riêng tư & Bảo mật
                                </div>
                                <ChevronDown
                                    className={`w-4 h-4 transition-transform ${expandedSettings === "security" ? "rotate-180" : ""
                                        }`}
                                />
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-3 p-4 bg-muted/30 rounded-xl space-y-3">
                            <div className="space-y-3">
                                <div className="space-y-2">
                                    <Label htmlFor="current-password">Mật khẩu hiện tại</Label>
                                    <Input
                                        id="current-password"
                                        type="password"
                                        className="rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="new-password">Mật khẩu mới</Label>
                                    <Input
                                        id="new-password"
                                        type="password"
                                        className="rounded-xl"
                                    />
                                </div>
                                <div className="flex items-center justify-between pt-2">
                                    <span className="text-sm">Bật xác thực 2 bước</span>
                                    <Switch />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Hiển thị hồ sơ</span>
                                    <select className="px-3 py-1 rounded-lg border text-sm bg-background">
                                        <option>Công khai</option>
                                        <option>Chỉ bạn bè</option>
                                        <option>Riêng tư</option>
                                    </select>
                                </div>
                            </div>
                            <Button
                                onClick={handleSave}
                                className="w-full rounded-xl bg-primary hover:bg-primary/90">
                                Cập nhật bảo mật
                            </Button>
                        </CollapsibleContent>
                    </Collapsible>
                </div>
            </Card>

            <Card className="p-6 rounded-2xl shadow-soft border border-border">
                <h3 className="mb-4">Thông báo</h3>
                <div className="space-y-4">
                    {[
                        "Phòng phù hợp mới",
                        "Tin nhắn",
                        "Cập nhật đặt phòng",
                        "Gợi ý SwapRoom",
                    ].map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                            <span className="text-sm">{item}</span>
                            <Switch defaultChecked />
                        </div>
                    ))}
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
