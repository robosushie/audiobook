import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { ChevronLeft } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';

type ScreenHeaderProps = {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
};

export function ScreenHeader({ title, onBack, right }: ScreenHeaderProps) {
  return (
    <View className="mb-4 flex-row items-center gap-3">
      {onBack ? (
        <Pressable
          onPress={onBack}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full bg-card">
          <Icon as={ChevronLeft} className="size-5 text-foreground" />
        </Pressable>
      ) : (
        <View className="w-10" />
      )}
      <Text className="flex-1 text-2xl font-bold tracking-tight">{title}</Text>
      {right ?? <View className="w-10" />}
    </View>
  );
}
