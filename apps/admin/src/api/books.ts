import type { BookRow } from "@/types/api";

export function fetchBooks(request: <T>(path: string, init?: RequestInit) => Promise<T>) {
  return request<BookRow[]>("/api/books/");
}

export function createBook(
  request: <T>(path: string, init?: RequestInit) => Promise<T>,
  body: Record<string, unknown>,
) {
  return request<BookRow>("/api/books/", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
