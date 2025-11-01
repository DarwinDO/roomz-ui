import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoomCard } from "@/components/common/RoomCard";
import { RefreshCw, Plus, Calendar, DollarSign, Home } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function SwapRoomPage() {
  const navigate = useNavigate();
  const [isBookSubletOpen, setIsBookSubletOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const myListings = [
    {
      id: "my-1",
      image: "https://images.unsplash.com/photo-1617325247661-675ab4b64ae2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwYmVkcm9vbXxlbnwxfHx8fDE3NjA2MzgzMDd8MA&ixlib=rb-4.1.0&q=80&w=1080",
      title: "Phòng của tôi - Cho thuê mùa hè",
      location: "Quận 1, TP.HCM",
      price: 3000000,
      distance: "Còn trống",
      verified: true,
      available: true,
    },
  ];

  const swapSuggestions = [
    {
      id: "swap-1",
      image: "https://images.unsplash.com/photo-1668089677938-b52086753f77?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBiZWRyb29tJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzYwNjM2NDM4fDA&ixlib=rb-4.1.0&q=80&w=1080",
      title: "Căn studio trung tâm - 2 tháng",
      location: "Quận 3, TP.HCM",
      price: 3800000,
      distance: "Tháng 6-7 2025",
      verified: true,
      available: true,
      matchPercentage: 88,
    },
    {
      id: "swap-2",
      image: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcGFydG1lbnQlMjBsaXZpbmclMjByb29tfGVufDF8fHx8MTc2MDY3MzE2NXww&ixlib=rb-4.1.0&q=80&w=1080",
      title: "Phòng ấm cúng gần trường",
      location: "Thủ Đức, TP.HCM",
      price: 2700000,
      distance: "Tháng 5-8 2025",
      verified: false,
      available: true,
      matchPercentage: 85,
    },
    {
      id: "swap-3",
      image: "https://images.unsplash.com/photo-1579632151052-92f741fb9b79?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3p5JTIwc3R1ZGVudCUyMHJvb218ZW58MXx8fHwxNzYwNjA0MDMzfDA&ixlib=rb-4.1.0&q=80&w=1080",
      title: "Phòng sáng có ban công",
      location: "Quận 10, TP.HCM",
      price: 3300000,
      distance: "Tháng 6-9 2025",
      verified: true,
      available: true,
      matchPercentage: 79,
    },
  ];

  const handleSubletClick = (sublet: any) => {
    navigate(`/sublet/${sublet.id}`);
  };

  return (
    <div className="pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 to-secondary/10 px-6 py-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-8 h-8 text-primary" />
          </div>
          <h1 className="mb-2">SwapRoom</h1>
          <p className="text-gray-600">
            Thuê phòng linh hoạt cho lưu trú ngắn hạn và hoán đổi phòng
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="browse">Tìm phòng cho thuê</TabsTrigger>
            <TabsTrigger value="mylistings">Tin đăng của tôi</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            <Card className="p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-secondary/5 border-0">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h3 className="mb-2">Tìm chỗ ở ngắn hạn?</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Tìm phòng cho thuê đã xác thực từ sinh viên đi thực tập, du học,
                    hoặc nghỉ hè.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="secondary" className="px-3 py-1 rounded-full bg-slate-100/90 border border-slate-200 text-slate-700 text-xs font-medium shadow-sm dark:bg-slate-800/70 dark:border-slate-700 dark:text-slate-200">1-3 tháng</Badge>
                    <Badge variant="secondary" className="px-3 py-1 rounded-full bg-slate-100/90 border border-slate-200 text-slate-700 text-xs font-medium shadow-sm dark:bg-slate-800/70 dark:border-slate-700 dark:text-slate-200">Thời gian linh hoạt</Badge>
                    <Badge variant="secondary" className="px-3 py-1 rounded-full bg-slate-100/90 border border-slate-200 text-slate-700 text-xs font-medium shadow-sm dark:bg-slate-800/70 dark:border-slate-700 dark:text-slate-200">Không cam kết dài hạn</Badge>
                  </div>
                </div>
              </div>
            </Card>

            <div>
              <h3 className="mb-4">Tin cho thuê đang mở</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {swapSuggestions.map((room) => (
                  <div key={room.id} onClick={() => handleSubletClick(room)} className="cursor-pointer">
                    <RoomCard {...room} />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="mylistings" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3>Tin đăng của bạn</h3>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 rounded-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Đăng phòng của bạn
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Đăng phòng cho thuê ngắn hạn</DialogTitle>
                    <DialogDescription>
                      Điền thông tin chi tiết để đăng tin sublet trong thời gian ngắn.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Tiêu đề phòng</Label>
                      <Input
                        id="title"
                        placeholder="Ví dụ: Căn studio ấm cúng gần trường"
                        className="rounded-xl"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="start-date">Ngày bắt đầu</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="start-date"
                            type="date"
                            className="pl-10 rounded-xl"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end-date">Ngày kết thúc</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="end-date"
                            type="date"
                            className="pl-10 rounded-xl"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price">Giá theo tháng (VND)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="price"
                          type="number"
                          placeholder="3500000"
                          className="pl-10 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Mô tả chi tiết</Label>
                      <Textarea
                        id="description"
                        placeholder="Mô tả phòng, tiện nghi và lý do đây là lựa chọn lý tưởng..."
                        className="rounded-xl min-h-32"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Loại phòng</Label>
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant="outline"
                          className="cursor-pointer hover:bg-primary hover:text-white"
                        >
                          Phòng riêng
                        </Badge>
                        <Badge
                          variant="outline"
                          className="cursor-pointer hover:bg-primary hover:text-white"
                        >
                          Phòng chung
                        </Badge>
                        <Badge
                          variant="outline"
                          className="cursor-pointer hover:bg-primary hover:text-white"
                        >
                          Căn studio
                        </Badge>
                        <Badge
                          variant="outline"
                          className="cursor-pointer hover:bg-primary hover:text-white"
                        >
                          Nguyên căn
                        </Badge>
                      </div>
                    </div>

                    <Button className="w-full bg-primary hover:bg-primary/90 rounded-full h-12">
                      <Home className="w-4 h-4 mr-2" />
                      Đăng tin
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {myListings.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myListings.map((room) => (
                  <RoomCard key={room.id} {...room} />
                ))}
              </div>
            ) : (
              <Card className="p-12 rounded-2xl text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <RefreshCw className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="mb-2">Chưa có tin đăng nào</h3>
                <p className="text-gray-600 mb-6">
                  Sắp đi xa một thời gian? Đăng phòng của bạn để tìm người thuê phù hợp ngay nhé!
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90 rounded-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Tạo tin đăng đầu tiên
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Đăng phòng cho thuê ngắn hạn</DialogTitle>
                      <DialogDescription>
                        Điền thông tin chi tiết để đăng tin sublet trong thời gian ngắn.
                      </DialogDescription>
                    </DialogHeader>
                    <p className="text-sm text-gray-600 py-4">
                      Biểu mẫu đăng tin sẽ hiển thị tại đây...
                    </p>
                  </DialogContent>
                </Dialog>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* How it Works */}
        <Card className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-secondary/5 to-primary/5 border-0">
          <h3 className="mb-4 text-center">Cách SwapRoom hoạt động</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg">
                1
              </div>
              <p className="text-sm">
                <strong>Đăng phòng</strong> kèm thời gian và giá mong muốn
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg">
                2
              </div>
              <p className="text-sm">
                <strong>Nhận gợi ý</strong> từ những người thuê đã xác thực
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg">
                3
              </div>
              <p className="text-sm">
                <strong>Thanh toán an toàn</strong> trên nền tảng RoomZ
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
