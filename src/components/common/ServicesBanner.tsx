import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Truck, Gift, ArrowRight } from "lucide-react";

export function ServicesBanner() {
  const navigate = useNavigate();
  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div>
        <h2>Dịch vụ RoomZ</h2>
        <p className="text-muted-foreground">
          Làm cho việc chuyển nhà dễ dàng hơn với đối tác tin cậy của chúng tôi
        </p>
      </div>

      {/* Two Column Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Moving & Support */}
        <Card
          className="p-6 rounded-2xl shadow-sm hover:shadow-md transition-all border-border cursor-pointer group"
          onClick={() => navigate("/support-services")}
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
              <Truck className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4>Chuyển nhà dễ dàng</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Dịch vụ chuyển nhà, dọn dẹp & thiết lập
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </div>
              <Button
                variant="outline"
                className="rounded-full text-sm h-9"
                onClick={(e) => { e.stopPropagation(); navigate("/support-services"); }}
              >
                Khám phá dịch vụ
              </Button>
            </div>
          </div>
        </Card>

        {/* Local Passport */}
        <Card
          className="p-6 rounded-2xl shadow-sm hover:shadow-md transition-all border-border cursor-pointer group"
          onClick={() => navigate("/local-passport")}
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-secondary/20 transition-colors">
              <Gift className="w-7 h-7 text-secondary" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4>Thẻ ưu đãi địa phương</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ưu đãi độc quyền cho sinh viên gần bạn
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-secondary transition-colors shrink-0" />
              </div>
              <Button
                variant="outline"
                className="rounded-full text-sm h-9"
                onClick={(e) => { e.stopPropagation(); navigate("/local-passport"); }}
              >
                Xem ưu đãi
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
