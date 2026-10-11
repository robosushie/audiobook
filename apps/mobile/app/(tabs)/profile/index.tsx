import { ProfileHeaderCard, ProfileStatsGrid } from '@/components/profile/profile-header-card';
import { ProfileMenuRow } from '@/components/profile/profile-menu-row';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useProfileStats } from '@/hooks/useProfileStats';
import { useAuth, useUser } from '@clerk/expo';
import { useTabContentInset } from '@/contexts/audiobook-player';
import { useRouter } from 'expo-router';
import {
  CircleHelp,
  Crown,
  LogOut,
  Mic,
  Settings,
  Users,
} from 'lucide-react-native';
import * as React from 'react';
import { LoadingState } from '@/components/ui/app-loader';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const scrollBottomPadding = useTabContentInset();
  const { stats, isLoading } = useProfileStats();

  const name = user?.fullName?.trim() || user?.username || 'Listener';
  const email = user?.primaryEmailAddress?.emailAddress ?? '';
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: scrollBottomPadding,
          paddingHorizontal: 20,
        }}>
        <Text className="mb-5 text-2xl font-bold tracking-tight">Profile</Text>

        <ProfileHeaderCard
          initials={initials}
          name={name}
          email={email}
          imageUrl={user?.imageUrl}
        />
        {isLoading ? (
          <LoadingState className="my-3 py-4" />
        ) : (
          <ProfileStatsGrid
            audiobooks={stats.audiobookCount}
            hours={stats.hoursListened}
            voices={stats.voiceCount}
          />
        )}

        <View className="mt-4 gap-2">
          <ProfileMenuRow
            title="My voices"
            subtitle="Manage your custom narrator voices"
            icon={Mic}
            onPress={() => router.push('/(tabs)/profile/voices' as never)}
          />
          <ProfileMenuRow
            title="Family"
            subtitle="Share with up to 5 people"
            icon={Users}
            disabled
          />
          <ProfileMenuRow
            title="Subscription"
            subtitle="Manage your plan"
            icon={Crown}
            variant="accent"
            disabled
          />
          <ProfileMenuRow
            title="Settings"
            subtitle="Notifications, playback, downloads"
            icon={Settings}
            onPress={() => router.push('/(tabs)/profile/settings' as never)}
          />
          <ProfileMenuRow
            title="Help & support"
            subtitle="FAQs, contact us"
            icon={CircleHelp}
            disabled
          />

          <Pressable
            onPress={() => void signOut()}
            className="mt-2 flex-row items-center justify-center gap-2 rounded-2xl border border-border/60 bg-card active:bg-destructive/10"
            style={{ padding: 12 }}>
            <Icon as={LogOut} className="size-4 text-destructive" />
            <Text className="text-sm font-semibold text-destructive">Sign out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
