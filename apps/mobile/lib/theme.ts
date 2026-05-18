import { DefaultTheme, type Theme } from '@react-navigation/native';

import { BRAND } from '@/lib/constants/brand';

/** Light theme tokens — matches apps/admin shell */
export const THEME = {
  background: BRAND.background,
  foreground: 'hsl(240 6% 10%)',
  card: '#ffffff',
  cardForeground: 'hsl(240 6% 10%)',
  popover: '#ffffff',
  popoverForeground: 'hsl(240 6% 10%)',
  primary: 'hsl(240 6% 10%)',
  primaryForeground: 'hsl(0 0% 98%)',
  secondary: '#ffffff',
  secondaryForeground: 'hsl(240 6% 10%)',
  muted: '#f0ebe6',
  mutedForeground: 'hsl(240 4% 46%)',
  accent: 'hsl(32 95% 55%)',
  accentForeground: 'hsl(0 0% 100%)',
  destructive: 'hsl(0 72% 51%)',
  border: '#e8e4df',
  input: '#e8e4df',
  ring: 'hsl(240 4% 65%)',
  radius: '0.625rem',
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
