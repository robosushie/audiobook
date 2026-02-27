import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { User, Sun, Moon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const THEME_ICONS = {
  light: Sun,
  dark: Moon,
};

export function TopBar() {
  const insets = useSafeAreaInsets();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const ThemeIcon = THEME_ICONS[colorScheme ?? 'light'];

  return (
    <View style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between border-b border-border/50 bg-background/95 px-4 h-12">
        <Button variant="secondary" size="icon" className="rounded-full h-8 w-8">
          <Icon as={User} className="size-4 text-foreground" />
        </Button>
        <Button
          onPress={toggleColorScheme}
          variant="ghost"
          size="icon"
          className="rounded-full h-8 w-8"
        >
          <Icon as={ThemeIcon} className="size-5 text-foreground" />
        </Button>
      </View>
    </View>
  );
}
