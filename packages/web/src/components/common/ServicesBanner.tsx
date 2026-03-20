import { useNavigate } from 'react-router-dom';
import { ArrowRight, Gift, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';

const serviceCards = [
  {
    title: 'Dịch vụ chuyển chỗ ở',
    description: 'Kết nối nhanh với dịch vụ chuyển nhà, dọn phòng và các hỗ trợ thiết thực sau khi chốt chỗ ở.',
    path: '/services?tab=services',
    cta: 'Xem dịch vụ',
    icon: Truck,
    tone: 'from-sky-100 via-white to-slate-50 text-sky-700 border-sky-200/80',
  },
  {
    title: 'Ưu đãi Local Passport',
    description: 'Mở deal quanh khu vực bạn đang ở hoặc sắp chuyển tới, thay vì phải tự đi tìm từng nơi một.',
    path: '/services?tab=deals',
    cta: 'Khám phá ưu đãi',
    icon: Gift,
    tone: 'from-amber-100 via-white to-orange-50 text-amber-700 border-amber-200/80',
  },
] as const;

export function ServicesBanner() {
  const navigate = useNavigate();

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Dịch vụ quanh nơi ở</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Chuyển đồ, dọn phòng và ưu đãi gần bạn.
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Mở nhanh các dịch vụ và ưu đãi thực sự cần sau khi chốt chỗ ở.
          </p>
        </div>
        <Button variant="outline" className="rounded-2xl px-5" onClick={() => navigate('/services')}>
          Xem tất cả
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {serviceCards.map((card) => (
          <button
            key={card.title}
            type="button"
            onClick={() => navigate(card.path)}
            className="group cursor-pointer rounded-[24px] border border-slate-200 bg-white p-5 text-left shadow-none transition-colors hover:border-slate-300"
          >
            <div className={`inline-flex rounded-2xl border bg-gradient-to-br p-3 ${card.tone}`}>
              <card.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-950">{card.title}</h3>
            <p className="mt-2 text-sm leading-7 text-slate-600">{card.description}</p>
            <div className="mt-6 flex items-center justify-between text-sm font-medium text-slate-800">
              <span>{card.cta}</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
