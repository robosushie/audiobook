import { create } from 'zustand';
import type { Audiobook } from './audiobooks';
import type { Book } from './books';
import type { VoiceSample } from './voice-samples';

interface AudioLibraryState {
  currentBook: Audiobook | null;
  selectedBook: Book | null;
  voiceSamples: VoiceSample[];
  setCurrentBook: (book: Audiobook | null) => void;
  setSelectedBook: (book: Book | null) => void;
  setVoiceSamples: (samples: VoiceSample[] | ((prev: VoiceSample[]) => VoiceSample[])) => void;
  addVoiceSample: (sample: VoiceSample) => void;
  playAudiobook: (book: Audiobook) => void;
  openBook: (book: Book) => void;
  closeBook: () => void;
  closePlayer: () => void;
  createAudiobook: (bookId: string, sampleId: string) => void;
}

export const useAudioLibraryStore = create<AudioLibraryState>((set) => ({
  currentBook: null,
  selectedBook: null,
  voiceSamples: [],

  setCurrentBook: (book) => set({ currentBook: book }),
  setSelectedBook: (book) => set({ selectedBook: book }),
  setVoiceSamples: (samples) =>
    set((state) => ({
      voiceSamples: typeof samples === 'function' ? samples(state.voiceSamples) : samples,
    })),

  addVoiceSample: (sample) =>
    set((state) => ({ voiceSamples: [sample, ...state.voiceSamples] })),

  playAudiobook: (book) => set({ currentBook: book }),
  openBook: (book) => set({ selectedBook: book }),
  closeBook: () => set({ selectedBook: null }),
  closePlayer: () => set({ currentBook: null }),

  createAudiobook: (bookId, sampleId) => {
    console.log('Creating audiobook from book', bookId, 'with voice sample', sampleId);
    set({ selectedBook: null });
  },
}));
