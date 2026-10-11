import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type BadgeProps = {
  children: ReactNode;
  variant?: "default" | "muted" | "accent";
  className?: string;
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full truncate rounded-full px-2 py-0.5 text-[10px] font-medium leading-tight",
        variant === "default" && "bg-primary text-primary-foreground",
        variant === "muted" && "bg-muted text-muted-foreground",
        variant === "accent" && "bg-primary text-primary-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}
