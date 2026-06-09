import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { formatDateLine, greetingForHour } from '@/lib/format';
import { Bell } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';

type HomeHeaderProps = {
  firstName?: string | null;
  topInset?: number;
};

export function HomeHeader({ firstName, topInset = 0 }: HomeHeaderProps) {
  const greeting = greetingForHour(new Date().getHours(), firstName);
  const dateLine = formatDateLine();

  return (
    <View
      className="flex-row items-center justify-between px-5 pb-4"
      style={{ paddingTop: topInset + 12 }}>
      <View className="flex-1 pr-4">
        <Text className="text-xs font-medium text-muted-foreground">{dateLine}</Text>
        <Text className="text-2xl font-bold tracking-tight">{greeting}</Text>
      </View>
      <Pressable className="relative h-11 w-11 items-center justify-center rounded-full border border-border bg-card">
        <Icon as={Bell} className="size-4 text-foreground" />
        <View className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-primary" />
      </Pressable>
    </View>
  );
}
