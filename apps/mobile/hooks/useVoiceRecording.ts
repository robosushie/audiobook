import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import * as React from 'react';

export function useVoiceRecording() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 250);
  const [recordingUri, setRecordingUri] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const previewPlayer = useAudioPlayer(recordingUri);

  const [recordedDurationMillis, setRecordedDurationMillis] = React.useState(0);
  const durationRef = React.useRef(0);
  durationRef.current = recorderState.durationMillis;

  const ensurePermission = React.useCallback(async () => {
    const { granted } = await requestRecordingPermissionsAsync();
    if (!granted) {
      throw new Error('Microphone permission is required to record your voice.');
    }
  }, []);

  const startRecording = React.useCallback(async () => {
    setError(null);
    setRecordingUri(null);
    setRecordedDurationMillis(0);
    try {
      await ensurePermission();
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
        interruptionMode: 'doNotMix',
      });
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start recording');
    }
  }, [ensurePermission, recorder]);

  const stopRecording = React.useCallback(async () => {
    const elapsed = durationRef.current;
    try {
      await recorder.stop();
      setRecordedDurationMillis(elapsed);
      if (recorder.uri) {
        setRecordingUri(recorder.uri);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not stop recording');
    }
  }, [recorder]);

  const resetRecording = React.useCallback(async () => {
    previewPlayer.pause();
    setRecordingUri(null);
    setRecordedDurationMillis(0);
    setError(null);
    try {
      await recorder.prepareToRecordAsync();
    } catch {
      // Ignore prepare errors after reset.
    }
  }, [previewPlayer, recorder]);

  const playPreview = React.useCallback(() => {
    if (!recordingUri) return;
    if (previewPlayer.playing) {
      previewPlayer.pause();
    } else {
      previewPlayer.play();
    }
  }, [previewPlayer, recordingUri]);

  return {
    isRecording: recorderState.isRecording,
    durationMillis: recorderState.durationMillis,
    recordedDurationMillis,
    recordingUri,
    error,
    isPreviewPlaying: previewPlayer.playing,
    startRecording,
    stopRecording,
    resetRecording,
    playPreview,
  };
}
