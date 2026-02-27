import { Icon } from '@/components/ui/icon';
import { THEME } from '@/lib/theme';
import { Tabs } from 'expo-router';
import { Home, Search, Library, Mic } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_BAR_HEIGHT = 64;

/* Translucent tab bar backgrounds (theme background as rgba + alpha) */
const TAB_BAR_BG = {
  light: 'rgba(255, 250, 242, 0.88)',
  dark: 'rgba(14, 13, 17, 0.88)',
} as const;

const TAB_BAR_BORDER = {
  light: 'rgba(220, 210, 195, 0.6)',
  dark: 'rgba(255, 255, 255, 0.08)',
} as const;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme().colorScheme ?? 'light';
  const theme = THEME[colorScheme];
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';

  return (
    <Tabs
      {...({
        sceneContainerStyle: { backgroundColor: 'transparent' },
      } as React.ComponentProps<typeof Tabs>)}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.mutedForeground,
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          borderTopWidth: 1,
          borderTopColor: TAB_BAR_BORDER[scheme],
          backgroundColor: TAB_BAR_BG[scheme],
          height: TAB_BAR_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
          elevation: 0,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Icon as={Home} className="size-5" color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => <Icon as={Search} className="size-5" color={color} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ color, size }) => <Icon as={Library} className="size-5" color={color} />,
        }}
      />
      <Tabs.Screen
        name="samples"
        options={{
          title: 'Samples',
          tabBarIcon: ({ color, size }) => <Icon as={Mic} className="size-5" color={color} />,
        }}
      />
    </Tabs>
  );
}
