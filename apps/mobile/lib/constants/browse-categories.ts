/** Browse tiles on Search — maps display label to catalogue ``genre`` slug. */

import { BOOK_GENRES, type BookGenre } from '@/lib/constants/genres';

export type BrowseCategory = {
  label: string;
  genre: BookGenre;
  gradient: readonly [string, string];
};

const GRADIENT_BY_GENRE: Record<BookGenre, readonly [string, string]> = {
  adventure: ['hsl(340 65% 58%)', 'hsl(240 6% 10%)'],
  fairytale: ['hsl(320 55% 62%)', 'hsl(280 45% 48%)'],
  mythical: ['hsl(42 92% 55%)', 'hsl(32 95% 55%)'],
  fantasy: ['hsl(214 72% 58%)', 'hsl(270 55% 58%)'],
  science_fiction: ['hsl(270 55% 58%)', 'hsl(214 45% 22%)'],
  mystery: ['hsl(260 28% 18%)', 'hsl(240 12% 10%)'],
  horror: ['hsl(0 55% 28%)', 'hsl(240 8% 8%)'],
  biography: ['hsl(152 45% 42%)', 'hsl(214 72% 58%)'],
  history: ['hsl(36 42% 32%)', 'hsl(28 38% 18%)'],
  religion: ['hsl(210 40% 38%)', 'hsl(240 20% 16%)'],
  other: ['hsl(240 6% 42%)', 'hsl(240 6% 22%)'],
};

export const BROWSE_CATEGORIES: BrowseCategory[] = BOOK_GENRES.map((genre) => ({
  label: genre.label,
  genre: genre.value,
  gradient: GRADIENT_BY_GENRE[genre.value],
}));
