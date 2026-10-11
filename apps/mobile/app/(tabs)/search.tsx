import { BookGrid, CataloguePager } from '@/components/search/book-grid';
import { CatalogueFilters } from '@/components/search/catalogue-filters';
import { SearchInput } from '@/components/search/search-input';
import { LoadingState } from '@/components/ui/app-loader';
import { Text } from '@/components/ui/text';
import { useTabContentInset } from '@/contexts/audiobook-player';
import { CATALOGUE_PAGE_SIZE, useCatalogueBooks } from '@/hooks/useCatalogueBooks';
import { openBook } from '@/lib/navigation/book';
import type { BookRow } from '@/types/api';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollBottomPadding = useTabContentInset();
  const [query, setQuery] = React.useState('');
  const [debouncedQuery, setDebouncedQuery] = React.useState('');
  const [genre, setGenre] = React.useState<string | null>(null);
  const [language, setLanguage] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const { books, total, isLoading, error, refetch } = useCatalogueBooks({
    q: debouncedQuery || undefined,
    genre: genre ?? undefined,
    language: language ?? undefined,
    page,
  });

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
          paddingBottom: scrollBottomPadding,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => {
              if (page !== 1) setPage(1);
              else void refetch();
            }}
          />
        }>
        <View className="gap-3 px-5 pb-4">
          <Text className="text-2xl font-bold tracking-tight">Search</Text>
          <SearchInput value={query} onChangeText={setQuery} />
          <CatalogueFilters
            genre={genre}
            language={language}
            onGenreChange={(next) => {
              setGenre(next);
              setPage(1);
            }}
            onLanguageChange={(next) => {
              setLanguage(next);
              setPage(1);
            }}
          />
        </View>

        {error ? (
          <View className="mx-5 mb-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3">
            <Text className="text-sm text-destructive">{error}</Text>
          </View>
        ) : null}

        {isLoading && books.length === 0 ? <LoadingState className="py-12" /> : null}

        <View className="px-5">
          <BookGrid books={books} onBookPress={handleBookPress} />
          <CataloguePager
            page={page}
            pageSize={CATALOGUE_PAGE_SIZE}
            total={total}
            onPageChange={setPage}
          />
        </View>
      </ScrollView>
    </View>
  );
}
