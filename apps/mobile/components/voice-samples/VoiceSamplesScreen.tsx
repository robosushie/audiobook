import { useState } from 'react';
import { Text, View, Pressable } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Play, Pause, Pencil, Plus, Mic } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAudioLibraryStore } from '@/lib/audio-library/store';
import type { VoiceSample } from '@/lib/audio-library';

export function VoiceSamplesScreen() {
  const router = useRouter();
  const voiceSamples = useAudioLibraryStore((s) => s.voiceSamples);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const handlePlay = (sample: VoiceSample) => {
    if (playingId === sample.id) {
      setPlayingId(null);
      return;
    }
    setPlayingId(sample.id);
  };

  return (
    <View className="px-5 py-4 flex-1">
      <View className="flex-row items-center justify-between mb-5">
        <Text className="text-lg font-bold text-foreground">Voice Samples</Text>
        <Button
          onPress={() => router.push('/(main)/record-sample')}
          className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl"
          size="sm"
        >
          <Icon as={Plus} className="size-3.5 text-primary-foreground" />
          <Text className="text-xs font-medium text-primary-foreground">New Sample</Text>
        </Button>
      </View>

      {voiceSamples.length === 0 ? (
        <View className="flex-1 items-center justify-center py-16 gap-4">
          <View className="w-16 h-16 rounded-full bg-secondary items-center justify-center">
            <Icon as={Mic} className="size-7 text-muted-foreground" />
          </View>
          <Text className="text-sm text-muted-foreground text-center">
            No voice samples yet. Tap "New Sample" to record one.
          </Text>
        </View>
      ) : (
        <View className="gap-3">
          {voiceSamples.map((sample) => (
            <View
              key={sample.id}
              className="flex-row items-center gap-3 p-3 rounded-xl bg-card border border-border"
            >
              <Pressable
                onPress={() => handlePlay(sample)}
                className="w-10 h-10 rounded-full bg-primary items-center justify-center shrink-0"
              >
                <Icon
                  as={playingId === sample.id ? Pause : Play}
                  className="size-4 text-primary-foreground"
                  style={playingId !== sample.id ? { marginLeft: 2 } : undefined}
                />
              </Pressable>
              <View className="flex-1 min-w-0">
                <Text className="text-sm font-medium text-foreground truncate">{sample.name}</Text>
                <View className="bg-badge self-start mt-0.5 px-2 py-0.5 rounded-full">
                  <Text className="text-[10px] font-medium text-badge-foreground uppercase tracking-wide">
                    {sample.language}
                  </Text>
                </View>
              </View>
              <Pressable className="w-8 h-8 rounded-full bg-secondary items-center justify-center shrink-0">
                <Icon as={Pencil} className="size-3.5 text-foreground" />
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
