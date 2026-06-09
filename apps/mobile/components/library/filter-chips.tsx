import { Text } from '@/components/ui/text';
import {
  LIBRARY_STATUS_FILTERS,
  type LibraryStatusFilter,
} from '@/lib/library/filters';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

type LibraryFilterChipsProps = {
  value: LibraryStatusFilter;
  onChange: (value: LibraryStatusFilter) => void;
  disabled?: boolean;
};

export function LibraryFilterChips({ value, onChange, disabled }: LibraryFilterChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2 pb-1">
      {LIBRARY_STATUS_FILTERS.map((filter) => {
        const active = value === filter.value;
        return (
          <Pressable
            key={filter.value}
            disabled={disabled}
            onPress={() => onChange(filter.value)}
            className={cn(
              'h-9 items-center justify-center rounded-full px-4',
              active ? 'bg-accent' : 'bg-card',
              disabled && 'opacity-50',
            )}>
            <Text
              className={cn(
                'text-xs font-semibold',
                active ? 'text-accent-foreground' : 'text-foreground',
              )}>
              {filter.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

type ShowFailedToggleProps = {
  active: boolean;
  onToggle: () => void;
  count?: number;
};

export function ShowFailedToggle({ active, onToggle, count }: ShowFailedToggleProps) {
  return (
    <Pressable
      onPress={onToggle}
      className={cn(
        'rounded-full border px-3 py-1.5',
        active ? 'border-destructive/40 bg-destructive/10' : 'border-border/60 bg-card',
      )}>
      <Text
        className={cn(
          'text-xs font-semibold',
          active ? 'text-destructive' : 'text-muted-foreground',
        )}>
        {active ? 'Hide failed' : 'Show failed'}
        {count !== undefined && count > 0 ? ` (${count})` : ''}
      </Text>
    </Pressable>
  );
}

export function LibraryMetaRow({
  count,
  trailing,
}: {
  count: number;
  trailing?: React.ReactNode;
}) {
  return (
    <View className="mb-4 flex-row items-center justify-between">
      <Text className="text-xs font-semibold text-muted-foreground">
        {count} {count === 1 ? 'audiobook' : 'audiobooks'}
      </Text>
      {trailing}
    </View>
  );
}
