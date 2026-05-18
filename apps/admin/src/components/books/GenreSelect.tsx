import { BOOK_GENRES, formatBookGenre, isKnownBookGenre } from "@/constants/genres";
type GenreSelectProps = {
  value: string;
  onChange: (value: string) => void;
  /** Shown when editing a book whose genre is not in BOOK_GENRES */
  legacyGenre?: string | null;
};

export function GenreSelect({ value, onChange, legacyGenre }: GenreSelectProps) {
  const legacy =
    legacyGenre && !isKnownBookGenre(legacyGenre) ? legacyGenre : null;
  const selectValue = value || legacy || "";

  return (
    <label className="block text-sm">
      <span className="mb-1 block text-muted-foreground">Genre</span>
      <select
        className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
        value={selectValue}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">No genre</option>
        {legacy ? (
          <option value={legacy}>{formatBookGenre(legacy)} (current)</option>
        ) : null}
        {BOOK_GENRES.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}
