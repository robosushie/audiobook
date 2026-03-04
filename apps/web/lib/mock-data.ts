export interface MockUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  plan: "free" | "pro" | "premium";
  createdAt: string;
}

export interface MockBook {
  id: string;
  title: string;
  genre: string;
  language: string;
  coverUrl: string | null;
  contentPreview: string;
  createdAt: string;
}

export interface MockAudiobook {
  id: string;
  bookId: string;
  bookTitle: string;
  status: "success" | "in_progress" | "queued" | "failed";
  createdAt: string;
}

export const mockUsers: MockUser[] = [
  {
    id: "1",
    email: "alice@example.com",
    firstName: "Alice",
    lastName: "Smith",
    plan: "premium",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    email: "bob@example.com",
    firstName: "Bob",
    lastName: "Jones",
    plan: "free",
    createdAt: "2024-02-20",
  },
  {
    id: "3",
    email: "carol@example.com",
    firstName: "Carol",
    lastName: "Lee",
    plan: "pro",
    createdAt: "2024-03-10",
  },
];

export const mockBooks: MockBook[] = [
  {
    id: "1",
    title: "The Great Adventure",
    genre: "Fiction",
    language: "en",
    coverUrl: null,
    contentPreview: "Chapter 1...",
    createdAt: "2024-01-01",
  },
  {
    id: "2",
    title: "Science Basics",
    genre: "Education",
    language: "en",
    coverUrl: null,
    contentPreview: "Introduction...",
    createdAt: "2024-02-01",
  },
];

export const mockAudiobooks: MockAudiobook[] = [
  {
    id: "1",
    bookId: "1",
    bookTitle: "The Great Adventure",
    status: "success",
    createdAt: "2024-01-05",
  },
  {
    id: "2",
    bookId: "2",
    bookTitle: "Science Basics",
    status: "in_progress",
    createdAt: "2024-02-10",
  },
];
