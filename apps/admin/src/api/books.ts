import { apiUpload } from "@/api/client";
import type { BookRow, BookUpdateBody, ListPage, ReferenceLanguage } from "@/types/api";

export type BookListParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  genres?: string[];
  languages?: ReferenceLanguage[];
  activeOnly?: boolean;
  trending?: boolean;
};

export function fetchBooks(
  request: <T>(path: string, init?: RequestInit) => Promise<T>,
  params?: BookListParams,
) {
  const search = new URLSearchParams();
  search.set("page", String(params?.page ?? 1));
  search.set("page_size", String(params?.pageSize ?? 8));
  if (params?.q) search.set("q", params.q);
  for (const genre of params?.genres ?? []) search.append("genre", genre);
  for (const language of params?.languages ?? []) search.append("language", language);
  if (params?.activeOnly === false) search.set("active_only", "false");
  if (params?.trending) search.set("trending", "true");
  return request<ListPage<BookRow>>(`/api/books/?${search.toString()}`);
}

export async function createBookWithContent(token: string, formData: FormData) {
  return apiUpload<BookRow>("/api/books/with-content", formData, token);
}

export function updateBook(
  request: <T>(path: string, init?: RequestInit) => Promise<T>,
  bookId: string,
  body: BookUpdateBody,
) {
  return request<BookRow>(`/api/books/${bookId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function fetchBookContent(
  request: <T>(path: string, init?: RequestInit) => Promise<T>,
  bookId: string,
) {
  return request<{ content: string }>(`/api/books/${bookId}/content`);
}

export async function updateBookContent(token: string, bookId: string, content: string) {
  const formData = new FormData();
  formData.append("content", content);
  return apiUpload<BookRow>(`/api/books/${bookId}/content`, formData, token);
}

export function deleteBook(
  request: <T>(path: string, init?: RequestInit) => Promise<T>,
  bookId: string,
) {
  return request<void>(`/api/books/${bookId}`, { method: "DELETE" });
}
