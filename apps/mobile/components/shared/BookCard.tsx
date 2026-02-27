import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Star } from 'lucide-react-native';
import { Image, Pressable, View } from 'react-native';
import type { Book } from '@/lib/audio-library';

export interface BookCardProps {
  book: Book;
  onPress: (book: Book) => void;
  width?: number;
}

export function BookCard({ book, onPress, width }: BookCardProps) {
  const cardStyle = width != null ? { width } : undefined;

  return (
    <Pressable
      onPress={() => onPress(book)}
      className="flex-1 flex-col items-start rounded-2xl overflow-hidden bg-card shadow-md max-w-[160px]"
      style={cardStyle}
    >
      <View className="w-full aspect-[3/4] relative overflow-hidden bg-muted">
        <Image
          source={{ uri: book.cover }}
          className="w-full h-full"
          resizeMode="cover"
        />
        {book.isNew && (
          <View className="absolute top-2 left-2 bg-primary rounded-md px-1.5 py-0.5">
            <Text className="text-[9px] font-bold text-primary-foreground uppercase">
              New
            </Text>
          </View>
        )}
      </View>
      <View className="p-2.5 gap-0.5 w-full">
        <Text className="font-semibold text-xs text-foreground truncate" numberOfLines={1}>
          {book.title}
        </Text>
        <Text className="text-[10px] text-muted-foreground truncate" numberOfLines={1}>
          {book.author}
        </Text>
        <View className="flex-row items-center gap-1.5 pt-0.5">
          <View className="bg-secondary px-1.5 py-0.5 rounded-full">
            <Text className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">
              {book.language}
            </Text>
          </View>
          <View className="flex-row items-center gap-0.5">
            <Icon as={Star} className="size-2.5 text-primary" fill="hsl(24 93% 47%)" />
            <Text className="text-[10px] text-primary font-medium">{book.rating}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
