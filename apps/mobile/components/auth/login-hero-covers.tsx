import { BRAND } from '@/lib/constants/brand';
import { cn } from '@/lib/utils';
import { Image, View, type ImageSourcePropType } from 'react-native';

const HERO_IMAGE = require('@/assets/images/hero.png');

type CoverItem =
  | { type: 'image'; source: ImageSourcePropType; className: string }
  | { type: 'fill'; className: string; color: string };

const COVERS: CoverItem[] = [
  {
    type: 'image',
    source: HERO_IMAGE,
    className: 'absolute left-[6%] top-8 h-40 w-28',
  },
  {
    type: 'fill',
    className: 'absolute right-[8%] top-12 h-32 w-24',
    color: BRAND.coverGradients.blue[0],
  },
  {
    type: 'fill',
    className: 'absolute bottom-16 left-[10%] h-24 w-32',
    color: BRAND.coverGradients.green[0],
  },
  {
    type: 'fill',
    className: 'absolute bottom-8 right-[12%] h-28 w-20',
    color: BRAND.coverGradients.pink[0],
  },
  {
    type: 'fill',
    className: 'absolute bottom-24 right-[28%] h-16 w-16',
    color: BRAND.coverGradients.yellow[0],
  },
];

type LoginHeroCoversProps = {
  className?: string;
};

export function LoginHeroCovers({ className }: LoginHeroCoversProps) {
  return (
    <View className={cn('relative overflow-hidden bg-background', className ?? 'h-[52%]')}>
      {COVERS.map((cover) => (
        <CoverCard key={cover.className} cover={cover} />
      ))}
    </View>
  );
}

function CoverCard({ cover }: { cover: CoverItem }) {
  if (cover.type === 'image') {
    return (
      <View className={cn('overflow-hidden bg-card', cover.className)}>
        <Image source={cover.source} className="h-full w-full" resizeMode="contain" />
      </View>
    );
  }

  return <View className={cover.className} style={{ backgroundColor: cover.color }} />;
}
