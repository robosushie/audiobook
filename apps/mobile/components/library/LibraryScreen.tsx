import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FilterBar, AudiobookCard } from '@/components/shared';
import { Icon } from '@/components/ui/icon';
import { Loader2 } from 'lucide-react-native';
import { Image } from 'react-native';
import {
  myLibrary,
  processingAudiobooks,
  genres,
} from '@/lib/audio-library';
import { useAudioLibraryStore } from '@/lib/audio-library/store';

const LANGUAGES = ['All', 'English', 'Hindi', 'Arabic'];
const SORT_OPTIONS = ['Recent', 'A-Z'];
const TAB_BAR_HEIGHT = 64;

export function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const playAudiobook = useAudioLibraryStore((s) => s.playAudiobook);

  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedLang, setSelectedLang] = useState('All');
  const [selectedSort, setSelectedSort] = useState('Recent');

  const filteredCompleted = useMemo(() => {
    return myLibrary.filter((b) => {
      if (selectedGenre !== 'All' && b.genre !== selectedGenre) return false;
      if (selectedLang !== 'All' && b.language !== selectedLang) return false;
      return true;
    });
  }, [selectedGenre, selectedLang]);

  return (
    <ScrollView
      className="flex-1 pt-4"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ gap: 24, paddingBottom: TAB_BAR_HEIGHT + insets.bottom }}
    >
      {processingAudiobooks.length > 0 && (
        <View className="px-5">
          <Text className="text-lg font-bold text-foreground mb-3">Processing</Text>
          <View className="gap-2">
            {processingAudiobooks.map((book) => (
              <View
                key={book.id}
                className="flex-row items-center gap-3 p-3 rounded-xl bg-card border border-border"
              >
                <Image
                  source={{ uri: book.cover }}
                  className="w-12 h-12 rounded-lg shrink-0"
                  resizeMode="cover"
                />
                <View className="flex-1 min-w-0">
                  <Text className="text-sm font-medium text-foreground truncate">{book.title}</Text>
                  <Text className="text-[10px] text-muted-foreground">
                    {book.voiceName} · {book.language}
                  </Text>
                  <View className="flex-row items-center gap-2 mt-1.5">
                    <View className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <View
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${book.progress * 100}%` }}
                      />
                    </View>
                    <Text className="text-[10px] text-primary font-medium shrink-0">
                      {Math.round(book.progress * 100)}%
                    </Text>
                  </View>
                </View>
                <Icon as={Loader2} className="size-4 text-primary shrink-0" />
              </View>
            ))}
          </View>
        </View>
      )}

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
        <Text className="text-lg font-bold text-foreground mb-3">My Audiobooks</Text>
        {filteredCompleted.length > 0 ? (
          <View className="flex-row flex-wrap -mx-1.5">
            {filteredCompleted.map((book) => (
              <View key={book.id} className="w-1/2 px-1.5 mb-3">
                <AudiobookCard book={book} onPress={playAudiobook} />
              </View>
            ))}
          </View>
        ) : (
          <Text className="text-sm text-muted-foreground text-center py-10">
            No audiobooks match your filters.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}
