import { BRAND } from '@/lib/constants/brand';
import { cn } from '@/lib/utils';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import { Image, View, type ImageStyle, type StyleProp } from 'react-native';

const PLACEHOLDER_GRADIENTS = [
  BRAND.coverGradients.amber,
  BRAND.coverGradients.rose,
  BRAND.coverGradients.teal,
] as const;

type BookCoverProps = {
  coverUrl?: string | null;
  seed?: string;
  className?: string;
  style?: StyleProp<ImageStyle>;
  roundedClassName?: string;
};

export function BookCover({
  coverUrl,
  seed = '0',
  className,
  style,
  roundedClassName = 'rounded-2xl',
}: BookCoverProps) {
  const gradient = PLACEHOLDER_GRADIENTS[hashSeed(seed) % PLACEHOLDER_GRADIENTS.length];

  if (coverUrl) {
    return (
      <Image
        source={{ uri: coverUrl }}
        className={cn(roundedClassName, className)}
        style={style}
        resizeMode="cover"
      />
    );
  }

  return (
    <View className={cn('overflow-hidden', roundedClassName, className)} style={style}>
      <LinearGradient
        colors={[gradient[0], gradient[1]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="h-full w-full"
      />
    </View>
  );
}

function hashSeed(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash + value.charCodeAt(i)) % 997;
  }
  return hash;
}
