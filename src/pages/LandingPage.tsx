import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Shield, Users, RefreshCw, Star, CheckCircle } from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { ServicesBanner } from "@/components/common/ServicesBanner";

export default function LandingPage() {
  const navigate = useNavigate();

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
  return (
    <div className="pb-20 md:pb-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/5 to-secondary/5 px-6 py-12 md:py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl mb-4">
              Tìm phòng và bạn cùng phòng
              <br />
              hoàn hảo của bạn.
            </h1>
            <p className="text-gray-600 text-lg">
              Phòng đã xác thực, kết nối phù hợp, thuê linh hoạt
            </p>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-full shadow-lg p-2 flex items-center gap-2 max-w-2xl mx-auto">
            <Search className="w-5 h-5 text-gray-400 ml-4" />
            <Input
              placeholder="Thành phố, Trường học, hoặc Khu vực..."
              className="border-0 bg-transparent focus-visible:ring-0"
            />
            <Button
              onClick={() => onNavigate("search")}
              className="rounded-full bg-primary hover:bg-primary/90 px-8"
            >
              Tìm kiếm
            </Button>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-3 justify-center mt-4">
            <Badge variant="secondary" className="px-3 py-1 rounded-full bg-slate-100/90 border border-slate-200 text-slate-700 text-xs font-medium shadow-sm dark:bg-slate-800/70 dark:border-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-200/90 dark:hover:bg-slate-700/90">
              Chỉ phòng đã xác thực
            </Badge>
            <Badge variant="secondary" className="px-3 py-1 rounded-full bg-slate-100/90 border border-slate-200 text-slate-700 text-xs font-medium shadow-sm dark:bg-slate-800/70 dark:border-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-200/90 dark:hover:bg-slate-700/90">
              2-4 triệu
            </Badge>
            <Badge variant="secondary" className="px-3 py-1 rounded-full bg-slate-100/90 border border-slate-200 text-slate-700 text-xs font-medium shadow-sm dark:bg-slate-800/70 dark:border-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-200/90 dark:hover:bg-slate-700/90">
              Phòng riêng
            </Badge>
            <Badge variant="secondary" className="px-3 py-1 rounded-full bg-slate-100/90 border border-slate-200 text-slate-700 text-xs font-medium shadow-sm dark:bg-slate-800/70 dark:border-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-200/90 dark:hover:bg-slate-700/90">
              Cho phép thú cưng
            </Badge>
          </div>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="px-6 py-8 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-4">
          <Button
            onClick={() => onNavigate("search")}
            size="lg"
            className="bg-primary hover:bg-primary/90 rounded-2xl h-14"
          >
            <Search className="w-5 h-5 mr-2" />
            Tìm phòng
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-2 border-primary text-primary hover:bg-primary/5 rounded-2xl h-14"
          >
            Đăng tin cho thuê
          </Button>
        </div>
      </div>

      {/* Key Features */}
      <div className="px-6 py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-center mb-8">Tại sao chọn RoomZ?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-primary" />
              </div>
              <h3 className="mb-2">Verified+</h3>
              <p className="text-gray-600 text-sm">
                Mọi phòng và chủ nhà được xác thực với kiểm tra giấy tờ và ảnh 360°
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
              <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-secondary" />
              </div>
              <h3 className="mb-2">Kết nối phù hợp</h3>
              <p className="text-gray-600 text-sm">
                Tìm bạn cùng phòng phù hợp với lối sống và sở thích của bạn
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="w-7 h-7 text-primary" />
              </div>
              <h3 className="mb-2">SwapRoom</h3>
              <p className="text-gray-600 text-sm">
                Thuê linh hoạt ngắn hạn và hoán đổi phòng dễ dàng
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Services Banner */}
      <div className="px-6 py-12 max-w-6xl mx-auto">
        <ServicesBanner onNavigate={onNavigate} />
      </div>

      {/* Testimonials */}
      <div className="px-6 py-12 max-w-6xl mx-auto">
        <h2 className="text-center mb-8">Được tin dùng bởi hàng nghìn sinh viên</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
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
          ].map((testimonial, index) => (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-4 text-sm">{testimonial.text}</p>
              <div>
                <p className="text-sm">{testimonial.name}</p>
                <p className="text-xs text-gray-500">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trust Badges */}
      <div className="px-6 py-8 bg-primary/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-8">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span className="text-sm">10,000+ Phòng đã xác thực</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span className="text-sm">50,000+ Người thuê hài lòng</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span className="text-sm">Đáng tin cậy & An toàn</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
