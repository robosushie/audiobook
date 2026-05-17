import { BookOpen } from "lucide-react";

import type { BookRow } from "@/types/api";

type BookCardProps = {
  book: BookRow;
};

function authorName(author: BookRow["author"]) {
  return [author.first, author.middle, author.last].filter(Boolean).join(" ");
}

export function BookCard({ book }: BookCardProps) {
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-[3/4] bg-muted">
        {book.cover_url ? (
          <img src={book.cover_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <BookOpen className="h-10 w-10 opacity-40" />
          </div>
        )}
        {book.is_trending ? (
          <span className="absolute right-2 top-2 rounded-md bg-primary px-2 py-0.5 text-[10px] font-medium uppercase text-primary-foreground">
            Trending
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-semibold leading-snug">{book.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{authorName(book.author)}</p>
        {book.genre ? (
          <p className="mt-2 text-xs capitalize text-muted-foreground">
            {book.genre.replace(/_/g, " ")}
          </p>
        ) : null}
        {!book.is_active ? (
          <p className="mt-2 text-xs font-medium text-destructive">Inactive</p>
        ) : null}
      </div>
    </article>
  );
}
