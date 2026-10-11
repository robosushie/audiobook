import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react-native';
import { ChevronRight } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';

const CARD_PADDING = 12;

type ProfileMenuRowProps = {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  onPress?: () => void;
  variant?: 'default' | 'accent';
  disabled?: boolean;
};

export function ProfileMenuRow({
  title,
  subtitle,
  icon,
  onPress,
  variant = 'default',
  disabled,
}: ProfileMenuRowProps) {
  const isAccent = variant === 'accent';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      className={cn(
        'flex-row items-center rounded-2xl border',
        isAccent
          ? 'border-transparent bg-primary'
          : 'border-border/60 bg-card active:bg-muted/50',
        disabled && 'opacity-60',
      )}
      style={{ padding: CARD_PADDING }}>
      <View
        className={cn(
          'h-10 w-10 shrink-0 items-center justify-center rounded-xl',
          isAccent ? 'bg-card/20' : 'bg-muted',
        )}>
        <Icon
          as={icon}
          className={cn('size-4', isAccent ? 'text-accent-foreground' : 'text-foreground')}
        />
      </View>
      <View className="min-w-0 flex-1 px-3">
        <Text
          className={cn(
            'text-sm font-semibold',
            isAccent ? 'text-accent-foreground' : 'text-foreground',
          )}>
          {title}
        </Text>
        <Text
          className={cn(
            'truncate text-xs',
            isAccent ? 'text-accent-foreground/90' : 'text-muted-foreground',
          )}
          numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      {onPress ? (
        <Icon
          as={ChevronRight}
          className={cn('size-4 opacity-60', isAccent ? 'text-accent-foreground' : 'text-foreground')}
        />
      ) : null}
    </Pressable>
  );
}
