import { Text } from '@/components/ui/text';
import { ChevronRight } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from '@/components/ui/icon';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  onSeeAll?: () => void;
};

export function SectionHeader({ title, subtitle, onSeeAll }: SectionHeaderProps) {
  return (
    <View className="mb-3 flex-row items-end justify-between">
      <View className="flex-1 pr-3">
        <Text className="text-lg font-bold tracking-tight">{title}</Text>
        {subtitle ? <Text className="text-xs text-muted-foreground">{subtitle}</Text> : null}
      </View>
      {onSeeAll ? (
        <Pressable onPress={onSeeAll} className="flex-row items-center gap-0.5">
          <Text className="text-xs font-semibold text-muted-foreground">See all</Text>
          <Icon as={ChevronRight} className="size-3 text-muted-foreground" />
        </Pressable>
      ) : null}
    </View>
  );
}
