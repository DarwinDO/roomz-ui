import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Shield, Users, RefreshCw, Star, CheckCircle, ArrowRight } from "lucide-react";
import { ServicesBanner } from "@/components/common/ServicesBanner";
import { PostListingModal } from "@/components/modals/PostListingModal";
import { toast } from "sonner";

export default function LandingPage() {
  const navigate = useNavigate();
  const [isPostListingOpen, setIsPostListingOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const onNavigate = (screen: string) => {
    const routeMap: Record<string, string> = {
      'search': '/search',
      'compatibility': '/roommates',
      'swaproom': '/swap',
      'profile': '/profile',
      'community': '/community',
    };
    navigate(routeMap[screen] || `/${screen}`);
  };

  const handleSearch = () => {
    navigate(`/search${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`);
  };

  const handlePostListingSubmit = () => {
    toast.success("Đã gửi tin đăng! Tin của bạn sẽ được xem xét trong vòng 24 giờ.");
  };

  const quickFilters = [
    "Chỉ phòng đã xác thực",
    "2-4 triệu",
    "Phòng riêng",
    "Cho phép thú cưng",
  ];

  const features = [
    {
      icon: Shield,
      title: "Verified+",
      description: "Mọi phòng và chủ nhà được xác thực với kiểm tra giấy tờ và ảnh 360°",
      color: "primary",
    },
    {
      icon: Users,
      title: "Kết nối phù hợp",
      description: "Tìm bạn cùng phòng phù hợp với lối sống và sở thích của bạn",
      color: "secondary",
    },
    {
      icon: RefreshCw,
      title: "SwapRoom",
      description: "Thuê linh hoạt ngắn hạn và hoán đổi phòng dễ dàng",
      color: "primary",
    },
  ];

  const testimonials = [
    {
      name: "Minh Anh",
      role: "Sinh viên Cao học",
      text: "Tìm được bạn cùng phòng hoàn hảo chỉ trong 2 ngày! Độ phù hợp cực kỳ chính xác.",
    },
    {
      name: "Tuấn Kiệt",
      role: "Nhân viên văn phòng",
      text: "Verified+ cho tôi sự yên tâm tuyệt đối. Không còn lo lừa đảo hay ảnh giả!",
    },
    {
      name: "Hương Giang",
      role: "Sinh viên Đại học",
      text: "SwapRoom cứu tôi khi cần cho thuê lại phòng trong mùa hè thực tập. Quá tiện lợi!",
    },
  ];

  const stats = [
    { label: "Phòng đã xác thực", value: "10,000+" },
    { label: "Người thuê hài lòng", value: "50,000+" },
    { label: "Đáng tin cậy & An toàn", value: "100%" },
  ];

  return (
    <div className="pb-20 md:pb-8">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-accent/50 to-background px-6 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight mb-4">
            Tìm phòng và bạn cùng phòng
            <br />
            <span className="text-primary">hoàn hảo của bạn.</span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-8">
            Phòng đã xác thực, kết nối phù hợp, thuê linh hoạt
          </p>

          {/* Search Bar */}
          <div className="bg-card rounded-2xl shadow-soft p-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-2xl mx-auto border border-border">
            <div className="flex items-center flex-1 px-4 gap-3">
              <Search className="w-5 h-5 text-muted-foreground shrink-0" />
              <Input
                placeholder="Thành phố, Trường học, hoặc Khu vực..."
                className="border-0 bg-transparent focus-visible:ring-0 px-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button
              onClick={handleSearch}
              size="lg"
              className="rounded-xl bg-primary hover:bg-primary/90 px-8 touch-target"
            >
              Tìm kiếm
            </Button>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2 justify-center mt-6 stagger-children">
            {quickFilters.map((filter, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="px-4 py-2 rounded-full bg-card border border-border text-muted-foreground text-sm cursor-pointer hover:bg-muted hover:text-foreground transition-colors"
              >
                {filter}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Buttons */}
      <section className="px-6 py-10 max-w-4xl mx-auto">
        <div className="grid sm:grid-cols-2 gap-4">
          <Button
            onClick={() => onNavigate("search")}
            size="lg"
            className="bg-primary hover:bg-primary/90 rounded-xl h-14 touch-target group"
          >
            <Search className="w-5 h-5 mr-2" />
            Tìm phòng
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button
            onClick={() => setIsPostListingOpen(true)}
            size="lg"
            variant="outline"
            className="border-2 border-primary text-primary hover:bg-primary/5 rounded-xl h-14 touch-target"
          >
            Đăng tin cho thuê
          </Button>
        </div>
      </section>

      {/* Key Features */}
      <section className="px-6 py-16 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-2xl md:text-3xl font-semibold mb-10">
            Tại sao chọn rommz?
          </h2>
          <div className="grid md:grid-cols-3 gap-6 stagger-children">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-card rounded-2xl p-6 text-center shadow-soft border border-border hover-lift cursor-pointer"
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${feature.color === "primary" ? "bg-primary/10" : "bg-secondary/10"
                    }`}
                >
                  <feature.icon
                    className={`w-7 h-7 ${feature.color === "primary" ? "text-primary" : "text-secondary"
                      }`}
                  />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Banner */}
      <section className="px-6 py-12 max-w-5xl mx-auto">
        <ServicesBanner />
      </section>

      {/* Testimonials */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <h2 className="text-center text-2xl md:text-3xl font-semibold mb-10">
          Được tin dùng bởi hàng nghìn sinh viên
        </h2>
        <div className="grid md:grid-cols-3 gap-6 stagger-children">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-card rounded-2xl p-6 shadow-soft border border-border"
            >
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                ))}
              </div>
              <p className="text-foreground/80 mb-4 text-sm leading-relaxed">
                "{testimonial.text}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary text-sm font-medium">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-6 py-12 bg-primary/5 border-y border-border">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-4 md:gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-primary hidden sm:block" />
                  <span className="text-xl md:text-2xl font-semibold text-primary">
                    {stat.value}
                  </span>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Post Listing Modal */}
      <PostListingModal
        isOpen={isPostListingOpen}
        onClose={() => setIsPostListingOpen(false)}
        onSubmit={handlePostListingSubmit}
      />
    </div>
  );
}
