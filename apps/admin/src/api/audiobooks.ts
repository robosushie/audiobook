import { getApiBaseUrl } from "@/lib/env";
import type {
  AdminAudiobookRow,
  AudiobookGenerateBody,
  AudiobookRow,
  AudiobookStatus,
} from "@/types/api";

export function generateAudiobook(
  request: <T>(path: string, init?: RequestInit) => Promise<T>,
  body: AudiobookGenerateBody,
) {
  return request<AudiobookRow>("/api/audiobooks/generate", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function fetchAdminAudiobooks(
  request: <T>(path: string, init?: RequestInit) => Promise<T>,
  params?: { userId?: string; status?: AudiobookStatus },
) {
  const search = new URLSearchParams();
  if (params?.userId) search.set("user_id", params.userId);
  if (params?.status) search.set("status", params.status);
  const query = search.toString();
  return request<AdminAudiobookRow[]>(`/api/audiobooks/admin${query ? `?${query}` : ""}`);
}

export async function fetchAdminAudiobookAudioBlob(
  token: string,
  audiobookId: string,
): Promise<Blob> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/audiobooks/admin/${encodeURIComponent(audiobookId)}/audio`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Failed to load audio (${response.status})`);
  }

  return response.blob();
}
