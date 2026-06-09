export type UserName = {
  first: string;
  middle?: string | null;
  last: string;
};

export type BookRow = {
  id: string;
  title: string;
  author: UserName;
  description?: string | null;
  cover_url?: string | null;
  genre?: string | null;
  language: string;
  is_active: boolean;
  is_trending: boolean;
  average_rating?: number | null;
  rating_count: number;
};

export type BookContentRow = {
  content: string;
};

export type AudiobookGenerateBody = {
  book_id: string;
  voice_profile_id: string;
  cloner_type?: 'indicf5' | 'xttsv2' | null;
};

export type PlaybackRow = {
  id: string;
  user_id: string;
  audiobook_id: string;
  progress: number;
  last_played_at: string | null;
  book_id: string;
  book_title: string;
  book_cover_url?: string | null;
  book_author?: UserName | null;
  audiobook_duration?: number | null;
  audiobook_status?: string | null;
  content_url?: string | null;
};

export type ReferenceLanguage =
  | 'english'
  | 'assamese'
  | 'bengali'
  | 'gujarati'
  | 'hindi'
  | 'arabic'
  | 'kannada'
  | 'malayalam'
  | 'marathi'
  | 'odia'
  | 'punjabi'
  | 'tamil'
  | 'telugu';

export type ReferenceRow = {
  id: string;
  language: ReferenceLanguage;
  text: string;
};

export type VoiceProfileStatus = 'uploaded' | 'queued' | 'processing' | 'ready' | 'failed';

export type VoiceProfileRow = {
  id: string;
  user_id: string;
  reference_id: string;
  label: string;
  raw_text?: string;
  duration: number;
  status: VoiceProfileStatus;
  language: ReferenceLanguage;
  raw_url?: string | null;
  audio_url?: string | null;
};

export type AudiobookRow = {
  id: string;
  user_id: string;
  book_id: string;
  voice_profile_id: string;
  status: string;
  content_url?: string | null;
  duration?: number | null;
  completed_at?: string | null;
  book_title?: string | null;
  book_cover_url?: string | null;
  book_author?: UserName | null;
  book_language?: string | null;
  playback_progress?: number;
};
