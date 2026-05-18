import { BRAND, SHADOW_POP } from '@/lib/constants/brand';
import { cn } from '@/lib/utils';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import { Image, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';

const HERO_IMAGE = require('@/assets/images/hero.png');

type CoverItem =
  | { type: 'image'; source: ImageSourcePropType; className: string }
  | {
      type: 'gradient';
      className: string;
      colors: readonly [string, string];
      start?: { x: number; y: number };
      end?: { x: number; y: number };
    };

/** Wider spacing than admin — mobile hero is shorter/narrower */
const COVERS: CoverItem[] = [
  {
    type: 'image',
    source: HERO_IMAGE,
    className: 'absolute -top-2 left-[2%] h-48 w-36 -rotate-12',
  },
  {
    type: 'gradient',
    className: 'absolute top-6 right-[2%] h-44 w-32 rotate-6',
    colors: BRAND.coverGradients.amber,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  {
    type: 'gradient',
    className: 'absolute bottom-14 left-[4%] h-40 w-28 rotate-3',
    colors: BRAND.coverGradients.rose,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  {
    type: 'gradient',
    className: 'absolute bottom-2 right-[4%] h-32 w-24 -rotate-6',
    colors: BRAND.coverGradients.teal,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
];

export function LoginHeroCovers() {
  return (
    <View className="relative h-[52%] overflow-hidden">
      <LinearGradient
        colors={[BRAND.loginHeroTop, BRAND.loginHeroMid, BRAND.background, BRAND.background]}
        locations={[0, 0.38, 0.72, 1]}
        className="absolute inset-0"
      />

      {COVERS.map((cover) => (
        <CoverCard key={cover.className} cover={cover} />
      ))}

      <LinearGradient
        colors={['transparent', 'transparent', 'rgba(250, 248, 245, 0.92)', BRAND.background]}
        locations={[0, 0.45, 0.85, 1]}
        className="pointer-events-none absolute inset-0"
      />
    </View>
  );
}

function CoverCard({ cover }: { cover: CoverItem }) {
  const isImage = cover.type === 'image';

  return (
    <View
      className={cn('overflow-hidden rounded-3xl', isImage && 'bg-background', cover.className)}
      style={SHADOW_POP as StyleProp<ViewStyle>}>
      {isImage ? (
        <Image
          source={cover.source}
          className="h-full w-full p-3"
          resizeMode="contain"
          style={{ backgroundColor: BRAND.background }}
        />
      ) : (
        <LinearGradient
          colors={[...cover.colors]}
          start={cover.start ?? { x: 0, y: 0 }}
          end={cover.end ?? { x: 1, y: 1 }}
          className="h-full w-full"
        />
      )}
    </View>
  );
}
