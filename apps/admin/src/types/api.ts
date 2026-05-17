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

export type ReferenceLanguage =
  | "english"
  | "hindi"
  | "arabic"
  | "kannada"
  | "malayalam"
  | "marathi"
  | "odia"
  | "punjabi"
  | "tamil"
  | "telugu";

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

export type DashboardOverview = {
  total_users: number;
  admin_users: number;
  regular_users: number;
  total_books: number;
  books_by_genre: GenreCount[];
  audiobooks_last_30_days: DailyAudiobookCount[];
};
