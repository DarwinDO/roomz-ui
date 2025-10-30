import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RoomCard } from "@/components/common/RoomCard";
import { ServicesBanner } from "@/components/common/ServicesBanner";
import { ChatDrawer } from "@/components/common/ChatDrawer";
import { UpgradeRoomZPlusModal } from "@/components/modals/UpgradeRoomZPlusModal";
import { ProfileEditModal } from "@/components/modals/ProfileEditModal";
import RoomDetailPage from "@/pages/RoomDetailPage";
import { MessagesList } from "@/components/common/MessagesList";
import { messagesData } from "../data/messages";
import { toast } from "sonner";
import {
  User,
  Settings,
  ShieldCheck,
  Heart,
  MessageCircle,
  Star,
  Award,
  Edit,
  Crown,
  ChevronDown,
  Trash2,
  Eye,
} from "lucide-react";

export default function ProfilePage({ onNavigate }: ProfilePageProps = {}) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedChatPerson, setSelectedChatPerson] = useState<any>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [expandedSettings, setExpandedSettings] = useState<string | null>(null);
  const savedRooms = [
    {
      id: "saved-1",
      image: "https://images.unsplash.com/photo-1668089677938-b52086753f77?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBiZWRyb29tJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzYwNjM2NDM4fDA&ixlib=rb-4.1.0&q=80&w=1080",
      title: "Phòng riêng ấm cúng gần trường",
      location: "Khu Đại học, TP.HCM",
      price: 3500000,
      distance: "0.5 km",
      verified: true,
      available: true,
      matchPercentage: 92,
    },
    {
      id: "saved-2",
      image: "https://images.unsplash.com/photo-1617325247661-675ab4b64ae2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwYmVkcm9vbXxlbnwxfHx8fDE3NjA2MzgzMDd8MA&ixlib=rb-4.1.0&q=80&w=1080",
      title: "Căn studio hiện đại nhìn ra thành phố",
      location: "Quận 3, TP.HCM",
      price: 5000000,
      distance: "2 km",
      verified: true,
      available: true,
      matchPercentage: 85,
    },
  ];



  const handleMessageClick = (message: any) => {
    setSelectedChatPerson(message);
    setIsChatOpen(true);
  };

  const handleUpgradeSuccess = () => {
    toast.success("Thành công! RoomZ+ đã được kích hoạt trên tài khoản của bạn.");
  };

  const handleProfileSave = () => {
    toast.success("Cập nhật hồ sơ thành công!");
  };

  const handleRoomClick = (room: any) => {
    setSelectedRoom(room);
  };

  const handleRemoveFavorite = (roomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toast.success("Đã xóa khỏi yêu thích");
  };

  const toggleSettingsSection = (section: string) => {
    setExpandedSettings(expandedSettings === section ? null : section);
  };

  const handleSaveSettings = () => {
    toast.success("Đã lưu cài đặt thành công!");
  };

  if (selectedRoom) {
    return (
      <RoomDetailPage
        onBack={() => setSelectedRoom(null)}
        roomId={selectedRoom.id}
      />
    );
  }

  return (
    <div className="pb-20 md:pb-8">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-primary/5 to-secondary/5 px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header with Avatar, Name, and Edit Button */}
          <div className="flex items-start gap-3 sm:gap-6 mb-4 sm:mb-6">
            <Avatar className="w-[72px] h-[72px] sm:w-[120px] sm:h-[120px] border-4 border-white shadow-lg shrink-0">
              <AvatarFallback className="text-xl sm:text-2xl bg-primary text-white">
                JD
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h2 className="text-lg sm:text-2xl">Nguyễn Thảo Linh</h2>
                    <Badge className="bg-primary text-white text-xs sm:text-sm px-2 py-0.5 sm:px-3 sm:py-1">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      Đã xác thực
                    </Badge>
                  </div>
                  <p className="text-sm sm:text-base text-gray-600">Khoa học máy tính, ĐH Bách Khoa TP.HCM</p>
                </div>
                <Button
                  onClick={() => setIsEditProfileOpen(true)}
                  variant="outline"
                  size="sm"
                  className="rounded-full shrink-0 min-w-[90px] text-sm"
                >
                  <Edit className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">Chỉnh sửa hồ sơ</span>
                  <span className="xs:hidden">Sửa</span>
                </Button>
              </div>
              <div className="flex items-center gap-3 sm:gap-6 mt-3 sm:mt-4">
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-base sm:text-lg">4.9</span>
                  </div>
                  <p className="text-xs text-gray-500">Đánh giá</p>
                </div>
                <div className="h-6 sm:h-8 w-px bg-gray-300"></div>
                <div>
                  <p className="text-base sm:text-lg">12</p>
                  <p className="text-xs text-gray-500">Nhận xét</p>
                </div>
                <div className="h-6 sm:h-8 w-px bg-gray-300"></div>
                <div>
                  <p className="text-base sm:text-lg">95%</p>
                  <p className="text-xs text-gray-500">Điểm tin cậy</p>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Score */}
          <Card className="p-4 rounded-2xl bg-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <span>Điểm tin cậy</span>
              </div>
              <span className="text-primary">95%</span>
            </div>
            <Progress value={95} className="mb-3" />
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <ShieldCheck className="w-3 h-3 mr-1" />
                Đã xác thực CMND
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <ShieldCheck className="w-3 h-3 mr-1" />
                Đã xác thực Email
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <ShieldCheck className="w-3 h-3 mr-1" />
                Đã xác thực thẻ SV
              </Badge>
            </div>
          </Card>
        </div>
      </div>

      {/* RoomZ+ Membership */}
      <div className="px-6 py-6 max-w-6xl mx-auto">
        <Card className="p-6 rounded-2xl bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-2xl flex items-center justify-center shrink-0">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="mb-1">Nâng cấp lên RoomZ+</h3>
              <p className="text-sm text-gray-700 mb-3">
                Nhận ưu tiên hiển thị, phù hợp nâng cao và ưu đãi độc quyền
              </p>
              <ul className="space-y-1 mb-4 text-sm">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  Ưu tiên trong kết quả tìm kiếm
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  Phù hợp nâng cao
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  Không phí đặt phòng
                </li>
              </ul>
              <Button
                onClick={() => setIsUpgradeModalOpen(true)}
                className="bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-white rounded-full"
              >
                Nâng cấp ngay - 200k/tháng
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Content Tabs */}
      <div className="px-6 max-w-6xl mx-auto">
        <Tabs defaultValue="favorites" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="favorites">
              <Heart className="w-4 h-4 mr-2" />
              Yêu thích
            </TabsTrigger>
            <TabsTrigger value="messages">
              <MessageCircle className="w-4 h-4 mr-2" />
              Tin nhắn
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              Cài đặt
            </TabsTrigger>
          </TabsList>

          <TabsContent value="favorites">
            <div className="space-y-8">
              {onNavigate && (
                <ServicesBanner onNavigate={onNavigate} />
              )}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3>Phòng đã lưu ({savedRooms.length})</h3>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedRooms.map((room) => (
                    <div key={room.id} className="relative group">
                      <div onClick={() => handleRoomClick(room)}>
                        <RoomCard {...room} />
                      </div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <Button
                          onClick={(e) => handleRemoveFavorite(room.id, e)}
                          size="icon"
                          variant="secondary"
                          className="rounded-full bg-white/90 hover:bg-white h-8 w-8"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRoomClick(room);
                          }}
                          size="icon"
                          variant="secondary"
                          className="rounded-full bg-white/90 hover:bg-white h-8 w-8"
                        >
                          <Eye className="w-4 h-4 text-primary" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="messages">
            <MessagesList messages={messagesData} onMessageClick={handleMessageClick} />
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-6">
              <Card className="p-6 rounded-2xl">
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
                        className="w-full justify-between rounded-xl"
                      >
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-3" />
                          Chỉnh sửa thông tin hồ sơ
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            expandedSettings === "profile" ? "rotate-180" : ""
                          }`}
                        />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 p-4 bg-gray-50 rounded-xl space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="profile-name">Họ và tên</Label>
                        <Input
                          id="profile-name"
                          defaultValue="Nguyễn Thảo Linh"
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="profile-major">Ngành học</Label>
                        <Input
                          id="profile-major"
                          defaultValue="Khoa học máy tính"
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="profile-university">Trường học</Label>
                        <Input
                          id="profile-university"
                          defaultValue="ĐH Bách Khoa TP.HCM"
                          className="rounded-xl"
                        />
                      </div>
                      <Button
                        onClick={handleSaveSettings}
                        className="w-full rounded-full bg-primary"
                      >
                        Lưu thay đổi
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
                        className="w-full justify-between rounded-xl"
                      >
                        <div className="flex items-center">
                          <ShieldCheck className="w-4 h-4 mr-3" />
                          Trạng thái xác thực
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            expandedSettings === "verification" ? "rotate-180" : ""
                          }`}
                        />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 p-4 bg-gray-50 rounded-xl space-y-3">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-green-600" />
                            <span className="text-sm">Đã xác thực CMND</span>
                          </div>
                          <Badge className="bg-green-100 text-green-700 border-0">
                            ✓ Đã xác thực
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-green-600" />
                            <span className="text-sm">Đã xác thực Email</span>
                          </div>
                          <Badge className="bg-green-100 text-green-700 border-0">
                            ✓ Đã xác thực
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-green-600" />
                            <span className="text-sm">Đã xác thực thẻ SV</span>
                          </div>
                          <Badge className="bg-green-100 text-green-700 border-0">
                            ✓ Đã xác thực
                          </Badge>
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
                        className="w-full justify-between rounded-xl"
                      >
                        <div className="flex items-center">
                          <Award className="w-4 h-4 mr-3" />
                          Tùy chọn & Phù hợp
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            expandedSettings === "preferences" ? "rotate-180" : ""
                          }`}
                        />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 p-4 bg-gray-50 rounded-xl space-y-3">
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
                        onClick={handleSaveSettings}
                        className="w-full rounded-full bg-primary"
                      >
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
                        className="w-full justify-between rounded-xl"
                      >
                        <div className="flex items-center">
                          <Settings className="w-4 h-4 mr-3" />
                          Quyền riêng tư & Bảo mật
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            expandedSettings === "security" ? "rotate-180" : ""
                          }`}
                        />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 p-4 bg-gray-50 rounded-xl space-y-3">
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
                          <select className="px-3 py-1 rounded-lg border text-sm">
                            <option>Công khai</option>
                            <option>Chỉ bạn bè</option>
                            <option>Riêng tư</option>
                          </select>
                        </div>
                      </div>
                      <Button
                        onClick={handleSaveSettings}
                        className="w-full rounded-full bg-primary"
                      >
                        Cập nhật bảo mật
                      </Button>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </Card>

              <Card className="p-6 rounded-2xl">
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

              <Button variant="outline" className="w-full text-red-600 hover:text-red-700 rounded-xl">
                Đăng xuất
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <UpgradeRoomZPlusModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onSuccess={handleUpgradeSuccess}
      />
      <ProfileEditModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        onSave={handleProfileSave}
      />
      {selectedChatPerson && (
      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        recipientName={selectedChatPerson.name}
        recipientRole="Người tìm bạn cùng phòng"
      />
      )}
    </div>
  );
}
