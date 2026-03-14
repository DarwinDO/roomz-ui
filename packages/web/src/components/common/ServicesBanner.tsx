import { useNavigate } from 'react-router-dom';
import { ArrowRight, Gift, Sparkles, Truck } from 'lucide-react';

const serviceCards = [
  {
    title: 'Dịch vụ chuyển chỗ ở',
    description: 'Kết nối nhanh với dịch vụ chuyển nhà, dọn phòng và các hỗ trợ thiết thực sau khi chốt chỗ ở.',
    path: '/support-services',
    cta: 'Xem dịch vụ',
    icon: Truck,
    tone: 'from-sky-100 via-white to-slate-50 text-sky-700 border-sky-200/80',
  },
  {
    title: 'Ưu đãi Local Passport',
    description: 'Mở deal quanh khu vực bạn đang ở hoặc sắp chuyển tới, thay vì phải tự đi tìm từng nơi một.',
    path: '/local-passport',
    cta: 'Khám phá ưu đãi',
    icon: Gift,
    tone: 'from-amber-100 via-white to-orange-50 text-amber-700 border-amber-200/80',
  },
] as const;

export function ServicesBanner() {
  const navigate = useNavigate();

  return (
    <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="rounded-[30px] border border-slate-200 bg-slate-950 p-7 text-white shadow-[0_24px_80px_rgba(15,23,42,0.16)]">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Sống tiện hơn sau khi chốt chỗ ở</p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight">RommZ không dừng ở listing. Phần dịch vụ và ưu đãi phải giúp việc chuyển chỗ ở bớt nặng đầu hơn.</h2>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          Sau khi tìm được phòng hoặc chỗ ở ngắn hạn, user cần tiếp tục xử lý chuyển đồ, thiết lập chỗ ở và tối ưu chi phí quanh khu vực mới. Đây là phần kéo giá trị của sản phẩm ra ngoài listing page.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-slate-200">
          <Sparkles className="h-4 w-4 text-amber-400" />
          Dịch vụ, deal và bước tiếp theo nên xuất hiện đúng lúc thay vì nằm tách khỏi flow tìm chỗ ở.
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {serviceCards.map((card) => (
          <button
            key={card.title}
            type="button"
            onClick={() => navigate(card.path)}
            className="group rounded-[28px] border border-slate-200 bg-white p-6 text-left shadow-soft transition-all hover:-translate-y-1 hover:shadow-[0_20px_55px_rgba(15,23,42,0.10)]"
          >
            <div className={`inline-flex rounded-2xl border bg-gradient-to-br p-3 ${card.tone}`}>
              <card.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-5 text-xl font-semibold text-slate-950">{card.title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">{card.description}</p>
            <div className="mt-8 flex items-center justify-between rounded-[22px] bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 transition-colors group-hover:bg-slate-100">
              <span>{card.cta}</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
