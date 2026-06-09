import { BookCover } from '@/components/home/book-cover';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useAudiobookPlayer } from '@/contexts/audiobook-player';
import { canPlayAudiobook, playableFromAudiobookRow } from '@/lib/audio/playable';
import { formatAuthorName } from '@/lib/format';
import { isInProgressStatus } from '@/lib/library/filters';
import type { AudiobookRow } from '@/types/api';
import { Pause, Play } from 'lucide-react-native';
import * as React from 'react';
import { AppLoader } from '@/components/ui/app-loader';
import { THEME } from '@/lib/theme';
import { Pressable, View } from 'react-native';

type LibraryAudiobookRowProps = {
  item: AudiobookRow;
};

export function LibraryAudiobookRow({ item }: LibraryAudiobookRowProps) {
  const { playingAudiobookId, isPlaying, isLoadingAudio, getProgress, playAudiobook } =
    useAudiobookPlayer();
  const [playLoading, setPlayLoading] = React.useState(false);

  const inProgress = isInProgressStatus(item.status);
  const failed = item.status === 'failed';
  const playable = playableFromAudiobookRow(item);
  const canPlay = canPlayAudiobook(playable);
  const progress = clampProgress(getProgress(playable));
  const percent = Math.round(progress * 100);
  const isDone = item.status === 'completed' && percent >= 100;
  const isActive = playingAudiobookId === item.id;
  const showPause = isActive && isPlaying;

  const handlePlay = async () => {
    if (!canPlay) return;
    setPlayLoading(true);
    try {
      await playAudiobook(playable);
    } finally {
      setPlayLoading(false);
    }
  };

  return (
    <View
      className="flex-row items-center gap-3 rounded-2xl border border-border/60 bg-card"
      style={{ padding: 4 }}>
      <View className="relative shrink-0">
        <BookCover
          coverUrl={item.book_cover_url}
          seed={item.book_id}
          className="h-16 w-16"
          roundedClassName="rounded-xl"
        />
        {inProgress ? (
          <View className="absolute inset-0 items-center justify-center rounded-xl bg-secondary/70">
            <AppLoader size={20} color={THEME.mutedForeground} />
          </View>
        ) : null}
        {isDone ? (
          <View className="absolute inset-0 items-center justify-center rounded-xl bg-secondary/60">
            <Text className="text-[9px] font-bold uppercase tracking-wider text-secondary-foreground">
              Done
            </Text>
          </View>
        ) : null}
        {failed ? (
          <View className="absolute inset-0 items-center justify-center rounded-xl bg-destructive/75">
            <Text className="text-[9px] font-bold uppercase tracking-wider text-destructive-foreground">
              Failed
            </Text>
          </View>
        ) : null}
      </View>

      <View className="min-w-0 flex-1">
        <Text className="truncate text-sm font-semibold text-foreground">
          {item.book_title ?? 'Audiobook'}
        </Text>
        <Text className="truncate text-xs text-muted-foreground">
          {formatAuthorName(item.book_author)}
        </Text>
        {inProgress ? (
          <Text className="mt-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {item.status === 'queued' ? 'Queued' : 'Processing'}…
          </Text>
        ) : failed ? (
          <Text className="mt-1.5 text-[10px] font-medium text-destructive">Generation failed</Text>
        ) : (
          <View className="mt-1.5 flex-row items-center gap-2">
            <View className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
              <View
                className="h-full rounded-full bg-primary"
                style={{ width: `${percent}%` }}
              />
            </View>
            <Text className="text-[10px] tabular-nums text-muted-foreground">{percent}%</Text>
          </View>
        )}
      </View>

      <Pressable
        onPress={() => void handlePlay()}
        disabled={!canPlay || playLoading || inProgress || failed}
        className="h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent shadow-soft disabled:opacity-35">
        {playLoading || (isLoadingAudio && playingAudiobookId === item.id) ? (
          <AppLoader size={18} color="#ffffff" />
        ) : (
          <Icon
            as={showPause ? Pause : Play}
            className="ml-0.5 size-4 fill-accent-foreground text-accent-foreground"
          />
        )}
      </Pressable>
    </View>
  );
}

function clampProgress(value: number) {
  return Math.min(Math.max(value, 0), 1);
}
