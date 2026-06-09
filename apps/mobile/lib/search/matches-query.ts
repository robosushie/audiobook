import { formatAuthorName } from '@/lib/format';
import type { BookRow } from '@/types/api';

export function matchesBookQuery(book: BookRow, query: string) {
  const title = book.title.toLowerCase();
  const author = formatAuthorName(book.author).toLowerCase();
  const genre = (book.genre ?? '').replace(/_/g, ' ').toLowerCase();
  const language = book.language.toLowerCase();
  return (
    title.includes(query) ||
    author.includes(query) ||
    genre.includes(query) ||
    language.includes(query)
  );
}
