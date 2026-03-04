import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FilterBar, AudiobookCard, BookCard } from '@/components/shared';
import {
  myLibrary,
  recentlyPlayed,
  books,
  genres,
} from '@/lib/audio-library';
import { useAudioLibraryStore } from '@/lib/audio-library/store';

const LANGUAGES = ['All', 'English', 'Hindi', 'Arabic'];
const SORT_OPTIONS = ['Recent', 'A-Z'];
const TAB_BAR_HEIGHT = 64;

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const playAudiobook = useAudioLibraryStore((s) => s.playAudiobook);
  const openBook = useAudioLibraryStore((s) => s.openBook);

  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedLang, setSelectedLang] = useState('All');
  const [selectedSort, setSelectedSort] = useState('Recent');

  const filteredLibrary = useMemo(() => {
    return myLibrary.filter((b) => {
      if (selectedGenre !== 'All' && b.genre !== selectedGenre) return false;
      if (selectedLang !== 'All' && b.language !== selectedLang) return false;
      return true;
    });
  }, [selectedGenre, selectedLang]);

  const recommendedBooks = useMemo(() => {
    return books.filter((b) => {
      if (selectedGenre !== 'All' && !b.categories.includes(selectedGenre)) return false;
      if (selectedLang !== 'All' && b.language !== selectedLang) return false;
      return true;
    });
  }, [selectedGenre, selectedLang]);

  const recommendedRow1 = recommendedBooks.slice(0, 6);
  const recommendedRow2 = recommendedBooks.slice(6, 12);
  const newestBooks = useMemo(() => books.filter((b) => b.isNew).slice(0, 8), []);

  return (
    <ScrollView
      className="flex-1 pt-4"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ gap: 24, paddingBottom: TAB_BAR_HEIGHT + insets.bottom }}
    >
      <FilterBar
        genres={genres}
        selectedGenre={selectedGenre}
        onGenreChange={setSelectedGenre}
        languages={LANGUAGES}
        selectedLang={selectedLang}
        onLangChange={setSelectedLang}
        sortOptions={SORT_OPTIONS}
        selectedSort={selectedSort}
        onSortChange={setSelectedSort}
      />

      <View>
        <View className="flex-row items-center justify-between px-5 mb-3">
          <Text className="text-lg font-bold text-foreground font-heading">My Library</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingHorizontal: 20, paddingBottom: 8 }}
        >
          {filteredLibrary.length > 0 ? (
            filteredLibrary.map((book) => (
              <AudiobookCard key={book.id} book={book} onPress={playAudiobook} width={140} />
            ))
          ) : (
            <Text className="text-sm text-muted-foreground py-4 px-5">No audiobooks match your filters.</Text>
          )}
        </ScrollView>
      </View>

      <View>
        <View className="flex-row items-center justify-between px-5 mb-3">
          <Text className="text-lg font-bold text-foreground font-heading">Recent Listens</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingHorizontal: 20, paddingBottom: 8 }}
        >
          {recentlyPlayed.map((book) => (
            <AudiobookCard key={book.id} book={book} onPress={playAudiobook} width={140} />
          ))}
        </ScrollView>
      </View>

      <View>
        <View className="flex-row items-center justify-between px-5 mb-3">
          <Text className="text-lg font-bold text-foreground font-heading">Recommended For You</Text>
          <Text className="text-[10px] text-muted-foreground uppercase tracking-wider">Books</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingHorizontal: 20, paddingBottom: 8 }}
        >
          {recommendedRow1.length > 0 ? (
            recommendedRow1.map((book) => (
              <BookCard key={book.id} book={book} onPress={openBook} width={140} />
            ))
          ) : (
            <Text className="text-sm text-muted-foreground py-4 px-5">No books match your filters.</Text>
          )}
        </ScrollView>
        {recommendedRow2.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingHorizontal: 20, paddingBottom: 8, marginTop: 10 }}
          >
            {recommendedRow2.map((book) => (
              <BookCard key={book.id} book={book} onPress={openBook} width={140} />
            ))}
          </ScrollView>
        )}
      </View>

      {newestBooks.length > 0 && (
        <View>
          <View className="flex-row items-center justify-between px-5 mb-3">
            <Text className="text-lg font-bold text-foreground font-heading">Newest Arrivals</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingHorizontal: 20, paddingBottom: 8 }}
          >
            {newestBooks.map((book) => (
              <BookCard key={book.id} book={book} onPress={openBook} width={140} />
            ))}
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
}
