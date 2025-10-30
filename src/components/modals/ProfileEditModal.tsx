import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, GraduationCap, Calendar, Upload } from "lucide-react";

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function ProfileEditModal({ isOpen, onClose, onSave }: ProfileEditModalProps) {
  const [profileData, setProfileData] = useState({
    name: "Nguyễn Văn A",
    email: "nguyenvana@university.edu",
    major: "Khoa học máy tính",
    year: "Năm 3",
    bio: "Thích cà phê, yoga và giữ gìn trật tự. Đang tìm bạn cùng phòng ngăn nắp, yên tĩnh có sở thích tương đồng!",
  });

  const handleSave = () => {
    onSave();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
              <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop" />
              <AvatarFallback>SJ</AvatarFallback>
            </Avatar>
            <Button variant="outline" className="rounded-full" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Thay đổi ảnh
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
              value={profileData.name}
              onChange={(e) =>
                setProfileData({ ...profileData, name: e.target.value })
              }
              className="rounded-xl"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="edit-email" className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              Địa chỉ email
            </Label>
            <Input
              id="edit-email"
              type="email"
              value={profileData.email}
              onChange={(e) =>
                setProfileData({ ...profileData, email: e.target.value })
              }
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
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-year" className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Năm học
              </Label>
              <select
                id="edit-year"
                value={profileData.year}
                onChange={(e) =>
                  setProfileData({ ...profileData, year: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-input bg-background"
              >
                <option>Năm 1</option>
                <option>Năm 2</option>
                <option>Năm 3</option>
                <option>Năm 4</option>
                <option>Cao học</option>
              </select>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="edit-bio">Giới thiệu</Label>
            <Textarea
              id="edit-bio"
              value={profileData.bio}
              onChange={(e) =>
                setProfileData({ ...profileData, bio: e.target.value })
              }
              className="rounded-xl min-h-32"
              placeholder="Kể về bản thân bạn..."
            />
            <p className="text-xs text-gray-500">
              {profileData.bio.length}/500 ký tự
            </p>
          </div>

          {/* University */}
          <div className="space-y-2">
            <Label htmlFor="edit-university">Trường học</Label>
            <Input
              id="edit-university"
              defaultValue="Đại học Bách Khoa"
              className="rounded-xl"
            />
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
              onClick={onClose}
              variant="outline"
              className="flex-1 rounded-full h-12"
            >
              Hủy
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-primary hover:bg-primary/90 rounded-full h-12"
            >
              Lưu thay đổi
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
