import { useState } from "react";
import {
  Building2,
  Calendar,
  Loader2,
  MoveRight,
  Shirt,
  Sparkles,
  Star,
  Truck,
  Wrench,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useMyServiceLeads, useCancelServiceLead, useRateServiceLead } from "@/hooks/useServiceLeads";
import type { ServiceLead, ServiceLeadStatus } from "@roomz/shared/types/serviceLeads";
import { formatCurrency } from "@roomz/shared/utils/format";

// ─── Helpers ────────────────────────────────────────────────────────────────

const SERVICE_LABELS: Record<string, { label: string; Icon: React.ElementType }> = {
  moving:   { label: "Chuyển phòng",    Icon: Truck },
  cleaning: { label: "Dọn dẹp",        Icon: Sparkles },
  setup:    { label: "Lắp đặt",        Icon: Wrench },
  laundry:  { label: "Giặt ủi",        Icon: Shirt },
  repair:   { label: "Sửa chữa",       Icon: Wrench },
  support:  { label: "Hỗ trợ khác",    Icon: MoveRight },
};

const STATUS_CONFIG: Record<ServiceLeadStatus, { label: string; className: string }> = {
  submitted: { label: "Đang chờ",        className: "bg-blue-100 text-blue-700" },
  assigned:  { label: "Đã gán đối tác", className: "bg-amber-100 text-amber-700" },
  confirmed: { label: "Đã xác nhận",    className: "bg-primary/10 text-primary" },
  completed: { label: "Hoàn thành",     className: "bg-green-100 text-green-700" },
  cancelled: { label: "Đã hủy",         className: "bg-muted text-muted-foreground" },
  rejected:  { label: "Từ chối",        className: "bg-red-100 text-red-700" },
};

