import { Text } from '@/components/ui/text';
import { BOOK_GENRES } from '@/lib/constants/genres';
import { REFERENCE_LANGUAGES } from '@/lib/constants/languages';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

type CatalogueFiltersProps = {
  genre: string | null;
  language: string | null;
  onGenreChange: (genre: string | null) => void;
  onLanguageChange: (language: string | null) => void;
};

export function CatalogueFilters({
  genre,
  language,
  onGenreChange,
  onLanguageChange,
}: CatalogueFiltersProps) {
  return (
    <View className="gap-2">
      <FilterRow
        label="Genre"
        options={BOOK_GENRES.map((item) => ({ value: item.value, label: item.label }))}
        selected={genre}
        onChange={onGenreChange}
      />
      <FilterRow
        label="Language"
        options={REFERENCE_LANGUAGES.map((item) => ({ value: item.value, label: item.label }))}
        selected={language}
        onChange={onLanguageChange}
      />
    </View>
  );
}

function FilterRow({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string | null;
  onChange: (value: string | null) => void;
}) {
  return (
    <View className="gap-1">
      <Text className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
        <Chip label="All" active={selected == null} onPress={() => onChange(null)} />
        {options.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            active={selected === option.value}
            onPress={() => onChange(selected === option.value ? null : option.value)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'h-8 items-center justify-center rounded-full px-3',
        active ? 'bg-cotton' : 'bg-card',
      )}>
      <Text className="text-xs font-semibold text-foreground">{label}</Text>
    </Pressable>
  );
}
