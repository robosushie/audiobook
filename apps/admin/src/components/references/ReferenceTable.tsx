import { Eye, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import { DeleteReferenceModal } from "@/components/references/DeleteReferenceModal";
import { EditReferenceModal } from "@/components/references/EditReferenceModal";
import { ViewReferenceModal } from "@/components/references/ViewReferenceModal";
import { formatReferenceLanguage } from "@/constants/languages";
import { truncatePassage } from "@/lib/reference";
import { cn } from "@/lib/utils";
import type { ReferenceRow } from "@/types/api";

type ReferenceTableProps = {
  references: ReferenceRow[];
  loading: boolean;
  emptyMessage?: string;
  onRefresh: () => void;
};

function IconButton({
  label,
  onClick,
  children,
  variant = "default",
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  variant?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-card text-foreground transition-colors",
        "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        variant === "default" && "border-border",
        variant === "danger" &&
          "border-destructive/40 text-destructive hover:bg-destructive/10",
      )}
    >
      {children}
    </button>
  );
}

export function ReferenceTable({
  references,
  loading,
  emptyMessage = "No reference passages found.",
  onRefresh,
}: ReferenceTableProps) {
  const [viewReference, setViewReference] = useState<ReferenceRow | null>(null);
  const [editReference, setEditReference] = useState<ReferenceRow | null>(null);
  const [deleteReferenceState, setDeleteReferenceState] = useState<ReferenceRow | null>(null);

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              <th className="w-36 px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Language
              </th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Passage
              </th>
              <th className="w-36 px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : references.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              references.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">
                    {formatReferenceLanguage(row.language)}
                  </td>
                  <td className="max-w-md px-4 py-3 text-muted-foreground">
                    <span className="line-clamp-1" title={row.text}>
                      {truncatePassage(row.text)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <IconButton label="View reference" onClick={() => setViewReference(row)}>
                        <Eye className="h-4 w-4" />
                      </IconButton>
                      <IconButton label="Edit reference" onClick={() => setEditReference(row)}>
                        <Pencil className="h-4 w-4" />
                      </IconButton>
                      <IconButton
                        label="Delete reference"
                        variant="danger"
                        onClick={() => setDeleteReferenceState(row)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ViewReferenceModal
        reference={viewReference}
        onClose={() => setViewReference(null)}
      />
      <EditReferenceModal
        reference={editReference}
        onClose={() => setEditReference(null)}
        onSuccess={onRefresh}
      />
      <DeleteReferenceModal
        reference={deleteReferenceState}
        onClose={() => setDeleteReferenceState(null)}
        onSuccess={onRefresh}
      />
    </>
  );
}
