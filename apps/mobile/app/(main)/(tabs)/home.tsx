import { TopBar, PlayerBar, BookDetailSheet } from '@/components/shared';
import { HomeScreen } from '@/components/home';
import { View } from 'react-native';
import { useAudioLibraryStore } from '@/lib/audio-library/store';

export default function HomeTab() {
  const currentBook = useAudioLibraryStore((s) => s.currentBook);

  return (
    <View className="flex-1 bg-background">
      <TopBar />
      <HomeScreen />
      {currentBook && <PlayerBar />}
      <BookDetailSheet />
    </View>
  );
}
