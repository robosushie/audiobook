import { ScreenHeader } from '@/components/layout/screen-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { uploadVoiceProfile } from '@/api/voice';
import { fetchReferences } from '@/api/references';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { REFERENCE_LANGUAGES, formatReferenceLanguage } from '@/lib/constants/languages';
import type { ReferenceLanguage, ReferenceRow } from '@/types/api';
import { useAuth } from '@clerk/expo';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { Mic, Pause, Play, RotateCcw, Square } from 'lucide-react-native';
import * as React from 'react';
import { AppLoader } from '@/components/ui/app-loader';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

export default function NewVoiceScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const getTokenRef = React.useRef(getToken);
  getTokenRef.current = getToken;
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const [name, setName] = React.useState('');
  const [language, setLanguage] = React.useState<ReferenceLanguage>('english');
  const [references, setReferences] = React.useState<ReferenceRow[]>([]);
  const [loadingRefs, setLoadingRefs] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const {
    isRecording,
    durationMillis,
    recordedDurationMillis,
    recordingUri,
    error: recordingError,
    isPreviewPlaying,
    startRecording,
    stopRecording,
    resetRecording,
    playPreview,
  } = useVoiceRecording();

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoadingRefs(true);
      try {
        const token = await getTokenRef.current();
        if (!token) throw new Error('Not signed in');
        const rows = await fetchReferences(token);
        if (!cancelled) setReferences(rows);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load reference text');
        }
      } finally {
        if (!cancelled) setLoadingRefs(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedReference = React.useMemo(() => {
    return references.find((row) => row.language === language) ?? null;
  }, [references, language]);

  const durationLabel = `${Math.floor((isRecording ? durationMillis : recordedDurationMillis) / 1000)}s`;
  const recordingTooShort = Boolean(recordingUri) && !isRecording && recordedDurationMillis < 8000;

  async function handleSubmit() {
    if (!name.trim()) {
      Alert.alert('Name required', 'Give your voice a name before submitting.');
      return;
    }
    if (!recordingUri) {
      Alert.alert('Recording required', 'Record your voice sample first.');
      return;
    }
    if (recordedDurationMillis < 8000) {
      Alert.alert(
        'Recording too short',
        'Record at least 8 seconds. Shorter clips do not have enough speech to align.',
      );
      return;
    }
    if (!selectedReference) {
      Alert.alert('Reference missing', 'No reference passage is available for this language yet.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');

      const extension = recordingUri.split('.').pop()?.toLowerCase() ?? 'm4a';
      const mime =
        extension === 'wav' ? 'audio/wav' : extension === 'webm' ? 'audio/webm' : 'audio/m4a';

      const formData = new FormData();
      formData.append('file', {
        uri: recordingUri,
        name: `recording.${extension}`,
        type: mime,
      } as unknown as Blob);
      formData.append('name', name.trim());
      formData.append('reference_id', selectedReference.id);

      await uploadVoiceProfile(token, formData);
      router.replace('/(tabs)/profile/voices' as never);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: tabBarHeight + 16,
          paddingHorizontal: 20,
        }}>
        <ScreenHeader title="Add voice" onBack={() => router.back()} />

        <View className="mb-4 gap-1">
          <Text className="text-sm font-semibold">Voice name</Text>
          <Input
            value={name}
            onChangeText={setName}
            placeholder="e.g. Maya — warm"
            className="h-12 rounded-2xl border-transparent bg-card"
          />
        </View>

        <View className="mb-4">
          <Text className="mb-2 text-sm font-semibold">Language</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
              {REFERENCE_LANGUAGES.map((item) => {
                const active = language === item.value;
                return (
                  <Pressable
                    key={item.value}
                    onPress={() => setLanguage(item.value)}
                    className={cn(
                      'h-9 items-center justify-center rounded-full px-4',
                      active ? 'bg-accent' : 'bg-card',
                    )}>
                    <Text
                      className={cn(
                        'text-xs font-semibold',
                        active ? 'text-accent-foreground' : 'text-foreground',
                      )}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
          </ScrollView>
        </View>

        <View className="mb-5 rounded-2xl border border-border/60 bg-card p-4">
          <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Read this passage ({formatReferenceLanguage(language)})
          </Text>
          {loadingRefs ? (
            <View className="items-center py-4">
              <AppLoader size={22} />
            </View>
          ) : selectedReference ? (
            <Text className="text-sm leading-6 text-foreground">{selectedReference.text}</Text>
          ) : (
            <Text className="text-sm text-muted-foreground">
              No reference text for {formatReferenceLanguage(language)} yet.
            </Text>
          )}
        </View>

        <View className="mb-5 items-center rounded-3xl border border-border/60 bg-card p-6">
          <Pressable
            onPress={() => void (isRecording ? stopRecording() : startRecording())}
            disabled={!selectedReference}
            className={cn(
              'h-20 w-20 items-center justify-center rounded-full',
              isRecording ? 'bg-destructive' : 'bg-accent',
              !selectedReference && 'opacity-40',
            )}>
            <Icon
              as={isRecording ? Square : Mic}
              className="size-8 fill-accent-foreground text-accent-foreground"
            />
          </Pressable>
          <Text className="mt-3 text-sm font-semibold text-foreground">
            {isRecording ? `Recording… ${durationLabel}` : recordingUri ? `Recorded · ${durationLabel}` : 'Tap to record'}
          </Text>
          <Text className="mt-1 text-center text-xs text-muted-foreground">
            Record at least 8 seconds of the passage.
          </Text>
          {recordingTooShort ? (
            <Text className="mt-2 text-center text-xs text-destructive">
              This recording is under 8 seconds. Record a longer take before submitting.
            </Text>
          ) : null}
          {recordingError ? (
            <Text className="mt-2 text-center text-xs text-destructive">{recordingError}</Text>
          ) : null}

          {recordingUri ? (
            <View className="mt-4 flex-row gap-3">
              <Button
                variant="outline"
                className="rounded-full"
                onPress={() => playPreview()}>
                <Icon as={isPreviewPlaying ? Pause : Play} className="size-4" />
                <Text>{isPreviewPlaying ? 'Pause' : 'Play back'}</Text>
              </Button>
              <Button variant="outline" className="rounded-full" onPress={() => void resetRecording()}>
                <Icon as={RotateCcw} className="size-4" />
                <Text>Re-record</Text>
              </Button>
            </View>
          ) : null}
        </View>

        {error ? (
          <View className="mb-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3">
            <Text className="text-sm text-destructive">{error}</Text>
          </View>
        ) : null}

        <Button
          className="rounded-full bg-accent"
          disabled={submitting || !recordingUri || !selectedReference || recordingTooShort}
          onPress={() => void handleSubmit()}>
          {submitting ? (
            <AppLoader size={20} color="#ffffff" />
          ) : (
            <Text className="font-semibold text-accent-foreground">Submit for processing</Text>
          )}
        </Button>
      </ScrollView>
    </View>
  );
}
