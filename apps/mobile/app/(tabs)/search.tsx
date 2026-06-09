import { BrowseAllSection } from '@/components/search/browse-all-section';
import { LoadingState } from '@/components/ui/app-loader';
import { SearchInput } from '@/components/search/search-input';
import { SearchResults } from '@/components/search/search-results';
import { Text } from '@/components/ui/text';
import { useCatalogueBooks } from '@/hooks/useCatalogueBooks';
import { openBook } from '@/lib/navigation/book';
import { matchesBookQuery } from '@/lib/search/matches-query';
import { useRouter } from 'expo-router';
import type { BookRow } from '@/types/api';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import * as React from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { books, isLoading, error, refetch } = useCatalogueBooks();

  const [query, setQuery] = React.useState('');

  const coverByGenre = React.useMemo(() => {
    const map = new Map<string, string | null>();
    for (const book of books) {
      if (!book.genre || map.has(book.genre)) continue;
      map.set(book.genre, book.cover_url ?? null);
    }
    return map;
  }, [books]);

  const trimmedQuery = query.trim();
  const hasSearchQuery = trimmedQuery.length > 0;

  const searchResults = React.useMemo(() => {
    if (!hasSearchQuery) return [];
    const q = trimmedQuery.toLowerCase();
    return books.filter((book) => matchesBookQuery(book, q));
  }, [books, hasSearchQuery, trimmedQuery]);

  const handleBookPress = React.useCallback(
    (book: BookRow) => {
      openBook(router, book);
    },
    [router],
  );

  const handleCategoryPress = React.useCallback(
    (genre: string) => {
      router.push(`/genre/${genre}`);
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
          paddingBottom: tabBarHeight + 16,
        }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={() => void refetch()} />
        }>
        <View className="px-5 pb-4">
          <Text className="mb-4 text-2xl font-bold tracking-tight">Search</Text>
          <SearchInput value={query} onChangeText={setQuery} />
        </View>

        {error ? (
          <View className="mx-5 mb-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3">
            <Text className="text-sm text-destructive">{error}</Text>
          </View>
        ) : null}

        {isLoading && books.length === 0 ? <LoadingState className="py-12" /> : null}

        {hasSearchQuery ? (
          <View className="mb-6 px-5">
            <SearchResults
              books={searchResults}
              title="Results"
              onBookPress={handleBookPress}
            />
          </View>
        ) : (
          <BrowseAllSection
            coverByGenre={coverByGenre}
            onCategoryPress={handleCategoryPress}
          />
        )}
      </ScrollView>
    </View>
  );
}
