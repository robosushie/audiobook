import { ScreenHeader } from '@/components/layout/screen-header';
import { Text } from '@/components/ui/text';
import { useTabContentInset } from '@/contexts/audiobook-player';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STORAGE_KEY = 'listener-settings';

type ListenerSettings = {
  notifyReady: boolean;
  speed: number;
  skipBack: number;
  skipForward: number;
  wifiOnly: boolean;
};

const DEFAULTS: ListenerSettings = {
  notifyReady: true,
  speed: 1,
  skipBack: 15,
  skipForward: 30,
  wifiOnly: true,
};

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollBottomPadding = useTabContentInset();
  const [settings, setSettings] = React.useState<ListenerSettings>(DEFAULTS);

  React.useEffect(() => {
    void SecureStore.getItemAsync(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        try {
          setSettings({ ...DEFAULTS, ...JSON.parse(raw) });
        } catch {
          setSettings(DEFAULTS);
        }
      })
      .catch(() => undefined);
  }, []);

  function update(next: ListenerSettings) {
    setSettings(next);
    void SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(next)).catch(() => undefined);
  }

  function cycleSpeed() {
    const index = SPEEDS.indexOf(settings.speed);
    const speed = SPEEDS[(index + 1) % SPEEDS.length] ?? 1;
    update({ ...settings, speed });
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: scrollBottomPadding,
          paddingHorizontal: 20,
        }}>
        <ScreenHeader title="Settings" onBack={() => router.back()} />

        <Text className="mb-2 mt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Notifications
        </Text>
        <SettingRow
          title="Audiobook ready"
          detail="When a voice finishes generating"
          onPress={() => update({ ...settings, notifyReady: !settings.notifyReady })}
          control={<Toggle on={settings.notifyReady} />}
        />

        <Text className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Playback
        </Text>
        <SettingRow
          title="Default speed"
          detail={`${settings.speed}×`}
          onPress={cycleSpeed}
        />
        <SettingRow title="Skip back" detail={`${settings.skipBack} seconds`} />
        <SettingRow title="Skip forward" detail={`${settings.skipForward} seconds`} />

        <Text className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Downloads
        </Text>
        <SettingRow
          title="Wi-Fi only"
          detail="Download audiobooks on Wi-Fi"
          onPress={() => update({ ...settings, wifiOnly: !settings.wifiOnly })}
          control={<Toggle on={settings.wifiOnly} />}
        />
      </ScrollView>
    </View>
  );
}

function SettingRow({
  title,
  detail,
  onPress,
  control,
}: {
  title: string;
  detail: string;
  onPress?: () => void;
  control?: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="mb-2 flex-row items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
      <View className="min-w-0 flex-1 pr-3">
        <Text className="text-sm font-semibold text-foreground">{title}</Text>
        <Text className="text-xs text-muted-foreground">{detail}</Text>
      </View>
      {control}
    </Pressable>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <View className={`h-6 w-11 rounded-full p-0.5 ${on ? 'items-end bg-tag-blue' : 'items-start bg-muted'}`}>
      <View className="h-5 w-5 rounded-full bg-card" />
    </View>
  );
}
