import { apiUpload } from "@/api/client";
import type { ReferenceLanguage, VoiceProfileRow } from "@/types/api";

export function fetchVoiceProfiles(
  request: <T>(path: string, init?: RequestInit) => Promise<T>,
  params?: { language?: ReferenceLanguage },
) {
  const search = new URLSearchParams();
  if (params?.language) search.set("language", params.language);
  const qs = search.toString();
  return request<VoiceProfileRow[]>(`/api/voice-profiles/${qs ? `?${qs}` : "/"}`);
}

export async function uploadVoiceProfile(
  token: string,
  formData: FormData,
) {
  return apiUpload<VoiceProfileRow>("/api/voice-profiles/upload", formData, token);
}
