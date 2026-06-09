import type { AudiobookRow, PlaybackRow } from '@/types/api';

export type PlayableAudiobook = {
  id: string;
  book_id: string;
  status: string;
  content_url?: string | null;
  duration?: number | null;
  book_title?: string | null;
  book_cover_url?: string | null;
  book_author?: AudiobookRow['book_author'];
  playback_progress?: number;
};

export function playableFromAudiobookRow(item: AudiobookRow): PlayableAudiobook {
  return {
    id: item.id,
    book_id: item.book_id,
    status: item.status,
    content_url: item.content_url,
    duration: item.duration,
    book_title: item.book_title,
    book_cover_url: item.book_cover_url,
    book_author: item.book_author,
    playback_progress: item.playback_progress,
  };
}

export function playableFromPlaybackRow(item: PlaybackRow): PlayableAudiobook | null {
  if (item.audiobook_status !== 'completed') {
    return null;
  }
  return {
    id: item.audiobook_id,
    book_id: item.book_id,
    status: item.audiobook_status,
    content_url: item.content_url,
    duration: item.audiobook_duration,
    book_title: item.book_title,
    book_cover_url: item.book_cover_url,
    book_author: item.book_author,
    playback_progress: item.progress,
  };
}

export function canPlayAudiobook(item: PlayableAudiobook) {
  return item.status === 'completed';
}
