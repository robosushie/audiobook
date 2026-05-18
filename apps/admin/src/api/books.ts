import { apiUpload } from "@/api/client";
import type { BookRow, BookUpdateBody } from "@/types/api";

export function fetchBooks(request: <T>(path: string, init?: RequestInit) => Promise<T>) {
  return request<BookRow[]>("/api/books/");
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
