import { cn } from "@/lib/utils";
import type { AudiobookStatus } from "@/types/api";

const STATUS_STYLES: Record<AudiobookStatus, string> = {
  queued: "bg-solar/50 text-foreground",
  processing: "bg-signal/15 text-foreground",
  completed: "bg-pulse/25 text-foreground",
  failed: "bg-destructive/10 text-destructive",
};

const STATUS_LABELS: Record<AudiobookStatus, string> = {
  queued: "Queued",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
};

type AudiobookStatusBadgeProps = {
  status: string;
};

export function AudiobookStatusBadge({ status }: AudiobookStatusBadgeProps) {
  const key = status as AudiobookStatus;
  const style = STATUS_STYLES[key] ?? "bg-muted text-muted-foreground";
  const label = STATUS_LABELS[key] ?? status;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
        style,
      )}
    >
      {label}
    </span>
  );
}
