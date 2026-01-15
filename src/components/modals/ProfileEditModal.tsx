import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, GraduationCap, Calendar, Upload, Phone, Building, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function ProfileEditModal({ isOpen, onClose, onSave }: ProfileEditModalProps) {
  const { user, profile, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: "",
    major: "",
    university: "",
    graduation_year: "",
    bio: "",
    phone: "",
  });

  // Initialize form with current profile data when modal opens
  useEffect(() => {
    if (isOpen && profile) {
      setProfileData({
        full_name: profile.full_name || "",
        major: profile.major || "",
        university: profile.university || "",
        graduation_year: profile.graduation_year?.toString() || "",
        bio: profile.bio || "",
        phone: profile.phone || "",
      });
    }
  }, [isOpen, profile]);

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.charAt(0).toUpperCase() || '?';
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const updateData: Record<string, unknown> = {
        full_name: profileData.full_name,
        major: profileData.major || null,
        university: profileData.university || null,
        bio: profileData.bio || null,
        phone: profileData.phone || null,
        updated_at: new Date().toISOString(),
      };

      // Only include graduation_year if it's a valid number
      if (profileData.graduation_year) {
        const year = parseInt(profileData.graduation_year);
        if (!isNaN(year)) {
          updateData.graduation_year = year;
        }
      }

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      toast.success("Cập nhật hồ sơ thành công!");
      
      // Refresh user data in context
      await refreshUser();
      
      onSave();
      onClose();
    } catch (error: unknown) {
      console.error('Error updating profile:', error);
      const errorMessage = error instanceof Error ? error.message : "Không thể cập nhật hồ sơ";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form to original profile data when closing without saving
    if (profile) {
      setProfileData({
        full_name: profile.full_name || "",
        major: profile.major || "",
        university: profile.university || "",
        graduation_year: profile.graduation_year?.toString() || "",
        bio: profile.bio || "",
        phone: profile.phone || "",
      });
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa hồ sơ</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin và tùy chọn của bạn
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Profile Picture */}
          <div className="flex flex-col items-center gap-4">
            <Avatar className="w-24 h-24">
              <AvatarImage 
                src={profile?.avatar_url || undefined} 
                alt={profile?.full_name || user?.email || ''} 
              />
              <AvatarFallback className="text-2xl bg-gradient-to-r from-primary to-secondary text-white">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <Button variant="outline" className="rounded-full" size="sm" disabled>
              <Upload className="w-4 h-4 mr-2" />
              Thay đổi ảnh (Sắp có)
            </Button>
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="edit-name" className="flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Họ và tên
            </Label>
            <Input
              id="edit-name"
              value={profileData.full_name}
              onChange={(e) =>
                setProfileData({ ...profileData, full_name: e.target.value })
              }
              placeholder="Nhập họ và tên của bạn"
              className="rounded-xl"
            />
          </div>

          {/* Email - Read only */}
          <div className="space-y-2">
            <Label htmlFor="edit-email" className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              Địa chỉ email
            </Label>
            <Input
              id="edit-email"
              type="email"
              value={user?.email || ""}
              disabled
              className="rounded-xl bg-gray-50"
            />
            <p className="text-xs text-gray-500">
              Email không thể thay đổi
            </p>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="edit-phone" className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" />
              Số điện thoại
            </Label>
            <Input
              id="edit-phone"
              type="tel"
              value={profileData.phone}
              onChange={(e) =>
                setProfileData({ ...profileData, phone: e.target.value })
              }
              placeholder="Ví dụ: 0901234567"
              className="rounded-xl"
            />
          </div>

          {/* Major and Year */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-major" className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-primary" />
                Ngành học
              </Label>
              <Input
                id="edit-major"
                value={profileData.major}
                onChange={(e) =>
                  setProfileData({ ...profileData, major: e.target.value })
                }
                placeholder="Ví dụ: Khoa học máy tính"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-year" className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Khóa (năm nhập học)
              </Label>
              <Input
                id="edit-year"
                type="number"
                value={profileData.graduation_year}
                onChange={(e) =>
                  setProfileData({ ...profileData, graduation_year: e.target.value })
                }
                placeholder="Ví dụ: 2022"
                className="rounded-xl"
                min="2000"
                max="2030"
              />
            </div>
          </div>

          {/* University */}
          <div className="space-y-2">
            <Label htmlFor="edit-university" className="flex items-center gap-2">
              <Building className="w-4 h-4 text-primary" />
              Trường học
            </Label>
            <Input
              id="edit-university"
              value={profileData.university}
              onChange={(e) =>
                setProfileData({ ...profileData, university: e.target.value })
              }
              placeholder="Ví dụ: Đại học Bách Khoa TP.HCM"
              className="rounded-xl"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="edit-bio">Giới thiệu bản thân</Label>
            <Textarea
              id="edit-bio"
              value={profileData.bio}
              onChange={(e) =>
                setProfileData({ ...profileData, bio: e.target.value.slice(0, 500) })
              }
              className="rounded-xl min-h-32"
              placeholder="Kể về bản thân bạn, sở thích, thói quen sinh hoạt..."
            />
            <p className="text-xs text-gray-500">
              {profileData.bio.length}/500 ký tự
            </p>
          </div>

          {/* Info Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-xs text-gray-700">
              💡 Thông tin hồ sơ giúp người khác tìm bạn cùng phòng phù hợp. Hãy giữ
              cho chúng chính xác và cập nhật!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleClose}
              variant="outline"
              className="flex-1 rounded-full h-12"
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-primary hover:bg-primary/90 rounded-full h-12"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                'Lưu thay đổi'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
