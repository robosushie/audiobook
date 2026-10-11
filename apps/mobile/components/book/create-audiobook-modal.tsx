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
import { Alert, Modal, Pressable, ScrollView, View } from 'react-native';
import { Icon } from '@/components/ui/icon';

type CreateAudiobookModalProps = {
  visible: boolean;
  book: BookRow;
  onClose: () => void;
  onSuccess?: (audiobookId: string) => void;
};

export function CreateAudiobookModal({
  visible,
  book,
  onClose,
  onSuccess,
}: CreateAudiobookModalProps) {
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
    if (!visible) return;
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
    if (!visible) return;

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
  }, [visible, bookLanguage]);

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

      onClose();
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
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <Pressable
          className="max-h-[85%] rounded-t-3xl bg-background px-5 pb-8 pt-4"
          onPress={(e) => e.stopPropagation()}>
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-foreground">Create audiobook</Text>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              className="h-9 w-9 items-center justify-center rounded-full bg-muted">
              <Icon as={X} className="size-4 text-foreground" />
            </Pressable>
          </View>

          <Text className="mb-1 text-sm text-muted-foreground">Book</Text>
          <Text className="mb-4 font-semibold text-foreground">{book.title}</Text>

          <Text className="mb-2 text-sm font-semibold text-foreground">
            Voice profile · {formatLanguage(book.language)}
          </Text>

          {loadingVoices ? (
            <View className="items-center py-8">
              <AppLoader size={24} />
            </View>
          ) : readyVoices.length === 0 ? (
            <View className="mb-4 rounded-2xl border border-border/60 bg-card px-4 py-4">
              <Text className="text-center text-sm text-muted-foreground">
                {pendingVoices.length > 0
                  ? 'A voice is still processing. It will show up here when it is ready.'
                  : `No ready voices for ${formatReferenceLanguage(bookLanguage)}. Add and process a voice in Profile → My voices first.`}
              </Text>
            </View>
          ) : (
            <View className="mb-4">
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
                  className="mt-2 max-h-48 rounded-2xl border border-border/60 bg-card"
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
                          active && 'bg-accent/10',
                        )}>
                        <Text
                          className={cn(
                            'text-sm font-medium',
                            active ? 'text-accent' : 'text-foreground',
                          )}>
                          {voice.label}
                        </Text>
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
            <View className="mb-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3">
              <Text className="text-sm text-destructive">{error}</Text>
            </View>
          ) : null}

          <Button
            className="rounded-full bg-accent"
            disabled={submitting || loadingVoices || readyVoices.length === 0}
            onPress={() => void handleGenerate()}>
            {submitting ? (
              <AppLoader size={20} color="#ffffff" />
            ) : (
              <Text className="font-semibold text-accent-foreground">Generate audiobook</Text>
            )}
          </Button>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
