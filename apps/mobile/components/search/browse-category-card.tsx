import { BookCover } from '@/components/home/book-cover';
import { Text } from '@/components/ui/text';
import type { BrowseCategory } from '@/lib/constants/browse-categories';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import { Pressable, View } from 'react-native';

type BrowseCategoryCardProps = {
  category: BrowseCategory;
  coverUrl?: string | null;
  onPress?: () => void;
};

export function BrowseCategoryCard({ category, coverUrl, onPress }: BrowseCategoryCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="h-28 overflow-hidden rounded-2xl shadow-soft active:opacity-90">
      <LinearGradient
        colors={[category.gradient[0], category.gradient[1]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="h-full p-3">
        <Text className="text-base font-bold text-foreground">{category.label}</Text>
        <View className="absolute -bottom-2 -right-2 rotate-12 shadow-pop">
          <BookCover
            coverUrl={coverUrl}
            seed={category.genre}
            className="h-16 w-16"
            roundedClassName="rounded-xl"
          />
        </View>
      </LinearGradient>
    </Pressable>
  );
}
