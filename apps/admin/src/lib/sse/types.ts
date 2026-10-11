import type { AudiobookStatus, ReferenceLanguage, VoiceProfileStatus } from "@/types/api";

export type UserEventType =
  | "voice.created"
  | "voice.updated"
  | "audiobook.created"
  | "audiobook.updated";

export type VoiceSSEPayload = {
  id: string;
  user_id: string;
  reference_id: string;
  label: string;
  status: VoiceProfileStatus;
  duration: number;
  language: ReferenceLanguage;
  raw_url?: string | null;
  audio_url?: string | null;
};

export type AudiobookSSEPayload = {
  id: string;
  user_id: string;
  book_id: string;
  voice_profile_id: string;
  status: AudiobookStatus | string;
  content_url?: string | null;
  duration?: number | null;
  book_title?: string | null;
  book_cover_url?: string | null;
  playback_progress?: number;
};

export type UserSSEMessage = {
  type: UserEventType;
  data: VoiceSSEPayload | AudiobookSSEPayload;
};
