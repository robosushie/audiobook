import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { AudiobookPlayerProvider } from '@/contexts/audiobook-player';
import { BRAND } from '@/lib/constants/brand';
import { TAB_BAR_CONTENT_HEIGHT } from '@/lib/constants/layout';
import { THEME } from '@/lib/theme';
import { Tabs } from 'expo-router';
import { BookOpen, Home, Search, User } from 'lucide-react-native';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = TAB_BAR_CONTENT_HEIGHT + insets.bottom;

  return (
    <AudiobookPlayerProvider>
        <View style={styles.root} className="flex-1 bg-background">
        <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: BRAND.background },
          tabBarActiveTintColor: THEME.foreground,
          tabBarInactiveTintColor: THEME.mutedForeground,
          tabBarLabel: ({ focused, children }) => (
            <Text
              className="text-[11px] font-medium"
              style={{ color: focused ? THEME.foreground : THEME.mutedForeground }}>
              {children}
            </Text>
          ),
          tabBarStyle: {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: tabBarHeight,
            paddingTop: 6,
            paddingBottom: insets.bottom,
            backgroundColor: BRAND.card,
            borderTopWidth: 1,
            borderTopColor: BRAND.background,
            elevation: 0,
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon focused={focused}>
                <Icon
                  as={Home}
                  className="size-5"
                  color={color}
                  fill={focused ? color : 'transparent'}
                />
              </TabIcon>
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Search',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon focused={focused}>
                <Icon as={Search} className="size-5" color={color} />
              </TabIcon>
            ),
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: 'Library',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon focused={focused}>
                <Icon as={BookOpen} className="size-5" color={color} />
              </TabIcon>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon focused={focused}>
                <Icon as={User} className="size-5" color={color} />
              </TabIcon>
            ),
          }}
        />
        </Tabs>
        </View>
    </AudiobookPlayerProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BRAND.background,
  },
  tabIcon: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
});

function TabIcon({ focused, children }: { focused: boolean; children: React.ReactNode }) {
  return (
    <View
      style={[
        styles.tabIcon,
        { backgroundColor: focused ? BRAND.cotton : 'transparent' },
      ]}>
      {children}
    </View>
  );
}
