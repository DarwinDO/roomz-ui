import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoomCard } from "@/components/common/RoomCard";
import { RefreshCw, Plus } from "lucide-react";
import { CreateSubletDialog } from "@/components/modals/CreateSubletDialog";

export default function SwapRoomPage() {
  const navigate = useNavigate();

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
    <div className="pb-20 md:pb-8 min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card/95 backdrop-blur-sm border-b border-border sticky top-0 z-30 px-6 py-4 transition-all">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">SwapRoom</h1>
              <p className="text-muted-foreground text-sm hidden sm:block">
                Trao đổi, cho thuê phòng ngắn hạn
              </p>
            </div>
          </div>
          <CreateSubletDialog>
            <Button className="bg-primary hover:bg-primary/90 rounded-xl hidden md:flex">
              <Plus className="w-4 h-4 mr-2" />
              Đăng phòng ngay
            </Button>
          </CreateSubletDialog>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8 rounded-xl bg-muted/50 p-1">
            <TabsTrigger value="browse" className="rounded-lg">Tìm phòng cho thuê</TabsTrigger>
            <TabsTrigger value="mylistings" className="rounded-lg">Tin đăng của tôi</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6 animate-fade-in">
            <Card className="p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/10 shadow-soft">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h3 className="mb-2 text-lg font-semibold">Tìm chỗ ở ngắn hạn?</h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-2xl">
                    Tìm phòng cho thuê đã xác thực từ sinh viên đi thực tập, du học,
                    hoặc nghỉ hè. Các phòng đều đã được kiểm duyệt.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="secondary" className="bg-background/80 hover:bg-background border border-border text-foreground font-normal px-3 py-1">1-3 tháng</Badge>
                    <Badge variant="secondary" className="bg-background/80 hover:bg-background border border-border text-foreground font-normal px-3 py-1">Thời gian linh hoạt</Badge>
                    <Badge variant="secondary" className="bg-background/80 hover:bg-background border border-border text-foreground font-normal px-3 py-1">Không cọc dài hạn</Badge>
                  </div>
                </div>
              </div>
            </Card>

            <div>
              <h3 className="mb-4 text-lg font-semibold flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-primary" />
                Tin cho thuê đang mở
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
                {swapSuggestions.map((room) => (
                  <div key={room.id} onClick={() => handleSubletClick(room)} className="cursor-pointer">
                    <RoomCard {...room} />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="mylistings" className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Tin đăng của bạn</h3>
              <CreateSubletDialog>
                <Button className="bg-primary hover:bg-primary/90 rounded-xl md:hidden">
                  <Plus className="w-4 h-4 mr-2" />
                  Đăng
                </Button>
              </CreateSubletDialog>
            </div>

            {myListings.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myListings.map((room) => (
                  <RoomCard key={room.id} {...room} />
                ))}
              </div>
            ) : (
              <Card className="p-12 rounded-2xl text-center border-dashed border-2 border-muted">
                <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <RefreshCw className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="mb-2 font-medium">Chưa có tin đăng nào</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Sắp đi xa một thời gian? Đăng phòng của bạn để tìm người thuê phù hợp ngay nhé!
                </p>
                <CreateSubletDialog>
                  <Button className="bg-primary hover:bg-primary/90 rounded-xl">
                    <Plus className="w-4 h-4 mr-2" />
                    Tạo tin đăng đầu tiên
                  </Button>
                </CreateSubletDialog>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* How it Works */}
        <div className="mt-12 pt-8 border-t border-border">
          <h3 className="mb-8 text-center text-lg font-semibold">Cách SwapRoom hoạt động</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4 text-xl font-bold group-hover:scale-110 transition-transform duration-300">
                1
              </div>
              <p className="text-sm px-4">
                <strong className="block mb-1 text-base">Đăng phòng</strong>
                kèm thời gian và giá mong muốn
              </p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4 text-xl font-bold group-hover:scale-110 transition-transform duration-300 delay-100">
                2
              </div>
              <p className="text-sm px-4">
                <strong className="block mb-1 text-base">Nhận gợi ý</strong>
                từ những người thuê đã xác thực
              </p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4 text-xl font-bold group-hover:scale-110 transition-transform duration-300 delay-200">
                3
              </div>
              <p className="text-sm px-4">
                <strong className="block mb-1 text-base">Thanh toán an toàn</strong>
                trên nền tảng RoomZ
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button - Mobile */}
      <div className="md:hidden fixed bottom-20 right-4 z-40">
        <CreateSubletDialog>
          <Button
            className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg"
            size="icon" aria-label="Đăng phòng mới"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </CreateSubletDialog>
      </div>
    </div>
  );
}
