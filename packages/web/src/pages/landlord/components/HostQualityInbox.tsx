import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, CheckCircle2, Pencil, ShieldAlert } from "lucide-react";
import type { RoomWithDetails } from "@/services/rooms";

interface HostQualityInboxProps {
  pendingRooms: RoomWithDetails[];
  rejectedRooms: RoomWithDetails[];
}

interface HostListingIssue {
  id: string;
  title: string;
  address: string;
  status: "pending" | "rejected";
  note: string;
}

function buildIssues(pendingRooms: RoomWithDetails[], rejectedRooms: RoomWithDetails[]): HostListingIssue[] {
  const pendingIssues = pendingRooms.map((room) => ({
    id: room.id,
    title: room.title,
    address: room.address,
    status: "pending" as const,
    note: "Tin đang chờ duyệt. Nếu đã quá 24 giờ, hãy kiểm tra lại ảnh, địa chỉ và mức giá để tránh phải sửa ở vòng sau.",
  }));

  const rejectedIssues = rejectedRooms.map((room) => ({
    id: room.id,
    title: room.title,
    address: room.address,
    status: "rejected" as const,
    note: room.rejection_reason?.trim() || "Tin cần chỉnh sửa trước khi gửi lại để duyệt.",
  }));

  return [...rejectedIssues, ...pendingIssues];
}

export function HostQualityInbox({ pendingRooms, rejectedRooms }: HostQualityInboxProps) {
  const navigate = useNavigate();
  const issues = buildIssues(pendingRooms, rejectedRooms);

  if (issues.length === 0) {
    return (
      <Card className="mb-6 rounded-[28px] border border-emerald-100 bg-emerald-50/70 shadow-soft">
        <CardContent className="flex flex-col gap-3 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Tin đăng ổn định</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">Không có tin nào cần chỉnh ngay</h2>
              <p className="mt-1 text-sm text-slate-600">
                Các tin hiện không có cảnh báo duyệt. Bạn có thể tiếp tục theo dõi booking và hiệu quả tin đăng.
              </p>
            </div>
          </div>
          <Button variant="outline" className="rounded-xl" onClick={() => navigate("/post-room")}>
            Đăng phòng mới
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
      <Card className="mb-6 rounded-[28px] border border-amber-200 bg-amber-50/50 shadow-soft">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-600">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">Cần xử lý sớm</p>
              <CardTitle className="mt-1 text-xl text-slate-950">{issues.length} tin cần bạn kiểm tra lại</CardTitle>
              <p className="mt-2 text-sm text-slate-600">
                Ưu tiên các tin bị từ chối trước. Tin chờ duyệt quá lâu cũng nên rà lại để tránh mất thêm một vòng duyệt.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="rounded-full border-amber-300 bg-white px-3 py-1 text-amber-700">
              {rejectedRooms.length} cần sửa
            </Badge>
            <Badge variant="outline" className="rounded-full border-sky-300 bg-white px-3 py-1 text-sky-700">
              {pendingRooms.length} chờ duyệt
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {issues.slice(0, 4).map((issue) => (
          <div key={issue.id} className="rounded-[24px] border border-white bg-white/90 p-4 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-950">{issue.title}</p>
                  <Badge
                    variant="outline"
                    className={
                      issue.status === "rejected"
                        ? "rounded-full border-destructive/20 bg-destructive/10 text-destructive"
                        : "rounded-full border-warning/20 bg-warning/10 text-warning"
                    }
                  >
                    {issue.status === "rejected" ? "Cần chỉnh sửa" : "Đang chờ duyệt"}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-slate-500">{issue.address}</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">{issue.note}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" className="rounded-xl" onClick={() => navigate(`/room/${issue.id}`)}>
                  Xem tin
                </Button>
                <Button className="rounded-xl" onClick={() => navigate(`/post-room?edit=${issue.id}`)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Chỉnh tin
                </Button>
              </div>
            </div>
          </div>
        ))}

        {issues.length > 4 ? (
          <Button variant="ghost" className="rounded-xl px-2 text-sm text-primary" onClick={() => navigate("/host?tab=my-rooms")}>
            Xem toàn bộ tin cần xử lý
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
