import { BookCover } from '@/components/home/book-cover';
import { Text } from '@/components/ui/text';
import { formatAuthorName, formatLanguage } from '@/lib/format';
import type { BookRow } from '@/types/api';
import * as React from 'react';
import { Pressable, View } from 'react-native';

type SearchResultsProps = {
  books: BookRow[];
  title?: string;
  onBookPress?: (book: BookRow) => void;
};

export function SearchResults({ books, title = 'Results', onBookPress }: SearchResultsProps) {
  if (books.length === 0) {
    return (
      <View className="rounded-2xl border border-border/60 bg-card px-4 py-6">
        <Text className="text-center text-sm text-muted-foreground">
          No books match your search. Try another title or category.
        </Text>
      </View>
    );
  }

  return (
    <View>
      <Text className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
        {title}
      </Text>
      <View className="gap-2">
        {books.map((book) => (
          <Pressable
            key={book.id}
            onPress={() => onBookPress?.(book)}
            className="flex-row items-center gap-3 rounded-2xl border border-border/60 bg-card active:bg-muted/50"
            style={{ padding: 4 }}>
            <BookCover coverUrl={book.cover_url} seed={book.id} className="h-14 w-14 rounded-xl" />
            <View className="min-w-0 flex-1">
              <Text className="text-sm font-semibold text-foreground" numberOfLines={2}>
                {book.title}
              </Text>
              <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                {formatAuthorName(book.author)} · {formatLanguage(book.language)}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
