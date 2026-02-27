import { TopBar, BookDetailSheet } from '@/components/shared';
import { SearchScreen } from '@/components/search';
import { View } from 'react-native';

export default function SearchTab() {
  return (
    <View className="flex-1 bg-background">
      <TopBar />
      <SearchScreen />
      <BookDetailSheet />
    </View>
  );
}
