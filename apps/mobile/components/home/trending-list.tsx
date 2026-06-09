import { BookCover } from '@/components/home/book-cover';
import { SectionHeader } from '@/components/home/section-header';
import { LoadingState } from '@/components/ui/app-loader';
import { Text } from '@/components/ui/text';
import { formatAuthorName, formatLanguage } from '@/lib/format';
import type { BookRow } from '@/types/api';
import * as React from 'react';
import { Pressable, View } from 'react-native';

type TrendingListProps = {
  books: BookRow[];
  isLoading?: boolean;
  onBookPress?: (book: BookRow) => void;
  onSeeAll?: () => void;
};

export function TrendingList({ books, isLoading, onBookPress, onSeeAll }: TrendingListProps) {
  return (
    <View className="mb-6 px-5">
      <SectionHeader title="Trending now" onSeeAll={books.length > 0 ? onSeeAll : undefined} />

      {isLoading ? (
        <LoadingState label="Loading trending books…" className="py-8" />
      ) : books.length === 0 ? (
        <View className="rounded-2xl border border-border/60 bg-card px-4 py-6">
          <Text className="text-center text-sm text-muted-foreground">
            No trending books right now. Check back soon.
          </Text>
        </View>
      ) : (
        <View className="gap-3">
          {books.map((book, index) => (
            <Pressable
              key={book.id}
              onPress={() => onBookPress?.(book)}
              className="-mx-2 flex-row items-center gap-3 rounded-2xl px-2 py-1.5 active:bg-muted/60">
              <Text className="w-5 text-center text-lg font-bold tabular-nums text-muted-foreground">
                {index + 1}
              </Text>
              <BookCover
                coverUrl={book.cover_url}
                seed={book.id}
                className="h-12 w-12"
                roundedClassName="rounded-xl"
              />
              <View className="min-w-0 flex-1">
                <Text className="truncate text-sm font-semibold text-foreground">{book.title}</Text>
                <Text className="truncate text-xs text-muted-foreground">
                  {formatAuthorName(book.author)} · {formatLanguage(book.language)}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
