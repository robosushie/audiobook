import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { UserMenu } from '@/components/user-menu';
import { useUser } from '@clerk/expo';
import { Link, Stack } from 'expo-router';
import { XIcon } from 'lucide-react-native';
import * as React from 'react';
import { Image, type ImageStyle, View } from 'react-native';

const LOGO = require('@/assets/images/react-native-reusables-light.png');
const CLERK_LOGO = require('@/assets/images/clerk-logo-light.png');

const LOGO_STYLE: ImageStyle = {
  height: 36,
  width: 40,
};

const SCREEN_OPTIONS = {
  header: () => (
    <View className="top-safe absolute left-0 right-0 flex-row justify-end px-4 py-2 web:mx-2">
      <UserMenu />
    </View>
  ),
};

export default function Screen() {
  const { user } = useUser();

  return (
    <>
      <Stack.Screen options={SCREEN_OPTIONS} />
      <View className="flex-1 items-center justify-center gap-8 bg-background p-4">
        <View className="flex-row items-center justify-center gap-3.5">
          <Image source={CLERK_LOGO} resizeMode="contain" style={LOGO_STYLE} />
          <Icon as={XIcon} className="mr-1 size-5" />
          <Image source={LOGO} style={LOGO_STYLE} resizeMode="contain" />
        </View>
        <View className="max-w-sm gap-2 px-4">
          <Text variant="h1" className="text-3xl font-medium">
            Make it yours{user?.firstName ? `, ${user.firstName}` : ''}.
          </Text>
          <Text className="text-center text-sm text-muted-foreground">
            Update the screens and components to match your design and logic.
          </Text>
        </View>
        <View className="gap-2">
          <Link href="https://go.clerk.com/8e6CCee" asChild>
            <Button size="sm">
              <Text>Explore Clerk Docs</Text>
            </Button>
          </Link>
        </View>
      </View>
    </>
  );
}
