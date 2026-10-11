import { X } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          "flex w-full max-h-[90vh] max-w-md flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg",
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 p-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 id="modal-title" className="text-lg font-semibold">
                {title}
              </h2>
              {description ? (
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              ) : null}
            </div>
            <Button
              type="button"
              variant="ghost"
              className="h-8 w-8 shrink-0 rounded-full p-0"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overscroll-contain px-6",
            footer ? "pb-4" : "pb-6",
          )}
        >
          {children}
        </div>
        {footer ? (
          <div className="flex shrink-0 justify-end gap-2 px-6 pb-6 pt-2">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