const ACTIVE_STATUSES: ServiceLeadStatus[] = ["submitted", "assigned", "confirmed"];
const DONE_STATUSES: ServiceLeadStatus[]   = ["completed", "cancelled", "rejected"];

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110"
          aria-label={`${star} sao`}
        >
          <Star
            className={`h-6 w-6 ${
              star <= (hovered || value)
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function ServiceLeadCard({
  lead,
  onCancel,
  onRate,
}: {
  lead: ServiceLead;
  onCancel: (lead: ServiceLead) => void;
  onRate: (lead: ServiceLead) => void;
}) {
  const serviceInfo = SERVICE_LABELS[lead.service_type] ?? SERVICE_LABELS.support;
  const statusInfo  = STATUS_CONFIG[lead.status ?? "submitted"];
  const { Icon }    = serviceInfo;
  const canCancel   = lead.status === "submitted" || lead.status === "assigned";
  const canRate     = lead.status === "completed" && !lead.user_rating;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/8">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{serviceInfo.label}</p>
            {lead.partner?.name && (
              <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <Building2 className="h-3 w-3" />
                {lead.partner.name}
              </div>
            )}
          </div>
        </div>
        <Badge className={`shrink-0 rounded-full text-[11px] ${statusInfo.className}`}>
          {statusInfo.label}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {lead.preferred_date && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(lead.preferred_date)}
          </span>
        )}
        {lead.estimated_price ? (
          <span className="font-medium text-foreground">
            ~{formatCurrency(lead.estimated_price)}
          </span>
        ) : null}
        {lead.user_rating ? (
          <span className="flex items-center gap-1 text-yellow-500">
            <Star className="h-3 w-3 fill-current" />
            {lead.user_rating}/5
          </span>
        ) : null}
      </div>

      {/* Rejection reason */}
      {lead.status === "rejected" && lead.rejection_reason && (
        <p className="rounded-xl bg-destructive/5 px-3 py-2 text-xs text-destructive">
          Lý do: {lead.rejection_reason}
        </p>
      )}

      {/* Actions */}
      {(canCancel || canRate) && (
        <div className="flex gap-2 pt-1">
          {canRate && (
            <Button
              size="sm"
              className="h-8 flex-1 rounded-full text-xs"
              onClick={() => onRate(lead)}
            >
              <Star className="mr-1.5 h-3.5 w-3.5" />
              Đánh giá dịch vụ
            </Button>
          )}
          {canCancel && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 rounded-full border-destructive/25 px-3 text-xs text-destructive hover:bg-destructive/5 hover:text-destructive"
              onClick={() => onCancel(lead)}
            >
              <X className="mr-1 h-3 w-3" />
              Hủy
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyServices({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/50">
        <Wrench className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function MyServicesTab() {
  const { data: leads = [], isLoading } = useMyServiceLeads();
  const cancelMutation = useCancelServiceLead();
  const rateMutation   = useRateServiceLead();

  const [cancelTarget, setCancelTarget] = useState<ServiceLead | null>(null);
  const [rateTarget,   setRateTarget]   = useState<ServiceLead | null>(null);
  const [rating,       setRating]       = useState(0);
  const [review,       setReview]       = useState("");

  const activeLeads = leads.filter((l) => ACTIVE_STATUSES.includes(l.status as ServiceLeadStatus));
  const doneLeads   = leads.filter((l) => DONE_STATUSES.includes(l.status as ServiceLeadStatus));

  const handleCancelConfirm = () => {
    if (!cancelTarget) return;
    cancelMutation.mutate(cancelTarget.id, { onSuccess: () => setCancelTarget(null) });
  };

  const handleRateConfirm = () => {
    if (!rateTarget || rating === 0) return;
    rateMutation.mutate(
      { id: rateTarget.id, rating, review: review.trim() || undefined },
      {
        onSuccess: () => {
          setRateTarget(null);
          setRating(0);
          setReview("");
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-14">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Tabs defaultValue="active">
        <TabsList className="mb-5 rounded-full">
          <TabsTrigger value="active" className="rounded-full text-xs">
            Đang xử lý
            {activeLeads.length > 0 && (
              <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                {activeLeads.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="done" className="rounded-full text-xs">
            Lịch sử
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-3">
          {activeLeads.length === 0 ? (
            <EmptyServices label="Không có yêu cầu dịch vụ nào đang xử lý." />
          ) : (
            activeLeads.map((lead) => (
              <ServiceLeadCard
                key={lead.id}
                lead={lead}
                onCancel={setCancelTarget}
                onRate={setRateTarget}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="done" className="space-y-3">
          {doneLeads.length === 0 ? (
            <EmptyServices label="Chưa có dịch vụ nào hoàn thành hoặc đã hủy." />
          ) : (
            doneLeads.map((lead) => (
              <ServiceLeadCard
                key={lead.id}
                lead={lead}
                onCancel={setCancelTarget}
                onRate={setRateTarget}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Cancel Confirm Dialog */}
      <Dialog open={!!cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hủy yêu cầu dịch vụ?</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn hủy yêu cầu{" "}
              <span className="font-medium text-foreground">
                {SERVICE_LABELS[cancelTarget?.service_type ?? ""]?.label}
              </span>{" "}
              này không? Hành động không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setCancelTarget(null)}>
              Giữ lại
            </Button>
            <Button
              variant="destructive"
              className="rounded-full"
              disabled={cancelMutation.isPending}
              onClick={handleCancelConfirm}
            >
              {cancelMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Xác nhận hủy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rate Dialog */}
      <Dialog
        open={!!rateTarget}
        onOpenChange={(open) => {
          if (!open) {
            setRateTarget(null);
            setRating(0);
            setReview("");
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Đánh giá dịch vụ</DialogTitle>
            <DialogDescription>
              Chia sẻ trải nghiệm của bạn với{" "}
              <span className="font-medium text-foreground">
                {rateTarget?.partner?.name ?? "đối tác"}
              </span>{" "}
              để giúp cải thiện chất lượng dịch vụ.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex flex-col items-center gap-2">
              <StarRating value={rating} onChange={setRating} />
              <p className="text-xs text-muted-foreground">
                {rating === 0
                  ? "Chọn số sao"
                  : ["", "Tệ", "Không tốt", "Bình thường", "Tốt", "Xuất sắc"][rating]}
              </p>
            </div>
            <Textarea
              placeholder="Nhận xét thêm (không bắt buộc)..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="min-h-[80px] resize-none rounded-xl"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => {
                setRateTarget(null);
                setRating(0);
                setReview("");
              }}
            >
              Để sau
            </Button>
            <Button
              className="rounded-full"
              disabled={rating === 0 || rateMutation.isPending}
              onClick={handleRateConfirm}
            >
              {rateMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Gửi đánh giá
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
