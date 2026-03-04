import { Text } from '@/components/ui/text';
import { Image, Pressable, View } from 'react-native';
import type { Audiobook } from '@/lib/audio-library';

export interface AudiobookCardProps {
  book: Audiobook;
  onPress: (book: Audiobook) => void;
  width?: number;
}

export function AudiobookCard({ book, onPress, width }: AudiobookCardProps) {
  const cardStyle = width != null ? { width } : undefined;

  return (
    <Pressable
      onPress={() => onPress(book)}
      className="flex-col items-start rounded-xl overflow-hidden bg-card shadow-md max-w-[160px]"
      style={cardStyle}
    >
      <View className="w-full aspect-square relative overflow-hidden bg-muted">
        <Image
          source={{ uri: book.cover }}
          className="w-full h-full"
          resizeMode="cover"
        />
        <View className="absolute bottom-2 right-2 bg-background/80 rounded-md px-1.5 py-0.5">
          <Text className="text-[10px] font-semibold text-foreground">{book.duration}</Text>
        </View>
      </View>
      <View className="p-2.5 gap-0.5 w-full">
        <Text className="font-heading text-xs text-foreground truncate" numberOfLines={1}>
          {book.title}
        </Text>
        <Text className="text-[10px] text-muted-foreground truncate" numberOfLines={1}>
          {book.author}
        </Text>
        {book.voiceName && (
          <Text className="text-[10px] text-primary font-bodySemibold">{book.voiceName}</Text>
        )}
        <View className="flex-row items-center gap-1.5 pt-0.5">
          <View className="bg-secondary px-1.5 py-0.5 rounded-full">
            <Text className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">
              {book.language}
            </Text>
          </View>
        </View>
        {book.progress > 0 && (
          <View className="pt-1">
            <View className="w-full h-1 bg-secondary rounded-full overflow-hidden">
              <View
                className="h-full bg-primary rounded-full"
                style={{ width: `${book.progress * 100}%` }}
              />
            </View>
          </View>
        )}
      </View>
    </Pressable>
  );
}
