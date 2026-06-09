import { Text } from '@/components/ui/text';
import { THEME } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { Loader } from 'lucide-react-native';
import * as React from 'react';
import { Animated, Easing, View, type StyleProp, type ViewStyle } from 'react-native';

const DEFAULT_LOADER_COLOR = '#52525b';

type AppLoaderProps = {
  size?: number;
  color?: string;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

/** Spinning Lucide `Loader` — default dark gray for page/section loading. */
export function AppLoader({
  size = 24,
  color = DEFAULT_LOADER_COLOR,
  className,
  style,
}: AppLoaderProps) {
  const spin = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => {
      loop.stop();
    };
  }, [spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[{ transform: [{ rotate }] }, style]} className={className}>
      <Loader size={size} color={color} />
    </Animated.View>
  );
}

type LoadingStateProps = {
  label?: string;
  size?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

/** Centered loader for full sections or initial page fetches. */
export function LoadingState({ label, size = 28, className, style }: LoadingStateProps) {
  return (
    <View className={cn('items-center justify-center gap-2.5 py-12', className)} style={style}>
      <AppLoader size={size} color={THEME.mutedForeground} />
      {label ? <Text className="text-sm text-muted-foreground">{label}</Text> : null}
    </View>
  );
}
