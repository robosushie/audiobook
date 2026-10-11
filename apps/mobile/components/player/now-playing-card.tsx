import { BookCover } from '@/components/home/book-cover';
import { AppLoader } from '@/components/ui/app-loader';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { PlayableAudiobook } from '@/lib/audio/playable';
import { playbackMeta } from '@/lib/format';
import { Pause, Play } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';

type NowPlayingCardProps = {
  item: PlayableAudiobook;
  progress: number;
  isPlaying: boolean;
  isLoading: boolean;
  onTogglePlay: () => void;
};

export function NowPlayingCard({
  item,
  progress,
  isPlaying,
  isLoading,
  onTogglePlay,
}: NowPlayingCardProps) {
  const { chapterLabel, minutesLeftLabel, percent } = playbackMeta(
    progress,
    item.duration ?? null,
  );

  return (
    <Pressable
      onPress={onTogglePlay}
      className="overflow-hidden rounded-md border border-border bg-card">
      <View className="flex-row items-center gap-4 p-4">
        <BookCover
          coverUrl={item.book_cover_url}
          seed={item.book_id}
          className="h-20 w-20"
          roundedClassName="rounded-md"
        />
        <View className="min-w-0 flex-1">
          <Text className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Now playing
          </Text>
          <Text className="truncate font-bold text-foreground">{item.book_title ?? 'Audiobook'}</Text>
          <Text className="mb-2 text-xs text-muted-foreground">
            {chapterLabel} · {minutesLeftLabel}
          </Text>
          <View className="h-1 overflow-hidden bg-muted">
            <View className="h-full bg-tag-blue" style={{ width: `${percent}%` }} />
          </View>
        </View>
        <Pressable
          onPress={onTogglePlay}
          disabled={isLoading}
          className="h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary disabled:opacity-70">
          {isLoading ? (
            <AppLoader size={20} color="#ffffff" />
          ) : (
            <Icon
              as={isPlaying ? Pause : Play}
              className="size-5 fill-primary-foreground text-primary-foreground"
            />
          )}
        </Pressable>
      </View>
    </Pressable>
  );
}
