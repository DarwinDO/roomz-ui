import { ShieldCheck } from "lucide-react";

interface ListingSafetyCardProps {
  title?: string;
  description: string;
  tone?: "warning" | "neutral";
}

export function ListingSafetyCard({
  title = "An toàn trước khi chốt",
  description,
  tone = "warning",
}: ListingSafetyCardProps) {
  const toneClassName =
    tone === "warning"
      ? "border border-warning/20 bg-warning/5"
      : "border border-border bg-muted/50";

  return (
    <div className={`rounded-2xl p-4 ${toneClassName}`}>
      <div className="flex gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600" />
        <div>
          <p className="mb-1 text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}
