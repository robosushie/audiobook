import type { UserName } from '@/types/api';

const LANGUAGE_LABELS: Record<string, string> = {
  english: 'English',
  hindi: 'Hindi',
  malayalam: 'Malayalam',
  tamil: 'Tamil',
  odia: 'Odia',
  arabic: 'Arabic',
};

export function formatAuthorName(author: UserName | null | undefined): string {
  if (!author) return 'Unknown author';
  const parts = [author.first, author.middle, author.last].filter(Boolean);
  return parts.join(' ');
}

export function formatLanguage(language: string): string {
  return LANGUAGE_LABELS[language] ?? language.charAt(0).toUpperCase() + language.slice(1);
}

export function formatPlayCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M plays`;
  if (count >= 1_000) return `${Math.round(count / 1_000)}k plays`;
  return `${count} plays`;
}

export function greetingForHour(hour: number, firstName?: string | null): string {
  const name = firstName?.trim() ? `, ${firstName.trim()}` : '';
  if (hour < 12) return `Good morning${name}`;
  if (hour < 17) return `Good afternoon${name}`;
  return `Good evening${name}`;
}

export function formatDateLine(date: Date = new Date()): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/** progress 0–1; duration seconds */
export function playbackMeta(progress: number, durationSeconds: number | null | undefined) {
  const ratio = Math.min(Math.max(progress, 0), 1);
  const chapter = Math.max(1, Math.ceil(ratio * 24) || 1);
  let minutesLeft = 32;
  if (durationSeconds && durationSeconds > 0) {
    minutesLeft = Math.max(1, Math.round(((1 - ratio) * durationSeconds) / 60));
  }
  return {
    chapterLabel: `Ch. ${chapter}`,
    minutesLeftLabel: `${minutesLeft} min left`,
    percent: Math.round(ratio * 100),
  };
}
