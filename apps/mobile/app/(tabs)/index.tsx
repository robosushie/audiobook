import { ContinueCard } from '@/components/home/continue-card';
import { HomeHeader } from '@/components/home/home-header';
import { RecommendedCarousel } from '@/components/home/recommended-carousel';
import { TrendingList } from '@/components/home/trending-list';
import { YourAudiobooks } from '@/components/home/your-audiobooks';
import { Text } from '@/components/ui/text';
import { useAudiobookPlayer, useTabContentInset } from '@/contexts/audiobook-player';
import { useHomeFeed } from '@/hooks/useHomeFeed';
import { playableFromPlaybackRow } from '@/lib/audio/playable';
import { openBook } from '@/lib/navigation/book';
import { useUser } from '@clerk/expo';
import { useRouter } from 'expo-router';
import * as React from 'react';
import type { BookRow } from '@/types/api';
import { LoadingState } from '@/components/ui/app-loader';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const scrollBottomPadding = useTabContentInset();
  const {
    isInitialLoading,
    isRefreshing,
    error,
    continueItem,
    myAudiobooks,
    recommendedBooks,
    trendingBooks,
    refetch,
  } = useHomeFeed();
  const {
    isLoadingAudio,
    playAudiobook,
  } = useAudiobookPlayer();

  const continuePlayable = continueItem ? playableFromPlaybackRow(continueItem) : null;

  const firstName = user?.firstName ?? user?.username ?? null;
  const showInitialSpinner = isInitialLoading && !continueItem && trendingBooks.length === 0;

  const handleBookPress = React.useCallback(
    (book: BookRow) => {
      openBook(router, book);
    },
    [router],
  );

  const featuredCard = React.useMemo(() => {
    if (!continueItem || !continuePlayable) return null;

    return (
      <ContinueCard
        item={continueItem}
        isLoading={isLoadingAudio}
        onPress={() => {
          playAudiobook(continuePlayable);
        }}
      />
    );
  }, [continueItem, continuePlayable, isLoadingAudio, playAudiobook]);

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1 bg-background"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: scrollBottomPadding }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refetch} />
        }>
        <HomeHeader firstName={firstName} topInset={insets.top} />

          {showInitialSpinner ? <LoadingState className="py-16" /> : null}

        {error ? (
          <View className="mx-5 mb-6 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3">
            <Text className="text-sm text-destructive">{error}</Text>
          </View>
        ) : null}

        {featuredCard ? <View className="mb-7 px-5">{featuredCard}</View> : null}

        <YourAudiobooks items={myAudiobooks} isLoading={isInitialLoading} />

        <RecommendedCarousel
          books={recommendedBooks}
          isLoading={isInitialLoading}
          onBookPress={handleBookPress}
        />

        <TrendingList
          books={trendingBooks}
          isLoading={isInitialLoading}
          onBookPress={handleBookPress}
        />
      </ScrollView>
    </View>
  );
}
