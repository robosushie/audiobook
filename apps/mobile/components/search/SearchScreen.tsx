import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FilterBar, BookCard } from '@/components/shared';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react-native';
import { books, genres } from '@/lib/audio-library';
import { useAudioLibraryStore } from '@/lib/audio-library/store';

const LANGUAGES = ['All', 'English', 'Hindi', 'Arabic'];
const SORT_OPTIONS = ['Popular', 'Top Rated', 'New Release', 'A-Z'];
const TAB_BAR_HEIGHT = 64;

export function SearchScreen() {
  const insets = useSafeAreaInsets();
  const openBook = useAudioLibraryStore((s) => s.openBook);

  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedLang, setSelectedLang] = useState('All');
  const [selectedSort, setSelectedSort] = useState('Popular');
  const [query, setQuery] = useState('');

  const filteredBooks = useMemo(() => {
    let result = [...books];
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.language.toLowerCase().includes(q) ||
          b.categories.some((c) => c.toLowerCase().includes(q))
      );
    }
    if (selectedGenre !== 'All') {
      result = result.filter((b) => b.categories.includes(selectedGenre));
    }
    if (selectedLang !== 'All') {
      result = result.filter((b) => b.language === selectedLang);
    }
    switch (selectedSort) {
      case 'Top Rated':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'New Release':
        result = result.filter((b) => b.isNew);
        break;
      case 'Popular':
        result = result.filter((b) => b.isTrending).concat(result.filter((b) => !b.isTrending));
        break;
      case 'A-Z':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }
    return result;
  }, [selectedGenre, selectedLang, selectedSort, query]);

  return (
    <ScrollView
      className="flex-1 pt-4"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ gap: 16, paddingBottom: TAB_BAR_HEIGHT + insets.bottom }}
    >
      <View className="px-5">
        <View className="flex-row items-center gap-2 bg-secondary rounded-xl px-3 py-2.5">
          <Icon as={Search} className="size-4 text-muted-foreground shrink-0" />
          <Input
            placeholder="Search books by title, author, genre..."
            value={query}
            onChangeText={setQuery}
            className="flex-1 bg-transparent text-sm border-0 min-h-0 py-0"
          />
        </View>
      </View>

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

      <View className="px-5">
        <Text className="text-lg font-bold text-foreground mb-3">
          {query.trim() ? 'Results for "' + query + '"' : 'All Books'}
        </Text>
        {filteredBooks.length > 0 ? (
          <View className="flex-row flex-wrap gap-3" style={{ gap: 12 }}>
            {filteredBooks.map((book) => (
              <View key={book.id} style={{ width: '47%' }}>
                <BookCard book={book} onPress={openBook} />
              </View>
            ))}
          </View>
        ) : (
          <Text className="text-sm text-muted-foreground text-center py-10">
            No books found matching your criteria.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}
