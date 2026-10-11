import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  active: boolean;
};

export function StatusBadge({ active }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
        active ? "bg-pulse/25 text-foreground" : "bg-muted text-muted-foreground",
      )}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}
