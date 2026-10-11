import {
  CreateAudiobookDock,
  createAudiobookScrollPadding,
} from '@/components/book/create-audiobook-modal';
import { BookCover } from '@/components/home/book-cover';
import { ScreenHeader } from '@/components/layout/screen-header';
import { LoadingState } from '@/components/ui/app-loader';
import { Text } from '@/components/ui/text';
import { useBookDetail } from '@/hooks/useBookDetail';
import { formatAuthorName, formatLanguage } from '@/lib/format';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BookDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const bookId = typeof id === 'string' ? id : id?.[0];

  const { book, content, isLoading, error } = useBookDetail(bookId);
  const [dockExpanded, setDockExpanded] = React.useState(false);

  const genreLabel = book?.genre?.replace(/_/g, ' ');

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: createAudiobookScrollPadding(insets.bottom, dockExpanded),
          paddingHorizontal: 20,
        }}>
        <ScreenHeader title="Book" onBack={() => router.back()} />

        {isLoading ? <LoadingState className="py-16" /> : null}

        {error ? (
          <View className="mb-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3">
            <Text className="text-sm text-destructive">{error}</Text>
          </View>
        ) : null}

        {book ? (
          <>
            <View className="mb-6 flex-row gap-4">
              <BookCover
                coverUrl={book.cover_url}
                seed={book.id}
                size="full"
                className="shrink-0"
                roundedClassName="rounded-2xl"
                style={{ width: 128, height: 176 }}
              />
              <View className="min-w-0 flex-1 justify-center gap-1">
                <Text className="text-xl font-bold text-foreground">{book.title}</Text>
                <Text className="text-sm text-muted-foreground">
                  {formatAuthorName(book.author)}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {formatLanguage(book.language)}
                  {genreLabel ? ` · ${genreLabel}` : ''}
                </Text>
                {book.average_rating != null && book.rating_count > 0 ? (
                  <Text className="text-xs text-muted-foreground">
                    {book.average_rating.toFixed(1)} · {book.rating_count} ratings
                  </Text>
                ) : null}
              </View>
            </View>

            {book.description ? (
              <View className="mb-6">
                <Text className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  About
                </Text>
                <Text className="text-sm leading-6 text-foreground">{book.description}</Text>
              </View>
            ) : null}

            <View className="mb-6">
              <Text className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Content
              </Text>
              {content ? (
                <View className="rounded-2xl border border-border/60 bg-card p-4">
                  <Text className="text-sm leading-7 text-foreground">{content}</Text>
                </View>
              ) : (
                <View className="rounded-2xl border border-border/60 bg-card px-4 py-6">
                  <Text className="text-center text-sm text-muted-foreground">
                    Manuscript text is not available for this book yet.
                  </Text>
                </View>
              )}
            </View>
          </>
        ) : null}
      </ScrollView>

      {book ? (
        <CreateAudiobookDock
          book={book}
          expanded={dockExpanded}
          onExpandedChange={setDockExpanded}
        />
      ) : null}
    </View>
  );
}
