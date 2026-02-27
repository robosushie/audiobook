import { TopBar, PlayerBar } from '@/components/shared';
import { LibraryScreen } from '@/components/library';
import { View } from 'react-native';
import { useAudioLibraryStore } from '@/lib/audio-library/store';

export default function LibraryTab() {
  const currentBook = useAudioLibraryStore((s) => s.currentBook);

  return (
    <View className="flex-1 bg-background">
      <TopBar />
      <LibraryScreen />
      {currentBook && <PlayerBar />}
    </View>
  );
}
