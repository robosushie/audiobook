import { Icon } from '@/components/ui/icon';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, SkipBack, SkipForward, ChevronDown, ChevronUp, X } from 'lucide-react-native';
import { useState } from 'react';
import { Image, Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudioLibraryStore } from '@/lib/audio-library/store';
import { cn } from '@/lib/utils';

const TAB_BAR_HEIGHT = 64;

function formatTime(progress: number, duration: string): string {
  const match = duration.match(/(\d+)h?\s*(\d+)?m?/);
  if (!match) return '0:00';
  const hours = parseInt(match[1], 10) || 0;
  const minutes = parseInt(match[2], 10) || 0;
  const totalMinutes = hours * 60 + minutes;
  const currentMinutes = Math.round(totalMinutes * progress);
  const h = Math.floor(currentMinutes / 60);
  const m = currentMinutes % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function PlayerBar() {
  const insets = useSafeAreaInsets();
  const currentBook = useAudioLibraryStore((s) => s.currentBook);
  const closePlayer = useAudioLibraryStore((s) => s.closePlayer);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(currentBook?.progress ?? 0);
  const [expanded, setExpanded] = useState(false);

  if (!currentBook) return null;

  const progressPercent = progress * 100;
  const bottomOffset = TAB_BAR_HEIGHT + insets.bottom;

  const collapsedBar = (
    <View
      className="absolute left-1 right-1 z-40 overflow-hidden rounded-md border border-border/50 bg-card shadow-lg"
      style={{ bottom: bottomOffset }}>
      <Pressable
        onPress={() => setExpanded(true)}
        className="flex-row items-center gap-3 px-3 pb-2.5 pt-2.5">
        <Image
          source={{ uri: currentBook.cover }}
          className="h-11 w-11 shrink-0 rounded-lg"
          resizeMode="cover"
        />
        <View className="min-w-0 flex-1">
          <Text className="truncate text-sm font-medium text-foreground" numberOfLines={1}>
            {currentBook.title}
          </Text>
          <Text className="truncate text-xs text-muted-foreground" numberOfLines={1}>
            {currentBook.author}
          </Text>
        </View>
        <Pressable
          onPress={(e) => {
            e?.stopPropagation?.();
            setIsPlaying(!isPlaying);
          }}
          className="h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary">
          <Icon
            as={isPlaying ? Pause : Play}
            className={cn('size-4 text-primary-foreground', !isPlaying && 'ml-0.5')}
          />
        </Pressable>
        <Pressable
          onPress={(e) => {
            e?.stopPropagation?.();
            setExpanded(true);
          }}
          className="h-8 w-8 shrink-0 items-center justify-center rounded-full">
          <Icon as={ChevronUp} className="size-4 text-muted-foreground" />
        </Pressable>
        <Pressable
          onPress={(e) => {
            e?.stopPropagation?.();
            closePlayer();
          }}
          className="h-8 w-8 shrink-0 items-center justify-center rounded-full">
          <Icon as={X} className="size-4 text-muted-foreground" />
        </Pressable>
      </Pressable>
      {/* Thin progress bar at bottom, inset from widget edges, flush to widget bottom */}
      <View className="px-3 pb-1.5">
        <View className="h-0.5 w-full overflow-hidden rounded-full bg-secondary">
          <View
            className="h-full rounded-full bg-primary"
            style={{ width: `${progressPercent}%` }}
          />
        </View>
      </View>
    </View>
  );

  const expandedContent = (
    <View className="flex-1">
      <Image
        source={{ uri: currentBook.cover }}
        className="absolute inset-0 h-full w-full"
        resizeMode="cover"
      />
      <View className="absolute inset-0 bg-black/50" />
      <View className="relative z-10 flex-row items-center justify-between px-5 py-4">
        <Pressable onPress={() => setExpanded(false)}>
          <Icon as={ChevronDown} className="size-6 text-white" />
        </Pressable>
        <Text className="text-sm font-medium text-white/70">Now Playing</Text>
        <View className="w-6" />
      </View>
      <View className="relative z-10 flex-1 items-center justify-center gap-6 px-10">
        <View className="h-56 w-56 overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
          <Image source={{ uri: currentBook.cover }} className="h-full w-full" resizeMode="cover" />
        </View>
        <View className="items-center">
          <Text className="text-center text-xl font-bold text-white">{currentBook.title}</Text>
          <Text className="mt-1 text-sm text-white/70">{currentBook.author}</Text>
          {currentBook.voiceName && (
            <Text className="mt-1 text-xs font-medium text-primary">{currentBook.voiceName}</Text>
          )}
        </View>
        <View className="w-full">
          <Progress value={progressPercent} className="h-2" indicatorClassName="bg-primary" />
          <View className="mt-1 flex-row justify-between">
            <Text className="text-[10px] text-white/50">
              {formatTime(progress, currentBook.duration)}
            </Text>
            <Text className="text-[10px] text-white/50">{currentBook.duration}</Text>
          </View>
        </View>
        <View className="flex-row items-center gap-8">
          <Pressable className="h-10 w-10 items-center justify-center">
            <Icon as={SkipBack} className="size-5 text-white" />
          </Pressable>
          <Pressable
            onPress={() => setIsPlaying(!isPlaying)}
            className="h-14 w-14 items-center justify-center rounded-full bg-primary shadow-md">
            <Icon
              as={isPlaying ? Pause : Play}
              className={cn('size-6 text-primary-foreground', !isPlaying && 'ml-0.5')}
            />
          </Pressable>
          <Pressable className="h-10 w-10 items-center justify-center">
            <Icon as={SkipForward} className="size-5 text-white" />
          </Pressable>
        </View>
      </View>
    </View>
  );

  if (expanded) {
    return (
      <Modal visible animationType="slide" statusBarTranslucent>
        <View className="flex-1 bg-black">{expandedContent}</View>
      </Modal>
    );
  }

  return collapsedBar;
}
