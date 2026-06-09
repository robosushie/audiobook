import { BRAND } from '@/lib/constants/brand';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

type AppShellGradientProps = {
  style?: StyleProp<ViewStyle>;
};

/** Warm top fade — same palette as login hero shell */
export function AppShellGradient({ style }: AppShellGradientProps) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <LinearGradient
        colors={[BRAND.loginHeroTop, BRAND.loginHeroMid, BRAND.background]}
        locations={[0, 0.38, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
