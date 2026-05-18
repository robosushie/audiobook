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
        "inline-flex max-w-full truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium leading-tight",
        variant === "default" && "bg-primary/10 text-primary ring-1 ring-primary/20",
        variant === "muted" && "bg-muted text-muted-foreground ring-1 ring-border",
        variant === "accent" && "bg-accent/15 text-accent ring-1 ring-accent/25",
        className,
      )}
    >
      {children}
    </span>
  );
}
