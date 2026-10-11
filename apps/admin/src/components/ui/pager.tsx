import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

type PagerProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
};

export function Pager({ page, pageSize, total, onPageChange }: PagerProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(page, 1), pageCount);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target?.isContentEditable
      ) {
        return;
      }
      if (event.key === "ArrowLeft" && current > 1) {
        event.preventDefault();
        onPageChange(current - 1);
      }
      if (event.key === "ArrowRight" && current < pageCount) {
        event.preventDefault();
        onPageChange(current + 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, onPageChange, pageCount]);

  return (
    <div className="mt-4 flex items-center justify-center gap-3">
      <Button
        type="button"
        variant="outline"
        className="h-9 w-9 px-0"
        disabled={current <= 1}
        aria-label="Previous page"
        onClick={() => onPageChange(current - 1)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-28 text-center text-sm text-muted-foreground">
        Page {current} of {pageCount}
      </span>
      <Button
        type="button"
        variant="outline"
        className="h-9 w-9 px-0"
        disabled={current >= pageCount}
        aria-label="Next page"
        onClick={() => onPageChange(current + 1)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
