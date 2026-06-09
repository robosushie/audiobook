import type { AudiobookRow } from '@/types/api';

export type LibraryStatusFilter = 'all' | 'completed' | 'processing' | 'queued';

const IN_PROGRESS = new Set(['queued', 'processing']);

export function isInProgressStatus(status: string) {
  return IN_PROGRESS.has(status);
}

export function filterLibraryAudiobooks(
  items: AudiobookRow[],
  statusFilter: LibraryStatusFilter,
  showFailed: boolean,
): AudiobookRow[] {
  if (showFailed) {
    return items.filter((item) => item.status === 'failed');
  }

  let list = items.filter((item) => item.status !== 'failed');

  switch (statusFilter) {
    case 'completed':
      list = list.filter((item) => item.status === 'completed');
      break;
    case 'processing':
      list = list.filter((item) => item.status === 'processing');
      break;
    case 'queued':
      list = list.filter((item) => item.status === 'queued');
      break;
    case 'all':
    default:
      break;
  }

  return sortLibraryAudiobooks(list);
}

export function sortLibraryAudiobooks(items: AudiobookRow[]): AudiobookRow[] {
  const rank = (status: string) => {
    if (status === 'queued') return 0;
    if (status === 'processing') return 1;
    if (status === 'completed') return 2;
    if (status === 'failed') return 3;
    return 4;
  };

  return [...items].sort((a, b) => rank(a.status) - rank(b.status));
}

export const LIBRARY_STATUS_FILTERS: { value: LibraryStatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'completed', label: 'Completed' },
  { value: 'processing', label: 'Processing' },
  { value: 'queued', label: 'Queued' },
];
