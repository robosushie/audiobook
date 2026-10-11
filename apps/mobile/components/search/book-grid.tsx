import { BookCover } from '@/components/home/book-cover';
import { Text } from '@/components/ui/text';
import { formatBookGenre } from '@/lib/constants/genres';
import { cn } from '@/lib/utils';
import type { BookRow } from '@/types/api';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from '@/components/ui/icon';

type BookGridProps = {
  books: BookRow[];
  onBookPress?: (book: BookRow) => void;
};

export function BookGrid({ books, onBookPress }: BookGridProps) {
  if (books.length === 0) {
    return (
      <View className="rounded-2xl border border-border/60 bg-card px-4 py-6">
        <Text className="text-center text-sm text-muted-foreground">
          No books match these filters.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-row flex-wrap gap-3">
      {books.map((book) => (
        <Pressable
          key={book.id}
          onPress={() => onBookPress?.(book)}
          className="w-[47%] overflow-hidden rounded-md border border-border bg-card">
          <View className="w-full overflow-hidden" style={{ aspectRatio: 3 / 4 }}>
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
  );
}

type CataloguePagerProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
};

export function CataloguePager({ page, pageSize, total, onPageChange }: CataloguePagerProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(page, 1), pageCount);

  return (
    <View className="flex-row items-center justify-center gap-3 py-4">
      <Pressable
        accessibilityLabel="Previous page"
        disabled={current <= 1}
        onPress={() => onPageChange(current - 1)}
        className={cn(
          'h-9 w-9 items-center justify-center rounded-full border border-border bg-card',
          current <= 1 && 'opacity-40',
        )}>
        <Icon as={ChevronLeft} className="size-4 text-foreground" />
      </Pressable>
      <Text className="min-w-28 text-center text-sm text-muted-foreground">
        Page {current} of {pageCount}
      </Text>
      <Pressable
        accessibilityLabel="Next page"
        disabled={current >= pageCount}
        onPress={() => onPageChange(current + 1)}
        className={cn(
          'h-9 w-9 items-center justify-center rounded-full border border-border bg-card',
          current >= pageCount && 'opacity-40',
        )}>
        <Icon as={ChevronRight} className="size-4 text-foreground" />
      </Pressable>
    </View>
  );
}
