import { BrowseCategoryCard } from '@/components/search/browse-category-card';
import { Text } from '@/components/ui/text';
import { BROWSE_CATEGORIES } from '@/lib/constants/browse-categories';
import * as React from 'react';
import { View } from 'react-native';

type BrowseAllSectionProps = {
  coverByGenre: Map<string, string | null>;
  onCategoryPress: (genre: string) => void;
};

export function BrowseAllSection({ coverByGenre, onCategoryPress }: BrowseAllSectionProps) {
  return (
    <View className="px-5">
      <Text className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
        Browse all
      </Text>
      <View className="flex-row flex-wrap gap-3">
        {BROWSE_CATEGORIES.map((category) => (
          <View key={category.genre} className="w-[47%]">
            <BrowseCategoryCard
              category={category}
              coverUrl={coverByGenre.get(category.genre)}
              onPress={() => onCategoryPress(category.genre)}
            />
          </View>
        ))}
      </View>
    </View>
  );
}
