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
              Find your perfect room
              <br />
              and roommate.
            </h1>
            <p className="text-gray-600 text-lg">
              Verified rooms, compatible matches, flexible subletting
            </p>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-full shadow-lg p-2 flex items-center gap-2 max-w-2xl mx-auto">
            <Search className="w-5 h-5 text-gray-400 ml-4" />
            <Input
              placeholder="City, University, or Neighborhood..."
              className="border-0 bg-transparent focus-visible:ring-0"
            />
            <Button
              onClick={() => onNavigate("search")}
              className="rounded-full bg-primary hover:bg-primary/90 px-8"
            >
              Search
            </Button>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            <Badge variant="secondary" className="bg-white hover:bg-gray-50 cursor-pointer">
              Verified Only
            </Badge>
            <Badge variant="secondary" className="bg-white hover:bg-gray-50 cursor-pointer">
              $500-$1000
            </Badge>
            <Badge variant="secondary" className="bg-white hover:bg-gray-50 cursor-pointer">
              Private Room
            </Badge>
            <Badge variant="secondary" className="bg-white hover:bg-gray-50 cursor-pointer">
              Pet Friendly
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
            Find a Room
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-2 border-primary text-primary hover:bg-primary/5 rounded-2xl h-14"
          >
            List a Room
          </Button>
        </div>
      </div>

      {/* Key Features */}
      <div className="px-6 py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-center mb-8">Why choose RoomZ?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-primary" />
              </div>
              <h3 className="mb-2">Verified+</h3>
              <p className="text-gray-600 text-sm">
                Every room and landlord verified with ID checks and 360° photos
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
              <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-secondary" />
              </div>
              <h3 className="mb-2">Compatibility Match</h3>
              <p className="text-gray-600 text-sm">
                Find roommates who match your lifestyle and preferences
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="w-7 h-7 text-primary" />
              </div>
              <h3 className="mb-2">SwapRoom</h3>
              <p className="text-gray-600 text-sm">
                Flexible subletting for short-term stays and room swaps
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
        <h2 className="text-center mb-8">Trusted by thousands of students</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              name: "Sarah Chen",
              role: "Graduate Student",
              text: "Found my perfect roommate in just 2 days! The compatibility match is incredibly accurate.",
            },
            {
              name: "Marcus Johnson",
              role: "Young Professional",
              text: "Verified+ gave me peace of mind. No more scam listings or fake photos!",
            },
            {
              name: "Emily Rodriguez",
              role: "Undergraduate",
              text: "SwapRoom saved me when I needed to sublet for summer internship. So convenient!",
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
              <span className="text-sm">10,000+ Verified Rooms</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span className="text-sm">50,000+ Happy Renters</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span className="text-sm">Trusted & Safe</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
