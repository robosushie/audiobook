import { generateAudiobook } from '@/api/audiobooks';
import { fetchVoiceProfiles } from '@/api/voice';
import { AppLoader } from '@/components/ui/app-loader';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useUserEventSubscription } from '@/contexts/user-events';
import { formatReferenceLanguage } from '@/lib/constants/languages';
import type { VoiceSSEPayload } from '@/lib/sse/types';
import { cn } from '@/lib/utils';
import type { BookRow, ReferenceLanguage, VoiceProfileRow } from '@/types/api';
import { useAuth } from '@clerk/expo';
import { ChevronDown } from 'lucide-react-native';
import * as React from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/icon';

type CreateAudiobookDockProps = {
  book: BookRow;
  onHeightChange?: (height: number) => void;
  onSuccess?: (audiobookId: string) => void;
};

export function CreateAudiobookDock({
  book,
  onHeightChange,
  onSuccess,
}: CreateAudiobookDockProps) {
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const getTokenRef = React.useRef(getToken);
  getTokenRef.current = getToken;

  const bookLanguage = book.language as ReferenceLanguage;
  const [voices, setVoices] = React.useState<VoiceProfileRow[]>([]);
  const [loadingVoices, setLoadingVoices] = React.useState(false);
  const [selectedVoiceId, setSelectedVoiceId] = React.useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const pendingVoices = React.useMemo(
    () => voices.filter((v) => v.status === 'queued' || v.status === 'processing'),
    [voices],
  );

  useUserEventSubscription((message) => {
    if (message.type !== 'voice.created' && message.type !== 'voice.updated') return;
    const data = message.data as VoiceSSEPayload;
    if (data.language !== bookLanguage) return;
    setVoices((prev) => {
      const index = prev.findIndex((item) => item.id === data.id);
      const row: VoiceProfileRow = {
        id: data.id,
        user_id: data.user_id,
        reference_id: data.reference_id,
        label: data.label,
        status: data.status,
        duration: data.duration,
        language: data.language,
        raw_url: data.raw_url,
        audio_url: data.audio_url,
      };
      if (index === -1) return [row, ...prev];
      const next = [...prev];
      next[index] = { ...next[index], ...row };
      return next;
    });
    if (data.status === 'ready') {
      setSelectedVoiceId((current) => current ?? data.id);
    }
  });

  const readyVoices = React.useMemo(
    () => voices.filter((v) => v.status === 'ready'),
    [voices],
  );

  const selectedVoice = readyVoices.find((v) => v.id === selectedVoiceId) ?? null;

  React.useEffect(() => {
    let cancelled = false;
    setError(null);
    setPickerOpen(false);
    setSelectedVoiceId(null);

    void (async () => {
      setLoadingVoices(true);
      try {
        const token = await getTokenRef.current();
        if (!token) throw new Error('Not signed in');
        const rows = await fetchVoiceProfiles(token, bookLanguage);
        if (cancelled) return;
        setVoices(rows);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load voices');
        }
      } finally {
        if (!cancelled) setLoadingVoices(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bookLanguage]);

  const voicePending = pendingVoices.length > 0;

  React.useEffect(() => {
    if (!voicePending) return;
    const timer = setInterval(() => {
      void (async () => {
        try {
          const token = await getTokenRef.current();
          if (!token) return;
          const rows = await fetchVoiceProfiles(token, bookLanguage);
          setVoices(rows);
        } catch {
          // The next tick retries.
        }
      })();
    }, 8000);
    return () => clearInterval(timer);
  }, [bookLanguage, voicePending]);

  async function handleGenerate() {
    if (!selectedVoiceId) {
      Alert.alert('Select a voice', 'Choose a voice profile to narrate this book.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const token = await getTokenRef.current();
      if (!token) throw new Error('Not signed in');

      const audiobook = await generateAudiobook(token, {
        book_id: book.id,
        voice_profile_id: selectedVoiceId,
      });

      setPickerOpen(false);
      onSuccess?.(audiobook.id);
      Alert.alert(
        'Audiobook queued',
        'Your audiobook is being generated. You can track progress in your Library.',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start generation');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View
      className="absolute inset-x-0 bottom-0 z-20 border-t border-border bg-background"
      onLayout={(event) => onHeightChange?.(event.nativeEvent.layout.height)}
      style={{ paddingBottom: insets.bottom + 12 }}>
      <View className="gap-2 px-5 pt-3">
        {loadingVoices ? (
          <View className="items-center py-3">
            <AppLoader size={20} />
          </View>
        ) : readyVoices.length === 0 ? (
          <Text className="text-center text-sm text-muted-foreground">
            {pendingVoices.length > 0
              ? 'A voice is still processing. It will show up here when it is ready.'
              : `No ready voices for ${formatReferenceLanguage(bookLanguage)}. Add one in Profile → My voices.`}
          </Text>
        ) : (
          <View>
            <Pressable
              onPress={() => setPickerOpen((open) => !open)}
              className="flex-row items-center justify-between rounded-full border border-border bg-card px-4 py-3">
              <Text className="text-sm font-semibold text-foreground">
                {selectedVoice?.label ?? 'Select voices'}
              </Text>
              <Icon as={ChevronDown} className="size-4 text-muted-foreground" />
            </Pressable>

            {pickerOpen ? (
              <ScrollView
                className="mt-2 max-h-40 rounded-2xl border border-border bg-card"
                keyboardShouldPersistTaps="handled">
                {readyVoices.map((voice) => {
                  const active = voice.id === selectedVoiceId;
                  return (
                    <Pressable
                      key={voice.id}
                      onPress={() => {
                        setSelectedVoiceId(voice.id);
                        setPickerOpen(false);
                      }}
                      className={cn(
                        'border-b border-border/40 px-4 py-3',
                        active && 'bg-cotton',
                      )}>
                      <Text className="text-sm font-medium text-foreground">{voice.label}</Text>
                      <Text className="text-xs text-muted-foreground">
                        {formatReferenceLanguage(voice.language)}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null}
          </View>
        )}

        {error ? <Text className="text-sm text-destructive">{error}</Text> : null}

        <Button
          className="rounded-full bg-primary"
          disabled={submitting || loadingVoices || !selectedVoiceId}
          onPress={() => void handleGenerate()}>
          {submitting ? (
            <AppLoader size={20} color="#ffffff" />
          ) : (
            <Text className="font-semibold text-primary-foreground">Create audiobook</Text>
          )}
        </Button>
      </View>
    </View>
  );
}
