import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Clock, Home, Search } from "lucide-react";

export function BecomeLandlordPending() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-lg">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/')}
                    className="mb-6 hover:bg-white/50"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Về trang chủ
                </Button>

                <Card className="border-warning/20 bg-warning/5 shadow-lg shadow-warning/5 animate-scale-in">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center mb-4 ring-8 ring-warning/5">
                            <Clock className="w-10 h-10 text-warning" />
                        </div>
                        <CardTitle className="text-2xl text-warning-foreground font-bold">
                            Đang chờ phê duyệt
                        </CardTitle>
                        <CardDescription className="text-warning-foreground/80 text-base mt-2">
                            Đơn đăng ký của bạn đang được xem xét
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center space-y-6 pt-4">
                        <p className="text-muted-foreground leading-relaxed">
                            Chúng tôi sẽ xem xét thông tin của bạn và phản hồi trong vòng <strong>24-48 giờ làm việc</strong>.
                            <br />
                            Bạn sẽ nhận được thông báo qua email khi có kết quả.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <Button onClick={() => navigate('/')} variant="outline" className="bg-white hover:bg-gray-50">
                                <Home className="w-4 h-4 mr-2" />
                                Về trang chủ
                            </Button>
                            <Button onClick={() => navigate('/search')} className="shadow-lg shadow-primary/20">
                                <Search className="w-4 h-4 mr-2" />
                                Tìm phòng
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
