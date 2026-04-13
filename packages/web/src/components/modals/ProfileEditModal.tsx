import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { Building, Calendar, GraduationCap, Loader2, Mail, Phone, Upload, User } from "lucide-react";
import { useAuth } from "@/contexts";
import { useUpdateProfile } from "@/hooks/useProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { type UpdateProfileData, uploadAvatarFile, validateAvatarFile } from "@/services/profile";
import { getUserInitials } from "@roomz/shared/utils/user";

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ProfileFormState = {
  full_name: string;
  major: string;
  university: string;
  graduation_year: string;
  bio: string;
  phone: string;
};

const EMPTY_FORM_STATE: ProfileFormState = {
  full_name: "",
  major: "",
  university: "",
  graduation_year: "",
  bio: "",
  phone: "",
};

export function ProfileEditModal({ isOpen, onClose }: ProfileEditModalProps) {
  const { user, profile } = useAuth();
  const { mutateAsync: updateProfileAsync, isPending: isSavingProfile } = useUpdateProfile();
  const [profileData, setProfileData] = useState<ProfileFormState>(EMPTY_FORM_STATE);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const isLoading = isSavingProfile || isUploadingAvatar;

  const resetAvatarInput = () => {
    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }
  };

  const replaceAvatarPreview = (nextUrl: string | null) => {
    setAvatarPreviewUrl((currentUrl) => {
      if (currentUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(currentUrl);
      }

      return nextUrl;
    });
  };

  const resetForm = () => {
    setProfileData({
      full_name: profile?.full_name || "",
      major: profile?.major || "",
      university: profile?.university || "",
      graduation_year: profile?.graduation_year?.toString() || "",
      bio: profile?.bio || "",
      phone: profile?.phone || "",
    });
    setSelectedAvatarFile(null);
    replaceAvatarPreview(profile?.avatar_url || null);
    resetAvatarInput();
  };

  useEffect(() => {
    if (isOpen) {
      setProfileData({
        full_name: profile?.full_name || "",
        major: profile?.major || "",
        university: profile?.university || "",
        graduation_year: profile?.graduation_year?.toString() || "",
        bio: profile?.bio || "",
        phone: profile?.phone || "",
      });
      setSelectedAvatarFile(null);
      setAvatarPreviewUrl((currentUrl) => {
        if (currentUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(currentUrl);
        }

        return profile?.avatar_url || null;
      });
      resetAvatarInput();
    }
  }, [isOpen, profile]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const validation = validateAvatarFile(file);

    if (!validation.isValid) {
      toast.error(validation.error);
      resetAvatarInput();
      return;
    }

    setSelectedAvatarFile(file);
    replaceAvatarPreview(URL.createObjectURL(file));
  };

  const handleResetAvatar = () => {
    setSelectedAvatarFile(null);
    replaceAvatarPreview(profile?.avatar_url || null);
    resetAvatarInput();
  };

  const handleSave = async () => {
    if (!user) {
      return;
    }

    const updateData: UpdateProfileData = {
      full_name: profileData.full_name,
      major: profileData.major || null,
      university: profileData.university || null,
      bio: profileData.bio || null,
      phone: profileData.phone || null,
    };

    if (profileData.graduation_year) {
      const year = Number.parseInt(profileData.graduation_year, 10);

      if (!Number.isNaN(year)) {
        updateData.graduation_year = year;
      }
    }

    try {
      if (selectedAvatarFile) {
        setIsUploadingAvatar(true);
        updateData.avatar_url = await uploadAvatarFile(user.id, selectedAvatarFile);
      }

      await updateProfileAsync(updateData);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật hồ sơ");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa hồ sơ</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin và ảnh đại diện của bạn.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage
                src={avatarPreviewUrl || undefined}
                alt={profile?.full_name || user?.email || ""}
              />
              <AvatarFallback className="bg-gradient-to-r from-primary to-secondary text-2xl text-white">
                {getUserInitials(profile?.full_name, user?.email)}
              </AvatarFallback>
            </Avatar>

            <Input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />

            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                size="sm"
                onClick={() => avatarInputRef.current?.click()}
                disabled={isLoading}
              >
                <Upload className="mr-2 h-4 w-4" />
                {selectedAvatarFile ? "Chọn ảnh khác" : "Thay đổi ảnh"}
              </Button>

              {selectedAvatarFile ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-full"
                  size="sm"
                  onClick={handleResetAvatar}
                  disabled={isLoading}
                >
                  Hoàn tác
                </Button>
              ) : null}
            </div>

            <p className="text-center text-xs text-muted-foreground">
              {selectedAvatarFile
                ? "Ảnh mới sẽ được lưu khi bạn bấm Lưu thay đổi."
                : "Hỗ trợ JPG, PNG hoặc WebP, tối đa 5MB."}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-name" className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Họ và tên
            </Label>
            <Input
              id="edit-name"
              value={profileData.full_name}
              onChange={(event) =>
                setProfileData({ ...profileData, full_name: event.target.value })
              }
              placeholder="Nhập họ và tên của bạn"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-email" className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              Địa chỉ email
            </Label>
            <Input
              id="edit-email"
              type="email"
              value={user?.email || ""}
              disabled
              className="rounded-xl bg-muted"
            />
            <p className="text-xs text-muted-foreground">Email không thể thay đổi.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              Số điện thoại
            </Label>
            <Input
              id="edit-phone"
              type="tel"
              value={profileData.phone}
              onChange={(event) =>
                setProfileData({ ...profileData, phone: event.target.value })
              }
              placeholder="Ví dụ: 0901234567"
              className="rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-major" className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                Ngành học
              </Label>
              <Input
                id="edit-major"
                value={profileData.major}
                onChange={(event) =>
                  setProfileData({ ...profileData, major: event.target.value })
                }
                placeholder="Ví dụ: Khoa học máy tính"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-year" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Khóa (năm nhập học)
              </Label>
              <Input
                id="edit-year"
                type="number"
                value={profileData.graduation_year}
                onChange={(event) =>
                  setProfileData({ ...profileData, graduation_year: event.target.value })
                }
                placeholder="Ví dụ: 2022"
                className="rounded-xl"
                min="2000"
                max="2030"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-university" className="flex items-center gap-2">
              <Building className="h-4 w-4 text-primary" />
              Trường học
            </Label>
            <Input
              id="edit-university"
              value={profileData.university}
              onChange={(event) =>
                setProfileData({ ...profileData, university: event.target.value })
              }
              placeholder="Ví dụ: Đại học Bách Khoa TP.HCM"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-bio">Giới thiệu bản thân</Label>
            <Textarea
              id="edit-bio"
              value={profileData.bio}
              onChange={(event) =>
                setProfileData({
                  ...profileData,
                  bio: event.target.value.slice(0, 500),
                })
              }
              className="min-h-32 rounded-xl"
              placeholder="Kể về bản thân bạn, sở thích, thói quen sinh hoạt..."
            />
            <p className="text-xs text-muted-foreground">{profileData.bio.length}/500 ký tự</p>
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-xs text-muted-foreground">
              Thông tin hồ sơ giúp người khác tìm bạn cùng phòng phù hợp hơn. Hãy giữ chúng chính
              xác và cập nhật.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={handleClose}
              variant="outline"
              className="h-12 flex-1 rounded-full"
              disabled={isLoading}
            >
              Hủy
            </Button>

            <Button
              type="button"
              onClick={handleSave}
              className="h-12 flex-1 rounded-full bg-primary hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                "Lưu thay đổi"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
