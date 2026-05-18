import type { AudiobookGenerateBody, AudiobookRow } from "@/types/api";

export function generateAudiobook(
  request: <T>(path: string, init?: RequestInit) => Promise<T>,
  body: AudiobookGenerateBody,
) {
  return request<AudiobookRow>("/api/audiobooks/generate", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
