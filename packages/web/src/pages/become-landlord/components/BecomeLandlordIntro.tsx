import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Users, Shield, CheckCircle, ArrowLeft } from "lucide-react";

export function BecomeLandlordIntro() {
    const navigate = useNavigate();

    return (
        <div className="mb-12">
            <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="mb-6 hover:bg-white/50"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại
            </Button>

            {/* Hero Section */}
            <div className="text-center mb-12 animate-fade-in">
                <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
                    <Building2 className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Trở thành Chủ trọ trên RommZ
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
                    Đăng ký để đăng tin cho thuê phòng, quản lý khách thuê và tiếp cận hàng nghìn sinh viên đang tìm phòng.
                </p>
            </div>

            {/* Benefits */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
                <Card className="text-center border-none shadow-soft hover:shadow-soft-lg transition-all duration-300 bg-white/60 backdrop-blur-sm">
                    <CardContent className="pt-8 pb-8">
                        <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform">
                            <Users className="w-7 h-7 text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">Tiếp cận khách thuê</h3>
                        <p className="text-sm text-muted-foreground">
                            Hàng nghìn sinh viên và người đi làm trẻ đang tìm phòng mỗi ngày trên RommZ
                        </p>
                    </CardContent>
                </Card>
                <Card className="text-center border-none shadow-soft hover:shadow-soft-lg transition-all duration-300 bg-white/60 backdrop-blur-sm">
                    <CardContent className="pt-8 pb-8">
                        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform">
                            <Shield className="w-7 h-7 text-green-600" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">Xác thực uy tín</h3>
                        <p className="text-sm text-muted-foreground">
                            Tin đăng được xác thực, tăng độ tin cậy và chuyên nghiệp với khách thuê
                        </p>
                    </CardContent>
                </Card>
                <Card className="text-center border-none shadow-soft hover:shadow-soft-lg transition-all duration-300 bg-white/60 backdrop-blur-sm">
                    <CardContent className="pt-8 pb-8">
                        <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform">
                            <CheckCircle className="w-7 h-7 text-orange-600" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">Quản lý dễ dàng</h3>
                        <p className="text-sm text-muted-foreground">
                            Dashboard quản lý phòng, tin nhắn, đặt lịch và thanh toán tiện lợi
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
