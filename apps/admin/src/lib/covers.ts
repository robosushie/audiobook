import { getApiBaseUrl } from "@/lib/env";

export type CoverSize = "thumb" | "full";

export function resolveCoverUrl(
  coverUrl: string | null | undefined,
  bookId: string | null | undefined,
  size: CoverSize = "thumb",
): string | null {
  if (!coverUrl) return null;
  if (/^https?:\/\//i.test(coverUrl)) return coverUrl;
  if (!bookId) return null;
  const query = size === "full" ? "?size=full" : "";
  return `${getApiBaseUrl()}/api/books/${bookId}/cover${query}`;
}
