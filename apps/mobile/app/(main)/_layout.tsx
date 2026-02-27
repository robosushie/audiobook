import { Stack } from 'expo-router';

export default function MainLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="record-sample"
        options={{
          presentation: 'modal',
          title: 'Record Voice Sample',
        }}
      />
    </Stack>
  );
}
