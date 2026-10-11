import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { formatReferenceLanguage } from '@/lib/constants/languages';
import type { VoiceProfileRow } from '@/types/api';
import { Mic } from 'lucide-react-native';
import * as React from 'react';
import { AppLoader } from '@/components/ui/app-loader';
import { View } from 'react-native';

const STATUS_LABEL: Record<string, string> = {
  uploaded: 'Uploaded',
  queued: 'Queued',
  processing: 'Processing',
  ready: 'Ready',
  failed: 'Failed',
};

type VoiceProfileListRowProps = {
  voice: VoiceProfileRow;
};

export function VoiceProfileListRow({ voice }: VoiceProfileListRowProps) {
  const inProgress = voice.status === 'queued' || voice.status === 'processing';
  const failed = voice.status === 'failed';

  return (
    <View
      className="flex-row items-center gap-3 rounded-2xl border border-border/60 bg-card"
      style={{ padding: 4 }}>
      <View className="h-12 w-12 items-center justify-center rounded-xl bg-muted">
        {inProgress ? (
          <AppLoader size={18} />
        ) : (
          <Icon as={Mic} className="size-4 text-foreground" />
        )}
      </View>
      <View className="min-w-0 flex-1">
        <Text className="truncate text-sm font-semibold text-foreground">{voice.label}</Text>
        <Text className="truncate text-xs text-muted-foreground">
          {formatReferenceLanguage(voice.language)}
          {voice.status === 'ready' && voice.duration > 0 ? ` · ${Math.round(voice.duration)}s` : ''}
        </Text>
        <Text
          className={cnStatus(
            'mt-0.5 text-[10px] font-semibold uppercase tracking-wide',
            failed ? 'text-destructive' : 'text-muted-foreground',
          )}>
          {STATUS_LABEL[voice.status] ?? voice.status}
        </Text>
      </View>
    </View>
  );
}

function cnStatus(...parts: string[]) {
  return parts.join(' ');
}
