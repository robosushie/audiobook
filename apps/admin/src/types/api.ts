export type UserName = {
  first: string;
  middle?: string | null;
  last: string;
};

export type UserGender = "undisclosed" | "male" | "female" | "other";

export type UserRow = {
  id: string;
  email: string;
  name: UserName;
  role: "admin" | "regular";
  gender: UserGender;
  verified: boolean;
  created_at: string;
};

export type UserUpdateBody = {
  name?: UserName;
  email?: string;
  gender?: UserGender;
  verified?: boolean;
};

export type ReferenceLanguage =
  | "english"
  | "assamese"
  | "bengali"
  | "gujarati"
  | "hindi"
  | "arabic"
  | "kannada"
  | "malayalam"
  | "marathi"
  | "odia"
  | "punjabi"
  | "tamil"
  | "telugu";

export type BookGenre =
  | "adventure"
  | "fairytale"
  | "mythical"
  | "fantasy"
  | "science_fiction"
  | "mystery"
  | "horror"
  | "biography"
  | "history"
  | "religion"
  | "other";

export type BookUpdateBody = {
  title?: string;
  author?: UserName;
  description?: string | null;
  cover_url?: string | null;
  genre?: BookGenre | null;
  language?: ReferenceLanguage;
  is_active?: boolean;
  is_trending?: boolean;
};

export type BookRow = {
  id: string;
  title: string;
  author: UserName;
  description?: string | null;
  cover_url?: string | null;
  genre?: BookGenre | string | null;
  language: ReferenceLanguage;
  content_url?: string | null;
  is_active: boolean;
  is_trending: boolean;
  categories: string[];
  created_at?: string;
};

export type GenreCount = {
  genre: string;
  count: number;
};

export type DailyAudiobookCount = {
  date: string;
  count: number;
};

export type ReferenceRow = {
  id: string;
  language: ReferenceLanguage;
  text: string;
};

export type ReferenceCreateBody = {
  language: ReferenceLanguage;
  text: string;
};

export type ReferenceUpdateBody = {
  language?: ReferenceLanguage;
  text?: string;
};

export type VoiceProfileStatus =
  | "uploaded"
  | "queued"
  | "processing"
  | "ready"
  | "failed";

export type VoiceProfileRow = {
  id: string;
  user_id: string;
  reference_id: string;
  label: string;
  raw_text: string;
  duration: number;
  status: VoiceProfileStatus;
  language: ReferenceLanguage;
  audio_url?: string | null;
};

export type AudiobookGenerateBody = {
  book_id: string;
  voice_profile_id: string;
  cloner_type?: "indicf5" | "xttsv2" | null;
};

export type AudiobookStatus = "queued" | "processing" | "completed" | "failed";

export type AudiobookRow = {
  id: string;
  user_id: string;
  book_id: string;
  voice_profile_id: string;
  status: AudiobookStatus | string;
  content_url?: string | null;
  duration?: number | null;
  completed_at?: string | null;
};

export type AdminAudiobookRow = AudiobookRow & {
  book_title?: string | null;
  book_cover_url?: string | null;
  book_language?: string | null;
  user_email?: string | null;
  user_name?: UserName | null;
  created_at: string;
};

export type AudiobookStatusFilter =
  | "all"
  | "queued_completed"
  | AudiobookStatus;

export type DashboardOverview = {
  total_users: number;
  admin_users: number;
  regular_users: number;
  total_books: number;
  books_by_genre: GenreCount[];
  audiobooks_last_30_days: DailyAudiobookCount[];
};
