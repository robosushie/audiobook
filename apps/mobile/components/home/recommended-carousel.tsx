import { BookCover } from '@/components/home/book-cover';
import { SectionHeader } from '@/components/home/section-header';
import { AppLoader } from '@/components/ui/app-loader';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { THEME } from '@/lib/theme';
import { formatLanguage } from '@/lib/format';
import type { BookRow } from '@/types/api';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

const CARD_GRADIENTS = [
  ['rgba(24, 24, 27, 0.85)', 'rgba(24, 24, 27, 0.35)'],
  ['rgba(120, 80, 40, 0.85)', 'rgba(120, 80, 40, 0.35)'],
  ['rgba(40, 90, 120, 0.85)', 'rgba(40, 90, 120, 0.35)'],
  ['rgba(90, 40, 80, 0.85)', 'rgba(90, 40, 80, 0.35)'],
  ['rgba(60, 100, 70, 0.85)', 'rgba(60, 100, 70, 0.35)'],
] as const;

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
    <View className="mb-7">
      <View className="px-5">
        <SectionHeader
          title="Recommended for you"
          subtitle="Picked for your taste"
          onSeeAll={books.length > 0 ? onSeeAll : undefined}
        />
      </View>

      {isLoading ? (
        <View className="flex-row items-center gap-2 px-5 py-8">
          <AppLoader size={22} color={THEME.mutedForeground} />
          <Text className="text-sm text-muted-foreground">Loading recommendations…</Text>
        </View>
      ) : books.length === 0 ? (
        <View className="mx-5 rounded-2xl border border-border/60 bg-card px-4 py-6">
          <Text className="text-center text-sm text-muted-foreground">
            Recommendations will appear when more books are in the catalogue.
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-3 px-5 pb-2"
          decelerationRate="fast"
          snapToInterval={176 + 12}>
          {books.map((book, index) => (
            <RecommendedCard
              key={book.id}
              book={book}
              gradient={CARD_GRADIENTS[index % CARD_GRADIENTS.length]}
              onPress={() => onBookPress?.(book)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function RecommendedCard({
  book,
  gradient,
  onPress,
}: {
  book: BookRow;
  gradient: readonly [string, string];
  onPress: () => void;
}) {
  const subtitle = book.genre
    ? book.genre.replace(/_/g, ' ')
    : formatLanguage(book.language);

  return (
    <Pressable onPress={onPress} className="h-56 w-44 overflow-hidden rounded-3xl shadow-pop">
      <View className="relative h-full w-full">
        <BookCover
          coverUrl={book.cover_url}
          seed={book.id}
          className="absolute inset-0 h-full w-full opacity-60"
          roundedClassName="rounded-none"
        />
        <LinearGradient
          colors={[gradient[0], gradient[1]]}
          className="absolute inset-0"
        />
        <View className="absolute inset-0 justify-between p-4">
          <View className="flex-row items-center gap-1 self-start rounded-full bg-background/90 px-2 py-1">
            <Icon as={Sparkles} className="size-2.5 text-foreground" />
            <Text className="text-[10px] font-bold uppercase tracking-wider text-foreground">
              For you
            </Text>
          </View>
          <View>
            <Text className="text-base font-bold leading-tight text-white" numberOfLines={2}>
              {book.title}
            </Text>
            <Text className="text-xs capitalize text-white/80" numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
