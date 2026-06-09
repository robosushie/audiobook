import { BRAND } from '@/lib/constants/brand';
import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: BRAND.background } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="voices/index" />
      <Stack.Screen name="voices/new" />
    </Stack>
  );
}
