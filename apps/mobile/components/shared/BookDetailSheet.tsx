import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { X, BookOpen, Plus, Star, Mic } from 'lucide-react-native';
import { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import type { Book } from '@/lib/audio-library/books';
import { useAudioLibraryStore } from '@/lib/audio-library/store';
import { cn } from '@/lib/utils';

const MAX_VISIBLE_CATEGORIES = 2;

export function BookDetailSheet() {
  const selectedBook = useAudioLibraryStore((s) => s.selectedBook);
  const voiceSamples = useAudioLibraryStore((s) => s.voiceSamples);
  const closeBook = useAudioLibraryStore((s) => s.closeBook);
  const createAudiobook = useAudioLibraryStore((s) => s.createAudiobook);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSample, setSelectedSample] = useState('');
  const [userRating, setUserRating] = useState(0);

  if (!selectedBook) return null;

  const book = selectedBook;

  const handleCreate = () => {
    if (selectedSample) {
      createAudiobook(book.id, selectedSample);
      setShowCreateModal(false);
      setSelectedSample('');
      closeBook();
    }
  };

  const visibleCategories = book.categories.slice(0, MAX_VISIBLE_CATEGORIES);
  const extraCount = book.categories.length - MAX_VISIBLE_CATEGORIES;
  const displayRating = userRating;

  return (
    <>
      <Modal
        visible
        animationType="slide"
        statusBarTranslucent
        onRequestClose={closeBook}
      >
        <View className="flex-1 bg-background">
          <View className="flex-1">
            <View className="relative">
              <Image
                source={{ uri: book.cover }}
                className="absolute inset-0 w-full h-72"
                resizeMode="cover"
              />
              <View className="absolute inset-0 bg-black/40" />
              <View className="relative z-10 flex-row items-center justify-between px-5 py-4">
                <Pressable onPress={closeBook}>
                  <Icon as={X} className="size-5 text-white" />
                </Pressable>
                <Text className="text-sm font-semibold text-white/90">Book Details</Text>
                <View className="w-5" />
              </View>
              <View className="relative z-10 px-5 pb-5 pt-8">
                <Text className="text-2xl font-bold text-white drop-shadow-md">{book.title}</Text>
                <Text className="text-sm text-white/80 mt-1">{book.author}</Text>
                <Text className="text-sm text-white/70 leading-relaxed mt-3" numberOfLines={3}>
                  {book.summary}
                </Text>
                <View className="flex-row items-center gap-1.5 mt-3 flex-wrap">
                  {visibleCategories.map((cat) => (
                    <View
                      key={cat}
                      className="bg-white/20 rounded-full px-2.5 py-1"
                    >
                      <Text className="text-[10px] font-medium text-white">{cat}</Text>
                    </View>
                  ))}
                  {extraCount > 0 && (
                    <View className="bg-white/20 rounded-full px-2 py-1">
                      <Text className="text-[10px] font-medium text-white">+{extraCount}</Text>
                    </View>
                  )}
                </View>
                <Text className="text-[11px] text-white/60 mt-1.5">{book.language}</Text>
                <View className="mt-4">
                  <Text className="text-xs text-white/60 mb-1.5">Rate this book</Text>
                  <View className="flex-row items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Pressable
                        key={star}
                        onPress={() => setUserRating(star)}
                        className="p-0.5"
                      >
                        <Icon
                          as={Star}
                          className={cn(
                            'size-6',
                            star <= displayRating ? 'text-primary fill-primary' : 'text-white/30'
                          )}
                          fill={star <= displayRating ? 'hsl(24 93% 47%)' : 'transparent'}
                        />
                      </Pressable>
                    ))}
                    {userRating > 0 && (
                      <Text className="text-xs text-white/60 ml-2">{userRating}/5</Text>
                    )}
                  </View>
                </View>
                <Pressable
                  onPress={() => setShowCreateModal(true)}
                  className="mt-4 flex-row items-center gap-1.5 self-start bg-primary rounded-full px-3 py-1.5"
                >
                  <Icon as={Plus} className="size-3 text-primary-foreground" />
                  <Text className="font-medium text-xs text-primary-foreground">Create</Text>
                </Pressable>
              </View>
            </View>

            <ScrollView className="flex-1 pb-24" showsVerticalScrollIndicator={false}>
              <View className="px-5 mt-6">
                <View className="flex-row items-center gap-2 mb-3">
                  <Icon as={BookOpen} className="size-4 text-primary" />
                  <Text className="font-bold text-foreground">Story</Text>
                </View>
                <View className="bg-card rounded-xl p-4 border border-border">
                  <Text className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                    {book.storyText}
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Audiobook</DialogTitle>
            <DialogDescription>
              Select a voice sample to narrate "{book.title}"
            </DialogDescription>
          </DialogHeader>
          <ScrollView className="max-h-60 gap-2 mt-2" nestedScrollEnabled>
            {voiceSamples.length === 0 ? (
              <Text className="text-sm text-muted-foreground text-center py-4">
                No voice samples yet. Add one from the Samples tab first.
              </Text>
            ) : (
              voiceSamples.map((sample) => (
                <Pressable
                  key={sample.id}
                  onPress={() => setSelectedSample(sample.id)}
                  className={cn(
                    'flex-row items-center gap-3 p-3 rounded-xl border',
                    selectedSample === sample.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card'
                  )}
                >
                  <View className="w-9 h-9 rounded-full bg-primary/20 items-center justify-center">
                    <Icon as={Mic} className="size-4 text-primary" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-foreground">{sample.name}</Text>
                    <Text className="text-[10px] text-muted-foreground uppercase">{sample.language}</Text>
                  </View>
                </Pressable>
              ))
            )}
          </ScrollView>
          <Button
            onPress={handleCreate}
            disabled={!selectedSample || voiceSamples.length === 0}
            className="w-full mt-2 py-3 rounded-xl"
          >
            <Text className="font-semibold text-sm text-primary-foreground">Submit</Text>
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
