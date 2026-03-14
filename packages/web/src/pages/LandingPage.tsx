import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarRange,
  Compass,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ServicesBanner } from '@/components/common/ServicesBanner';

type EntryLane = {
  title: string;
  eyebrow: string;
  description: string;
  actionLabel: string;
  path: string;
  icon: typeof Search;
  tone: string;
  featured?: boolean;
};

const entryLanes: EntryLane[] = [
  {
    title: 'Tìm phòng',
    eyebrow: 'Core demand',
    description: 'Vào thẳng listing đã xác thực, location context và bộ lọc đủ rõ để quyết định nhanh hơn.',
    actionLabel: 'Mở kết quả tìm phòng',
    path: '/search',
    icon: Search,
    tone: 'from-sky-500/12 via-sky-100 to-white text-sky-700 border-sky-200/80',
    featured: true,
  },
  {
    title: 'Tìm bạn cùng phòng',
    eyebrow: 'Matching',
    description: 'Xem độ phù hợp, confidence và tín hiệu sống chung trước khi nhắn tin.',
    actionLabel: 'Tìm người phù hợp',
    path: '/roommates',
    icon: Users,
    tone: 'from-emerald-500/12 via-emerald-100 to-white text-emerald-700 border-emerald-200/80',
  },
  {
    title: 'Ở ngắn hạn',
    eyebrow: 'Short-stay',
    description: 'Tìm chỗ ở linh hoạt cho thực tập, nghỉ hè, chuyển chỗ hoặc thuê lại ngắn hạn.',
    actionLabel: 'Xem chỗ ở ngắn hạn',
    path: '/swap',
    icon: CalendarRange,
    tone: 'from-amber-500/12 via-amber-100 to-white text-amber-700 border-amber-200/80',
  },
  {
    title: 'Đăng ký làm host',
    eyebrow: 'Supply side',
    description: 'Đưa listing lên nhanh hơn, theo dõi booking và xử lý quality issue trong một host console rõ ràng.',
    actionLabel: 'Mở đăng ký host',
    path: '/become-host',
    icon: Building2,
    tone: 'from-rose-500/12 via-rose-100 to-white text-rose-700 border-rose-200/80',
  },
] as const;

const trustSignals = [
  {
    title: 'Phòng đã xác thực',
    description: 'Ưu tiên listing có ảnh rõ, thông tin đủ và tín hiệu tin cậy tốt hơn.',
    icon: ShieldCheck,
  },
  {
    title: 'Ghép ở hợp lý hơn',
    description: 'Roommate matching dùng khu vực, ngân sách, thời gian chuyển vào và confidence dữ liệu.',
    icon: Users,
  },
  {
    title: 'Sống tiện hơn quanh trường',
    description: 'Ưu đãi, dịch vụ và location context được kéo sát vào nhu cầu ở thực tế.',
    icon: Compass,
  },
] as const;

const locationShortcuts = [
  'Bách Khoa Hà Nội',
  'Cầu Giấy',
  'Mỹ Đình',
  'Bình Thạnh',
  'Làng Đại học',
  'Liên Chiểu',
] as const;

const ecosystemNotes = [
  {
    title: 'Tìm phòng',
    description: 'Listing dài hạn đã xác thực, location context và host trust trong cùng một flow.',
  },
  {
    title: 'Tìm bạn cùng phòng',
    description: 'Không chỉ là phần trăm phù hợp, mà còn có confidence và điều cần hỏi kỹ trước khi ở cùng.',
  },
  {
    title: 'Ở ngắn hạn',
    description: 'Thuê lại ngắn hạn là trục chính; hoán đổi là nhánh phụ trợ khi thật sự hợp ngữ cảnh.',
  },
  {
    title: 'ROMI + Local Passport',
    description: 'Assistant, deal và dịch vụ cùng kéo user sang bước tiếp theo thay vì dừng ở chat hoặc card tĩnh.',
  },
] as const;

