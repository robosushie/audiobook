/** Brand colors — keep in sync with `global.css` and apps/admin `constants/brand.ts` */

export const BRAND = {
  background: '#e5e7eb',
  foreground: '#000000',
  card: '#ffffff',
  muted: '#666666',
  cotton: '#ffb4ed',
  signal: '#1871da',
  pulse: '#1ec072',
  hot: '#f6609f',
  solar: '#ffbb38',
  loginHeroTop: '#e5e7eb',
  loginHeroMid: '#e5e7eb',
  coverGradients: {
    blue: ['#1871da', '#1871da'] as const,
    green: ['#1ec072', '#1ec072'] as const,
    pink: ['#f6609f', '#f6609f'] as const,
    yellow: ['#ffbb38', '#ffbb38'] as const,
  },
} as const;

/** Flat product surfaces — no drop shadow */
export const SHADOW_POP = {
  shadowColor: 'transparent',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0,
  shadowRadius: 0,
  elevation: 0,
} as const;
