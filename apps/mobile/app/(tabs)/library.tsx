import {
  LibraryFilterChips,
  LibraryMetaRow,
  ShowFailedToggle,
} from '@/components/library/filter-chips';
import { LibraryAudiobookRow } from '@/components/library/library-audiobook-row';
import { LoadingState } from '@/components/ui/app-loader';
import { Text } from '@/components/ui/text';
import { useLibraryAudiobooks } from '@/hooks/useLibraryAudiobooks';
import {
  filterLibraryAudiobooks,
  type LibraryStatusFilter,
} from '@/lib/library/filters';
import { useTabContentInset } from '@/contexts/audiobook-player';
import * as React from 'react';
import {
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const scrollBottomPadding = useTabContentInset();
  const { audiobooks, isLoading, error, refetch } = useLibraryAudiobooks();

  const [statusFilter, setStatusFilter] = React.useState<LibraryStatusFilter>('all');
  const [showFailed, setShowFailed] = React.useState(false);

  const failedCount = React.useMemo(
    () => audiobooks.filter((item) => item.status === 'failed').length,
    [audiobooks],
  );

  const visibleItems = React.useMemo(
    () => filterLibraryAudiobooks(audiobooks, statusFilter, showFailed),
    [audiobooks, showFailed, statusFilter],
  );

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1 bg-background"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: scrollBottomPadding,
        }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={() => void refetch()} />
        }>
        <View className="px-5 pb-4">
          <Text className="mb-4 text-2xl font-bold tracking-tight">Your Library</Text>
          <LibraryFilterChips
            value={statusFilter}
            onChange={(next) => {
              setStatusFilter(next);
              setShowFailed(false);
            }}
            disabled={showFailed}
          />
        </View>

        <View className="px-5">
          <LibraryMetaRow
            count={visibleItems.length}
            trailing={
              <ShowFailedToggle
                active={showFailed}
                count={failedCount}
                onToggle={() => setShowFailed((prev) => !prev)}
              />
            }
          />
        </View>

        {error ? (
          <View className="mx-5 mb-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3">
            <Text className="text-sm text-destructive">{error}</Text>
          </View>
        ) : null}

        {isLoading && audiobooks.length === 0 ? <LoadingState className="py-16" /> : visibleItems.length === 0 ? (
          <View className="mx-5 rounded-2xl border border-border/60 bg-card px-4 py-8">
            <Text className="text-center text-sm text-muted-foreground">
              {showFailed
                ? 'No failed audiobooks.'
                : statusFilter === 'all'
                  ? 'Your library is empty. Generate an audiobook from Search.'
                  : `No ${statusFilter} audiobooks yet.`}
            </Text>
          </View>
        ) : (
          <View className="gap-2 px-5">
            {visibleItems.map((item) => (
              <LibraryAudiobookRow key={item.id} item={item} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
