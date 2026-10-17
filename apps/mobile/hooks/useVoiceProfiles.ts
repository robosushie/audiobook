import { fetchVoiceProfiles } from '@/api/voice';
import { useUserEventSubscription } from '@/contexts/user-events';
import type { VoiceSSEPayload } from '@/lib/sse/types';
import type { VoiceProfileRow } from '@/types/api';
import { useAuth } from '@clerk/expo';
import * as React from 'react';

const STATUS_POLL_MS = 8000;

export function useVoiceProfiles() {
  const { getToken } = useAuth();
  const getTokenRef = React.useRef(getToken);
  getTokenRef.current = getToken;

  const [voices, setVoices] = React.useState<VoiceProfileRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
      setError(null);
    }
    try {
      const token = await getTokenRef.current();
      if (!token) throw new Error('Not signed in');
      setVoices(await fetchVoiceProfiles(token));
    } catch (err) {
      if (!silent) {
        setError(err instanceof Error ? err.message : 'Failed to load voices');
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const hasPending = voices.some(
    (voice) => voice.status === 'queued' || voice.status === 'processing' || voice.status === 'uploaded',
  );

  React.useEffect(() => {
    if (!hasPending) return;
    const timer = setInterval(() => {
      void load(true);
    }, STATUS_POLL_MS);
    return () => clearInterval(timer);
  }, [hasPending, load]);

  useUserEventSubscription((message) => {
    if (message.type === 'voice.created' || message.type === 'voice.updated') {
      const row = voiceFromSSE(message.data as VoiceSSEPayload);
      setVoices((prev) => {
        const index = prev.findIndex((item) => item.id === row.id);
        if (index === -1) return [row, ...prev];
        const next = [...prev];
        next[index] = { ...next[index], ...row };
        return next;
      });
    }
  });

  return { voices, isLoading, error, refetch: () => load() };
}

function voiceFromSSE(data: VoiceSSEPayload): VoiceProfileRow {
  return {
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
}
