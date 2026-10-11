import { BookCover } from '@/components/home/book-cover';
import { SectionHeader } from '@/components/home/section-header';
import { AppLoader } from '@/components/ui/app-loader';
import { Text } from '@/components/ui/text';
import { formatBookGenre } from '@/lib/constants/genres';
import { THEME } from '@/lib/theme';
import type { BookRow } from '@/types/api';
import * as React from 'react';
import { Pressable, View } from 'react-native';

type RecommendedCarouselProps = {
  books: BookRow[];
  isLoading?: boolean;
  onBookPress?: (book: BookRow) => void;
  onSeeAll?: () => void;
};

export function RecommendedCarousel({
  books,
  isLoading,
  onBookPress,
  onSeeAll,
}: RecommendedCarouselProps) {
  return (
    <View className="mb-7 px-5">
      <SectionHeader
        title="Recommended for you"
        subtitle="Picked for your taste"
        onSeeAll={books.length > 0 ? onSeeAll : undefined}
      />

      {isLoading ? (
        <View className="flex-row items-center gap-2 py-8">
          <AppLoader size={22} color={THEME.mutedForeground} />
          <Text className="text-sm text-muted-foreground">Loading recommendations…</Text>
        </View>
      ) : books.length === 0 ? (
        <View className="rounded-2xl border border-border/60 bg-card px-4 py-6">
          <Text className="text-center text-sm text-muted-foreground">
            Recommendations will appear when more books are in the catalogue.
          </Text>
        </View>
      ) : (
        <View className="flex-row flex-wrap gap-3">
          {books.map((book) => (
            <Pressable
              key={book.id}
              onPress={() => onBookPress?.(book)}
              className="w-[47%] overflow-hidden rounded-md border border-border bg-card">
              <View className="w-full overflow-hidden" style={{ aspectRatio: 1 }}>
                <BookCover
                  coverUrl={book.cover_url}
                  seed={book.id}
                  size="thumb"
                  className="h-full w-full"
                  roundedClassName="rounded-none"
                  style={{ width: '100%', height: '100%' }}
                />
              </View>
              <View className="gap-0.5 p-2">
                <Text className="text-sm font-semibold text-foreground" numberOfLines={2}>
                  {book.title}
                </Text>
                <Text className="text-xs capitalize text-muted-foreground" numberOfLines={1}>
                  {book.genre ? formatBookGenre(book.genre) : 'Story'}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
