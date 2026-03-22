import { useCallback, useMemo, useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ArrowRight, CalendarDays, Plus, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LazyImage } from "@/components/common/LazyImage";
import { ApplySubletDialog } from "@/components/modals/ApplySubletDialog";
import { SwapRequestDialog } from "@/components/modals/SwapRequestDialog";
import { SubletCard, SubletFilter } from "@/components/swap";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts";
import { useMySublets, useSublets } from "@/hooks/useSublets";
import { stitchAssets } from "@/lib/stitchAssets";
import type { SubletFilters, SubletListingWithDetails } from "@roomz/shared/types/swap";
import { formatMonthlyPrice } from "@roomz/shared/utils/format";

const INITIAL_FILTERS: SubletFilters = { city: "", district: "", start_date: "", end_date: "" };
const PRICE_RANGES = [
  { label: "Tất cả mức giá", min: undefined, max: undefined },
  { label: "Dưới 3 triệu", min: 0, max: 3_000_000 },
  { label: "3 - 5 triệu", min: 3_000_000, max: 5_000_000 },
  { label: "5 - 8 triệu", min: 5_000_000, max: 8_000_000 },
  { label: "Trên 8 triệu", min: 8_000_000, max: undefined },
] as const;

type SwapTab = "browse" | "sublet" | "swap";

const fmtMove = (date?: string) =>
  date ? format(new Date(date), "dd / MM / yyyy", { locale: vi }) : "Linh hoạt";
const fmtType = (value?: string) =>
  value === "studio" ? "Studio" : value === "entire" ? "Nguyên căn" : value === "shared" ? "Phòng chung" : value === "private" ? "Phòng riêng" : "Ở ngắn hạn";

