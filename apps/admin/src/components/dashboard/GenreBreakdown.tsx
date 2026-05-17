import type { GenreCount } from "@/types/api";

type GenreBreakdownProps = {
  items: GenreCount[];
};

export function GenreBreakdown({ items }: GenreBreakdownProps) {
  const max = Math.max(...items.map((i) => i.count), 1);

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold">Books by genre</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">Catalogue breakdown</p>
      <ul className="mt-5 space-y-3">
        {items.length === 0 ? (
          <li className="text-sm text-muted-foreground">No books in catalogue yet.</li>
        ) : (
          items.map((item) => (
            <li key={item.genre}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-medium capitalize">{item.genre.replace(/_/g, " ")}</span>
                <span className="text-muted-foreground">{item.count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary/80"
                  style={{ width: `${(item.count / max) * 100}%` }}
                />
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
