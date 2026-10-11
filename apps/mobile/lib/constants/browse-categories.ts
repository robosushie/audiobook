/** Browse tiles on Search — maps display label to catalogue ``genre`` slug. */

import { BOOK_GENRES, type BookGenre } from '@/lib/constants/genres';

export type BrowseCategory = {
  label: string;
  genre: BookGenre;
  gradient: readonly [string, string];
};

const CONFETTI = [
  ['#1871da', '#1871da'],
  ['#1ec072', '#1ec072'],
  ['#f6609f', '#f6609f'],
  ['#ffbb38', '#ffbb38'],
  ['#9664d7', '#9664d7'],
] as const satisfies readonly (readonly [string, string])[];

export const BROWSE_CATEGORIES: BrowseCategory[] = BOOK_GENRES.map((genre, index) => ({
  label: genre.label,
  genre: genre.value,
  gradient: CONFETTI[index % CONFETTI.length],
}));