export default function LandingPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const quickFilters = useMemo(
    () => ['Phòng đã xác thực', 'Quanh trường', 'Ngân sách rõ ràng', 'Ở ngắn hạn linh hoạt'],
    [],
  );

  const handleSearch = () => {
    const query = searchQuery.trim();
    navigate(query ? `/search?q=${encodeURIComponent(query)}` : '/search');
  };

  const featuredLane = entryLanes.find((lane) => lane.featured) ?? entryLanes[0];
  const secondaryLanes = entryLanes.filter((lane) => !lane.featured);
  const featuredTone = featuredLane.tone.split(' ').slice(0, 3).join(' ');

  return (
    <div className="bg-[linear-gradient(180deg,#f7fbff_0%,#fffdf8_42%,#ffffff_100%)] pb-20 md:pb-8">
      <section className="relative overflow-hidden border-b border-border px-6 pb-14 pt-16 md:pb-20 md:pt-20">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(249,115,22,0.14),_transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(255,255,255,0.72)_55%,rgba(255,255,255,0)_100%)]" />
        <div className="relative mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div className="max-w-3xl">
              <Badge className="mb-5 rounded-full border border-slate-200 bg-white/90 px-4 py-1.5 text-slate-700 shadow-sm">
                <Sparkles className="mr-2 h-3.5 w-3.5 text-amber-500" />
                Tìm phòng đã xác thực. Ghép ở phù hợp. Ở ngắn hạn linh hoạt.
              </Badge>

              <p className="text-xs font-semibold uppercase tracking-[0.38em] text-slate-500">RommZ housing system</p>
              <h1 className="mt-4 max-w-4xl text-5xl font-semibold leading-[0.96] tracking-[-0.06em] text-slate-950 md:text-7xl">
                Bắt đầu từ <span className="text-primary">đúng nhu cầu ở</span>, thay vì đi lạc giữa quá nhiều module.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 md:text-xl">
                Một điểm vào rõ ràng cho tìm phòng, roommate matching, ở ngắn hạn, host console và dịch vụ quanh khu vực bạn thực sự quan tâm.
              </p>

              <div className="mt-8 flex flex-col gap-3 rounded-[28px] border border-slate-200 bg-white/90 p-3 shadow-[0_22px_70px_rgba(15,23,42,0.08)] sm:flex-row sm:items-center">
                <div className="flex flex-1 items-center gap-3 px-3">
                  <Search className="h-5 w-5 shrink-0 text-slate-400" />
                  <Input
                    placeholder="Khu vực, trường học hoặc địa điểm bạn muốn ở..."
                    className="border-0 bg-transparent px-0 text-base focus-visible:ring-0"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
                  />
                </div>
                <Button onClick={handleSearch} size="lg" className="rounded-2xl px-8">
                  Tìm phòng ngay
                </Button>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {quickFilters.map((filter) => (
                  <Badge key={filter} variant="secondary" className="rounded-full px-3 py-1 text-xs">
                    {filter}
                  </Badge>
                ))}
              </div>

              <div className="mt-10 grid gap-3 md:max-w-2xl md:grid-cols-[1.2fr_0.8fr]">
                <Button size="lg" className="h-12 rounded-2xl px-6" onClick={() => navigate('/search')}>
                  Tìm phòng
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="h-12 rounded-2xl px-6" onClick={() => navigate('/roommates')}>
                  Tìm bạn cùng phòng
                </Button>
              </div>
            </div>

            <div className="grid gap-4 lg:pt-6">
              <button
                type="button"
                onClick={() => navigate(featuredLane.path)}
                className="group relative overflow-hidden rounded-[32px] border border-slate-200 bg-white/95 p-6 text-left shadow-[0_28px_80px_rgba(15,23,42,0.08)] transition-all hover:-translate-y-1 hover:shadow-[0_32px_90px_rgba(37,99,235,0.14)]"
              >
                <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${featuredTone}`} />
                <div className="flex items-start justify-between gap-4">
                  <div className="max-w-md">
                    <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">{featuredLane.eyebrow}</p>
                    <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{featuredLane.title}</h2>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{featuredLane.description}</p>
                  </div>
                  <div className={`inline-flex rounded-2xl border bg-gradient-to-br p-3 ${featuredLane.tone}`}>
                    <featuredLane.icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-8 flex items-center justify-between rounded-[24px] bg-slate-950 px-4 py-4 text-white">
                  <div>
                    <p className="text-sm font-medium">Đi thẳng vào kết quả phù hợp hơn</p>
                    <p className="mt-1 text-xs text-slate-300">Search, location context và action tiếp theo nằm trong cùng một flow.</p>
                  </div>
                  <ArrowRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1" />
                </div>
              </button>

              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-3">
                {secondaryLanes.map((lane) => (
                  <button
                    key={lane.title}
                    type="button"
                    onClick={() => navigate(lane.path)}
                    className="group rounded-[28px] border border-slate-200 bg-white/92 p-5 text-left shadow-[0_16px_45px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-1 hover:border-slate-300"
                  >
                    <div className={`inline-flex rounded-2xl border bg-gradient-to-br p-3 ${lane.tone}`}>
                      <lane.icon className="h-5 w-5" />
                    </div>
                    <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-500">{lane.eyebrow}</p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-950">{lane.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{lane.description}</p>
                    <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary">
                      {lane.actionLabel}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14 md:py-16">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[34px] border border-slate-200 bg-slate-950 p-7 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-slate-400">Vì sao RommZ</p>
            <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">
              Không chỉ là một website listing, mà là một hệ quyết định chỗ ở rõ hơn cho cả người tìm phòng và host.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
              Cùng một hệ thiết kế cho tìm phòng, roommate, ở ngắn hạn, location context, ưu đãi và ROMI. User không bị ném qua nhiều module rời rạc; host cũng không bị kẹt trong dashboard nửa vời.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {trustSignals.map((signal) => (
                <div key={signal.title} className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <div className="inline-flex rounded-2xl bg-white/10 p-3 text-white">
                    <signal.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-white">{signal.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{signal.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[30px] border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-6 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-700">Điểm vào theo khu vực</p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Người dùng nghĩ theo trường, quận và bến xe trước khi nghĩ theo route.</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Landing cần cho phép vào thẳng đúng ngữ cảnh. Bách Khoa, Mỹ Đình, Cầu Giấy hay Bình Thạnh không nên bị vùi trong search box trống.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {locationShortcuts.map((shortcut) => (
                  <button
                    key={shortcut}
                    type="button"
                    onClick={() => navigate(`/search?q=${encodeURIComponent(shortcut)}`)}
                    className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-amber-300 hover:bg-amber-100/60"
                  >
                    <MapPin className="h-4 w-4 text-amber-600" />
                    {shortcut}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[30px] border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-white p-6 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">Host lane</p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Host không chỉ là một role. Đây là một console vận hành riêng.</h3>
              <div className="mt-5 space-y-3 text-sm leading-6 text-slate-600">
                <div className="flex items-start gap-3 rounded-2xl bg-white p-4">
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>Quy trình đăng ký host rõ ràng, theo dõi trạng thái duyệt và tách khỏi hồ sơ user thường.</span>
                </div>
                <div className="flex items-start gap-3 rounded-2xl bg-white p-4">
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>Listing quality inbox, booking flow và cảnh báo moderation cùng nằm trong một console nhất quán.</span>
                </div>
              </div>
              <Button className="mt-6 rounded-2xl px-6" onClick={() => navigate('/become-host')}>
                Đăng ký làm host
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-[linear-gradient(180deg,#fffdf8_0%,#ffffff_100%)] px-6 py-14 md:py-16">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[30px] border border-slate-200 bg-white p-7 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Hệ sản phẩm RommZ</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">Một hệ trải nghiệm thống nhất thay vì nhiều module vá nối với nhau.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Tìm phòng, ghép ở, ở ngắn hạn, deal, location context và ROMI cần được cảm nhận như một sản phẩm duy nhất. Đó là cách tăng trust tốt hơn là thêm nhiều tính năng rời rạc.
            </p>
            <Button variant="outline" className="mt-6 rounded-2xl px-6" onClick={() => navigate('/search')}>
              Đi từ tìm phòng
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {ecosystemNotes.map((note, index) => (
              <div
                key={note.title}
                className={`rounded-[28px] border p-5 shadow-soft ${index % 2 === 0 ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50'}`}
              >
                <p className="text-sm font-semibold text-slate-950">{note.title}</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">{note.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <ServicesBanner />
      </section>
    </div>
  );
}
