import type { AudiobookRow, VoiceProfileRow } from '@/types/api';

export type UserEventType =
  | 'voice.created'
  | 'voice.updated'
  | 'audiobook.created'
  | 'audiobook.updated';

export type VoiceSSEPayload = Omit<VoiceProfileRow, 'raw_text'> & {
  reference_id: string;
};

export type AudiobookSSEPayload = AudiobookRow & {
  voice_profile_id: string;
  playback_progress?: number;
};

export type UserSSEMessage = {
  type: UserEventType;
  data: VoiceSSEPayload | AudiobookSSEPayload;
};
