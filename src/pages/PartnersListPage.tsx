import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PartnerDetailModal } from "@/components/modals/PartnerDetailModal";
import { ArrowLeft, Search, Star, MapPin, Percent } from "lucide-react";

interface Partner {
  name: string;
  rating: number;
  reviews: number;
  specialization: string;
  discount: string;
  category: string;
}

export default function PartnersListPage() {
  const navigate = useNavigate();
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Mock data - trong thực tế sẽ fetch từ API
  const allPartners: Partner[] = [
    {
      name: "NhanhMove Express",
      rating: 4.9,
      reviews: 342,
      specialization: "Chuyển nhà",
      discount: "Giảm 15% cho sinh viên",
      category: "moving",
    },
    {
      name: "SạchPlus",
      rating: 4.8,
      reviews: 267,
      specialization: "Vệ sinh",
      discount: "Giảm 15% cho sinh viên",
      category: "cleaning",
    },
    {
      name: "SetupCare",
      rating: 4.7,
      reviews: 198,
      specialization: "Lắp đặt & bố trí",
      discount: "Giảm 15% cho sinh viên",
      category: "setup",
    },
    {
      name: "FastMove Pro",
      rating: 4.8,
      reviews: 289,
      specialization: "Chuyển nhà",
      discount: "Giảm 20% cho đơn trên 5tr",
      category: "moving",
    },
    {
      name: "CleanMaster",
      rating: 4.9,
      reviews: 415,
      specialization: "Vệ sinh",
      discount: "Miễn phí vệ sinh lần đầu",
      category: "cleaning",
    },
    {
      name: "HomeFix Services",
      rating: 4.6,
      reviews: 156,
      specialization: "Sửa chữa & bảo trì",
      discount: "Giảm 10% cho sinh viên",
      category: "maintenance",
    },
    {
      name: "PackPro",
      rating: 4.7,
      reviews: 203,
      specialization: "Đóng gói chuyên nghiệp",
      discount: "Giảm 15% cho sinh viên",
      category: "packing",
    },
    {
      name: "SparkleClean",
      rating: 4.8,
      reviews: 321,
      specialization: "Vệ sinh",
      discount: "Giảm 15% cho sinh viên",
      category: "cleaning",
    },
  ];

  const categories = [
    { value: "all", label: "Tất cả dịch vụ" },
    { value: "moving", label: "Chuyển nhà" },
    { value: "cleaning", label: "Vệ sinh" },
    { value: "setup", label: "Lắp đặt & bố trí" },
    { value: "maintenance", label: "Sửa chữa" },
    { value: "packing", label: "Đóng gói" },
  ];

  const filteredPartners = allPartners.filter((partner) => {
    const matchesSearch =
      partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.specialization.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || partner.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handlePartnerClick = (partner: Partner) => {
    setSelectedPartner(partner);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8FAFF] to-white pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-2 rounded-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
          <div className="space-y-1">
            <h1>Đối tác RoomZ</h1>
            <p className="text-muted-foreground">
              Danh sách đầy đủ các đối tác uy tín được xác thực bởi RoomZ
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Search and Filter */}
        <Card className="p-4 rounded-2xl shadow-sm border-border">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm đối tác hoặc dịch vụ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>

            {/* Category Filter */}
            <div className="w-full md:w-64">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Tìm thấy <strong>{filteredPartners.length}</strong> đối tác
          </p>
          <Select defaultValue="rating">
            <SelectTrigger className="w-40 rounded-xl text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Đánh giá cao nhất</SelectItem>
              <SelectItem value="reviews">Nhiều đánh giá</SelectItem>
              <SelectItem value="name">Tên A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Partners Grid */}
        {filteredPartners.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPartners.map((partner, idx) => (
              <Card
                key={idx}
                onClick={() => handlePartnerClick(partner)}
                className="p-5 rounded-2xl shadow-sm hover:shadow-md transition-all border-border cursor-pointer group"
              >
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <h4 className="group-hover:text-primary transition-colors">
                        {partner.name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {partner.specialization}
                      </p>
                    </div>
                    <Badge className="rounded-full bg-primary text-white shrink-0">
                      <Star className="w-3 h-3 mr-1 fill-white" />
                      {partner.rating}
                    </Badge>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-xs text-muted-foreground">
                      {partner.reviews} đánh giá
                    </span>
                    <Badge
                      variant="secondary"
                      className="rounded-full bg-amber-50 text-amber-700 text-xs"
                    >
                      <Percent className="w-3 h-3 mr-1" />
                      Ưu đãi SV
                    </Badge>
                  </div>

                  {/* Discount */}
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-3">
                    <p className="text-xs text-amber-900">{partner.discount}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 rounded-2xl text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="mb-2">Không tìm thấy đối tác</h3>
            <p className="text-gray-600 mb-6">
              Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
            </p>
            <Button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              variant="outline"
              className="rounded-full"
            >
              Xóa bộ lọc
            </Button>
          </Card>
        )}

        {/* Info Banner */}
        <Card className="p-6 rounded-2xl bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center shrink-0">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 space-y-1">
              <h4>Bạn là đối tác địa phương?</h4>
              <p className="text-sm text-muted-foreground">
                Tham gia mạng lưới đối tác RoomZ để kết nối với hàng nghìn sinh viên trong khu vực
              </p>
            </div>
            <Button
              onClick={() => navigate("/partner-signup")}
              className="rounded-full bg-primary hover:bg-primary/90 shrink-0"
            >
              Đăng ký đối tác
            </Button>
          </div>
        </Card>
      </div>

      {/* Partner Detail Modal */}
      {selectedPartner && (
        <PartnerDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          partner={selectedPartner}
        />
      )}
    </div>
  );
}

