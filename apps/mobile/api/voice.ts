import { apiFetch, apiUpload } from '@/api/client';
import type { ReferenceLanguage, VoiceProfileRow } from '@/types/api';

export function fetchVoiceProfiles(token: string, language?: ReferenceLanguage) {
  const path = language
    ? `/api/voice-profiles/?language=${language}`
    : '/api/voice-profiles/';
  return apiFetch<VoiceProfileRow[]>(path, { token });
}

export function uploadVoiceProfile(token: string, formData: FormData) {
  return apiUpload<VoiceProfileRow>('/api/voice-profiles/upload', formData, token);
}
