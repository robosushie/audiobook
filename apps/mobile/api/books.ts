import { apiFetch } from '@/api/client';
import type { BookContentRow, BookRow } from '@/types/api';

export function fetchTrendingBooks(token: string) {
  return apiFetch<BookRow[]>('/api/books/?trending=true&limit=8', { token });
}

export function fetchBooks(token: string) {
  return apiFetch<BookRow[]>('/api/books/', { token });
}

export function fetchBook(token: string, bookId: string) {
  return apiFetch<BookRow>(`/api/books/${bookId}`, { token });
}

export function fetchBookContent(token: string, bookId: string) {
  return apiFetch<BookContentRow>(`/api/books/${bookId}/content`, { token });
}
