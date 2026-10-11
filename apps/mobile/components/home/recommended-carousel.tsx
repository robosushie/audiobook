import { SectionHeader } from '@/components/home/section-header';
import { AppLoader } from '@/components/ui/app-loader';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { BRAND } from '@/lib/constants/brand';
import { formatLanguage } from '@/lib/format';
import { THEME } from '@/lib/theme';
import type { BookRow } from '@/types/api';
import { Sparkles } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

const CARD_COLORS = [BRAND.signal, BRAND.pulse, BRAND.hot, BRAND.solar, '#9664d7'] as const;

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
              color={CARD_COLORS[index % CARD_COLORS.length]}
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
  color,
  onPress,
}: {
  book: BookRow;
  color: string;
  onPress: () => void;
}) {
  const subtitle = book.genre
    ? book.genre.replace(/_/g, ' ')
    : formatLanguage(book.language);

  return (
    <Pressable onPress={onPress} className="h-56 w-44 overflow-hidden">
      <View className="h-full w-full justify-between p-4" style={{ backgroundColor: color }}>
          <View className="flex-row items-center gap-1 self-start rounded-full bg-background/90 px-2 py-1">
            <Icon as={Sparkles} className="size-2.5 text-foreground" />
            <Text className="text-[10px] font-bold uppercase tracking-wider text-foreground">
              For you
            </Text>
          </View>
          <View>
            <Text className="text-base font-bold leading-tight text-foreground" numberOfLines={2}>
              {book.title}
            </Text>
            <Text className="text-xs capitalize text-foreground/70" numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
      </View>
    </Pressable>
  );
}
