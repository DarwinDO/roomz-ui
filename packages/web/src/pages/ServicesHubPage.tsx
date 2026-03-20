import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, Sparkles, MapPin } from "lucide-react";
import { SupportServicesContent } from "@/pages/SupportServicesPage";
import { LocalPassportContent } from "@/pages/LocalPassportPage";

type ServicesTab = "services" | "deals";

function normalizeTab(tab: string | null): ServicesTab {
  return tab === "deals" ? "deals" : "services";
}

export default function ServicesHubPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = normalizeTab(searchParams.get("tab"));

  const tabCopy = useMemo(
    () => ({
      services: {
        eyebrow: "Support hub",
        title: "Dịch vụ thiết thực sau khi chốt chỗ ở.",
        description:
          "Từ chuyển phòng, dọn phòng đến setup góc ở mới, RoomZ gom mọi hỗ trợ hậu thuê nhà vào một cụm rõ ràng hơn.",
      },
      deals: {
        eyebrow: "Local passport",
        title: "Ưu đãi và đối tác theo đúng khu vực bạn đang ở.",
        description:
          "Mở nhanh các deal gần bạn, xem điểm mốc nổi bật quanh khu vực và nhận voucher mà không phải tìm từng nơi một.",
      },
    }),
    [],
  );

  const handleTabChange = (nextTab: string) => {
    const normalizedTab = normalizeTab(nextTab);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("tab", normalizedTab);
    setSearchParams(nextParams, { replace: true });
  };

  const hero = tabCopy[activeTab];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5f8fb] via-[#fffdf9] to-white pb-24 md:pb-10">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <Card className="overflow-hidden border-border/70 bg-[linear-gradient(135deg,#f4f9fd_0%,#fffdf9_48%,#fff3df_100%)] p-0">
          <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="border-b border-border/70 bg-[#102131] px-6 py-7 text-white lg:border-b-0 lg:border-r">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-100">
                <Sparkles className="h-3.5 w-3.5" />
                {hero.eyebrow}
              </div>
              <h1 className="max-w-2xl font-display text-white">{hero.title}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">{hero.description}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Badge className="rounded-full bg-white/10 text-white">Trust-first UI</Badge>
                <Badge className="rounded-full bg-white/10 text-white">Đối tác xác thực</Badge>
                <Badge className="rounded-full bg-white/10 text-white">Ưu đãi theo khu vực</Badge>
              </div>
            </div>

            <div className="grid gap-4 px-6 py-6 sm:grid-cols-3 lg:grid-cols-1">
              <Card className="rounded-[24px] border-border/70 bg-card/90 p-5 shadow-soft">
                <ShieldCheck className="h-6 w-6 text-primary" />
                <p className="mt-4 text-sm font-semibold text-foreground">Dịch vụ đã sàng lọc</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Ưu tiên các đội hỗ trợ liên quan trực tiếp đến nhu cầu chuyển ở.
                </p>
              </Card>
              <Card className="rounded-[24px] border-border/70 bg-card/90 p-5 shadow-soft">
                <MapPin className="h-6 w-6 text-secondary" />
                <p className="mt-4 text-sm font-semibold text-foreground">Context theo khu vực</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Local Passport dùng landmark và vị trí để gợi ý đúng ngữ cảnh.
                </p>
              </Card>
              <Card className="rounded-[24px] border-border/70 bg-card/90 p-5 shadow-soft">
                <Sparkles className="h-6 w-6 text-warning" />
                <p className="mt-4 text-sm font-semibold text-foreground">Hub thống nhất</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Không còn tách rời dịch vụ và ưu đãi thành hai trải nghiệm đứt đoạn.
                </p>
              </Card>
            </div>
          </div>
        </Card>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="w-full max-w-xl justify-start overflow-x-auto rounded-[22px] border border-border/70 bg-card/80 p-1.5">
            <TabsTrigger value="services" className="min-w-[180px] rounded-[18px] px-5">
              Dịch vụ hỗ trợ
            </TabsTrigger>
            <TabsTrigger value="deals" className="min-w-[180px] rounded-[18px] px-5">
              Ưu đãi & đối tác
            </TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="space-y-6">
            <SupportServicesContent embedded />
          </TabsContent>

          <TabsContent value="deals" className="space-y-6">
            <LocalPassportContent embedded />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
