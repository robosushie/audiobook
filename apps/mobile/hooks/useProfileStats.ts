import { fetchMyAudiobooks } from '@/api/audiobooks';
import { fetchVoiceProfiles } from '@/api/voice';
import { useUserEventSubscription } from '@/contexts/user-events';
import { useAuth } from '@clerk/expo';
import * as React from 'react';

type ProfileStats = {
  audiobookCount: number;
  voiceCount: number;
  hoursListened: number;
};

export function useProfileStats() {
  const { getToken } = useAuth();
  const getTokenRef = React.useRef(getToken);
  getTokenRef.current = getToken;

  const [stats, setStats] = React.useState<ProfileStats>({
    audiobookCount: 0,
    voiceCount: 0,
    hoursListened: 0,
  });
  const [isLoading, setIsLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    try {
      const token = await getTokenRef.current();
      if (!token) return;

      const [audiobooks, voices] = await Promise.all([
        fetchMyAudiobooks(token),
        fetchVoiceProfiles(token),
      ]);

      const hoursListened = audiobooks.reduce((sum, ab) => {
        if (!ab.duration) return sum;
        const progress = ab.playback_progress ?? 0;
        return sum + (ab.duration * progress) / 3600;
      }, 0);

      setStats({
        audiobookCount: audiobooks.length,
        voiceCount: voices.length,
        hoursListened: Math.round(hoursListened),
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useUserEventSubscription(() => {
    void load();
  });

  React.useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!cancelled) await load();
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [load]);

  return { stats, isLoading };
}
