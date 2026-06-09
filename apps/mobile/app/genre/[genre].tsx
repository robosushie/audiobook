import { ScreenHeader } from '@/components/layout/screen-header';
import { SearchInput } from '@/components/search/search-input';
import { SearchResults } from '@/components/search/search-results';
import { LoadingState } from '@/components/ui/app-loader';
import { Text } from '@/components/ui/text';
import { useCatalogueBooks } from '@/hooks/useCatalogueBooks';
import { formatBookGenre } from '@/lib/constants/genres';
import { openBook } from '@/lib/navigation/book';
import { matchesBookQuery } from '@/lib/search/matches-query';
import type { BookRow } from '@/types/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function GenreBrowseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { genre: genreParam } = useLocalSearchParams<{ genre: string }>();
  const genreSlug = typeof genreParam === 'string' ? genreParam : genreParam?.[0];

  const { books, isLoading, error, refetch } = useCatalogueBooks();
  const [query, setQuery] = React.useState('');

  const genreLabel = genreSlug ? formatBookGenre(genreSlug) : 'Genre';

  const genreBooks = React.useMemo(() => {
    if (!genreSlug) return [];
    return books.filter((book) => book.genre === genreSlug);
  }, [books, genreSlug]);

  const filteredBooks = React.useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return genreBooks;
    return genreBooks.filter((book) => matchesBookQuery(book, trimmed));
  }, [genreBooks, query]);

  const handleBookPress = React.useCallback(
    (book: BookRow) => {
      openBook(router, book);
    },
    [router],
  );

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1 bg-background"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 24,
        }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={() => void refetch()} />
        }>
        <View className="px-5 pb-4">
          <ScreenHeader title={genreLabel} onBack={() => router.back()} />
          <SearchInput value={query} onChangeText={setQuery} />
        </View>

        {error ? (
          <View className="mx-5 mb-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3">
            <Text className="text-sm text-destructive">{error}</Text>
          </View>
        ) : null}

        {isLoading && books.length === 0 ? <LoadingState className="py-12" /> : null}

        <View className="px-5">
          <SearchResults
            books={filteredBooks}
            title={`${genreLabel} · ${filteredBooks.length}`}
            onBookPress={handleBookPress}
          />
        </View>
      </ScrollView>
    </View>
  );
}
