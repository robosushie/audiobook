import { ScreenHeader } from '@/components/layout/screen-header';
import { LoadingState } from '@/components/ui/app-loader';
import { VoiceProfileListRow } from '@/components/voices/voice-profile-row';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useVoiceProfiles } from '@/hooks/useVoiceProfiles';
import { useTabContentInset } from '@/contexts/audiobook-player';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import * as React from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MyVoicesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollBottomPadding = useTabContentInset();
  const { voices, isLoading, error, refetch } = useVoiceProfiles();

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: scrollBottomPadding,
          paddingHorizontal: 20,
        }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={() => void refetch()} />
        }>
        <ScreenHeader
          title="My voices"
          onBack={() => router.back()}
          right={
            <Pressable
              onPress={() => router.push('/(tabs)/profile/voices/new' as never)}
              className="h-10 w-10 items-center justify-center rounded-full bg-accent">
              <Plus color="#fff" size={20} />
            </Pressable>
          }
        />

        {error ? (
          <View className="mb-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3">
            <Text className="text-sm text-destructive">{error}</Text>
          </View>
        ) : null}

        {isLoading && voices.length === 0 ? <LoadingState className="py-16" /> : voices.length === 0 ? (
          <View className="rounded-2xl border border-border/60 bg-card px-4 py-8">
            <Text className="mb-4 text-center text-sm text-muted-foreground">
              No voices yet. Record a short sample to create your first narrator voice.
            </Text>
            <Button
              className="rounded-full bg-accent"
              onPress={() => router.push('/(tabs)/profile/voices/new' as never)}>
              <Text className="font-semibold text-accent-foreground">Add new voice</Text>
            </Button>
          </View>
        ) : (
          <View className="gap-2">
            {voices.map((voice) => (
              <VoiceProfileListRow key={voice.id} voice={voice} />
            ))}
            <Button
              className="mt-3 rounded-full bg-accent"
              onPress={() => router.push('/(tabs)/profile/voices/new' as never)}>
              <Text className="font-semibold text-accent-foreground">Add new voice</Text>
            </Button>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
