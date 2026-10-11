import { getApiBaseUrl } from "@/lib/env";
import type {
  AdminAudiobookRow,
  AudiobookGenerateBody,
  AudiobookRow,
  AudiobookStatus,
  ListPage,
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
  params?: {
    userId?: string;
    statuses?: AudiobookStatus[];
    q?: string;
    page?: number;
    pageSize?: number;
  },
) {
  const search = new URLSearchParams();
  search.set("page", String(params?.page ?? 1));
  search.set("page_size", String(params?.pageSize ?? 8));
  if (params?.userId) search.set("user_id", params.userId);
  for (const status of params?.statuses ?? []) search.append("status", status);
  if (params?.q) search.set("q", params.q);
  return request<ListPage<AdminAudiobookRow>>(
    `/api/audiobooks/admin?${search.toString()}`,
  );
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
