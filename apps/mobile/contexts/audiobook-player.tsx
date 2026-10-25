import { upsertMyPlayback } from '@/api/playbacks';
import { ensureAudiobookAudioFile } from '@/lib/audio/audiobook-cache';
import { canPlayAudiobook, type PlayableAudiobook } from '@/lib/audio/playable';
import { useAuth } from '@clerk/expo';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';
import * as React from 'react';
import { Alert } from 'react-native';

type AudiobookPlayerContextValue = {
  activeAudiobook: PlayableAudiobook | null;
  playingAudiobookId: string | null;
  isPlaying: boolean;
  isLoadingAudio: boolean;
  getProgress: (item: PlayableAudiobook) => number;
  playAudiobook: (item: PlayableAudiobook) => Promise<void>;
  dismissAudiobook: () => Promise<void>;
};

const AudiobookPlayerContext = React.createContext<AudiobookPlayerContextValue | null>(null);

function clampProgress(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

export function AudiobookPlayerProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();
  const getTokenRef = React.useRef(getToken);
  getTokenRef.current = getToken;

  const player = useAudioPlayer(null, { updateInterval: 500 });
  const status = useAudioPlayerStatus(player);
  const [activeAudiobook, setActiveAudiobook] = React.useState<PlayableAudiobook | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = React.useState(false);
  const [savedProgress, setSavedProgress] = React.useState<Record<string, number>>({});
  const lastSavedProgressRef = React.useRef<number | null>(null);
  const cachedUriRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'duckOthers',
    });
  }, []);

  const persistProgress = React.useCallback(async (audiobookId: string, progress: number) => {
    const token = await getTokenRef.current();
    if (!token) return;
    const clamped = clampProgress(progress);
    try {
      await upsertMyPlayback(token, audiobookId, clamped);
      setSavedProgress((prev) => ({ ...prev, [audiobookId]: clamped }));
      lastSavedProgressRef.current = clamped;
    } catch {
      // Non-blocking — playback continues even if save fails.
    }
  }, []);

  React.useEffect(() => {
    if (!activeAudiobook?.id || !status.duration || status.duration <= 0) return;
    const progress = clampProgress(status.currentTime / status.duration);
    setSavedProgress((prev) => ({ ...prev, [activeAudiobook.id]: progress }));

    if (!status.playing) return;
    const last = lastSavedProgressRef.current;
    if (last !== null && Math.abs(last - progress) < 0.02) return;

    const timer = setTimeout(() => {
      void persistProgress(activeAudiobook.id, progress);
    }, 800);
    return () => clearTimeout(timer);
  }, [
    activeAudiobook?.id,
    persistProgress,
    status.currentTime,
    status.duration,
    status.playing,
  ]);

  const playAudiobook = React.useCallback(
    async (item: PlayableAudiobook) => {
      if (!canPlayAudiobook(item)) {
        Alert.alert(
          'Not ready',
          'This audiobook is still generating or failed. Try again when it is ready.',
        );
        return;
      }

      if (activeAudiobook?.id === item.id && status.playing) {
        player.pause();
        if (status.duration && status.duration > 0) {
          await persistProgress(item.id, status.currentTime / status.duration);
        }
        return;
      }

      if (activeAudiobook?.id === item.id && !status.playing && cachedUriRef.current) {
        const atEnd =
          status.duration > 1 && status.currentTime >= status.duration - 0.35;
        if (atEnd) {
          player.replace(cachedUriRef.current);
          await player.seekTo(0);
          lastSavedProgressRef.current = 0;
          setSavedProgress((prev) => ({ ...prev, [item.id]: 0 }));
          await persistProgress(item.id, 0);
        }
        player.play();
        return;
      }

      setIsLoadingAudio(true);
      setActiveAudiobook(item);

      try {
        const token = await getTokenRef.current();
        if (!token) {
          throw new Error('Not signed in');
        }

        const localUri = await ensureAudiobookAudioFile(token, item.id);
        cachedUriRef.current = localUri;

        const resumeProgress = clampProgress(
          savedProgress[item.id] ?? item.playback_progress ?? 0,
        );
        const startProgress = resumeProgress >= 0.985 ? 0 : resumeProgress;

        player.replace(localUri);
        lastSavedProgressRef.current = startProgress;

        if (item.duration && item.duration > 0 && startProgress > 0) {
          await player.seekTo(startProgress * item.duration);
        }

        player.play();
        await persistProgress(item.id, startProgress);
      } catch (err) {
        setActiveAudiobook((current) => (current?.id === item.id ? null : current));
        cachedUriRef.current = null;
        const message =
          err instanceof Error
            ? err.message
            : 'Could not load audiobook audio.';
        console.error('[audiobook-player] play failed', err);
        Alert.alert('Playback failed', message);
      } finally {
        setIsLoadingAudio(false);
      }
    },
    [activeAudiobook?.id, persistProgress, player, savedProgress, status.currentTime, status.duration, status.playing],
  );

  const dismissAudiobook = React.useCallback(async () => {
    if (activeAudiobook?.id && status.duration && status.duration > 0) {
      await persistProgress(activeAudiobook.id, status.currentTime / status.duration);
    }
    player.pause();
    setActiveAudiobook(null);
    cachedUriRef.current = null;
  }, [activeAudiobook?.id, persistProgress, player, status.currentTime, status.duration]);

  const getProgress = React.useCallback(
    (item: PlayableAudiobook) => {
      if (activeAudiobook?.id === item.id && status.duration && status.duration > 0) {
        return clampProgress(status.currentTime / status.duration);
      }
      return clampProgress(savedProgress[item.id] ?? item.playback_progress ?? 0);
    },
    [activeAudiobook?.id, savedProgress, status.currentTime, status.duration],
  );

  const value = React.useMemo(
    () => ({
      activeAudiobook,
      playingAudiobookId: activeAudiobook?.id ?? null,
      isPlaying: Boolean(activeAudiobook && status.playing),
      isLoadingAudio,
      getProgress,
      playAudiobook,
      dismissAudiobook,
    }),
    [activeAudiobook, dismissAudiobook, getProgress, isLoadingAudio, playAudiobook, status.playing],
  );

  return (
    <AudiobookPlayerContext.Provider value={value}>{children}</AudiobookPlayerContext.Provider>
  );
}

export function useAudiobookPlayer() {
  const ctx = React.useContext(AudiobookPlayerContext);
  if (!ctx) {
    throw new Error('useAudiobookPlayer must be used within AudiobookPlayerProvider');
  }
  return ctx;
}

/** Extra space so lists clear the tab bar and the floating player. */
export function useTabContentInset() {
  const tabBarHeight = useBottomTabBarHeight();
  const { activeAudiobook } = useAudiobookPlayer();
  return tabBarHeight + 16 + (activeAudiobook ? 72 : 0);
}
