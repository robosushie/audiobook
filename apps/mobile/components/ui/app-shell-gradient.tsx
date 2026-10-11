import { BRAND } from '@/lib/constants/brand';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

type AppShellGradientProps = {
  style?: StyleProp<ViewStyle>;
};

/** Flat concrete canvas behind auth and home shells. */
export function AppShellGradient({ style }: AppShellGradientProps) {
  return <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.canvas, style]} />;
}

const styles = StyleSheet.create({
  canvas: {
    backgroundColor: BRAND.background,
  },
});
