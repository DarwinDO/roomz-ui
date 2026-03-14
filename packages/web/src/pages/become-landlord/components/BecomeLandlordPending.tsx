import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Home, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface BecomeLandlordPendingProps {
  submittedAt?: string | null;
}

function formatSubmittedAt(value?: string | null) {
  if (!value) {
    return 'Chưa rõ thời gian gửi';
  }

  return new Date(value).toLocaleString('vi-VN');
}

export function BecomeLandlordPending({ submittedAt }: BecomeLandlordPendingProps) {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50/50 p-4">
      <div className="w-full max-w-lg">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-6 hover:bg-white/50">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Về trang chủ
        </Button>

        <Card className="animate-scale-in border-warning/20 bg-warning/5 shadow-lg shadow-warning/5">
          <CardHeader className="pb-2 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-warning/10 ring-8 ring-warning/5">
              <Clock className="h-10 w-10 text-warning" />
            </div>
            <CardTitle className="text-2xl font-bold text-warning-foreground">Đơn host đang chờ duyệt</CardTitle>
            <CardDescription className="mt-2 text-base text-warning-foreground/80">
              RommZ đang xem xét hồ sơ host của bạn.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4 text-center">
            <div className="rounded-2xl bg-white/80 px-4 py-3 text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Đã gửi lúc</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{formatSubmittedAt(submittedAt)}</p>
            </div>

            <p className="leading-relaxed text-muted-foreground">
              RommZ sẽ phản hồi trong vòng <strong>24-48 giờ làm việc</strong>. Khi có kết quả, bạn sẽ thấy trạng thái mới trong hồ sơ và nhận thông báo phù hợp.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Button onClick={() => navigate('/')} variant="outline" className="bg-white hover:bg-gray-50">
                <Home className="mr-2 h-4 w-4" />
                Về trang chủ
              </Button>
              <Button onClick={() => navigate('/search')}>
                <Search className="mr-2 h-4 w-4" />
                Tìm phòng
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
