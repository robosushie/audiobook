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
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium duration-150",
          "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:pointer-events-none disabled:opacity-50",
          variant === "primary" &&
            "bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90",
          variant === "accent" &&
            "bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90",
          variant === "ghost" &&
            "bg-transparent px-3 py-2 text-foreground underline-offset-4 hover:underline",
          variant === "outline" &&
            "border border-border bg-card px-6 py-3 text-foreground hover:bg-muted",
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
