import { BookCover } from '@/components/home/book-cover';
import { AppLoader } from '@/components/ui/app-loader';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { playbackMeta } from '@/lib/format';
import type { PlaybackRow } from '@/types/api';
import { LinearGradient } from 'expo-linear-gradient';
import { Play } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';

type ContinueCardProps = {
  item: PlaybackRow;
  isLoading?: boolean;
  onPress?: () => void;
};

export function ContinueCard({ item, isLoading, onPress }: ContinueCardProps) {
  const { chapterLabel, minutesLeftLabel, percent } = playbackMeta(
    item.progress,
    item.audiobook_duration,
  );

  return (
    <Pressable onPress={onPress} className="overflow-hidden rounded-3xl shadow-pop">
      <View className="relative min-h-[120px] overflow-hidden rounded-3xl p-5">
        <View className="absolute inset-0">
          <BookCover
            coverUrl={item.book_cover_url}
            seed={item.book_id}
            className="h-full w-full"
            roundedClassName="rounded-none"
          />
          <LinearGradient
            colors={['rgba(20, 18, 16, 0.92)', 'rgba(20, 18, 16, 0.75)', 'rgba(20, 18, 16, 0.45)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            className="absolute inset-0"
          />
        </View>

        <View className="relative flex-row items-center gap-4">
          <BookCover
            coverUrl={item.book_cover_url}
            seed={item.book_id}
            className="h-20 w-20 shadow-lg"
            roundedClassName="rounded-2xl"
          />
          <View className="min-w-0 flex-1">
            <Text className="text-[10px] font-bold uppercase tracking-widest text-white/70">
              Continue
            </Text>
            <Text className="truncate font-bold text-white">{item.book_title}</Text>
            <Text className="mb-2 text-xs text-white/70">
              {chapterLabel} · {minutesLeftLabel}
            </Text>
            <View className="h-1 overflow-hidden rounded-full bg-white/20">
              <View className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
            </View>
          </View>
          <Pressable
            onPress={onPress}
            disabled={isLoading}
            className="h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent shadow-pop disabled:opacity-70">
            {isLoading ? (
              <AppLoader size={20} color="#ffffff" />
            ) : (
              <Icon as={Play} className="size-5 fill-accent-foreground text-accent-foreground" />
            )}
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}
