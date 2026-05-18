/** Brand colors — keep in sync with `global.css` and apps/admin `constants/brand.ts` */

export const BRAND = {
  background: '#faf8f5',
  loginHeroTop: '#f8e0d8',
  loginHeroMid: '#f9f1ec',
  coverGradients: {
    amber: ['#fcd34d', '#d97706'] as const,
    rose: ['#fda4af', '#be123c'] as const,
    teal: ['#5eead4', '#0f766e'] as const,
  },
} as const;

/** Matches admin `shadow-pop` utility */
export const SHADOW_POP = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 12 },
  shadowOpacity: 0.14,
  shadowRadius: 16,
  elevation: 10,
} as const;