export default function SwapRoomPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SwapTab>("browse");
  const [filters, setFilters] = useState<SubletFilters>(INITIAL_FILTERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSublet, setSelectedSublet] = useState<SubletListingWithDetails | null>(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [swapOpen, setSwapOpen] = useState(false);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch } = useSublets(filters);
  const { data: mySublets, isLoading: mySubletsLoading } = useMySublets();

  const sublets = useMemo(() => data?.pages.flatMap((page) => page.sublets) || [], [data]);
  const myListings = useMemo(() => ((mySublets as unknown as SubletListingWithDetails[] | undefined) ?? []), [mySublets]);
  const visibleSublets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sublets;
    return sublets.filter((sublet) =>
      [sublet.room_title, sublet.district, sublet.city, sublet.address, sublet.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [searchQuery, sublets]);

  const featured = visibleSublets[0] ?? null;
  const side = visibleSublets[1] ?? null;
  const lowerCards = [...visibleSublets.slice(2)].sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()).slice(0, 2);
  const mySwapLead = myListings[0] ?? null;
  const swapLead = mySwapLead ?? visibleSublets[2] ?? null;
  const activePrice = PRICE_RANGES.find((range) => filters.min_price === range.min && filters.max_price === range.max) ?? PRICE_RANGES[0];

  const openApply = useCallback((sublet: SubletListingWithDetails) => {
    setSelectedSublet(sublet);
    setApplyOpen(true);
  }, []);
  const openSwap = useCallback((sublet: SubletListingWithDetails) => {
    setSelectedSublet(sublet);
    setSwapOpen(true);
  }, []);
  const updateFilters = useCallback((next: SubletFilters) => setFilters((prev) => ({ ...prev, ...next })), []);
  const updatePrice = useCallback((label: string) => {
    const range = PRICE_RANGES.find((item) => item.label === label) ?? PRICE_RANGES[0];
    setFilters((prev) => ({ ...prev, min_price: range.min, max_price: range.max }));
  }, []);

  return (
    <div lang="vi" className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-[1520px] px-4 pt-28 pb-16 sm:px-6 lg:px-8">
        <section className="mb-14 rounded-[2rem] border border-border/70 bg-surface-container-low p-6 shadow-soft md:p-8">
          <div className="flex flex-wrap gap-8 border-b border-border/50 pb-5">
            {[
              ["browse", "Ở ngắn hạn"],
              ["sublet", "Sublet"],
              ["swap", "Đổi phòng"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setActiveTab(value as SwapTab)}
                className={`pb-2 font-display text-lg ${activeTab === value ? "border-b-2 border-primary font-bold text-primary" : "font-semibold text-on-surface-variant hover:text-primary"}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-5 xl:grid-cols-[1.6fr_1fr_1fr_0.9fr] xl:items-end">
            <div className="flex flex-col gap-2">
              <label htmlFor="swap-query" className="px-1 text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">Chọn khu vực</label>
              <div className="flex h-14 items-center rounded-full bg-surface-container-lowest px-5 ring-1 ring-border/70 focus-within:ring-2 focus-within:ring-primary/20">
                <Search className="mr-3 h-4 w-4 text-outline" />
                <Input id="swap-query" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Thành phố, Quận..." className="h-auto border-0 bg-transparent px-0 shadow-none focus-visible:ring-0" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="swap-start" className="px-1 text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">Chọn ngày</label>
              <div className="grid h-14 grid-cols-2 items-center rounded-full bg-surface-container-lowest ring-1 ring-border/70 focus-within:ring-2 focus-within:ring-primary/20">
                <div className="flex items-center gap-3 border-r border-border/60 px-5">
                  <CalendarDays className="h-4 w-4 text-outline" />
                  <input id="swap-start" type="date" value={filters.start_date || ""} onChange={(e) => updateFilters({ start_date: e.target.value })} className="w-full bg-transparent text-sm font-medium text-on-surface outline-none" />
                </div>
                <div className="px-5">
                  <input type="date" value={filters.end_date || ""} onChange={(e) => updateFilters({ end_date: e.target.value })} className="w-full bg-transparent text-sm font-medium text-on-surface outline-none" />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="swap-price" className="px-1 text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">Ngân sách</label>
              <div className="h-14 rounded-full bg-surface-container-lowest px-5 ring-1 ring-border/70 focus-within:ring-2 focus-within:ring-primary/20">
                <select id="swap-price" value={activePrice.label} onChange={(e) => updatePrice(e.target.value)} className="h-full w-full bg-transparent text-sm font-medium text-on-surface outline-none">
                  {PRICE_RANGES.map((range) => <option key={range.label}>{range.label}</option>)}
                </select>
              </div>
            </div>
            <Button className="h-14 rounded-full font-display text-base font-bold shadow-lg shadow-primary/20" onClick={() => document.getElementById("swap-grid")?.scrollIntoView({ behavior: "smooth", block: "start" })}>
              Tìm kiếm ngay
            </Button>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-tertiary-container px-3 py-1.5 text-xs font-semibold text-on-tertiary-container">{visibleSublets.length} tin đang mở</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="rounded-full" onClick={() => setShowFilters((value) => !value)}>Bộ lọc nâng cao</Button>
              <Button className="rounded-full" onClick={() => navigate(user ? "/create-sublet" : "/login")}><Plus className="mr-2 h-4 w-4" />Đăng chỗ ở</Button>
            </div>
          </div>
          {showFilters ? <div className="mt-5"><SubletFilter filters={filters} onChange={updateFilters} onReset={() => { setFilters(INITIAL_FILTERS); setSearchQuery(""); }} /></div> : null}
        </section>

        {activeTab === "browse" ? (
          isLoading ? (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"><Card className="h-[420px] animate-pulse rounded-[2rem]" /><div className="grid gap-6"><Card className="h-[200px] animate-pulse rounded-[2rem]" /><Card className="h-[200px] animate-pulse rounded-[2rem]" /></div></div>
          ) : isError ? (
            <Card className="rounded-[2rem] p-10 text-center shadow-soft"><p className="mb-5 text-muted-foreground">Có lỗi khi tải dữ liệu ở ngắn hạn.</p><Button onClick={() => refetch()}>Thử lại</Button></Card>
          ) : featured ? (
            <>
              <section className="mb-20 grid grid-cols-12 gap-6" id="swap-grid">
                <article className="col-span-12 overflow-hidden rounded-[2rem] bg-surface-container-lowest shadow-soft lg:col-span-8">
                  <div className="flex h-full flex-col md:flex-row">
                    <div className="relative overflow-hidden md:w-1/2">
                      <LazyImage src={featured.images?.[0]?.image_url || stitchAssets.swap.featuredRoom} alt={featured.room_title} className="h-full min-h-[280px] w-full object-cover transition-transform duration-700 hover:scale-[1.03]" />
                      <div className="absolute left-6 top-6 flex flex-wrap gap-2">
                        <span className="rounded-full bg-tertiary-container px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-on-tertiary-container">{featured.status === "active" ? "Có thể dọn vào" : featured.status}</span>
                        <span className="rounded-full bg-white/90 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">{fmtType(featured.room_type)}</span>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col justify-between p-8 md:p-10">
                      <div>
                        <div className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">Short-stay nổi bật • {[featured.district, featured.city].filter(Boolean).join(", ")}</div>
                        <h1 className="font-display text-3xl font-extrabold leading-tight text-on-surface md:text-4xl">{featured.room_title}</h1>
                        <p className="mt-4 line-clamp-4 text-sm leading-7 text-on-surface-variant md:text-base">{featured.description || "Không gian ở ngắn hạn sẵn sàng để bạn chốt theo lịch ở, ngân sách và mức độ furnished."}</p>
                        <div className="mt-8 flex flex-wrap items-center gap-6">
                          <div><p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-outline">Giá thuê</p><p className="font-display text-2xl font-bold text-primary">{formatMonthlyPrice(featured.sublet_price)}</p></div>
                          <div className="hidden h-10 w-px bg-outline-variant/40 md:block" />
                          <div><p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-outline">Diện tích</p><p className="font-display text-2xl font-bold text-on-surface">{featured.area_sqm ? `${featured.area_sqm}m²` : "Đang cập nhật"}</p></div>
                        </div>
                      </div>
                      <div className="mt-8 flex flex-wrap gap-3">
                        <Button className="rounded-full px-6" onClick={() => navigate(`/sublet/${featured.id}`)}>Xem chi tiết căn hộ</Button>
                        <Button variant="outline" className="rounded-full px-6" onClick={() => openApply(featured)}>Đăng ký ở</Button>
                        <Button variant="secondary" className="rounded-full px-6" onClick={() => openSwap(featured)}>Hoán đổi</Button>
                      </div>
                    </div>
                  </div>
                </article>
                <div className="col-span-12 flex flex-col gap-6 lg:col-span-4">
                  <article className="relative overflow-hidden rounded-[2rem] bg-surface-container-lowest p-6 shadow-soft">
                    <div className="mb-6 overflow-hidden rounded-[1.25rem]"><LazyImage src={side?.images?.[0]?.image_url || stitchAssets.roomDetail.gallery[2]} alt={side?.room_title || "Tin nhượng phòng nổi bật"} className="h-48 w-full object-cover transition-transform duration-500 hover:scale-105" /></div>
                    <span className="absolute right-8 top-8 rounded-full bg-secondary-container px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-on-secondary-container">Nhượng phòng</span>
                    <h3 className="font-display text-xl font-bold text-on-surface">{side?.room_title || "Nhượng phòng nhanh trong tháng này"}</h3>
                    <p className="mt-2 text-sm leading-6 text-on-surface-variant">{side?.description || "Các tin nhượng phòng được gom riêng để bạn chốt nhanh chỗ ở còn hợp đồng ngắn hạn."}</p>
                    <div className="mt-5 flex items-center justify-between gap-3"><span className="text-lg font-bold text-primary">{side ? formatMonthlyPrice(side.sublet_price) : "Từ 2.8tr/tháng"}</span><span className="text-xs font-semibold text-outline">{side ? `Dọn vào: ${fmtMove(side.start_date)}` : "Ưu tiên tin có thể dọn sớm"}</span></div>
                  </article>
                  <article className="rounded-[2rem] bg-primary p-8 text-center text-on-primary shadow-soft">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white/20"><ShieldCheck className="h-8 w-8" /></div>
                    <h3 className="font-display text-xl font-bold">Giao nhận an toàn &amp; Xác thực 100%</h3>
                    <p className="mt-3 text-sm leading-6 text-on-primary/85">RommZ cam kết thông tin ở ngắn hạn rõ ràng và flow đặt cọc minh bạch cho từng tin.</p>
                  </article>
                </div>
              </section>

              <section>
                <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
                  <div><h2 className="font-display text-3xl font-extrabold text-on-surface">Cơ hội dời đến sớm</h2><p className="mt-2 text-on-surface-variant">Các phòng trống sẵn sàng đón chủ mới trong tháng tới.</p></div>
                  <button type="button" onClick={() => document.getElementById("swap-grid")?.scrollIntoView({ behavior: "smooth", block: "start" })} className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:gap-3">Xem tất cả<ArrowRight className="h-4 w-4" /></button>
                </div>
                <div className="grid gap-6 lg:grid-cols-3">
                  <article className="flex h-full flex-col justify-between rounded-[2rem] border-t-4 border-tertiary bg-surface-container-low p-8 shadow-soft">
                    <div>
                      <div className="mb-6 flex items-start justify-between gap-3"><span className="rounded-full bg-tertiary-container px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-on-tertiary-container">{mySwapLead ? "Hoán đổi" : "Cách hoạt động"}</span><span className="text-xs font-bold text-tertiary">{mySwapLead ? "Lane đang mở" : "Cần tin của bạn"}</span></div>
                      <h3 className="font-display text-xl font-bold text-on-surface">{mySwapLead ? `So khớp lịch ở cho ${fmtType(mySwapLead.room_type).toLowerCase()} tại ${[mySwapLead.district, mySwapLead.city].filter(Boolean).join(", ")}` : "Đăng một tin ngắn hạn để bật gợi ý đổi phòng"}</h3>
                      <p className="mt-4 text-sm leading-7 text-on-surface-variant">{mySwapLead ? `RommZ sẽ dùng listing của bạn để so khớp khu vực, ngày nhận phòng và mức giá với các tin ở ngắn hạn khác. Listing hiện tại đang mở từ ${fmtMove(mySwapLead.start_date)} đến ${fmtMove(mySwapLead.end_date)}.` : swapLead ? `Hiện đã có các tin đang mở ở ${[swapLead.district, swapLead.city].filter(Boolean).join(", ")}. Khi bạn có listing của riêng mình, RommZ mới bắt đầu đề xuất các cặp đổi phòng phù hợp.` : "Lane này dùng cho người đã có tin ngắn hạn của chính mình. Sau khi đăng tin, RommZ sẽ so khớp khu vực, mốc nhận phòng và ngân sách để đề xuất phương án đổi."}</p>
                    </div>
                    <div className="mt-8 space-y-5">
                      {mySwapLead ? (
                        <>
                          <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-[1.1rem] bg-surface-container-lowest p-4">
                              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-outline">Khu vực</p>
                              <p className="mt-2 text-sm font-semibold text-on-surface">{[mySwapLead.district, mySwapLead.city].filter(Boolean).join(", ") || "Đang cập nhật"}</p>
                            </div>
                            <div className="rounded-[1.1rem] bg-surface-container-lowest p-4">
                              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-outline">Ngày ở</p>
                              <p className="mt-2 text-sm font-semibold text-on-surface">{fmtMove(mySwapLead.start_date)}</p>
                            </div>
                            <div className="rounded-[1.1rem] bg-surface-container-lowest p-4">
                              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-outline">Ngân sách</p>
                              <p className="mt-2 text-sm font-semibold text-on-surface">{formatMonthlyPrice(mySwapLead.sublet_price)}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-3"><Button className="rounded-full" onClick={() => navigate(user ? "/swap-matches" : "/login")}>Xem cơ hội đổi</Button><Button variant="outline" className="rounded-full" onClick={() => navigate(user ? "/my-sublets" : "/login")}>{user ? "Quản lý tin của bạn" : "Đăng nhập để mở lane"}</Button></div>
                        </>
                      ) : (
                        <>
                          <div className="grid gap-3 sm:grid-cols-3">
                            {[
                              "1. Đăng tin ngắn hạn",
                              "2. RommZ so khớp lịch ở",
                              "3. Bạn chọn đề xuất phù hợp",
                            ].map((step) => (
                              <div key={step} className="rounded-[1.1rem] bg-surface-container-lowest p-4 text-sm font-semibold text-on-surface">
                                {step}
                              </div>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-3"><Button className="rounded-full" onClick={() => navigate(user ? "/create-sublet" : "/login")}>{user ? "Đăng tin để bắt đầu" : "Đăng nhập để bắt đầu"}</Button><Button variant="outline" className="rounded-full" onClick={() => document.getElementById("swap-grid")?.scrollIntoView({ behavior: "smooth", block: "start" })}>Xem tin đang mở</Button></div>
                        </>
                      )}
                    </div>
                  </article>
                  {lowerCards.map((sublet, index) => (
                    <article key={sublet.id} className="rounded-[2rem] bg-surface-container-lowest p-8 shadow-soft">
                      <div className="mb-6 flex items-center gap-3">
                        <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-200"><LazyImage src={sublet.owner_avatar || stitchAssets.swap.moveInAvatars[index % stitchAssets.swap.moveInAvatars.length]} alt={sublet.owner_name} className="h-full w-full object-cover" /></div>
                        <div><p className="text-sm font-bold text-on-surface">{sublet.owner_name}</p><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">{sublet.owner_verified ? "Host xác thực" : "Chủ phòng"}</p></div>
                      </div>
                      <h3 className="font-display text-lg font-bold text-on-surface">{sublet.room_title}</h3>
                      <p className="mt-2 text-sm leading-6 text-on-surface-variant">{sublet.description || "Tin đã sẵn sàng để bạn so ngày ở, mức giá và mức độ furnished trước khi chốt."}</p>
                      <div className="mt-6 rounded-[1.25rem] bg-surface-container-low p-4"><p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-outline">Ngày dời đến</p><p className="font-display text-base font-bold text-on-surface">{fmtMove(sublet.start_date)}</p></div>
                      <div className="mt-6 flex gap-3"><span className="flex-1 rounded-full bg-tertiary-container py-3 text-center text-xs font-bold text-on-tertiary-container">Verified</span><span className={`flex-1 rounded-full py-3 text-center text-xs font-bold ${index === 0 ? "bg-secondary-container text-on-secondary-container" : "bg-surface-container-highest text-on-surface-variant"}`}>{index === 0 ? "New" : "Phổ biến"}</span></div>
                    </article>
                  ))}
                </div>
                <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{visibleSublets.slice(0, 6).map((sublet) => <SubletCard key={sublet.id} sublet={sublet} onApply={openApply} onSwapRequest={openSwap} />)}</div>
                {hasNextPage ? <div className="mt-8 text-center"><Button variant="outline" className="rounded-full" onClick={() => { if (!isFetchingNextPage) fetchNextPage(); }} disabled={isFetchingNextPage}>{isFetchingNextPage ? "Đang tải..." : "Tải thêm tin"}</Button></div> : null}
              </section>
            </>
          ) : (
            <Card className="rounded-[2rem] p-12 text-center shadow-soft"><p className="mx-auto max-w-lg text-muted-foreground">Chưa có tin ở ngắn hạn phù hợp với tìm kiếm hoặc bộ lọc hiện tại.</p></Card>
          )
        ) : null}

        {activeTab === "sublet" ? (
          <section className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div><h2 className="font-display text-3xl font-extrabold text-on-surface">Sublet của bạn</h2><p className="mt-2 text-on-surface-variant">{user ? "Quản lý listing đã đăng và giữ nhịp short-stay trong cùng một hub." : "Đăng nhập để tạo listing, nhận đơn quan tâm và quản lý lịch ở ngắn hạn."}</p></div>
              <div className="flex flex-wrap gap-3"><Button className="rounded-full" onClick={() => navigate(user ? "/create-sublet" : "/login")}><Plus className="mr-2 h-4 w-4" />{user ? "Đăng listing mới" : "Đăng nhập để đăng tin"}</Button><Button variant="outline" className="rounded-full" onClick={() => navigate(user ? "/my-sublets" : "/login")}>Quản lý tin</Button></div>
            </div>
            {!user ? <Card className="rounded-[2rem] bg-surface-container-low p-10 shadow-soft"><h3 className="font-display text-2xl font-bold text-on-surface">Bạn cần đăng nhập để mở lane Sublet.</h3><p className="mt-3 max-w-2xl text-on-surface-variant">Sau khi đăng nhập, RommZ sẽ giữ toàn bộ flow đăng tin, sửa tin và theo dõi đơn quan tâm ngay trong route này.</p></Card> : mySubletsLoading ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 3 }).map((_, index) => <Card key={index} className="h-[320px] animate-pulse rounded-[2rem]" />)}</div> : myListings.length > 0 ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{myListings.map((sublet) => <SubletCard key={sublet.id} sublet={sublet} />)}</div> : <Card className="rounded-[2rem] border border-dashed border-border/70 p-12 text-center shadow-soft"><p className="mx-auto max-w-lg text-muted-foreground">Bạn chưa có listing nào. Tạo listing đầu tiên để mở flow sublet và nhận đơn quan tâm.</p></Card>}
          </section>
        ) : null}

        {activeTab === "swap" ? (
          <section className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div><h2 className="font-display text-3xl font-extrabold text-on-surface">Đổi phòng theo lịch ở</h2><p className="mt-2 text-on-surface-variant">Xem cơ hội đổi chỗ ở khi bạn muốn đổi khu vực hoặc chuyển mốc nhận phòng mà không rời lane short-stay.</p></div>
              <div className="flex flex-wrap gap-3"><Button className="rounded-full" onClick={() => navigate(user ? "/swap-matches" : "/login")}>Xem gợi ý đổi phòng</Button><Button variant="outline" className="rounded-full" onClick={() => navigate(user ? "/swap-requests" : "/login")}>Yêu cầu của tôi</Button></div>
            </div>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
              <Card className="rounded-[2rem] bg-surface-container-low p-8 shadow-soft"><div className="flex h-full flex-col justify-between gap-6"><div><div className="mb-4 inline-flex rounded-full bg-tertiary-container px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-on-tertiary-container">Đổi phòng</div><h3 className="font-display text-3xl font-bold text-on-surface">{swapLead ? `Hoán đổi từ ${[swapLead.district, swapLead.city].filter(Boolean).join(", ")} sang nhịp ở khác` : "Bạn cần một listing trước khi bắt đầu đổi phòng"}</h3><p className="mt-4 text-sm leading-7 text-on-surface-variant">{swapLead ? "RommZ sẽ so trùng khu vực, mức giá và thời gian ở giữa listing của bạn với các listing short-stay khác để tạo cơ hội hoán đổi nhanh hơn." : "Khi đã có listing, route này sẽ hiển thị các match phù hợp nhất, yêu cầu chờ phản hồi và tiến trình hoán đổi."}</p></div><div className="flex flex-wrap gap-3"><Button className="rounded-full" onClick={() => navigate(user ? "/swap-matches" : "/login")}>Xem match</Button><Button variant="outline" className="rounded-full" onClick={() => navigate(user ? "/create-sublet" : "/login")}>{user ? "Tạo listing để đổi" : "Đăng nhập để bắt đầu"}</Button></div></div></Card>
              <Card className="rounded-[2rem] bg-surface-container-lowest p-8 shadow-soft"><div className="mb-4 flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary"><RefreshCw className="h-5 w-5" /></div><div><p className="font-display text-lg font-bold text-on-surface">Điều gì sẽ mở ở phase sau</p><p className="text-sm text-on-surface-variant">Tin nhắn, lịch hẹn và flow đổi nâng cao</p></div></div><ul className="space-y-3 text-sm leading-6 text-on-surface-variant"><li>• Yêu cầu đổi phòng đến / đi</li><li>• Match theo khu vực và ngày nhận phòng</li><li>• Quản lý lịch đổi và follow-up</li></ul></Card>
            </div>
          </section>
        ) : null}
      </div>

      <ApplySubletDialog sublet={selectedSublet} isOpen={applyOpen} onClose={() => setApplyOpen(false)} />
      <SwapRequestDialog targetSublet={selectedSublet} isOpen={swapOpen} onClose={() => setSwapOpen(false)} />
    </div>
  );
}
