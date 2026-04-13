import * as React from "react";
import { Crown } from "lucide-react";
import { Avatar } from "./avatar";
import { cn } from "./utils";

interface PremiumAvatarProps {
  isPremium?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function PremiumAvatar({ isPremium, className, children }: PremiumAvatarProps) {
  if (!isPremium) {
    return <Avatar className={className}>{children}</Avatar>;
  }

  return (
    <div className={cn("relative inline-flex shrink-0 rounded-full", className)}>
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-[inherit] motion-safe:animate-spin motion-safe:[animation-duration:4s]"
        style={{
          background: "conic-gradient(#f59e0b 0%, #fde68a 30%, #f97316 60%, #f59e0b 100%)",
        }}
      />
      <Avatar
        className={cn(
          className,
          "absolute inset-[3px] h-[calc(100%-6px)] w-[calc(100%-6px)] rounded-[inherit] border-2 border-white",
        )}
      >
        {children}
      </Avatar>
      <span
        aria-label="Rommz+ Premium"
        role="img"
        className="absolute -right-1 -top-1 z-10 flex items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-amber-400 to-orange-500"
        style={{
          width: "clamp(14px, 28%, 28px)",
          height: "clamp(14px, 28%, 28px)",
        }}
      >
        <Crown className="h-[60%] w-[60%] text-white" strokeWidth={2.25} />
      </span>
    </div>
  );
}
