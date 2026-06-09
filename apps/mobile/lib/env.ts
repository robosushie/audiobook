export function getApiBaseUrl(): string {
  const value = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (!value) {
    throw new Error('Missing EXPO_PUBLIC_API_BASE_URL in apps/mobile/.env');
  }
  return value.replace(/\/$/, '');
}
