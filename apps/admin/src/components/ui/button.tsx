import { type ButtonHTMLAttributes, forwardRef } from "react";

import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline" | "accent";
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          variant === "primary" &&
            "rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90",
          variant === "accent" &&
            "h-12 rounded-2xl bg-accent px-4 font-semibold text-accent-foreground shadow-pop hover:bg-accent/90",
          variant === "ghost" &&
            "rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground",
          variant === "outline" &&
            "rounded-lg border border-border bg-card px-4 py-2 hover:bg-muted",
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
