import { Text } from '@/components/ui/text';
import { Stack, useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View className="flex-1 items-center justify-center gap-4 p-6">
        <Text>This screen doesn&apos;t exist.</Text>
        <Pressable
          onPress={() => {
            // Expo typed routes omit the tabs group path until regenerated.
            router.replace('/(tabs)' as never);
          }}>
          <Text className="font-semibold text-foreground underline">Go to home screen</Text>
        </Pressable>
      </View>
    </>
  );
}
