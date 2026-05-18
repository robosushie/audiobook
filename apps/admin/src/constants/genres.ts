import type { BookGenre } from "@/types/api";

export const BOOK_GENRES: { value: BookGenre; label: string }[] = [
  { value: "adventure", label: "Adventure" },
  { value: "fairytale", label: "Fairytale" },
  { value: "mythical", label: "Mythical" },
  { value: "fantasy", label: "Fantasy" },
  { value: "science_fiction", label: "Science fiction" },
  { value: "mystery", label: "Mystery" },
  { value: "horror", label: "Horror" },
  { value: "biography", label: "Biography" },
  { value: "history", label: "History" },
  { value: "religion", label: "Religion" },
  { value: "other", label: "Other" },
];

export function formatBookGenre(genre: string) {
  const match = BOOK_GENRES.find((item) => item.value === genre);
  return match?.label ?? genre.replace(/_/g, " ");
}

export function isKnownBookGenre(genre: string): genre is BookGenre {
  return BOOK_GENRES.some((item) => item.value === genre);
}
