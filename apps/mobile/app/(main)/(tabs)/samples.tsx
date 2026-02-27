import { TopBar } from '@/components/shared';
import { VoiceSamplesScreen } from '@/components/voice-samples';
import { View } from 'react-native';

export default function SamplesTab() {
  return (
    <View className="flex-1 bg-background">
      <TopBar />
      <VoiceSamplesScreen />
    </View>
  );
}
