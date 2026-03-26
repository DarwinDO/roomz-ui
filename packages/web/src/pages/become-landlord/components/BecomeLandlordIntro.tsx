import { Building2, CheckCircle2, Shield, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function BecomeLandlordIntro() {
  return (
    <div className="mb-10 md:mb-14">
      <div className="mb-10 text-center animate-fade-in">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[28px] bg-[image:linear-gradient(135deg,rgba(0,80,212,0.95),rgba(123,156,255,0.9))] shadow-[0_24px_50px_rgba(0,80,212,0.18)]">
          <Building2 className="h-10 w-10 text-white" />
        </div>
        <h1 className="mb-4 font-display text-balance text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
          Đăng ký làm host trên RommZ
        </h1>
        <p className="mx-auto max-w-3xl text-lg leading-8 text-slate-600">
          Bắt đầu quy trình để đăng tin, quản lý lịch xem phòng và theo dõi mọi việc trong cùng một nơi.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="rounded-[32px] border border-white/60 bg-white/90 shadow-[0_24px_50px_rgba(40,43,81,0.07)] backdrop-blur-sm">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-7 w-7 text-primary" />
            </div>
            <h3 className="mb-2 font-display text-2xl font-bold tracking-tight text-slate-900">
              Tiếp cận đúng người thuê
            </h3>
            <p className="text-base leading-7 text-slate-600">
              Kết nối với sinh viên và người đi làm trẻ đang chủ động tìm chỗ ở hoặc ở ngắn hạn mỗi ngày trên
              RommZ.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border border-white/60 bg-white/90 shadow-[0_24px_50px_rgba(40,43,81,0.07)] backdrop-blur-sm">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <Shield className="h-7 w-7 text-emerald-600" />
            </div>
            <h3 className="mb-2 font-display text-2xl font-bold tracking-tight text-slate-900">
              Tăng tín hiệu tin cậy
            </h3>
            <p className="text-base leading-7 text-slate-600">
              Quy trình rõ ràng giúp tin đăng của bạn đáng tin hơn và dễ được duyệt hơn.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border border-white/60 bg-white/90 shadow-[0_24px_50px_rgba(40,43,81,0.07)] backdrop-blur-sm">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
              <CheckCircle2 className="h-7 w-7 text-amber-600" />
            </div>
            <h3 className="mb-2 font-display text-2xl font-bold tracking-tight text-slate-900">
              Vận hành gọn hơn
            </h3>
            <p className="text-base leading-7 text-slate-600">
              Theo dõi tin đăng, lịch xem phòng và các việc cần xử lý trong một nơi dành riêng cho host.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
