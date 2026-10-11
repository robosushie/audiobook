import '@/global.css';

import { NAV_THEME } from '@/lib/theme';
import { UserEventsProvider } from '@/contexts/user-events';
import { ClerkProvider, useAuth } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const publishableKey = getPublishableKey();

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  const { setColorScheme } = useColorScheme();

  React.useEffect(() => {
    setColorScheme('light');
  }, [setColorScheme]);

  return (
    <SafeAreaProvider>
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <ThemeProvider value={NAV_THEME}>
          <StatusBar style="dark" />
          <Routes />
          <PortalHost />
        </ThemeProvider>
      </ClerkProvider>
    </SafeAreaProvider>
  );
}

function getPublishableKey() {
  const key = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!key) {
    throw new Error('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY');
  }

  return key;
}

SplashScreen.preventAutoHideAsync();

function Routes() {
  const { isSignedIn, isLoaded } = useAuth();
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const ready = isLoaded && (fontsLoaded || Boolean(fontError));

  React.useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  return (
    <UserEventsProvider>
      <Stack>
        {/* Screens only shown when the user is NOT signed in */}
        <Stack.Protected guard={!isSignedIn}>
          <Stack.Screen name="(auth)/sign-in" options={SIGN_IN_SCREEN_OPTIONS} />
        </Stack.Protected>

        {/* Screens only shown when the user IS signed in */}
        <Stack.Protected guard={isSignedIn}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="book/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="genre/[genre]" options={{ headerShown: false }} />
        </Stack.Protected>

        {/* Screens outside the guards are accessible to everyone (e.g. not found) */}
      </Stack>
    </UserEventsProvider>
  );
}

const SIGN_IN_SCREEN_OPTIONS = {
  headerShown: false,
  title: 'Sign in',
};
