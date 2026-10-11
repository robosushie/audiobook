import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Text } from '@/components/ui/text';
import { BRAND } from '@/lib/constants/brand';
import * as React from 'react';
import { View } from 'react-native';

const CARD_PADDING = 14;

type ProfileHeaderCardProps = {
  initials: string;
  name: string;
  email: string;
  imageUrl?: string | null;
};

export function ProfileHeaderCard({ initials, name, email, imageUrl }: ProfileHeaderCardProps) {
  return (
    <View
      className="flex-row items-center gap-4 rounded-3xl border border-border/60 bg-card shadow-pop"
      style={{ padding: CARD_PADDING }}>
      <View className="h-16 w-16 overflow-hidden rounded-full">
        {imageUrl ? (
          <Avatar alt={name} className="h-16 w-16">
            <AvatarImage source={{ uri: imageUrl }} />
            <AvatarFallback>
              <Text className="font-bold">{initials}</Text>
            </AvatarFallback>
          </Avatar>
        ) : (
          <View
            className="h-16 w-16 items-center justify-center"
            style={{ backgroundColor: BRAND.cotton }}>
            <Text className="text-xl font-bold text-foreground">{initials}</Text>
          </View>
        )}
      </View>
      <View className="min-w-0 flex-1">
        <Text className="truncate text-lg font-bold">{name}</Text>
        <Text className="truncate text-xs text-muted-foreground">{email}</Text>
        <View className="mt-1.5 self-start rounded-full bg-secondary px-2 py-0.5">
          <Text className="text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
            Member
          </Text>
        </View>
      </View>
    </View>
  );
}

export function ProfileStatsGrid({
  audiobooks,
  hours,
  voices,
}: {
  audiobooks: number;
  hours: number;
  voices: number;
}) {
  return (
    <View className="mt-3 flex-row gap-2">
      <StatTile value={String(audiobooks)} label="Audiobooks" />
      <StatTile value={String(hours)} label="Hours" />
      <StatTile value={String(voices)} label="Voices" />
    </View>
  );
}

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <View
      className="flex-1 items-center rounded-2xl border border-border/60 bg-card"
      style={{ paddingVertical: 12, paddingHorizontal: 8 }}>
      <Text className="text-xl font-bold">{value}</Text>
      <Text className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </Text>
    </View>
  );
}
