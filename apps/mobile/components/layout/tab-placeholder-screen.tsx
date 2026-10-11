import { Text } from '@/components/ui/text';
import * as React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTabContentInset } from '@/contexts/audiobook-player';

type TabPlaceholderScreenProps = {
  title: string;
  description?: string;
};

export function TabPlaceholderScreen({ title, description }: TabPlaceholderScreenProps) {
  const insets = useSafeAreaInsets();
  const scrollBottomPadding = useTabContentInset();

  return (
    <View
      className="flex-1 px-6"
      style={{ paddingTop: insets.top + 16, paddingBottom: scrollBottomPadding }}>
      <Text className="text-2xl font-bold">{title}</Text>
      {description ? (
        <Text className="mt-2 text-sm text-muted-foreground">{description}</Text>
      ) : null}
    </View>
  );
}
