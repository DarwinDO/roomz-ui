import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Building2, CheckCircle, Shield, Users } from 'lucide-react';

export function BecomeLandlordIntro() {
  const navigate = useNavigate();

  return (
    <div className="mb-12">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 rounded-full hover:bg-white/50">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Quay lại
      </Button>

      <div className="mb-12 text-center animate-fade-in">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/20">
          <Building2 className="h-10 w-10 text-white" />
        </div>
        <h1 className="mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
          Đăng ký làm host trên RommZ
        </h1>
        <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Bắt đầu quy trình để đăng tin, quản lý lịch xem phòng và theo dõi mọi việc trong cùng một nơi.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="rounded-[24px] border border-border/70 bg-white/70 shadow-soft backdrop-blur-sm transition-all duration-300 hover:shadow-soft-lg">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
              <Users className="h-7 w-7 text-blue-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Tiếp cận đúng người thuê</h3>
            <p className="text-sm text-muted-foreground">
              Kết nối với sinh viên và người đi làm trẻ đang chủ động tìm chỗ ở hoặc ở ngắn hạn mỗi ngày trên RommZ.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-[24px] border border-border/70 bg-white/70 shadow-soft backdrop-blur-sm transition-all duration-300 hover:shadow-soft-lg">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <Shield className="h-7 w-7 text-green-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Tăng tín hiệu tin cậy</h3>
            <p className="text-sm text-muted-foreground">
              Quy trình rõ ràng giúp tin đăng của bạn đáng tin hơn và dễ được duyệt hơn.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-[24px] border border-border/70 bg-white/70 shadow-soft backdrop-blur-sm transition-all duration-300 hover:shadow-soft-lg">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
              <CheckCircle className="h-7 w-7 text-orange-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Vận hành gọn hơn</h3>
            <p className="text-sm text-muted-foreground">
              Theo dõi tin đăng, lịch xem phòng và các việc cần xử lý trong một nơi dành riêng cho host.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
