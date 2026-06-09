import type { BookRow } from '@/types/api';
import type { Router } from 'expo-router';

export function openBook(router: Router, book: BookRow | { id: string }) {
  router.push(`/book/${book.id}` as never);
}
