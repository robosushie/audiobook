import { generateAudiobook } from '@/api/audiobooks';
import { fetchVoiceProfiles } from '@/api/voice';
import { AppLoader } from '@/components/ui/app-loader';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useUserEventSubscription } from '@/contexts/user-events';
import { formatReferenceLanguage } from '@/lib/constants/languages';
import { formatLanguage } from '@/lib/format';
import type { VoiceSSEPayload } from '@/lib/sse/types';
import { cn } from '@/lib/utils';
import type { BookRow, ReferenceLanguage, VoiceProfileRow } from '@/types/api';
import { useAuth } from '@clerk/expo';
import { ChevronDown, X } from 'lucide-react-native';
import * as React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/icon';

/** Gap between the dock and the system navigation bar. */
export const CREATE_AUDIOBOOK_DOCK_GAP = 12;

/** Space the manuscript needs above the collapsed or expanded dock. */
export function createAudiobookScrollPadding(insetBottom: number, expanded: boolean) {
  return insetBottom + CREATE_AUDIOBOOK_DOCK_GAP + (expanded ? 268 : 84);
}

type CreateAudiobookDockProps = {
  book: BookRow;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onSuccess?: (audiobookId: string) => void;
};

export function CreateAudiobookDock({
  book,
  expanded,
  onExpandedChange,
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
    if (!expanded) return;
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
    if (!expanded) return;

    let cancelled = false;
    setError(null);
    setPickerOpen(false);

    void (async () => {
      setLoadingVoices(true);
      try {
        const token = await getTokenRef.current();
        if (!token) throw new Error('Not signed in');
        const rows = await fetchVoiceProfiles(token, bookLanguage);
        if (cancelled) return;
        setVoices(rows);
        const ready = rows.filter((v) => v.status === 'ready');
        setSelectedVoiceId(ready[0]?.id ?? null);
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
  }, [expanded, bookLanguage]);

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

      onExpandedChange(false);
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
      className="absolute inset-x-3 z-20 overflow-hidden rounded-2xl border border-white/80"
      style={{ bottom: insets.bottom + CREATE_AUDIOBOOK_DOCK_GAP }}>
      <BlurView intensity={42} tint="light" style={StyleSheet.absoluteFill} />
      <View className="bg-white/75 p-3">
        {expanded ? (
          <>
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-foreground">
                Voice profile · {formatLanguage(book.language)}
              </Text>
              <Pressable
                onPress={() => onExpandedChange(false)}
                hitSlop={8}
                accessibilityLabel="Close"
                className="h-8 w-8 items-center justify-center rounded-full border border-border bg-white/70">
                <Icon as={X} className="size-3.5 text-foreground" />
              </Pressable>
            </View>

            {loadingVoices ? (
              <View className="items-center py-4">
                <AppLoader size={20} />
              </View>
            ) : readyVoices.length === 0 ? (
              <Text className="mb-3 text-center text-sm text-muted-foreground">
                {pendingVoices.length > 0
                  ? 'A voice is still processing. It will show up here when it is ready.'
                  : `No ready voices for ${formatReferenceLanguage(bookLanguage)}. Add and process a voice in Profile → My voices first.`}
              </Text>
            ) : (
              <View className="mb-3">
                <Pressable
                  onPress={() => setPickerOpen((open) => !open)}
                  className="flex-row items-center justify-between rounded-2xl border border-border/60 bg-card px-4 py-3">
                  <Text className="text-sm font-medium text-foreground">
                    {selectedVoice?.label ?? 'Select voice'}
                  </Text>
                  <Icon as={ChevronDown} className="size-4 text-muted-foreground" />
                </Pressable>

                {pickerOpen ? (
                  <ScrollView
                    className="mt-2 max-h-40 rounded-2xl border border-border/60 bg-card"
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

            {error ? (
              <Text className="mb-3 text-sm text-destructive">{error}</Text>
            ) : null}

            <Button
              className="rounded-full bg-primary"
              disabled={submitting || loadingVoices || readyVoices.length === 0}
              onPress={() => void handleGenerate()}>
              {submitting ? (
                <AppLoader size={20} color="#ffffff" />
              ) : (
                <Text className="font-semibold text-primary-foreground">Generate audiobook</Text>
              )}
            </Button>
          </>
        ) : (
          <Button className="rounded-full bg-primary" onPress={() => onExpandedChange(true)}>
            <Text className="font-semibold text-primary-foreground">Create audiobook</Text>
          </Button>
        )}
      </View>
    </View>
  );
}
