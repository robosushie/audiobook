import { BookCover } from '@/components/home/book-cover';
import { SectionHeader } from '@/components/home/section-header';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useAudiobookPlayer } from '@/contexts/audiobook-player';
import { canPlayAudiobook, playableFromAudiobookRow } from '@/lib/audio/playable';
import { formatAuthorName, formatLanguage } from '@/lib/format';
import type { AudiobookRow } from '@/types/api';
import { Pause, Play } from 'lucide-react-native';
import * as React from 'react';
import { AppLoader, LoadingState } from '@/components/ui/app-loader';
import { Pressable, View } from 'react-native';

type YourAudiobooksProps = {
  items: AudiobookRow[];
  isLoading?: boolean;
  onSeeAll?: () => void;
};

export function YourAudiobooks({ items, isLoading, onSeeAll }: YourAudiobooksProps) {
  const { playingAudiobookId, isPlaying, isLoadingAudio, getProgress, playAudiobook } =
    useAudiobookPlayer();
  const [loadingId, setLoadingId] = React.useState<string | null>(null);

  const handlePlay = React.useCallback(
    async (item: AudiobookRow) => {
      setLoadingId(item.id);
      try {
        await playAudiobook(playableFromAudiobookRow(item));
      } finally {
        setLoadingId((current) => (current === item.id ? null : current));
      }
    },
    [playAudiobook],
  );

  return (
    <View className="mb-7 px-5">
      <SectionHeader title="Your audio books" onSeeAll={items.length > 0 ? onSeeAll : undefined} />

      {isLoading ? (
        <LoadingState label="Loading your audiobooks…" className="py-8" />
      ) : items.length === 0 ? (
        <View className="rounded-2xl border border-border/60 bg-card px-4 py-6">
          <Text className="text-center text-sm text-muted-foreground">
            You can select any book to generate an audiobook.
          </Text>
        </View>
      ) : (
        <View className="gap-3">
          {items.map((item) => (
            <AudiobookRowCard
              key={item.id}
              item={item}
              progress={getProgress(playableFromAudiobookRow(item))}
              isActive={playingAudiobookId === item.id}
              isPlaying={playingAudiobookId === item.id && isPlaying}
              isLoading={
                loadingId === item.id || (isLoadingAudio && playingAudiobookId === item.id)
              }
              onPlay={() => void handlePlay(item)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function AudiobookRowCard({
  item,
  progress,
  isActive,
  isPlaying,
  isLoading,
  onPlay,
}: {
  item: AudiobookRow;
  progress: number;
  isActive: boolean;
  isPlaying: boolean;
  isLoading: boolean;
  onPlay: () => void;
}) {
  const percent = Math.round(clampProgress(progress) * 100);
  const canPlay = canPlayAudiobook(playableFromAudiobookRow(item));
  const authorLine = formatAuthorName(item.book_author);
  const languageLine = item.book_language ? formatLanguage(item.book_language) : null;

  return (
    <Pressable
      onPress={canPlay ? onPlay : undefined}
      className="overflow-hidden rounded-2xl border border-border/60 bg-card active:bg-muted/40">
      <View className="flex-row items-center gap-1" style={{ padding: 4 }}>
        <BookCover
          coverUrl={item.book_cover_url}
          seed={item.book_id}
          className="h-16 w-16 shrink-0"
          roundedClassName="rounded-xl"
        />
        <View className="min-w-0 flex-1 gap-0.5">
          <Text className="text-sm font-semibold text-foreground" numberOfLines={2}>
            {item.book_title ?? 'Audiobook'}
          </Text>
          <Text className="text-xs text-muted-foreground" numberOfLines={1}>
            {authorLine}
          </Text>
          {languageLine ? (
            <Text className="text-xs text-muted-foreground" numberOfLines={1}>
              {languageLine}
            </Text>
          ) : null}
        </View>
        <Pressable
          onPress={onPlay}
          disabled={!canPlay || isLoading}
          hitSlop={8}
          className="h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary disabled:opacity-40">
          {isLoading ? (
            <AppLoader size={18} color="#ffffff" />
          ) : (
            <Icon
              as={isActive && isPlaying ? Pause : Play}
              className="size-5 fill-primary-foreground text-primary-foreground"
            />
          )}
        </Pressable>
      </View>
      <View className="h-1 bg-muted">
        <View className="h-full bg-tag-blue" style={{ width: `${percent}%` }} />
      </View>
    </Pressable>
  );
}

function clampProgress(value: number) {
  return Math.min(Math.max(value, 0), 1);
}
