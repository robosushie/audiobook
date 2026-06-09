import { cn } from "@/lib/utils";
import type { AudiobookStatus } from "@/types/api";

const STATUS_STYLES: Record<AudiobookStatus, string> = {
  queued: "bg-amber-50 text-amber-800 ring-amber-200",
  processing: "bg-sky-50 text-sky-800 ring-sky-200",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  failed: "bg-red-50 text-red-700 ring-red-200",
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
  const style = STATUS_STYLES[key] ?? "bg-zinc-100 text-zinc-600 ring-zinc-200";
  const label = STATUS_LABELS[key] ?? status;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1",
        style,
      )}
    >
      {label}
    </span>
  );
}
