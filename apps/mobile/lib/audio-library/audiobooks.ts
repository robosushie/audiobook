export interface Audiobook {
  id: string;
  title: string;
  author: string;
  cover: string;
  language: string;
  genre: string;
  duration: string;
  progress: number;
  voiceName?: string;
  status: 'completed' | 'processing' | 'ready';
}

export const myLibrary: Audiobook[] = [
  {
    id: '1',
    title: 'The Jungle Book',
    author: 'Rudyard Kipling',
    cover: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=400&h=400&fit=crop',
    language: 'English',
    genre: 'Adventure',
    duration: '3h 20m',
    progress: 0.45,
    voiceName: "Dad's Voice",
    status: 'completed',
  },
  {
    id: '2',
    title: 'Little Red Riding Hood',
    author: 'Brothers Grimm',
    cover: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=400&h=400&fit=crop',
    language: 'English',
    genre: 'Fairy Tale',
    duration: '25m',
    progress: 0.8,
    voiceName: "Mom's Voice",
    status: 'completed',
  },
  {
    id: '3',
    title: 'Three Little Pigs',
    author: 'Joseph Jacobs',
    cover: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=400&h=400&fit=crop',
    language: 'Hindi',
    genre: 'Fairy Tale',
    duration: '18m',
    progress: 0.1,
    voiceName: "Grandma's Voice",
    status: 'completed',
  },
  {
    id: '4',
    title: 'Cinderella',
    author: 'Charles Perrault',
    cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=400&fit=crop',
    language: 'English',
    genre: 'Fairy Tale',
    duration: '35m',
    progress: 0,
    voiceName: "Dad's Voice",
    status: 'completed',
  },
  {
    id: '5',
    title: 'Panchatantra Tales',
    author: 'Vishnu Sharma',
    cover: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=400&fit=crop',
    language: 'Hindi',
    genre: 'Fable',
    duration: '1h 10m',
    progress: 0.6,
    voiceName: "Grandpa's Voice",
    status: 'completed',
  },
];

export const recentlyPlayed: Audiobook[] = [myLibrary[0], myLibrary[1], myLibrary[4]];

export const processingAudiobooks: Audiobook[] = [
  {
    id: 'p1',
    title: 'Aladdin & the Magic Lamp',
    author: 'Arabian Nights',
    cover: 'https://images.unsplash.com/photo-1474932430478-367dbb6832c1?w=400&h=400&fit=crop',
    language: 'Arabic',
    genre: 'Mystical',
    duration: '~45m',
    progress: 0.65,
    voiceName: "Mom's Voice",
    status: 'processing',
  },
  {
    id: 'p2',
    title: 'Ramayana',
    author: 'Valmiki',
    cover: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&h=400&fit=crop',
    language: 'Hindi',
    genre: 'Mythology',
    duration: '~2h',
    progress: 0.3,
    voiceName: "Grandpa's Voice",
    status: 'processing',
  },
];

export const allAudiobooks: Audiobook[] = [...myLibrary, ...processingAudiobooks];
