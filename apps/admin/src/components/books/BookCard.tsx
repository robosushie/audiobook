import { BookOpen, Eye, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatBookGenre } from "@/constants/genres";
import { resolveCoverUrl } from "@/lib/covers";
import { formatReferenceLanguage } from "@/constants/languages";
import { cn } from "@/lib/utils";
import type { BookRow } from "@/types/api";

type BookCardProps = {
  book: BookRow;
  onView: (book: BookRow) => void;
  onEdit: (book: BookRow) => void;
  onDelete: (book: BookRow) => void;
};

function authorName(author: BookRow["author"]) {
  return [author.first, author.middle, author.last].filter(Boolean).join(" ");
}

function CardIconButton({
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
        "inline-flex h-7 w-7 items-center justify-center rounded-full border bg-card text-foreground transition-colors duration-150",
        "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        variant === "default" && "border-border",
        variant === "danger" && "border-destructive/40 text-destructive hover:bg-destructive/10",
      )}
    >
      {children}
    </button>
  );
}

export function BookCard({ book, onView, onEdit, onDelete }: BookCardProps) {
  return (
    <article className="flex flex-col overflow-hidden rounded-md border border-border bg-card">
      <div className="relative h-32 shrink-0 bg-muted">
        {resolveCoverUrl(book.cover_url, book.id) ? (
          <img
            src={resolveCoverUrl(book.cover_url, book.id) ?? undefined}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <BookOpen className="h-8 w-8 opacity-40" />
          </div>
        )}
        {book.is_trending ? (
          <span className="absolute right-2 top-2 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary-foreground">
            Hot
          </span>
        ) : null}
        <div className="absolute bottom-2 left-2 flex gap-1">
          <CardIconButton label="View book" onClick={() => onView(book)}>
            <Eye className="h-3.5 w-3.5" />
          </CardIconButton>
          <CardIconButton label="Edit book" onClick={() => onEdit(book)}>
            <Pencil className="h-3.5 w-3.5" />
          </CardIconButton>
          <CardIconButton label="Delete book" variant="danger" onClick={() => onDelete(book)}>
            <Trash2 className="h-3.5 w-3.5" />
          </CardIconButton>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-2 p-3">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{book.title}</h3>
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{authorName(book.author)}</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {book.genre ? <Badge variant="default">{formatBookGenre(book.genre)}</Badge> : null}
          <Badge variant="muted">{formatReferenceLanguage(book.language)}</Badge>
          {book.is_active ? null : <Badge variant="accent">Inactive</Badge>}
        </div>
      </div>
    </article>
  );
}
