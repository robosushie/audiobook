import { apiFetch } from '@/api/client';
import type { BookContentRow, BookRow, ListPage } from '@/types/api';

export type BookListParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  genre?: string;
  language?: string;
  trending?: boolean;
};

export function fetchBooks(token: string, params?: BookListParams) {
  const search = new URLSearchParams();
  search.set('page', String(params?.page ?? 1));
  search.set('page_size', String(params?.pageSize ?? 8));
  if (params?.q) search.set('q', params.q);
  if (params?.genre) search.set('genre', params.genre);
  if (params?.language) search.set('language', params.language);
  if (params?.trending) search.set('trending', 'true');
  return apiFetch<ListPage<BookRow>>(`/api/books/?${search.toString()}`, { token });
}

export function fetchBook(token: string, bookId: string) {
  return apiFetch<BookRow>(`/api/books/${bookId}`, { token });
}

export function fetchBookContent(token: string, bookId: string) {
  return apiFetch<BookContentRow>(`/api/books/${bookId}/content`, { token });
}
