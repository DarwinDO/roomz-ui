import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Crown, ShieldCheck } from "lucide-react";

interface UpgradeBannerProps {
    onUpgrade: () => void;
}

export function UpgradeBanner({ onUpgrade }: UpgradeBannerProps) {
    return (
        <div className="px-6 py-6 max-w-6xl mx-auto">
            <Card className="p-6 rounded-2xl bg-gradient-to-br from-warning/5 to-warning/10 border border-warning/20">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-warning to-warning/80 rounded-2xl flex items-center justify-center shrink-0">
                        <Crown className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                        <h3 className="mb-1">Nâng cấp lên RoomZ+</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                            Nhận ưu tiên hiển thị, phù hợp nâng cao và ưu đãi độc quyền
                        </p>
                        <ul className="space-y-1 mb-4 text-sm">
                            <li className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-primary" />
                                Ưu tiên trong kết quả tìm kiếm
                            </li>
                            <li className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-primary" />
                                Phù hợp nâng cao
                            </li>
                            <li className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-primary" />
                                Không phí đặt phòng
                            </li>
                        </ul>
                        <Button
                            onClick={onUpgrade}
                            className="bg-gradient-to-r from-warning to-warning/80 hover:from-warning/90 hover:to-warning/70 text-white rounded-xl">
                            Nâng cấp ngay - 49k/tháng
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
