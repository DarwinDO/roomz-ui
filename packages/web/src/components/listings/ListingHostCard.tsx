import type { ReactNode } from "react";
import { AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PremiumAvatar } from "@/components/ui/PremiumAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, MessageCircle } from "lucide-react";

interface ListingHostCardProps {
  name: string;
  avatarUrl?: string | null;
  isPremium?: boolean;
  isVerified?: boolean;
  roleLabel?: string;
  email?: string | null;
  trustScore?: number | null;
  onMessageClick?: () => void;
  messageLabel?: string;
  footer?: ReactNode;
}

export function ListingHostCard({
  name,
  avatarUrl,
  isPremium = false,
  isVerified = false,
  roleLabel = "Host",
  email,
  trustScore,
  onMessageClick,
  messageLabel = "Nhắn host",
  footer,
}: ListingHostCardProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="mb-3 flex items-center gap-3">
        <PremiumAvatar isPremium={isPremium} className="h-12 w-12">
          <AvatarImage src={avatarUrl || undefined} />
          <AvatarFallback>{initials || "H"}</AvatarFallback>
        </PremiumAvatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-medium">{name}</p>
            {isVerified ? (
              <Badge variant="outline" className="border-secondary text-secondary">
                <CheckCircle className="mr-1 h-3 w-3" />
                Host đã xác thực
              </Badge>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">{roleLabel}</p>
          {email ? <p className="truncate text-sm text-muted-foreground">{email}</p> : null}
        </div>
      </div>

      {typeof trustScore === "number" ? (
        <div className="mb-3 flex items-center gap-2">
          <span className="shrink-0 text-sm text-muted-foreground">Độ tin cậy</span>
          <Progress value={trustScore} className="flex-1" />
          <span className="shrink-0 text-sm">{trustScore}%</span>
        </div>
      ) : null}

      {onMessageClick ? (
        <Button
          onClick={onMessageClick}
          variant="outline"
          className="h-11 w-full rounded-xl border-border hover:bg-muted"
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          {messageLabel}
        </Button>
      ) : null}

      {footer ? <div className="mt-3 border-t border-border/50 pt-3">{footer}</div> : null}
    </div>
  );
}
