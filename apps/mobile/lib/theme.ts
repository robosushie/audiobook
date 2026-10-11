import { DefaultTheme, type Theme } from '@react-navigation/native';

import { BRAND } from '@/lib/constants/brand';

/** Light theme tokens — matches apps/admin shell */
export const THEME = {
  background: BRAND.background,
  foreground: '#000000',
  card: '#ffffff',
  cardForeground: '#000000',
  popover: '#ffffff',
  popoverForeground: '#000000',
  primary: '#000000',
  primaryForeground: '#ffffff',
  secondary: '#ffffff',
  secondaryForeground: '#000000',
  muted: '#f7f7f7',
  mutedForeground: '#666666',
  accent: '#000000',
  accentForeground: '#ffffff',
  cotton: BRAND.cotton,
  destructive: '#c60808',
  border: '#e5e7eb',
  input: '#e5e7eb',
  ring: '#1871da',
  radius: '6px',
};

export const NAV_THEME: Theme = {
  ...DefaultTheme,
  colors: {
    background: THEME.background,
    border: THEME.border,
    card: THEME.card,
    notification: THEME.destructive,
    primary: THEME.primary,
    text: THEME.foreground,
  },
};
