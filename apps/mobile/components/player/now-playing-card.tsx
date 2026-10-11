import { BookCover } from '@/components/home/book-cover';
import { AppLoader } from '@/components/ui/app-loader';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { PlayableAudiobook } from '@/lib/audio/playable';
import { playbackMeta } from '@/lib/format';
import { BlurView } from 'expo-blur';
import { Pause, Play, X } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

type NowPlayingCardProps = {
  item: PlayableAudiobook;
  progress: number;
  isPlaying: boolean;
  isLoading: boolean;
  onTogglePlay: () => void;
  onDismiss: () => void;
};

export function NowPlayingCard({
  item,
  progress,
  isPlaying,
  isLoading,
  onTogglePlay,
  onDismiss,
}: NowPlayingCardProps) {
  const { chapterLabel, minutesLeftLabel, percent } = playbackMeta(
    progress,
    item.duration ?? null,
  );

  return (
    <View className="overflow-hidden rounded-2xl border border-white/80">
      <BlurView intensity={42} tint="light" style={StyleSheet.absoluteFill} />
      <View className="flex-row items-center gap-2 bg-white/70 px-2 py-1.5">
        <BookCover
          coverUrl={item.book_cover_url}
          seed={item.book_id}
          className="h-10 w-10"
          roundedClassName="rounded-md"
        />
        <View className="min-w-0 flex-1">
          <Text className="text-[13px] font-semibold text-foreground" numberOfLines={1}>
            {item.book_title ?? 'Audiobook'}
          </Text>
          <Text className="text-[11px] text-muted-foreground" numberOfLines={1}>
            {chapterLabel} · {minutesLeftLabel}
          </Text>
          <View className="mt-1 h-[3px] overflow-hidden bg-black/10">
            <View className="h-full bg-tag-blue" style={{ width: `${percent}%` }} />
          </View>
        </View>
        <Pressable
          onPress={onTogglePlay}
          disabled={isLoading}
          accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
          className="h-8 w-8 items-center justify-center rounded-full bg-primary disabled:opacity-70">
          {isLoading ? (
            <AppLoader size={14} color="#ffffff" />
          ) : (
            <Icon
              as={isPlaying ? Pause : Play}
              className="size-3.5 fill-primary-foreground text-primary-foreground"
            />
          )}
        </Pressable>
        <Pressable
          onPress={onDismiss}
          accessibilityLabel="Close player"
          className="h-8 w-8 items-center justify-center rounded-full border border-border bg-white/70">
          <Icon as={X} className="size-3.5 text-foreground" />
        </Pressable>
      </View>
    </View>
  );
}
