import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react-native';
import * as React from 'react';
import { View } from 'react-native';

type SearchInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  className?: string;
};

export function SearchInput({
  value,
  onChangeText,
  placeholder = 'Books, authors, narrators…',
  className,
}: SearchInputProps) {
  return (
    <View className={cn('relative', className)}>
      <View className="absolute left-4 top-0 z-10 h-12 justify-center">
        <Icon as={Search} className="size-4 text-muted-foreground" />
      </View>
      <Input
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        className="h-12 rounded-2xl border-transparent bg-card pl-11 text-sm"
      />
    </View>
  );
}
